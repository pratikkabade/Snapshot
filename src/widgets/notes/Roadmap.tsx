import { useState, useEffect } from 'react'
import { query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, where } from "firebase/firestore"
import { auth, roadmapNotesCollectionRef, db } from '../../config/Firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Link, useLocation } from 'react-router-dom'
import roadmapData from '../../data/Roadmap.json'

interface ContentItem {
    name: string;
    tag: string;
}

interface WeekData {
    dates: string[];
    content: ContentItem[];
}

interface PhaseContent {
    [key: string]: WeekData;
}

interface Phase {
    Name: string;
    Content: PhaseContent;
}

interface StudyPlan {
    [key: string]: Phase;
}

interface RoadmapNoteProps {
    date: string;
    weekContent: ContentItem[];
    existingNote?: any;
    onClose: () => void;
    phase?: string;
    week?: string;
}

// helper to map tags to color classes
const getTagClasses = (tag: string) => {
    const t = (tag || '').toLowerCase()
    if (t.includes('dsa')) return 'bg-purple-200 text-purple-800'
    if (t.includes('dev')) return 'bg-yellow-200 text-yellow-800'
    if (t.includes('genai') || t.includes('algorithm')) return 'bg-indigo-200 text-indigo-800'
    if (t.includes('system')) return 'bg-pink-200 text-pink-800'
    return 'bg-blue-200 text-blue-800'
}

