import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export const Task = ({ id, title, description, completed }: any) => {
    const handleCheckedChange1 = async () => {
        setTimeout(async () => {
            const taskDocRef = doc(db, 'tasks', id)
            try {
                await updateDoc(taskDocRef, {
                    completed: !completed
                })
            } catch (err) {
                alert(err)
            }
        }, 500)
    }
    const handleCheckedChange2 = async () => {
        setTimeout(async () => {
            const taskDocRef = doc(db, 'tasks', id)
            try {
                await updateDoc(taskDocRef, {
                    completed: !completed
                })
            } catch (err) {
                alert(err)
            }
        }, 2000)
    }
    const handleDelete = async () => {
        const taskDocRef = doc(db, 'tasks', id)
        try {
            await deleteDoc(taskDocRef)
        } catch (err) {
            alert(err)
        }
    }



    return (
        <div className="fade-in2 flex flex-row justify-between items-center content-center px-3 py-1.5 hover:bg-sky-50 rounded-lg group">
            <label
                htmlFor={`checkbox-${id}`}
                className="flex flex-row justify-start items-center w-full">
                {
                    completed ? (
                        <input
                            type='checkbox'
                            id={`checkbox-${id}`}
                            checked={completed}
                            onChange={handleCheckedChange1}
                            className="my-1  peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-7 before:w-7 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-blue-500 checked:bg-blue-500 checked:before:bg-blue-500 hover:before:opacity-20" />
                    ) : (
                        <input
                            type='checkbox'
                            id={`checkbox-${id}`}
                            // checked={completed}
                            onChange={handleCheckedChange2}
                            className="my-1  peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-7 before:w-7 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-blue-500 checked:bg-blue-500 checked:before:bg-blue-500 hover:before:opacity-20" />

                    )
                }
                <div
                    className="ml-3">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-sm">{description}</p>
                </div>
            </label>
            <button
                type="button"
                className="focus:outline-none opacity-0 group-hover:opacity-100 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm h-fit p-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                onClick={handleDelete}>
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    )
};