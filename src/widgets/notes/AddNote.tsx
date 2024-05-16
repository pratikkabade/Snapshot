import { addDoc, Timestamp } from 'firebase/firestore'
import { auth, notesCollectionRef } from '../../config/Firebase'
import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

export const AddNote = ({ open, onClose }: any) => {
    const [title, setTitle] = useState('')

    const [user] = useAuthState(auth);

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            await addDoc(notesCollectionRef, {
                title: title,
                created: Timestamp.now(),
                email: user.email
            })
            onClose()
        } catch (err) {
            alert(err)
        }
    }

    // focus on the title input field when the form is opened
    useEffect(() => {
        setTimeout(() => {
            const inputElement = document.querySelector('.taskinputs input[type="text"]') as HTMLInputElement;
            inputElement?.focus();
        }, 100);
    }, [])

    // // press enter to submit the form
    // document.addEventListener('keydown', (e) => {
    //     if (e.key === 'Enter') {
    //         e.preventDefault()
    //         handleSubmit(e)
    //     }
    // })

    // press esc to close the form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
        }
    })


    return (
        <div className='m-1 fade-in p-2 rounded-lg border-2 border-slate-500' style={{ display: open ? 'flex' : 'none' }}>
            <form onSubmit={handleSubmit} className='taskinputs flex flex-row justify-center items-center align-middle'>
                <div className='flex flex-col'>
                    <input
                        type='text'
                        className="w-24 rounded-lg pl-2 border-none focus:border-none focus:font-extrabold text-lg font-bold"
                        placeholder='Title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="focus:outline-none text-white bg-emerald-700 hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-300 font-medium rounded-full text-sm h-5 w-5 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:focus:ring-emerald-900">
                    <i className="fa-solid fa-plus"></i>
                </button>
            </form>
        </div>
    )
}