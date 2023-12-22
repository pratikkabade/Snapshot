import { useState } from "react"

export const DateDifference = () => {

    //STATEs
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    // CALCULATE DIFFERENCE
    const date1 = new Date(start);
    const date2 = new Date(end);

    const diffTime = Math.abs(+date1 - +date2);
    const theDiffBase = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


    return (
        <div className="flex flex-col mt-6 justify-center ">
            <div className="flex flex-row flex-wrap justify-center mb-2">
                <div className="flex flex-col items-center">
                    <input type="date" className="cursor-pointer m-2 hover:shadow-lg rounded-xl p-2 bg-green-100 dark:bg-green-900"
                        value={start} onChange={(e) => {
                            setStart(e.target.value)
                        }} />
                    <button type="button" className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-fit"
                        onClick={() => {
                            setStart(new Date().toISOString().split('T')[0])
                        }}
                    >
                        Today
                    </button>
                </div>
                <div className="flex flex-col items-center">
                    <input type="date" className="cursor-pointer m-2 hover:shadow-lg rounded-xl p-2 bg-red-100 dark:bg-red-900"
                        value={end} onChange={(e) => {
                            setEnd(e.target.value)
                        }} />
                    <button type="button" className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 w-fit"
                        onClick={() => {
                            setEnd(new Date().toISOString().split('T')[0])
                        }}
                    >
                        Today
                    </button>
                </div>
            </div>
            {
                Number.isNaN(theDiffBase) ?
                    <p className="text-xl p-3 text-red-600 dark:text-red-500 text-center font-bold">Please recheck the dates entered</p>
                    :
                    <p className="text-3xl text-center p-3">
                        <span className="font-bold mr-2">{theDiffBase}</span>
                        days</p>
            }
        </div>
    )
}