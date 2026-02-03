import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
    dayNumber?: number;
    notHomePage?: boolean;
    showheatMap: boolean;
    setshowHeatMap: React.Dispatch<React.SetStateAction<boolean>>;
}

// helper to map tags to color classes
const getTagClasses = (tag: string) => {
    const t = (tag || '').toLowerCase()
    if (t.includes('dsa')) return 'bg-purple-500/20 text-purple-900 border-purple-300/50'
    if (t.includes('dev')) return 'bg-amber-500/20 text-amber-900 border-amber-300/50'
    if (t.includes('genai') || t.includes('algorithm')) return 'bg-indigo-500/20 text-indigo-900 border-indigo-300/50'
    if (t.includes('system')) return 'bg-pink-500/20 text-pink-900 border-pink-300/50'
    return 'bg-blue-500/20 text-blue-900 border-blue-300/50'
}

// Format date to human-readable format
const formatDate = (dateString: string): string => {
    const [day, month, year] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('en-US', {
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

// Build a sorted list of all dates from the roadmap
const getAllRoadmapDates = (studyPlan: StudyPlan): string[] => {
    const allDates: string[] = []
    Object.values(studyPlan).forEach(phase => {
        Object.values(phase.Content || {}).forEach(week => {
            if (week.dates) {
                allDates.push(...week.dates)
            }
        })
    })
    // Sort dates chronologically
    return allDates.sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('-').map(Number)
        const [dayB, monthB, yearB] = b.split('-').map(Number)
        const dateA = new Date(yearA, monthA - 1, dayA)
        const dateB = new Date(yearB, monthB - 1, dayB)
        return dateA.getTime() - dateB.getTime()
    })
}

// Get consecutive day number for a date
const getConsecutiveDayNumber = (dateString: string, allDates: string[]): number => {
    const index = allDates.indexOf(dateString)
    return index !== -1 ? index + 1 : 0
}

const RoadmapNote = React.memo(function RoadmapNoteComponent({ date, existingNote, onClose, dayNumber, weekContent, notHomePage, showheatMap, setshowHeatMap }: RoadmapNoteProps) {
    const [noteText, setNoteText] = useState('')
    const [completedTopics, setCompletedTopics] = useState<string[]>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const [draggedOutItem, setDraggedOutItem] = useState<string | null>(null)
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (!auth.currentUser) {
            console.log('Please sign in to mark topics completed')
            return
        }
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
        if (!raw) return
        try {
            const item = JSON.parse(raw)
            if (item && item.name) {
                const newCompleted = completedTopics.includes(item.name) ? completedTopics : [...completedTopics, item.name]
                setCompletedTopics(newCompleted)
                handleSave(false, newCompleted)
                setIsDragOver(false)
            }
        } catch (err) {
            console.error('Invalid drop payload', err)
        }
    }

    // Memoize drag handlers to prevent re-registration on every state change
    const handleGlobalDrop = useCallback((e: DragEvent) => {
        const dropArea = document.getElementById('today-drop-area')
        if (dropArea && !dropArea.contains(e.target as Node)) {
            e.preventDefault()
            if (!auth.currentUser) return

            const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain')
            if (!raw) return

            try {
                const item = JSON.parse(raw)
                if (item && item.name && item.fromCompleted) {
                    setCompletedTopics(prev => {
                        if (prev.includes(item.name)) {
                            const newCompleted = prev.filter(t => t !== item.name)
                            // Defer save to avoid blocking drag
                            requestAnimationFrame(() => handleSave(false, newCompleted))
                            return newCompleted
                        }
                        return prev
                    })
                }
            } catch (err) {
                console.error('Invalid drop payload', err)
            }
        }
        setDraggedOutItem(null)
    }, [])

    const handleGlobalDragOver = useCallback((e: DragEvent) => {
        const dropArea = document.getElementById('today-drop-area')
        if (dropArea && !dropArea.contains(e.target as Node)) {
            e.preventDefault()
        }
    }, [])

    useEffect(() => {
        document.addEventListener('drop', handleGlobalDrop)
        document.addEventListener('dragover', handleGlobalDragOver)

        return () => {
            document.removeEventListener('drop', handleGlobalDrop)
            document.removeEventListener('dragover', handleGlobalDragOver)
        }
    }, [handleGlobalDrop, handleGlobalDragOver])

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

    const handleSave = async (closeAfterSave: boolean = true, completedTopicsOverride?: string[]) => {
        if (!auth.currentUser) {
            console.log('Please sign in to save notes')
            return
        }
        setLoading(true)
        try {
            const userEmail = auth.currentUser.email || 'unknown'
            const safeEmail = userEmail.replace(/[^a-zA-Z0-9_-]/g, '_')
            const docId = `${safeEmail}_${date}`

            const completedForSave = completedTopicsOverride ?? completedTopics

            const noteData = {
                date,
                content: noteText,
                completedTopics: completedForSave,
                email: userEmail,
                created: existingNote ? existingNote.data.created : new Date(),
                updated: new Date(),
                phase: existingNote?.data?.phase || null,
                week: existingNote?.data?.week || null
            }

            const noteRef = doc(db, 'roadmapNotes', docId)

            const isEmpty = (!noteText || noteText.trim() === '') && (!completedForSave || completedForSave.length === 0)

            if (existingNote) {
                if (isEmpty) {
                    await deleteDoc(noteRef)
                    console.log('Note deleted')
                    if (closeAfterSave) onClose()
                    setLoading(false)
                    return
                }
                await updateDoc(noteRef, noteData)
            } else {
                if (isEmpty) {
                    console.log('Nothing to save')
                    setLoading(false)
                    return
                }
                await setDoc(noteRef, noteData)
            }

            console.log('Note saved successfully!')
            if (closeAfterSave) onClose()
        } catch (error) {
            console.error('Error saving note:', error)
            console.log('Failed to save note')
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
            console.log('Note deleted')
            onClose()
        } catch (error) {
            console.error('Error deleting note:', error)
            console.log('Failed to delete note')
        }
        setLoading(false)
    }

    const handleDragStartFromCompleted = (e: React.DragEvent, item: string) => {
        try {
            e.dataTransfer.setData('application/json', JSON.stringify({ name: item, fromCompleted: true }))
            e.dataTransfer.effectAllowed = 'move'
            setDraggedOutItem(item)
        } catch (err) {
            e.dataTransfer.setData('text/plain', item)
        }
    }

    const handleDragEndFromCompleted = () => {
        setDraggedOutItem(null)
    }

    if (!notHomePage) {
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
                            onClick={() => handleSave()}
                            disabled={!isDirty || loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : existingNote ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        )
    } else {
        if (!showheatMap) {
            return (
                <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-6 fade-in2">
                    <div className="flex flex-row items-center mb-4 gap-2">
                        <h2 className="text-2xl font-bold text-gray-800">{formatWeekDay(date)}</h2>
                        <h2 className="text-xl font-semibold text-gray-600">({formatDate(date)})</h2>
                        {dayNumber && <span className="text-sm text-gray-500 ml-2 backdrop-blur-md bg-gray-500/10 px-3 py-1 rounded-full border border-gray-300/30">Day {dayNumber}</span>}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Today's Completed Topics</h3>
                        <div
                            id="today-drop-area"
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                            onDragEnter={() => setIsDragOver(true)}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            className={`min-h-[120px] p-4 border-2 border-dashed rounded-xl backdrop-blur-md flex flex-col gap-3 items-start justify-start transition-all ${isDragOver
                                ? 'border-green-400/80 bg-green-500/10 shadow-lg'
                                : 'border-slate-300/50 bg-gray-500/5'
                                }`}
                        >
                            <div className="text-xs text-gray-500">Drop a topic from the Week's Topics to mark it completed for this day.</div>
                            {completedTopics.length === 0 ? (
                                <div className="text-sm text-gray-400">No topics added yet. Drop one here.</div>
                            ) : (
                                <div className="w-full space-y-2">
                                    {completedTopics.map((t, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-grab transition-all backdrop-blur-md ${draggedOutItem === t
                                                ? 'bg-red-500/10 border-red-400/50 shadow-lg'
                                                : 'bg-white/60 border-gray-300/40 hover:bg-white/80 hover:shadow-md'
                                                }`}
                                            draggable
                                            onDragStart={(e) => handleDragStartFromCompleted(e, t)}
                                            onDragEnd={handleDragEndFromCompleted}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked className="w-4 h-4 accent-green-500" onChange={() => toggleTopic(t)} />
                                                <div className="text-sm font-medium text-gray-800">{t}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">Drag away to undo</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Notes</h3>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Write your notes here... What did you learn? Any challenges? Key insights?"
                            className="w-full h-64 p-4 border-2 border-gray-300/40 rounded-xl backdrop-blur-md bg-white/60 focus:outline-none focus:border-slate-500/60 focus:bg-white/80 resize-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            {existingNote && (
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 py-2 backdrop-blur-md bg-red-600/90 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {loading ? 'Processing...' : 'Delete'}
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => handleSave(true)}
                                disabled={!isDirty || loading}
                                className="px-6 py-2 backdrop-blur-md bg-green-600/90 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {loading ? 'Saving...' : existingNote ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-6 fade-in2">
                    <div className='flex flex-row justify-between'>
                        <div className="flex flex-row items-center mb-4 gap-2">
                            <h2 className="text-2xl font-bold text-gray-800">{formatWeekDay(date)}</h2>
                            <h2 className="text-xl font-semibold text-gray-600">({formatDate(date)})</h2>
                            {dayNumber && <span className="text-sm text-gray-500 ml-2 backdrop-blur-md bg-gray-500/10 px-3 py-1 rounded-full border border-gray-300/30">Day {dayNumber}</span>}
                        </div>
                        <button
                            className={`flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] border-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in bg-slate-500/20 border-slate-400 text-slate-800 hover:bg-slate-500/30 hover:shadow-[0_2px_5px_rgba(128,128,128,  1)]
                                        `}
                            onClick={() => { setshowHeatMap(prev => !prev) }}
                        >
                            Hide Heatmap
                        </button>
                    </div>

                    <div className='flex flex-row justify-around gap-10'>
                        <div className="mb-6 w-full">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Today's Completed Topics</h3>
                            <div
                                id="today-drop-area"
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                                onDragEnter={() => setIsDragOver(true)}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                className={`min-h-[120px] p-4 border-2 border-dashed rounded-xl backdrop-blur-md flex flex-col gap-3 items-start justify-start transition-all ${isDragOver
                                    ? 'border-green-400/80 bg-green-500/10 shadow-lg'
                                    : 'border-slate-300/50 bg-gray-500/5'
                                    }`}
                            >
                                <div className="text-xs text-gray-500">Drop a topic from the Week's Topics to mark it completed for this day.</div>
                                {completedTopics.length === 0 ? (
                                    <div className="text-sm text-gray-400">No topics added yet. Drop one here.</div>
                                ) : (
                                    <div className="w-full space-y-2">
                                        {completedTopics.map((t, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-grab transition-all backdrop-blur-md ${draggedOutItem === t
                                                    ? 'bg-red-500/10 border-red-400/50 shadow-lg'
                                                    : 'bg-white/60 border-gray-300/40 hover:bg-white/80 hover:shadow-md'
                                                    }`}
                                                draggable
                                                onDragStart={(e) => handleDragStartFromCompleted(e, t)}
                                                onDragEnd={handleDragEndFromCompleted}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked className="w-4 h-4 accent-green-500" onChange={() => toggleTopic(t)} />
                                                    <div className="text-sm font-medium text-gray-800">{t}</div>
                                                </div>
                                                <div className="text-xs text-gray-500">Drag away to undo</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-4 w-full">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Notes</h3>
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Write your notes here... What did you learn? Any challenges? Key insights?"
                                className="w-full h-64 p-4 border-2 border-gray-300/40 rounded-xl backdrop-blur-md bg-white/60 focus:outline-none focus:border-slate-500/60 focus:bg-white/80 resize-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-5">
                        <div>
                            {existingNote && (
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-4 py-2 backdrop-blur-md bg-red-600/90 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                                >
                                    {loading ? 'Processing...' : 'Delete'}
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => handleSave(true)}
                                disabled={!isDirty || loading}
                                className="px-6 py-2 backdrop-blur-md bg-green-600/90 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {loading ? 'Saving...' : existingNote ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    }
})

// Heatmap Component
const YearHeatmap = React.memo(function YearHeatmapComponent({ notes, onDateClick }: { notes: any[], onDateClick: (date: string) => void }) {
    const [hoveredDate, setHoveredDate] = useState<string | null>(null)
    const [hoveredCount, setHoveredCount] = useState<number>(0)

    const generateYearDates = () => {
        const dates = []
        const startDate = new Date(2026, 0, 1)
        const endDate = new Date(2026, 11, 31)

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const day = String(d.getDate()).padStart(2, '0')
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const year = d.getFullYear()
            dates.push(`${day}-${month}-${year}`)
        }
        return dates
    }

    const yearDates = generateYearDates()

    const dateActivityMap = useMemo(() => {
        const map = new Map<string, number>()
        notes.forEach(note => {
            const count = note.data?.completedTopics?.length || 0
            map.set(note.data.date, count)
        })
        return map
    }, [notes])

    const getActivityLevel = (count: number): number => {
        if (count === 0) return 0
        if (count <= 2) return 1
        if (count <= 4) return 2
        if (count <= 6) return 3
        return 4
    }

    const getColor = (level: number): string => {
        const colors = [
            'bg-gray-100/80',
            'bg-green-200/80',
            'bg-green-400/80',
            'bg-green-600/80',
            'bg-green-800/80'
        ]
        return colors[level]
    }

    const weeks: string[][] = []
    let currentWeek: string[] = []

    const firstDay = new Date(2026, 0, 1).getDay()

    for (let i = 0; i < firstDay; i++) {
        currentWeek.push('')
    }

    yearDates.forEach((date) => {
        currentWeek.push(date)
        if (currentWeek.length === 7) {
            weeks.push([...currentWeek])
            currentWeek = []
        }
    })

    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push('')
        }
        weeks.push(currentWeek)
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return (
        <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">Your 2026 Study Progress</h3>
                    {hoveredDate ? (
                        <div className="text-sm text-gray-600 backdrop-blur-md bg-gray-500/10 px-3 py-1 rounded-full border border-gray-300/30">
                            {formatDate(hoveredDate)}: <span className="font-semibold">{hoveredCount} topics</span>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 backdrop-blur-md bg-gray-500/10 px-3 py-1 rounded-full border border-gray-300/30">
                            No topics
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(level => (
                            <div key={level} className={`w-3 h-3 ${getColor(level)} border border-gray-300/40 backdrop-blur-sm`}></div>
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block">
                    <div className="flex mb-1 ml-8">
                        {months.map((month, idx) => (
                            <div key={idx} className="text-xs text-gray-600 w-16 text-left">
                                {month}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        <div className="flex flex-col gap-1 mr-2 text-xs text-gray-600">
                            <div className="h-3"></div>
                            <div className="h-3">Mon</div>
                            <div className="h-3"></div>
                            <div className="h-3">Wed</div>
                            <div className="h-3"></div>
                            <div className="h-3">Fri</div>
                            <div className="h-3"></div>
                        </div>

                        <div className="flex gap-1">
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-1">
                                    {week.map((date, dayIdx) => {
                                        if (!date) {
                                            return <div key={dayIdx} className="w-3 h-3"></div>
                                        }
                                        const count = dateActivityMap.get(date) || 0
                                        const level = getActivityLevel(count)
                                        const color = getColor(level)

                                        return (
                                            <div
                                                key={dayIdx}
                                                className={`w-3 h-3 ${color} border border-gray-300/40 rounded-sm cursor-pointer hover:ring-2 hover:ring-slate-400/60 transition-all backdrop-blur-sm hover:scale-110`}
                                                onClick={() => onDateClick(date)}
                                                onMouseEnter={() => {
                                                    setHoveredDate(date)
                                                    setHoveredCount(count)
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredDate(null)
                                                    setHoveredCount(0)
                                                }}
                                            ></div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

function RoadmapManager() {
    const [selectedPhase, setSelectedPhase] = useState<string>('phase1')
    const [selectedWeek, setSelectedWeek] = useState<string>('Week 1')
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [timeOut, setTimeOut] = useState(true)
    const [notes, setNotes] = useState<any[]>([])
    const [showHeatMap, setShowHeatMap] = useState<boolean>(false)
    const [showDays, setShowDays] = useState<boolean>(false)

    const today = new Date()
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`

    const [user] = useAuthState(auth)

    const studyPlan: StudyPlan = useMemo(() => roadmapData as StudyPlan, [])

    const allRoadmapDates = useMemo(() => getAllRoadmapDates(studyPlan), [studyPlan])

    // Create O(1) lookup for day numbers instead of searching array every time
    const dayNumberMap = useMemo(() => {
        const map = new Map<string, number>()
        allRoadmapDates.forEach((date, idx) => {
            map.set(date, idx + 1)
        })
        return map
    }, [allRoadmapDates])

    const getDayNumber = useCallback((date: string) => {
        return dayNumberMap.get(date) || 0
    }, [dayNumberMap])

    // Create O(1) lookup map for notes instead of repeated find() calls
    const notesByDate = useMemo(() => {
        const map = new Map()
        notes.forEach(note => {
            map.set(note.data.date, note)
        })
        return map
    }, [notes])

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

    // Consolidated effect: Initialize phase/week/day on mount and validate on changes
    useEffect(() => {
        const sp = studyPlan
        let found = false

        // Try to find today's date first
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
    }, [formattedToday, studyPlan])

    // Validate week exists in phase
    useEffect(() => {
        const currentPhase = studyPlan[selectedPhase]
        if (currentPhase?.Content) {
            const weeks = Object.keys(currentPhase.Content)
            if (weeks.length > 0 && !weeks.includes(selectedWeek)) {
                setSelectedWeek(weeks[0])
                setSelectedDay(currentPhase.Content[weeks[0]]?.dates?.[0] || null)
            }
        }
    }, [selectedPhase, studyPlan])

    // Validate day exists in week
    useEffect(() => {
        const currentPhase = studyPlan[selectedPhase]
        const currentWeek = currentPhase?.Content[selectedWeek]
        if (currentWeek?.dates && currentWeek.dates.length > 0) {
            if (!currentWeek.dates.includes(selectedDay || '')) {
                setSelectedDay(currentWeek.dates[0])
            }
        }
    }, [selectedWeek, selectedPhase, studyPlan])

    const location = useLocation()
    const NOTHomePage = !["/"].includes(location.pathname)

    const currentPhase = studyPlan[selectedPhase]
    const currentWeek = currentPhase?.Content[selectedWeek]

    // const isTodayInCurrentWeek = currentWeek?.dates?.includes(formattedToday)

    const navigateToDate = useCallback((date: string) => {
        const sp = roadmapData as StudyPlan
        for (const [phaseKey, phase] of Object.entries(sp)) {
            for (const [weekKey, week] of Object.entries(phase.Content || {})) {
                if (week.dates && week.dates.includes(date)) {
                    setSelectedPhase(phaseKey)
                    setSelectedWeek(weekKey)
                    setSelectedDay(date)
                    return
                }
            }
        }
    }, [])

    const goToToday = useCallback(() => {
        const sp = roadmapData as StudyPlan
        for (const [phaseKey, phase] of Object.entries(sp)) {
            for (const [weekKey, week] of Object.entries(phase.Content || {})) {
                if (week.dates && week.dates.includes(formattedToday)) {
                    setSelectedPhase(phaseKey)
                    setSelectedWeek(weekKey)
                    setSelectedDay(formattedToday)
                    return
                }
            }
        }
    }, [formattedToday])

    const completedInWeek = useMemo(() => {
        const set = new Set<string>()
        if (currentWeek?.dates && notesByDate.size > 0) {
            currentWeek.dates.forEach(d => {
                const n = notesByDate.get(d)
                if (n?.data?.completedTopics) {
                    n.data.completedTopics.forEach((t: string) => set.add(t))
                }
            })
        }
        return set
    }, [currentWeek?.dates, notesByDate])

    const globalCompleted = useMemo(() => {
        const set = new Set<string>()
        notes.forEach(n => {
            n.data?.completedTopics?.forEach((t: string) => set.add(t))
        })
        return set
    }, [notes])

    const overdueTopics = useMemo(() => {
        const items: { name: string; tag: string; weekKey: string }[] = []
        const weeks = Object.keys(currentPhase?.Content || {})
        const selIndex = weeks.indexOf(selectedWeek)
        for (let i = 0; i < selIndex; i++) {
            const weekKey = weeks[i]
            const wk = currentPhase?.Content[weekKey]
            if (wk?.content) {
                wk.content.forEach(item => {
                    if (!globalCompleted.has(item.name)) {
                        items.push({ name: item.name, tag: item.tag, weekKey })
                    }
                })
            }
        }
        return items
    }, [currentPhase?.Content, selectedWeek, globalCompleted])

    const handleDragStart = useCallback((e: React.DragEvent, item: { name: string; tag: string }) => {
        try {
            e.dataTransfer.setData('application/json', JSON.stringify(item))
            e.dataTransfer.effectAllowed = 'move'
            try { e.currentTarget.classList.add('opacity-60', 'scale-95') } catch (err) { }
        } catch (err) {
            e.dataTransfer.setData('text/plain', item.name)
        }
    }, [])

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        try { e.currentTarget.classList.remove('opacity-60', 'scale-95') } catch (err) { }
    }, [])

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
                    <Link to={'/Roadmap'} className="p-2 px-4 rounded-full border-2 border-white hover:border-stone-300 backdrop-blur-md bg-white/60 transition-all">
                        <i className='fa-solid fa-road fa-lg mr-2'></i>
                        Roadmap
                    </Link>
                }
            </div>
        )
    }

    const getNoteForDate = useCallback((date: string) => {
        return notesByDate.get(date)
    }, [notesByDate])

    if (user === null || timeOut) {
        return (
            <div className="flex flex-col justify-center items-center">
                <div className={`p-2 ${NOTHomePage ? 'w-4/6' : 'backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl w-full border border-white/40'}`}>
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
        <div className="flex flex-col justify-center items-center -mt-10">
            <div className={`p-4 ${NOTHomePage ? 'w-11/12' : 'backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl w-full border border-white/40'}`}>
                {renderHeader()}


                {NOTHomePage && showHeatMap && (
                    <YearHeatmap notes={notes} onDateClick={navigateToDate} />
                )}


                {!showHeatMap ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${NOTHomePage ? 'md:col-span-1 backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-4' : 'hidden'}`}>
                        {NOTHomePage && (
                            <div>
                                <div className='flex flex-row justify-around mb-10'>
                                    {!showDays && <button
                                        className={`flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in
                                        ${showHeatMap ? 'bg-slate-500/20 border-slate-400 text-slate-800 hover:bg-slate-500/30 hover:shadow-[0_2px_5px_rgba(0,128,0,0.08)]' : ''}
                                        `}
                                        onClick={() => { setShowHeatMap(prev => !prev) }}
                                    >
                                        {showHeatMap ? 'Hide' : 'Show'} Heatmap
                                    </button>}

                                    {!showHeatMap && <button
                                        className={`flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in
                                        ${showDays ? 'bg-slate-500/20 border-slate-400 text-slate-800 hover:bg-slate-500/30 hover:shadow-[0_2px_5px_rgba(128,128,128,  1)]' : ''}
                                        `}
                                        onClick={() => setShowDays(prev => !prev)}
                                    >
                                        {showDays ? 'Hide Day Selection' : 'Select Other Day'}
                                    </button>}
                                </div>
                                {showDays && <div className="mb-6 fade-in">
                                    <div className="mb-10 flex flex-row gap-3 flex-wrap items-center">
                                        <select
                                            value={selectedPhase}
                                            onChange={(e) => setSelectedPhase(e.target.value)}
                                            className="group relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl text-md font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] w-full z-0"
                                        >
                                            {Object.keys(studyPlan).map((phaseKey) => (
                                                <option key={phaseKey} value={phaseKey}>
                                                    {studyPlan[phaseKey].Name}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex flex-row justify-between gap-2 w-full z-10">
                                            <button
                                                onClick={() => {
                                                    const weeks = Object.keys(currentPhase?.Content || {})
                                                    const currentIndex = weeks.indexOf(selectedWeek)
                                                    if (currentIndex > 0) setSelectedWeek(weeks[currentIndex - 1])
                                                }}
                                                className="flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in"
                                            >
                                                ⬅
                                            </button>

                                            <div className='flex flex-row gap-2'>
                                                <select
                                                    value={selectedWeek}
                                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                                    className="group relative flex flex-col items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] w-24"
                                                >
                                                    {Object.keys(currentPhase?.Content || {}).map((weekKey) => (
                                                        <option key={weekKey} value={weekKey}>
                                                            {weekKey}
                                                        </option>
                                                    ))}
                                                </select>

                                                {!(selectedDay === formattedToday) && (
                                                    <button
                                                        onClick={goToToday}
                                                        className="flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in"
                                                    >
                                                        <i className="fas fa-calendar-day"></i>
                                                        Today
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const weeks = Object.keys(currentPhase?.Content || {})
                                                    const currentIndex = weeks.indexOf(selectedWeek)
                                                    if (currentIndex < weeks.length - 1) setSelectedWeek(weeks[currentIndex + 1])
                                                }}
                                                className="flex flex-row gap-2 items-center justify-center px-3 py-1 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] fade-in"
                                            >
                                                ➡
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-wrap justify-around gap-4">
                                        {currentWeek?.dates.map((date, idx) => {
                                            const hasNote = getNoteForDate(date)
                                            const dayNumber = getDayNumber(date)
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedDay(date)}
                                                    aria-current={selectedDay === date ? "page" : undefined}
                                                    title={formatDate(date)}
                                                    className={`w-fit group relative flex flex-col items-center justify-center px-8 py-2 rounded-2xl text-sm font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out ${selectedDay === date ? `bg-slate-200/10 border-slate-200/20 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)]` : `bg-white/20 border-white/30 text-slate-700 hover:bg-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_10px_rgba(0,0,0,0.08)] active:scale-[0.97]`}`}
                                                >
                                                    <div className="relative font-medium flex flex-col items-center justify-center w-fit">
                                                        <span className='text-md'>
                                                            Day {dayNumber}
                                                        </span>
                                                        <span className='text-xs'>
                                                            {formatWeekDay(date).slice(0, 3)}, {formatDate(date).split(',')[0]}
                                                        </span>
                                                    </div>

                                                    {hasNote && (
                                                        <span className="absolute bottom-1 h-[3px] w-5 rounded-full bg-green-500/60" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>}
                            </div>
                        )}

                        {!showDays && <>
                            <h3 className="text-xl font-bold mb-4 text-gray-800">Week's Topics</h3>

                            <div className="space-y-2 scrl h-screen max-h-[55vh] p-2 fade-in">
                                {/* Current Week Topics from JSON */}
                                {currentWeek?.content.map((item, idx) => {
                                    const isCompleted = completedInWeek.has(item.name)
                                    const baseClasses = `
                                group relative flex flex-row items-center justify-center px-3 py-1.5 rounded-xl font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)]  backdrop-blur-md ${isCompleted
                                            ? 'bg-green-500/10 border-green-400/50'
                                            : 'bg-white/20 border-white/30 hover:bg-white/30'
                                        }`

                                    const content = (
                                        <div className="flex flex-row items-center gap-2 w-full">
                                            <div className="flex-1 w-full">
                                                <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                                                    }`}>
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className={`inline-block px-1 text-xs font-semibold rounded mt-2 border backdrop-blur-sm ${isCompleted
                                                        ? 'bg-green-500/20 text-green-900 border-green-300/50'
                                                        : getTagClasses(item.tag)
                                                        }`}>
                                                        {item.tag}
                                                    </span>
                                                </div>
                                            </div>
                                            {isCompleted && (
                                                <div className="text-sm text-green-700 font-semibold">Done</div>
                                            )}
                                        </div>
                                    )

                                    return (
                                        <div key={`current-${idx}`} draggable onDragStart={(e) => handleDragStart(e, item)} onDragEnd={(e) => handleDragEnd(e)} className={`${baseClasses} cursor-grab hover:shadow-md`}>
                                            {content}
                                        </div>
                                    )
                                })}

                                {/* AUTO-GENERATED NeetCode 250 Daily for each day */}
                                {currentWeek?.dates.map((date, dateIdx) => {
                                    const dayNumber = getDayNumber(date)
                                    const neetCodeItem = {
                                        name: `NeetCode 250 Daily #${dayNumber}`,
                                        tag: 'DSA'
                                    }
                                    const isCompleted = completedInWeek.has(neetCodeItem.name)

                                    const baseClasses = `
                                group relative flex flex-row items-center justify-center px-3 py-1.5 rounded-xl font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)]  backdrop-blur-md ${isCompleted
                                            ? 'bg-green-500/10 border-green-400/50'
                                            : 'bg-white/20 border-white/30 hover:bg-white/30'
                                        }`

                                    return (
                                        <div
                                            key={`neet-${dateIdx}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, neetCodeItem)}
                                            onDragEnd={(e) => handleDragEnd(e)}
                                            className={`${baseClasses} cursor-grab hover:shadow-md flex flex-row items-center gap-2 w-full`}>
                                            <div className="flex-1 w-full">
                                                <a
                                                    href={'https://neetcode.io/practice'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800 hover:underline'
                                                        }`}>
                                                    {neetCodeItem.name}
                                                </a>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block px-1 text-xs font-semibold rounded mt-2 border backdrop-blur-sm ${isCompleted
                                                            ? 'bg-green-500/20 text-green-900 border-green-300/50'
                                                            : 'bg-purple-500/20 text-purple-900 border-purple-300/50'
                                                            }`}>
                                                            {neetCodeItem.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isCompleted && (
                                                <div className="text-sm text-green-700 font-semibold">Done</div>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Overdue Topics */}
                                {overdueTopics.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-300/30">
                                        <h4 className="text-sm font-semibold mb-2 text-red-600">Overdue from previous weeks</h4>
                                        <div className="space-y-2">
                                            {overdueTopics.map((ot, i) => {
                                                const baseClasses = `
                                                group relative flex flex-row items-center justify-center px-3 py-1.5 rounded-xl font-medium backdrop-blur-xl backdrop-saturate-150 border transition-all duration-200 ease-out shadow-[0_4px_10px_rgba(0,0,0,0.08)] active:scale-[0.97] hover:shadow-[0_2px_5px_rgba(0,0,0,0.08)] cursor-grab bg-yellow-500/10 border-yellow-400/50`

                                                return (
                                                    <div
                                                        key={`overdue-${i}`}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, ot)}
                                                        onDragEnd={(e) => handleDragEnd(e)}
                                                        className={baseClasses}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex flex-col items-start justify-between w-full">
                                                                <p className="text-sm font-medium text-gray-800">{ot.name}</p>
                                                                <div>
                                                                    <span className={`inline-block px-1 text-xs font-semibold rounded mb-2 border backdrop-blur-sm ${getTagClasses(ot.tag)}`}>
                                                                        {ot.tag}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col text-sm text-yellow-700 font-semibold">Overdue<span className='text-xs'>({ot.weekKey})</span></div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>}
                    </div>

                    <div className={`${!NOTHomePage ? 'md:col-span-3' : 'md:col-span-2'}`}>
                        {selectedDay ? (
                            <RoadmapNote
                                date={selectedDay}
                                weekContent={currentWeek?.content || []}
                                existingNote={getNoteForDate(selectedDay)}
                                onClose={() => setSelectedDay(null)}
                                phase={selectedPhase}
                                week={selectedWeek}
                                dayNumber={getConsecutiveDayNumber(selectedDay, allRoadmapDates)}
                                notHomePage={NOTHomePage}
                                showheatMap={showHeatMap}
                                setshowHeatMap={setShowHeatMap}
                            />
                        ) : (
                            <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-8 h-full flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <i className="fas fa-calendar-day text-6xl mb-4"></i>
                                    <p className="text-xl">Select a day to view or add notes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                    :
                    <div>
                        {selectedDay ? (
                            <RoadmapNote
                                date={selectedDay}
                                weekContent={currentWeek?.content || []}
                                existingNote={getNoteForDate(selectedDay)}
                                onClose={() => setSelectedDay(null)}
                                phase={selectedPhase}
                                week={selectedWeek}
                                dayNumber={getConsecutiveDayNumber(selectedDay, allRoadmapDates)}
                                notHomePage={NOTHomePage}
                                showheatMap={showHeatMap}
                                setshowHeatMap={setShowHeatMap}
                            />
                        ) : (
                            <div className="backdrop-blur-xl bg-white/70 border border-white/40 rounded-2xl shadow-2xl p-8 h-full flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <i className="fas fa-calendar-day text-6xl mb-4"></i>
                                    <p className="text-xl">Select a day to view or add notes</p>
                                </div>
                            </div>
                        )}
                    </div>
                }
            </div>
        </div>
    )
}

export default RoadmapManager