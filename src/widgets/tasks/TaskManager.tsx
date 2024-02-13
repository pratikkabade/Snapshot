import { useState, useEffect } from 'react'
import { query, orderBy, onSnapshot } from "firebase/firestore"
import { tasksCollectionRef } from '../../config/Firebase'
import { Task } from './Task'
import { AddTask } from './AddTask'

function TaskManager() {
    const [view, setView] = useState(false)
    const [tasks, setTasks] = useState([])

    /* function to get all tasks from firestore in realtime */
    useEffect(() => {
        const q = query(tasksCollectionRef, orderBy('created', 'desc'))
        onSnapshot(q, (querySnapshot) => {
            setTasks(querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    data: doc.data()
                })))
        })
    }, [])

    return (
        <div className='w-64 p-2 rounded-lg'>
            <header>Task Manager</header>
            <div>
                {view ?
                    <>
                        <AddTask onClose={() => setView(false)} open={view} />
                        {/* <button
                            onClick={() => setView(false)}
                            className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800">
                            Cancel
                        </button> */}
                    </> :
                    // <button
                    //     onClick={() => setView(true)}
                    //     className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                    //     Add task +
                    // </button>

                    <div
                        className="fade-in2 cursor-pointer flex flex-row justify-between items-center content-center px-3 py-1.5 hover:bg-sky-50 rounded-lg"
                        onClick={() => setView(true)}>
                        <div
                            className="hover:text-slate-600 dark:hover:text-slate-500">
                            <h3 className="text-lg font-bold">Add </h3>
                            <p className="text-sm">Task</p>
                        </div>
                    </div>


                }
                <div className='bg-white p-2 rounded-lg'>
                    {tasks.map((task) => (
                        <Task
                            id={task.id}
                            key={task.id}
                            completed={task.data.completed}
                            title={task.data.title}
                            description={task.data.description}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TaskManager