// Format date to human-readable format
const formatDate = (dateString: string): string => {
    const [day, month, year] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('en-US', {
        // weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

// Format date to human-readable format
const formatWeekDay = (dateString: string): string => {
    const [day, month, year] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
    }).format(date)
}

// count dates difference from dec 31, 2025
const dateDifferenceFrom2026 = (dateString: string): number => {
    const [day, month, year] = dateString.split('-').map(Number)
    const targetDate = new Date(year, month - 1, day)
    const baseDate = new Date(2025, 11, 31) // December is 11
    const diffTime = targetDate.getTime() - baseDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function RoadmapNote({ date, weekContent, existingNote, onClose }: RoadmapNoteProps) {
    const [noteText, setNoteText] = useState('')
    const [completedTopics, setCompletedTopics] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [initialState, setInitialState] = useState<{ noteText: string; completedTopics: string[] }>({ noteText: '', completedTopics: [] })

    useEffect(() => {
        if (existingNote) {
            setNoteText(existingNote.data.content || '')
            setCompletedTopics(existingNote.data.completedTopics || [])
            setInitialState({ noteText: existingNote.data.content || '', completedTopics: existingNote.data.completedTopics || [] })
        } else {
            setNoteText('')
            setCompletedTopics([])
            setInitialState({ noteText: '', completedTopics: [] })
        }
    }, [existingNote])

    const toggleTopic = (topicName: string) => {
        setCompletedTopics(prev =>
            prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]
        )
    }

    const arraysEqualAsSets = (a: string[], b: string[]) => {
        if (a.length !== b.length) return false
        const sa = new Set(a)
        for (const v of b) if (!sa.has(v)) return false
        return true
    }

    const isDirty = (() => {
        if (noteText !== (initialState.noteText || '')) return true
        if (!arraysEqualAsSets(initialState.completedTopics || [], completedTopics || [])) return true
        return false
    })()

    const handleSave = async () => {
        if (!auth.currentUser) {
            alert('Please sign in to save notes')
            return
        }
        setLoading(true)
        try {
            const userEmail = auth.currentUser.email || 'unknown'
            const safeEmail = userEmail.replace(/[^a-zA-Z0-9_-]/g, '_')
            const docId = `${safeEmail}_${date}`

            const noteData = {
                date,
                content: noteText,
                completedTopics,
                email: userEmail,
                created: existingNote ? existingNote.data.created : new Date(),
                updated: new Date(),
                phase: existingNote?.data?.phase || null,
                week: existingNote?.data?.week || null
            }

            const noteRef = doc(db, 'roadmapNotes', docId)

            const isEmpty = (!noteText || noteText.trim() === '') && (!completedTopics || completedTopics.length === 0)

            if (existingNote) {
                if (isEmpty) {
                    await deleteDoc(noteRef)
                    alert('Note deleted')
                    onClose()
                    setLoading(false)
                    return
                }
                await updateDoc(noteRef, noteData)
            } else {
                if (isEmpty) {
                    alert('Nothing to save')
                    setLoading(false)
                    return
                }
                await setDoc(noteRef, noteData)
            }

            alert('Note saved successfully!')
            onClose()
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Failed to save note')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!existingNote) return
        if (!confirm('Delete this note?')) return
        setLoading(true)
        try {
            const userEmail = auth.currentUser?.email || 'unknown'
            const safeEmail = userEmail.replace(/[^a-zA-Z0-9_-]/g, '_')
            const docId = `${safeEmail}_${date}`
            const noteRef = doc(db, 'roadmapNotes', docId)
            await deleteDoc(noteRef)
            alert('Note deleted')
            onClose()
        } catch (error) {
            console.error('Error deleting note:', error)
            alert('Failed to delete note')
        }
        setLoading(false)
    }

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-md p-6 fade-in2">
            <div className="flex flex-row items-center mb-4 gap-2">
                <h2 className="text-2xl font-bold text-gray-800">{formatWeekDay(date)}</h2>
                <h2 className="text-xl font-semibold text-gray-800">({formatDate(date)})</h2>
                {/* <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                    <i className="fas fa-times"></i>
                </button> */}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Today's Topics</h3>
                <div className="space-y-2">
                    {weekContent.map((topic, idx) => (
                        <div
                            key={idx}
                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => toggleTopic(topic.name)}
                        >
                            <input
                                type="checkbox"
                                checked={completedTopics.includes(topic.name)}
                                onChange={() => toggleTopic(topic.name)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <div className="ml-3 flex-1">
                                <span className={`font-medium ${completedTopics.includes(topic.name) ? 'line-through text-gray-500' : 'text-gray-800'
                                    }`}>
                                    {topic.name}
                                </span>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${getTagClasses(topic.tag)}`}>
                                    {topic.tag}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Notes</h3>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your notes here... What did you learn? Any challenges? Key insights?"
                    className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-500 resize-none"
                />
            </div>

            <div className="flex justify-between items-center">
                <div>
                    {existingNote && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Delete'}
                        </button>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    {/* <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button> */}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : existingNote ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}


function RoadmapManager() {
    const [selectedPhase, setSelectedPhase] = useState<string>('phase1')
    const [selectedWeek, setSelectedWeek] = useState<string>('Week 1')
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [timeOut, setTimeOut] = useState(true)
    const [notes, setNotes] = useState<any[]>([])

    // get current day in this format 01-01-2026
    const today = new Date()
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`

    // Based on formattedToday, auto-select phase, week and day if present in roadmap
    useEffect(() => {
        const sp = roadmapData as StudyPlan
        let found = false
        for (const [phaseKey, phase] of Object.entries(sp)) {
            for (const [weekKey, week] of Object.entries(phase.Content || {})) {
                if (week.dates && week.dates.includes(formattedToday)) {
                    setSelectedPhase(phaseKey)
                    setSelectedWeek(weekKey)
                    setSelectedDay(formattedToday)
                    found = true
                    break
                }
            }
            if (found) break
        }
    }, [formattedToday])



    const [user] = useAuthState(auth)

    // Load study plan from JSON file
    const studyPlan: StudyPlan = roadmapData as StudyPlan

    // Fetch notes for the signed-in user only, with error handling and logs
    useEffect(() => {
        if (!user) {
            setNotes([])
            return
        }

        try {
            const q = query(roadmapNotesCollectionRef, where('email', '==', user.email), orderBy('created', 'desc'))
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const noteList: any[] = []
                querySnapshot.forEach((doc) => {
                    noteList.push({
                        id: doc.id,
                        data: doc.data()
                    })
                })
                console.debug('Loaded roadmap notes:', noteList.length)
                setNotes(noteList)
            }, (err) => {
                console.error('Failed to subscribe to roadmapNotes:', err)
                setNotes([])
            })
            return () => unsubscribe()
        } catch (err) {
            console.error('Error querying roadmapNotes:', err)
            setNotes([])
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeOut(false)
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    // Auto-select first week when phase changes — only if current selectedWeek isn't valid
    useEffect(() => {
        const currentPhase = studyPlan[selectedPhase]
        if (currentPhase && currentPhase.Content) {
            const weeks = Object.keys(currentPhase.Content)
            if (!weeks.includes(selectedWeek)) {
                setSelectedWeek(weeks[0])
            }
        }
    }, [selectedPhase, selectedWeek, studyPlan])

    // Auto-select first day when week changes — don't override an already-valid selectedDay
    useEffect(() => {
        const currentPhase = studyPlan[selectedPhase]
        const currentWeek = currentPhase?.Content[selectedWeek]
        if (currentWeek && currentWeek.dates && currentWeek.dates.length > 0) {
            if (!currentWeek.dates.includes(selectedDay || '')) {
                setSelectedDay(currentWeek.dates[0])
            }
        }
    }, [selectedWeek, selectedPhase, selectedDay, studyPlan])

    const location = useLocation()
    const NOTHomePage = !["/"].includes(location.pathname)

    const currentPhase = studyPlan[selectedPhase]
    const currentWeek = currentPhase?.Content[selectedWeek]

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `${currentPhase?.Name || ''} - ${selectedWeek}`
        }
    }, [selectedPhase, selectedWeek, NOTHomePage])


    const renderHeader = () => {
        return (
            <div className="flex flex-row justify-center text-2xl text-stone-700 font-semibold text-center mt-2 mb-5">
                {NOTHomePage ?
                    <></>
                    :
                    <Link to={'/Roadmap'} className="p-2 px-4 rounded-full border-2 border-white hover:border-stone-300">
                        <i className='fa-solid fa-road fa-lg mr-2'></i>
                        Roadmap
                    </Link>
                }
            </div>
        )
    }


    // Get note for specific date
    const getNoteForDate = (date: string) => {
        return notes.find(note => note.data.date === date)
    }

    // Note: topic completion is managed inside the Day note editor.
    // Left column shows completion state only (no interactive checkboxes).

    if (user === null || timeOut) {
        return (
            <div className="flex flex-col justify-center items-center">
                <div className={`p-2 ${NOTHomePage ? 'w-4/6' : 'bg-white rounded-xl shadow-md w-full'}`}>
                    <div className="flex flex-row justify-center text-2xl text-slate-700 font-semibold text-center mt-2 mb-5">
                        <h2>Study Plan Manager</h2>
                    </div>
                    <div className={`${!NOTHomePage && 'scrl h-72'}`}>
                        {user ? (
                            <h3 className="text-xl text-center font-bold animate-pulse">Loading..</h3>
                        ) : (
                            <h3 className="text-xl text-red-600 text-center font-bold">
                                Sign in to view your study plan
                            </h3>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`p-4 ${NOTHomePage ? 'w-11/12' : 'bg-white rounded-xl shadow-md w-full scrl h-72'}`}>
                {renderHeader()}
                {/* {NOTHomePage && (
                        <Link
                            to="/"
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                        >
                            Back to Home
                        </Link>
                    )} */}

                {/* OLD Week Selector <div className="flex flex-wrap gap-2 mb-6">
                    {Object.keys(currentPhase?.Content || {}).map((weekKey) => (
                        <button
                            key={weekKey}
                            onClick={() => {
                                setSelectedWeek(weekKey)
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedWeek === weekKey
                                ? 'bg-slate-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {weekKey}
                        </button>
                    ))}
                </div> */}

                {/* Days Selector - Horizontal */}
                <div className="mb-6 bg-white border border-gray-100 rounded-xl shadow-md p-4">
                    {/* Header 
                    <div className="flex flex-row justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-700">
                            {currentPhase?.Name}
                        </h1>
                    </div>
                    */}

                    {/* Phase Selector */}
                    <div className="mb-4 flex flex-row gap-3 flex-wrap">
                        <select
                            value={selectedPhase}
                            onChange={(e) => setSelectedPhase(e.target.value)}
                            className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-slate-500 w-72 text-xl"
                        >
                            {Object.keys(studyPlan).map((phaseKey) => (
                                <option key={phaseKey} value={phaseKey}>
                                    {studyPlan[phaseKey].Name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-slate-500 w-36"
                        >
                            {Object.keys(currentPhase?.Content || {}).map((weekKey) => (
                                <option key={weekKey} value={weekKey} onClick={() => { setSelectedWeek(weekKey) }}>
                                    {currentPhase?.Content[weekKey] && weekKey}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {/* previous week */}
                        <button
                            onClick={() => {
                                const weeks = Object.keys(currentPhase?.Content || {})
                                const currentIndex = weeks.indexOf(selectedWeek)
                                if (currentIndex > 0) {
                                    setSelectedWeek(weeks[currentIndex - 1])
                                }
                            }}
                            className="flex flex-col items-center justify-center p-4 text-sm font-medium rounded-lg bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-primary-500 hover:bg-slate-200"
                        >
                            <div className="font-semibold">⬅️</div>
                        </button>

                        {currentWeek?.dates.map((date, idx) => {
                            const hasNote = getNoteForDate(date)
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDay(date)}
                                    aria-current={selectedDay === date ? "page" : undefined}
                                    className={`flex flex-col items-center justify-center p-4 text-sm font-medium first:ml-0 rounded-t-lg bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-primary-500 border-b-4 hover:bg-slate-200
                                         ${selectedDay === date
                                            ? 'py-3 border-slate-600 bg-stone-200 text-slate-800 dark:bg-stone-800 dark:text-slate-200 font-bold'
                                            : 'py-3 border-slate-100 hover:border-slate-400'
                                        }`}
                                >
                                    <div className="font-semibold flex flex-row justify-center items-center w-20">
                                        {hasNote ?
                                            <div>✅ Day {dateDifferenceFrom2026(date)}</div>
                                            :
                                            <div>Day {dateDifferenceFrom2026(date)}</div>}</div>
                                    <div className="text-xs">{formatDate(date)}</div>
                                </button>
                            )
                        })}

                        {/* next week */}
                        <button
                            onClick={() => {
                                const weeks = Object.keys(currentPhase?.Content || {})
                                const currentIndex = weeks.indexOf(selectedWeek)
                                if (currentIndex < weeks.length - 1) {
                                    setSelectedWeek(weeks[currentIndex + 1])
                                }
                            }}
                            className="flex flex-col items-center justify-center p-4 text-sm font-medium rounded-lg bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-primary-500 hover:bg-slate-200"
                        >
                            <div className="font-semibold">➡️</div>
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left: Week Topics */}
                    <div className={`${NOTHomePage ? 'lg:col-span-1 bg-white border border-gray-100 rounded-xl shadow-md p-4' : 'hidden'}`}>
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Week's Topics</h3>
                        <div className="space-y-2">
                            {currentWeek?.content.map((item, idx) => {
                                const note = selectedDay ? getNoteForDate(selectedDay) : null
                                const isCompleted = note?.data.completedTopics?.includes(item.name) || false

                                const isNeet = item.name === 'NeetCode 250 daily'
                                const baseClasses = `p-3 rounded-lg border-l-4 transition-all flex ${isCompleted
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-blue-50 border-blue-500'
                                    }`

                                const content = (
                                    <div className="flex items-start gap-2 w-full">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <div>
                                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mb-2 ${isCompleted
                                                        ? 'bg-green-200 text-green-800'
                                                        : getTagClasses(item.tag)
                                                        }`}>
                                                        {item.tag}
                                                    </span>
                                                </div>
                                                {isCompleted && (
                                                    <div className="text-sm text-green-700 font-semibold">Done</div>
                                                )}
                                            </div>
                                            <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                                                }`}>
                                                {item.name}
                                            </p>
                                        </div>
                                    </div>
                                )

                                return isNeet ? (
                                    <a
                                        href={'https://neetcode.io/practice/practice/neetcode250'}
                                        target="_blank"
                                        rel="noreferrer"
                                        key={idx}
                                        className={`${baseClasses} cursor-pointer hover:brightness-95 hover:underline`}>
                                        {content}
                                    </a>
                                ) : (
                                    <div key={idx} className={`${baseClasses} cursor-default`}>
                                        {content}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: Day Note */}
                    <div className={`${!NOTHomePage ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                        {selectedDay ? (
                            <RoadmapNote
                                date={selectedDay}
                                weekContent={currentWeek?.content || []}
                                existingNote={getNoteForDate(selectedDay)}
                                onClose={() => setSelectedDay(null)}
                                phase={selectedPhase}
                                week={selectedWeek}
                            />
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-xl shadow-md p-8 h-full flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <i className="fas fa-calendar-day text-6xl mb-4"></i>
                                    <p className="text-xl">Select a day to view or add notes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoadmapManager