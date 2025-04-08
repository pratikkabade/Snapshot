import { useState, useEffect } from 'react'
import { query, orderBy, onSnapshot } from "firebase/firestore"
import { auth, tasksCollectionRef } from '../../config/Firebase'
import { Task } from './Task'
import { AddTask } from './AddTask'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Link, useLocation } from 'react-router-dom'


function TaskManager() {
    const [view, setView] = useState(false)
    const [tasks, setTasks] = useState([])
    const [showCompleted, setShowCompleted] = useState(false)
    const [timeOut, setTimeOut] = useState(true)

    const [user] = useAuthState(auth);


    // function to get all tasks from firestore in realtime
    useEffect(() => {
        const q = query(tasksCollectionRef, orderBy('created', 'desc'))
        onSnapshot(q, (querySnapshot) => {
            const taskList: { id: string, data: any }[] = [] // Explicitly define the type of taskList
            querySnapshot.forEach((doc) => {
                doc.data().email === user?.email &&
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
            <div className="flex flex-row justify-center text-2xl text-blue-700 font-semibold text-center mt-2 mb-5">
                {NOTHomePage ?
                    <></>
                    :
                    <Link to={'/Tasks'} className="p-2 px-4 rounded-full border-2 border-white hover:border-blue-300">
                        <i className='fa-solid fa-circle-check mr-3'></i>
                        Tasks{` (${uncompletedTasks}/${totalTasks})`}
                    </Link>
                }
            </div>
        )
    }

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Tasks (${uncompletedTasks}/${totalTasks})`
        }
    }, [totalTasks, NOTHomePage, uncompletedTasks])

    if (user === null || timeOut) return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? 'w-4/6' : 'w-full'}`}>
                {renderHeader()}
                <div className='scrl h-72'>
                    {
                        user ?
                            <h3 className="text-xl text-center font-bold animate-pulse">Loading..</h3>
                            :
                            <h3 className="text-xl text-red-600 text-center font-bold">Sign in to add tasks </h3>
                    }
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? 'w-4/6' : 'w-full'}`}>
                {renderHeader()}
                <div className={`${NOTHomePage ? '' : 'scrl h-72'}`}>
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
                </div>
            </div>
        </div>
    )
}

export default TaskManager
