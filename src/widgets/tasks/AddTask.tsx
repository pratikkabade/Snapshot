import { addDoc, Timestamp } from 'firebase/firestore'
import { tasksCollectionRef } from '../../config/Firebase'
import { useState } from 'react'

export const AddTask = ({ open, onClose }: any) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            await addDoc(tasksCollectionRef, {
                title: title,
                description: description,
                completed: false,
                created: Timestamp.now()
            })
            onClose()
        } catch (err) {
            alert(err)
        }
    }

    return (
        <div className='fade-in bg-sky-100 p-2 rounded-lg' style={{ display: open ? 'flex' : 'none' }}>
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    className="flex flex-col m-2 p-2 rounded-xl bg-blue-200 w-full"
                    placeholder='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <input
                    type='text'
                    className="flex flex-col m-2 p-2 rounded-xl bg-blue-200 w-full"
                    placeholder='Description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button
                    type='submit'
                    className="text-white bg-emerald-700 hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-emerald-600 dark:hover:bg-emerald-700 focus:outline-none dark:focus:ring-emerald-800">
                    Add +
                </button>
            </form>
        </div>
    )
}