import { useState, useEffect } from 'react'
import { query, orderBy, onSnapshot } from "firebase/firestore"
import { auth, tasksCollectionRef } from '../../config/Firebase'
import { Task } from './Task'
import { AddTask } from './AddTask'
import { useAuthState } from 'react-firebase-hooks/auth'

function TaskManager() {
    const [view, setView] = useState(false)
    const [tasks, setTasks] = useState([])
    const [showCompleted, setShowCompleted] = useState(false)

    const [user] = useAuthState(auth);

    // function to get all tasks from firestore in realtime
    useEffect(() => {
        const q = query(tasksCollectionRef, orderBy('created', 'desc'))
        onSnapshot(q, (querySnapshot) => {
            const taskList: { id: string, data: any }[] = [] // Explicitly define the type of taskList
            querySnapshot.forEach((doc) => {
                doc.data().email === user.email &&
                    taskList.push({
                        id: doc.id,
                        data: doc.data()
                    })
            })
            setTasks(taskList)
        })
    }, [user])

    // total number of tasks
    const totalTasks = tasks.length
    // total uncompleted tasks
    const uncompletedTasks = tasks.filter((task) => !task.data.completed).length

    return (
        <div className='w-64 p-2 scrl h-80 rounded-lg'>
            <>
                <h3 className="text-2xl text-blue-800 font-semibold text-center mt-2 mb-5">
                    <i className='fa-solid fa-tasks mr-3'></i>
                    Tasks ({uncompletedTasks}/{totalTasks})
                    </h3>
                {
                    view ?
                        <>
                            < AddTask onClose={() => setView(false)} open={view} />
                        </> :
                        <div
                            className="fade-in2 cursor-pointer flex flex-row justify-start items-center content-center px-3 py-1.5 hover:bg-sky-50 rounded-lg"
                            onClick={() => setView(true)}>
                            <input
                                type='checkbox'
                                className="my-1 opacity-0 h-5 w-5 cursor-pointer rounded-full" />
                            <div
                                className="ml-3 text-start">
                                <h3 className="text-lg font-bold">Add </h3>
                                <p className="text-sm">Task</p>
                            </div>
                        </div>
                }
                <div className='rounded-lg'>
                    {tasks
                        .filter((task) => (task.data.completed === false))
                        .map((task) => (
                            <Task
                                id={task.id}
                                key={task.id}
                                completed={task.data.completed}
                                title={task.data.title}
                                description={task.data.description}
                            />
                        ))}

                    <div>
                        <div
                            className="fade-in2 cursor-pointer flex flex-row justify-start items-center content-center px-3 py-1.5 hover:bg-sky-50 rounded-lg"
                            onClick={() => setShowCompleted(!showCompleted)}>
                            <div
                                className="ml-3 text-start">
                                <h3 className="text-lg font-bold">
                                    {showCompleted && <i className="fa-solid fa-chevron-up mr-2 fade-in"></i>}
                                    {!showCompleted && <i className="fa-solid fa-chevron-down mr-2 fade-in"></i>}
                                    Completed
                                </h3>
                            </div>
                        </div>
                        {showCompleted && tasks
                            .filter((task) => (task.data.completed === true))
                            .map((task) => (
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
            </>
        </div >
    )
}

export default TaskManager
