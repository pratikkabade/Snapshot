import { Button } from "flowbite-react"
import { useEffect, useState } from "react"
import { DateDifference } from "./DateDifference"
import { Link, useLocation } from "react-router-dom";

export const Schedule = () => {
    // States
    const [text, setText] = useState('')
    const [date1, setDate1] = useState('')
    const [time1, setTime1] = useState('')
    const [date2, setDate2] = useState('')
    const [time2, setTime2] = useState('')
    const [located, setLocated] = useState('')
    const [details, setDetails] = useState('')
    const [date7, setDate7] = useState('')
    const [time7, setTime7] = useState('')
    const [visibility, setVisibility] = useState(false)

    // Submit
    const Word = 'https://calendar.google.com/calendar/u/0/r/eventedit?' +
        'text=' + text +
        '&dates=' + date1 +
        'T' + time1 +
        '/' + date2 +
        'T' + time2 +
        '&location=' + located +
        '&details=' + details +
        '&recur=RRULE:FREQ=DAILY;INTERVAL=1;' +
        'UNTIL=' + date7 +
        'T' + time7 +
        'Z';

    // Copy Function
    function copy() {
        navigator.clipboard.writeText(Word);
        document.getElementById('copyBtn')!.innerHTML = 'Copied!';
        setTimeout(() => {
            document.getElementById('copyBtn')!.innerHTML = 'Copy Link <i class="fa-regular fa-copy"></i>';
        }, 2000);
    }

    // Forms
    const event1 = (e: any) => {
        setText(e.target.value.replace(/ /g, '+'))
    }

    const event2 = (e: any) => {
        setDate1(e.target.value.replace(/-/g, ''))
    }

    const event2t = (e: any) => {
        var t2 = e.target.value.replace(/:/g, '') + '00'
        setTime1(t2)
    }

    const event3 = (e: any) => {
        setDate2(e.target.value.replace(/-/g, ''))
    }

    const event3t = (e: any) => {
        var t3 = e.target.value.replace(/:/g, '') + '00'
        setTime2(t3)
    }

    const event4 = (e: any) => {
        setLocated(e.target.value.replace(/ /g, '+'))
    }

    const event5 = (e: any) => {
        setDetails(e.target.value.replace(/ /g, '+'))
    }

    const event7 = (e: any) => {
        setDate7(e.target.value.replace(/-/g, ''))
    }

    const event7t = (e: any) => {
        var t7 = e.target.value.replace(/:/g, '') + '00'
        setTime7(t7)
    }

    const show = () => {
        setVisibility(!visibility)
    }

    const location = useLocation();
    const NOTHomePage = !["/"].includes(location.pathname);
    const renderHeader = () => (
        <div className="flex flex-row justify-center text-2xl text-sky-700 font-semibold text-center mt-2 mb-5">
            {NOTHomePage ?
                <></>
                :
                <Link to={'/Scheduler'} className="p-2 px-4 rounded-full border-2 border-white hover:border-sky-300">
                    <i className='fa-solid fa-calendar mr-3'></i>
                    Scheduler
                </Link>
            }
        </div>
    );

    useEffect(() => {
        if (NOTHomePage) {
            document.title = `Scheduler`
        }
    }, [NOTHomePage])

    // Output
    return (
        <div className="flex flex-col justify-center items-center">
            <div className={`flex flex-col justify-center items-center bg-white rounded-xl shadow-md p-2 ${NOTHomePage ? '' : 'w-full'}`}>
                {renderHeader()}
                <div className={`flex flex-col w-5/6`}>
                    <div className="flex flex-col py-3">
                        <input type="text" onChange={event1} placeholder='Event Name'
                            className="flex flex-col hover:cursor-pointer hover:shadow-sm p-3 rounded-xl text-xl w-full border-2 border-sky-300 bg-sky-100" />
                    </div>

                    <div className="flex flex-row max-md:flex-col flex-wrap justify-between py-3">
                        <div className="flex flex-col p-2 w-1/2 max-md:w-full max-md:rounded-b-none md:rounded-r-none rounded-xl bg-green-100">
                            <h3 className=" text-xl mx-5">Starts from</h3>
                            <div className="smaller flex flex-row items-start justify-start flex-wrap">
                                <input type="date" onChange={event2}
                                    className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-emerald-300 bg-emerald-200" />

                                <input type="time" onChange={event2t}
                                    className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-emerald-300 bg-emerald-200" />
                            </div>
                        </div>

                        <div className="flex flex-col p-2 w-1/2 max-md:w-full max-md:rounded-t-none md:rounded-l-none rounded-xl bg-rose-100 justify-end items-end ">
                            <h3 className="text-xl mx-5">Ends on</h3>
                            <div className="smaller flex flex-row items-end justify-end flex-wrap">
                                <input type="date" onChange={event3}
                                    className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-red-300 bg-red-200" />

                                <input type="time" onChange={event3t}
                                    className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-red-300 bg-red-200" />
                            </div>
                        </div>
                    </div>


                    <div className="flex flex-row flex-wrap justify-between">
                        <input type="text" onChange={event4} placeholder='Add Location'
                            className="flex flex-col hover:cursor-pointer hover:shadow-sm p-3 w-5/12 max-md:w-full max-md:rounded-b-none rounded-xl border-2 border-slate-300 bg-slate-100 h-fit" />
                        <textarea onChange={event5} placeholder='Details'
                            className="flex flex-col hover:cursor-pointer hover:shadow-sm p-3 w-5/12 max-md:w-full max-md:rounded-t-none rounded-xl border-2 border-yellow-300 bg-yellow-100" />
                    </div>


                    <div className="flex flex-col justify-center items-center mt-2">
                        {visibility ?
                            <div>
                                <div className="flex flex-col justify-center items-center content-center">
                                    <Button color="red" onClick={show} className="mx-4">
                                        Non Recurring <i className="fa-sharp fa-solid fa-xmark ml-2"></i>
                                    </Button>
                                </div>

                                <div className="flex flex-row flex-wrap justify-center items-center m-2 p-2 rounded-xl bg-rose-100">
                                    <div className="flex flex-col">
                                        <h3 className="text-xl mx-5">Recursion ends on</h3>
                                        <div className="smaller flex flex-row items-end justify-end flex-wrap">
                                            <input type="date" onChange={event7}
                                                className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-red-300 bg-red-200" />
                                            <input type="time" onChange={event7t}
                                                className="flex flex-col hover:cursor-pointer hover:shadow-sm m-2 p-2 rounded-xl border-2 border-red-300 bg-red-200" />
                                        </div>
                                    </div>
                                    <div className="m-2">
                                        <DateDifference />
                                    </div>
                                </div>
                            </div>
                            :
                            <Button color="yellow" onClick={show} className="mx-4">
                                Recurring <i className="fa-solid fa-repeat ml-2"></i>
                            </Button>
                        }

                    </div>
                    <div className="flex flex-row justify-around m-5">
                        <Button color="gray" onClick={copy} className="mx-4">
                            <div id="copyBtn">
                                Copy Link <i className="fa-regular fa-copy ml-2"></i>
                            </div>
                        </Button>
                        <a href={Word} target={"_blank"} rel="noreferrer" className="mx-4">
                            <Button color="blue">
                                Save it <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                            </Button>
                        </a>
                    </div>

                </div>
            </div>
        </div>
    )
}
