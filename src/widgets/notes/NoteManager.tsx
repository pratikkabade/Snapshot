import { useState, useEffect } from 'react'
import { query, orderBy, onSnapshot } from "firebase/firestore"
import { auth, notesCollectionRef } from '../../config/Firebase'
import { Note } from './Note'
import { AddNote } from './AddNote'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Link, useLocation } from 'react-router-dom'

function NoteManager() {
    const [view, setView] = useState(false)
    const [notes, setNotes] = useState([])
    const [timeOut, setTimeOut] = useState(true)

    const [user] = useAuthState(auth);

    // function to get all notes from firestore in realtime
    useEffect(() => {
        const q = query(notesCollectionRef, orderBy('created', 'desc'))
        onSnapshot(q, (querySnapshot) => {
            const noteList: { id: string, data: any }[] = [] // Explicitly define the type of noteList
            querySnapshot.forEach((doc) => {
                doc.data().email === user?.email &&
                    noteList.push({
                        id: doc.id,
                        data: doc.data()
                    })
            })
            setNotes(noteList)
        })
    }, [user])

    // total number of notes
    const totalNotes = notes.length

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeOut(false)
        }, 3000)
        return () => clearTimeout(timer)
    })

    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);
    const renderHeader = () => {
        return (
            <div className="flex flex-row justify-center text-2xl text-amber-700 font-semibold text-center mt-2 mb-5">
                {NOTHomePage ?
                    <></>
                    :
                    <Link to={'/Notes'} className="p-2 px-4 rounded-full border-2 border-white hover:border-amber-300">
                        <i className='fa-solid fa-lightbulb mr-3'></i>
                        Notes{` (${totalNotes})`}
                    </Link>
                }
            </div>
        )
    }

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Notes (${totalNotes})`
        }
    }, [totalNotes, NOTHomePage])

    if (user === null || timeOut) return (
        <div className="flex flex-col justify-center items-center">
            <div className={`p-2 ${NOTHomePage ? 'w-4/6' : 'bg-white rounded-xl shadow-md w-full'}`}>
                {renderHeader()}
                <div className={`${!NOTHomePage && 'scrl h-72'}`}>
                    {
                        user ?
                            <h3 className="text-xl text-center font-bold animate-pulse">Loading..</h3>
                            :
                            <h3 className="text-xl text-red-600 text-center font-bold">Sign in to add notes </h3>
                    }
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`p-2 ${NOTHomePage ? 'w-5/6' : 'bg-white rounded-xl shadow-md w-full'}`}>
                {renderHeader()}
                {/* <div className='scrl h-72'> */}
                <div className={`flex flex-row flex-wrap ${NOTHomePage ? '' : 'scrl h-72'}`}>
                    <div className='flex flex-row flex-wrap'>
                        {notes
                            .map((note) => (
                                <Note
                                    id={note.id}
                                    key={note.id}
                                    title={note.data.title}
                                />
                            ))}

                        {
                            view ?
                                <>
                                    <AddNote onClose={() => setView(false)} open={view} />
                                </> :
                                <div
                                    className="m-1 fade-in2 cursor-pointer flex flex-row justify-start items-center content-center px-3 py-1.5 hover:bg-green-50 rounded-lg border-2 border-green-700"
                                    onClick={() => setView(true)}>
                                    <div
                                        className="ml-3 text-start">
                                        <h3 className="text-lg font-bold">Add </h3>
                                    </div>

                                    <button
                                        type="button"
                                        className="opacity-0 font-medium rounded-full text-sm h-fit p-2 ">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteManager