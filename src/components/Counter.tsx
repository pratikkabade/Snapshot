import { Modal } from "flowbite-react";
import { useState } from "react";

export const Counter = () => {
    // get count from local storage
    const [count, setCount] = useState(localStorage.getItem('count') ? parseInt(localStorage.getItem('count')!) : 0);
    const [openModal, setOpenModal] = useState(false);

    // save this in localsotrage
    localStorage.setItem('count', count.toString());

    return (
        <div className="justify-center flex flex-row items-center p-5">
            <h1 className="text-7xl p-3">{count}</h1>

            <div className="bottom-0 flex flex-col items-center">
                <button type="button" className="mx-1 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-4xl px-3.5 py-1 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={() => setCount(count + 1)}>
                    +
                </button>

                <button type="button" className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                    onClick={() => setOpenModal(true)}>
                    Reset
                </button>

            </div>

            <Modal dismissible className="h-screen content-center" show={openModal} onClose={() => setOpenModal(false)}>
                <Modal.Header>Reset?</Modal.Header>
                <Modal.Footer>
                    <button type="button" className="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                        onClick={() => {
                            setCount(0)
                            setOpenModal(false)
                        }}>Reset</button>

                    <button type="button" className="text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-slate-900" onClick={() => setOpenModal(false)}>Cancel</button>
                </Modal.Footer>
            </Modal>

        </div>
    )
}