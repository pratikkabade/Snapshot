import { addDoc, Timestamp } from 'firebase/firestore'
import { auth, tasksCollectionRef } from '../../config/Firebase'
import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

export const AddTask = ({ open, onClose }: any) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const [user] = useAuthState(auth);

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            await addDoc(tasksCollectionRef, {
                title: title,
                description: description,
                completed: false,
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

    // press enter to submit the form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit(e)
        }
    })

    // press esc to close the form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
        }
    })




    return (
        <div className='fade-in p-2 rounded-lg' style={{ display: open ? 'flex' : 'none' }}>
            <form onSubmit={handleSubmit} className='taskinputs flex flex-row justify-center align-middle'>
                <div className='flex flex-col'>
                    <input
                        type='text'
                        className="w-full rounded-lg pl-2 border-none focus:border-none focus:font-extrabold text-lg font-bold"
                        placeholder='Title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <input
                        type='text'
                        className="w-full rounded-lg pl-2 border-none focus:border-none focus:font-medium text-sm"
                        placeholder='Description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <button
                    type='submit'
                    className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-3xl text-sm px-1.5 me-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800 block my-1">
                    <i className='fas fa-plus text-lg'></i>
                </button>
            </form>
        </div>
    )
}