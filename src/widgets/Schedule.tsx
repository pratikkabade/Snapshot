import { Button, Modal } from "flowbite-react"
import { useState } from "react"

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

    const [openModal, setOpenModal] = useState(false);

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

    // use esc eventlistener to close modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setOpenModal(false)
        }
    })

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

    // Output
    return (
        <>
            <Button color={'blue'} onClick={() => setOpenModal(true)}>Schedule an Event</Button>
            <Modal className="fade-in" show={openModal} onClose={() => setOpenModal(false)}>
                <Modal.Header>Schedule an Event</Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col m-2 p-2">
                        <input type="text" onChange={event1} placeholder='Event Name'
                            className="flex flex-col m-2 p-3 rounded-xl text-xl w-full bg-sky-100" />
                    </div>

                    <div className="flex flex-row flex-wrap justify-center items-center">
                        <div className="flex flex-col m-2 p-2 rounded-xl bg-green-100">
                            <h3>Starts from</h3>
                            <div className="smaller">
                                <input type="date" onChange={event2}
                                    className="flex flex-col m-2 p-2 rounded-xl bg-emerald-200" />

                                <input type="time" onChange={event2t}
                                    className="flex flex-col m-2 p-2 rounded-xl bg-emerald-200" />
                            </div>
                        </div>

                        <div className="flex flex-col m-2 p-2 rounded-xl bg-rose-100">
                            <h3>Ends on</h3>
                            <div className="smaller">
                                <input type="date" onChange={event3}
                                    className="flex flex-col m-2 p-2 rounded-xl bg-red-200" />

                                <input type="time" onChange={event3t}
                                    className="flex flex-col m-2 p-2 rounded-xl bg-red-200" />
                            </div>
                        </div>
                    </div>


                    <div className="flex flex-row flex-wrap justify-center items-center">
                        <input type="text" onChange={event4} placeholder='Add Location'
                            className="flex flex-col m-2 p-3 rounded-xl bg-slate-100" />
                        <textarea onChange={event5} placeholder='Details'
                            className="flex flex-col m-2 p-3 rounded-xl bg-yellow-100" />
                    </div>


                    <div className="flex flex-col justify-center items-center mt-2">
                        {visibility ?
                            <div>
                                <div className="flex flex-col justify-center items-center content-center">
                                    <button type="button" onClick={show} className="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 w-fit">
                                        Non Recurring <i className="fa-sharp fa-solid fa-xmark ml-2"></i>
                                    </button>
                                </div>

                                <div className="flex flex-row flex-wrap justify-center items-center">
                                    <div className="flex flex-col m-2 p-2 rounded-xl bg-sky-100">
                                        <h3>Recurring ends on</h3>
                                        <div className="smaller">
                                            <input type="date" onChange={event7}
                                                className="flex flex-col m-2 p-2 rounded-xl bg-blue-200" />
                                            <input type="time" onChange={event7t}
                                                className="flex flex-col m-2 p-2 rounded-xl bg-blue-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            :
                            <button type="button" onClick={show} className="text-white bg-rose-700 hover:bg-rose-800 focus:ring-4 focus:ring-rose-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-rose-600 dark:hover:bg-rose-700 focus:outline-none dark:focus:ring-rose-800">
                                Recurring <i className="fa-solid fa-repeat ml-2"></i>
                            </button>

                        }

                    </div>
                </Modal.Body>
                <Modal.Footer className="justify-between">
                    <Button color="gray" onClick={copy}>
                        <div id="copyBtn">
                            Copy Link <i className="fa-regular fa-copy ml-2"></i>
                        </div>
                    </Button>
                    <a href={Word} target={"_blank"} rel="noreferrer">
                        <Button color="blue">
                            Save it <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                        </Button>
                    </a>

                </Modal.Footer>
            </Modal>
        </>
    )
}
