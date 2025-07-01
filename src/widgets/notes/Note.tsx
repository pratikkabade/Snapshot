import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/Firebase";

export const Note = ({ id, title }: any) => {

    const handleDelete = async () => {
        const noteDocRef = doc(db, 'notes', id)
        try {
            await deleteDoc(noteDocRef)
        } catch (err) {
            alert(err)
        }
    }

    return (
        <div className="m-1 fade-in2 flex flex-row justify-between items-center align-middle content-center px-3 py-1.5 bg-white hover:bg-emerald-50 rounded-lg group border-2 border-slate-500 ">
            <div
                className="ml-3">
                <h3 className="text-lg font-bold cursor-default">{title}</h3>
            </div>
            <button
                type="button"
                className="focus:outline-none opacity-0 group-hover:opacity-100 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm h-5 w-5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 ml-5 align-middle"
                onClick={handleDelete}>
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
    )
};