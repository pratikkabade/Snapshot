import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export const Task = ({ id, title, description, completed }: any) => {
    const handleCheckedChange = async () => {
        const taskDocRef = doc(db, 'tasks', id)
        try {
            await updateDoc(taskDocRef, {
                completed: !completed
            })
        } catch (err) {
            alert(err)
        }
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
        <div className="fade-in2 flex flex-row justify-between items-center content-center px-3 py-1.5 hover:bg-sky-50 rounded-lg">
            <label
                htmlFor={`checkbox-${id}`}
                className="flex flex-row justify-start items-center w-full">
                <input
                    type='checkbox'
                    id={`checkbox-${id}`}
                    checked={completed}
                    onChange={handleCheckedChange}
                    className="my-1 h-5"
                />
                <div
                    className="ml-3 hover:text-slate-600 dark:hover:text-slate-500">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-sm">{description}</p>
                </div>
            </label>
            <button
                type="button"
                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm h-fit p-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                onClick={handleDelete}>
                <i className="fas fa-trash-alt"></i>
            </button>
        </div>
    )
};