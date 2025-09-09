import React, { useEffect, useState, useRef } from 'react';
import {
    query, orderBy, onSnapshot, addDoc, where,
    deleteDoc, doc, collection, serverTimestamp, Timestamp, updateDoc
} from "firebase/firestore";
import { db, auth } from '../config/Firebase';
import { Alert, Button, TextInput, Label, Select } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';

// Types
interface Timer {
    id: string;
    name: string;
    duration: number; // in minutes
    timeRemaining: number; // in seconds
    isRunning: boolean;
    type: 'pomodoro' | 'break' | 'custom';
    created: Date | null;
    userId: string;
}

// Utils
const formatDate = (date: Date): string => 
    date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

const formatTime = (date: Date): string => 
    date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });

const formatTimerDisplay = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const TimeTracker: React.FC = () => {
    const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
    const [timers, setTimers] = useState<Timer[]>([]);
    const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
    const [message, setMessage] = useState<string>('');
    const [alert, setAlert] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [timeOut, setTimeOut] = useState(true);
    const timerIntervalRef = useRef<number | null>(null);

    // Form states
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [newTimerName, setNewTimerName] = useState<string>('');
    const [newTimerDuration, setNewTimerDuration] = useState<number>(25);
    const [newTimerType, setNewTimerType] = useState<'pomodoro' | 'break' | 'custom'>('pomodoro');

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeOut(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Update current time
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        
        return () => clearInterval(timeInterval);
    }, []);

    // Fetch timers for current user only
    const currentUser = auth.currentUser;
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            showMessage('Please sign in to view your timers', 'failure');
            return;
        }

        const timersRef = collection(db, "timers");
        const q = query(
            timersRef,
            where("userId", "==", currentUser.uid),
            orderBy('created', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Timer[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                const timestamp = data.created as Timestamp;

                return {
                    id: doc.id,
                    name: data.name || '',
                    duration: data.duration || 25,
                    timeRemaining: data.timeRemaining || (data.duration * 60),
                    isRunning: data.isRunning || false,
                    type: data.type || 'pomodoro',
                    created: timestamp?.toDate() || null,
                    userId: data.userId
                };
            });

            setTimers(items);
            
            // Check if there's a running timer
            const runningTimer = items.find(timer => timer.isRunning);
            if (runningTimer) {
                setActiveTimer(runningTimer);
                startTimerCountdown(runningTimer);
            }
            
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [currentUser]);

    const showMessage = (msg: string, alrt: string) => {
        setMessage(msg);
        setAlert(alrt);
        setTimeout(() => {
            setMessage('');
            setAlert('');
        }, 3000);
    };

    const addTimer = async () => {
        if (!newTimerName.trim()) {
            showMessage('Timer name is required', 'failure');
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            showMessage('Please sign in to add timers', 'failure');
            return;
        }

        try {
            // Set duration based on timer type
            let duration = newTimerDuration;
            if (newTimerType === 'pomodoro' && duration === 0) {
                duration = 25; // Default pomodoro duration
            } else if (newTimerType === 'break' && duration === 0) {
                duration = 5; // Default break duration
            }

            const timerData = {
                name: newTimerName.trim(),
                duration: duration,
                timeRemaining: duration * 60, // Convert to seconds
                isRunning: false,
                type: newTimerType,
                created: serverTimestamp(),
                userId: currentUser.uid
            };

            await addDoc(collection(db, "timers"), timerData);

            // Reset form
            setNewTimerName('');
            setNewTimerDuration(25);
            setNewTimerType('pomodoro');
            setShowAddForm(false);

            showMessage('Timer added successfully', 'success');
        } catch (err) {
            showMessage(`Failed to add timer: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const removeTimer = async (id: string) => {
        try {
            // If removing active timer, clear the interval
            if (activeTimer && activeTimer.id === id) {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                setActiveTimer(null);
            }
            
            await deleteDoc(doc(db, "timers", id));
            showMessage('Timer removed', 'warning');
        } catch (err) {
            showMessage(`Failed to remove: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const startTimerCountdown = (timer: Timer) => {
        // Clear existing interval if any
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        // Set up new interval
        timerIntervalRef.current = window.setInterval(async () => {
            // Update remaining time
            if (timer.timeRemaining > 0) {
                const updatedTimer = { ...timer, timeRemaining: timer.timeRemaining - 1 };
                
                // Update in Firestore
                try {
                    await updateDoc(doc(db, "timers", timer.id), {
                        timeRemaining: updatedTimer.timeRemaining
                    });
                } catch (err) {
                    console.error("Error updating timer:", err);
                }
            } else {
                // Timer completed
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                
                try {
                    await updateDoc(doc(db, "timers", timer.id), {
                        isRunning: false,
                        timeRemaining: 0
                    });
                    
                    // Play notification sound
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                    audio.play();
                    
                    showMessage(`Timer "${timer.name}" completed!`, 'success');
                    setActiveTimer(null);
                } catch (err) {
                    console.error("Error completing timer:", err);
                }
            }
        }, 1000);
    };

    const toggleTimer = async (timer: Timer) => {
        try {
            const isCurrentlyRunning = timer.isRunning;
            
            // Update all timers to pause any that might be running
            for (const t of timers) {
                if (t.id !== timer.id && t.isRunning) {
                    await updateDoc(doc(db, "timers", t.id), {
                        isRunning: false
                    });
                }
            }
            
            // Toggle this timer
            await updateDoc(doc(db, "timers", timer.id), {
                isRunning: !isCurrentlyRunning
            });
            
            if (!isCurrentlyRunning) {
                // Timer is being started
                const updatedTimer = { ...timer, isRunning: true };
                setActiveTimer(updatedTimer);
                startTimerCountdown(updatedTimer);
                showMessage(`Timer "${timer.name}" started`, 'success');
            } else {
                // Timer is being paused
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                setActiveTimer(null);
                showMessage(`Timer "${timer.name}" paused`, 'warning');
            }
        } catch (err) {
            showMessage(`Failed to toggle timer: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const resetTimer = async (timer: Timer) => {
        try {
            // If it's the active timer, clear the interval
            if (activeTimer && activeTimer.id === timer.id) {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                setActiveTimer(null);
            }
            
            await updateDoc(doc(db, "timers", timer.id), {
                isRunning: false,
                timeRemaining: timer.duration * 60 // Reset to full duration
            });
            
            showMessage(`Timer "${timer.name}" reset`, 'info');
        } catch (err) {
            showMessage(`Failed to reset timer: ${err instanceof Error ? err.message : String(err)}`, 'failure');
        }
    };

    const renderAddTimerForm = () => (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Add New Timer</h3>
            <div className="space-y-3">
                <div>
                    <Label htmlFor="timerName">Timer Name</Label>
                    <TextInput
                        id="timerName"
                        placeholder="Timer Name (required)"
                        value={newTimerName}
                        onChange={(e) => setNewTimerName(e.target.value)}
                        className='w-full'
                    />
                </div>
                <div>
                    <Label htmlFor="timerType">Timer Type</Label>
                    <Select
                        id="timerType"
                        value={newTimerType}
                        onChange={(e) => setNewTimerType(e.target.value as 'pomodoro' | 'break' | 'custom')}
                    >
                        <option value="pomodoro">Pomodoro (25 min)</option>
                        <option value="break">Break (5 min)</option>
                        <option value="custom">Custom</option>
                    </Select>
                </div>
                {newTimerType === 'custom' && (
                    <div>
                        <Label htmlFor="timerDuration">Duration (minutes)</Label>
                        <TextInput
                            id="timerDuration"
                            type="number"
                            min="1"
                            max="180"
                            value={newTimerDuration}
                            onChange={(e) => setNewTimerDuration(parseInt(e.target.value) || 25)}
                        />
                    </div>
                )}
                <div className="flex space-x-2">
                    <Button color="blue" onClick={addTimer}>Save Timer</Button>
                    <Button color="gray" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
            </div>
        </div>
    );

    const renderAddButton = () => (
        <div className='flex justify-center mt-1 mb-4'>
            <Button pill outline color="blue" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : 'Add New Timer'}
            </Button>
        </div>
    );

    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);

    const renderHeader = () => (
        <div className="flex flex-col items-center text-2xl text-slate-700 font-semibold text-center mt-2 mb-5">
            {NOTHomePage ?
                <></>
                :
                <Link to={'/TimeTracker'} className="p-2 px-4 rounded-full border-2 border-white hover:border-slate-300">
                    <i className='fa-solid fa-clock mr-3'></i>
                    Time Tracker
                </Link>
            }
            <div className="text-lg mt-2">
                {formatDate(currentDateTime)}
            </div>
            <div className="text-xl font-bold">
                {formatTime(currentDateTime)}
            </div>
        </div>
    );

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Time Tracker`;
        }
    }, [NOTHomePage]);

    const renderTimerBadge = (type: 'pomodoro' | 'break' | 'custom') => {
        let bgColor = 'bg-blue-100 text-blue-800';
        let icon = 'fa-solid fa-clock';
        
        if (type === 'pomodoro') {
            bgColor = 'bg-red-100 text-red-800';
            icon = 'fa-solid fa-tomato';
        } else if (type === 'break') {
            bgColor = 'bg-green-100 text-green-800';
            icon = 'fa-solid fa-mug-hot';
        }
        
        return (
            <span className={`text-xs ${bgColor} px-2 py-1 rounded inline-flex items-center`}>
                <i className={`${icon} mr-1`}></i>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
        );
    };

    const renderTimersList = () => {
        if (timers.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500">
                    <p>No timers yet.</p>
                    <p>Add your first timer to get started.</p>
                </div>
            );
        }

        return (
            <ul className="fade-in2">
                {timers.map((timer) => (
                    <li key={timer.id} className={`p-3 border-2 ${activeTimer && activeTimer.id === timer.id ? 'border-blue-200 bg-blue-50' : 'border-gray-100'} shadow-md my-2 rounded-xl`}>
                        <div className="p-2 rounded text-sm overflow-x-auto overflow-y-auto">
                            <div className="flex flex-row justify-between items-center mb-2">
                                <div className='flex flex-col'>
                                    <div className="text-lg font-medium">{timer.name}</div>
                                    <div className='flex flex-row gap-2 items-center'>
                                        {renderTimerBadge(timer.type)}
                                        <div className="text-gray-600">
                                            {timer.duration} min
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-2xl font-bold">
                                        {formatTimerDisplay(timer.timeRemaining)}
                                    </div>
                                    <div className="flex space-x-2 mt-2">
                                        <Button
                                            onClick={() => toggleTimer(timer)}
                                            size="xs" color={timer.isRunning ? "yellow" : "green"}>
                                            <i className={`fa-solid ${timer.isRunning ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                                            {timer.isRunning ? 'Pause' : 'Start'}
                                        </Button>
                                        <Button
                                            onClick={() => resetTimer(timer)}
                                            size="xs" color="blue">
                                            <i className="fa-solid fa-rotate-right mr-1"></i>
                                            Reset
                                        </Button>
                                        <Button size="xs" pill onClick={() => removeTimer(timer.id)} color="failure">
                                            <i className="fa-solid fa-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">Created: {timer.created ? formatDate(timer.created) : "Just now"}</div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderTimers = () => (
        <div className={`overflow-y-auto overflow-x-auto ${message === '' ? 'h-full' : NOTHomePage ? 'h-96' : 'h-52'}`}>
            {renderAddButton()}
            {showAddForm && renderAddTimerForm()}
            {renderTimersList()}
        </div>
    );

    const renderMessage = () => (
        message && <div className="mt-2 p-2">
            <Alert color={alert}>
                {message}
            </Alert>
        </div>
    );

    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? 'w-5/6' : 'w-full'}`}>
                {renderHeader()}
                <div className={`${NOTHomePage ? '' : 'scrl h-72'}`}>
                    {loading || timeOut ? <h3 className="scrl h-72 text-xl text-center font-bold animate-pulse">Loading..</h3> :
                        auth.currentUser ?
                            renderTimers() :
                            <div className="p-6 text-center">Please sign in to view your timers</div>
                    }
                    {renderMessage()}
                </div>
            </div>
        </div>
    );
};

export default TimeTracker;