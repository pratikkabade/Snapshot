import { Button, Modal } from "flowbite-react"
import { IndianTimeValues, LondonTimeValues } from "../constants/LondonTimes"
import { useState } from "react";

export const TimeExchange = () => {
    const [local, setLocal] = useState(true);
    const [openModal, setOpenModal] = useState(false);


    // fetch current time
    const LondonTimeText = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })
    var LondonHours = LondonTimeText.split(':')[0]
    const LondonMinutes = LondonTimeText.split(':')[1]

    if (LondonMinutes === '30') {
        LondonHours === '00' ? LondonHours = '00' : LondonHours = (parseInt(LondonHours) - 1).toString()
    }

    const LocalTimeText = new Date()
    const LocalHours = LocalTimeText.getHours().toString()
    const LocalMinutes = LocalTimeText.getMinutes().toString()

    // esc to close modal
    window.addEventListener('keydown', (event: any) => {
        if (event.key === 'Escape') {
            setOpenModal(false)
        }
    })


    return (
        <div>
            {
                local ?
                    <div onClick={() => setLocal(false)} className="flex flex-col justify-end items-end">
                        <p className="text-5xl font-bold">{LocalHours}:{LocalMinutes}</p>
                        <p className="">Mumbai, India</p>
                    </div>
                    :
                    <div onClick={() => setOpenModal(true)} className="flex flex-col justify-end items-end fade-in2">
                        <p className="text-5xl font-bold">{LondonHours}:{LondonMinutes}</p>
                        <p className="">London, UK</p>
                    </div>
            }

            <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
                <Modal.Header>London Time</Modal.Header>
                <Modal.Body>
                    <div className="flex flex-row justify-around flex-wrap">
                        <div className="flex flex-row cursor-default">
                            <div className="flex flex-col text-lg">
                                {
                                    IndianTimeValues
                                        .slice(0, 12)
                                        .map((time, index) => {
                                            return (
                                                index === parseInt(LocalHours) ? <div className="bg-sky-500 text-white font-bold p-1 my-1 px-4 rounded-r-none rounded-xl hover:brightness-95" key={index}>
                                                    {time}
                                                </div>
                                                    :
                                                    <div className="bg-sky-200 p-1 my-1 px-4 rounded-r-none rounded-xl hover:brightness-95" key={index}>
                                                        {time}
                                                    </div>
                                            )
                                        })
                                }
                            </div>
                            <div className="flex flex-col text-lg">
                                {
                                    LondonTimeValues
                                        .slice(0, 12)
                                        .map((time, index) => {
                                            return (
                                                index === parseInt(LocalHours) ? <div className="bg-sky-500 text-white font-bold p-1 my-1 px-4 rounded-l-none rounded-xl hover:brightness-95" key={index}>
                                                    {time}
                                                </div>
                                                    :
                                                    <div className="bg-sky-200 p-1 my-1 px-4 rounded-l-none rounded-xl hover:brightness-95" key={index}>
                                                        {time}
                                                    </div>
                                            )
                                        })
                                }
                            </div>
                        </div>
                        <div className="flex flex-row cursor-default">
                            <div className="flex flex-col text-lg">
                                {
                                    IndianTimeValues
                                        .slice(12, 24)
                                        .map((time, index) => {
                                            return (
                                                (index + 12) === parseInt(LocalHours) ? <div className="bg-sky-500 text-white font-bold p-1 my-1 px-4 rounded-r-none rounded-xl hover:brightness-95" key={index}>
                                                    {time}
                                                </div>
                                                    :
                                                    <div className="bg-sky-200 p-1 my-1 px-4 rounded-r-none rounded-xl hover:brightness-95" key={index}>
                                                        {time}
                                                    </div>
                                            )
                                        })
                                }
                            </div>
                            <div className="flex flex-col text-lg">
                                {
                                    LondonTimeValues
                                        .slice(12, 24)
                                        .map((time, index) => {
                                            return (
                                                (index + 12) === parseInt(LocalHours) ? <div className="bg-sky-500 text-white font-bold p-1 my-1 px-4 rounded-l-none rounded-xl hover:brightness-95" key={index}>
                                                    {time}
                                                </div>
                                                    :
                                                    <div className="bg-sky-200 p-1 my-1 px-4 rounded-l-none rounded-xl hover:brightness-95" key={index}>
                                                        {time}
                                                    </div>
                                            )
                                        })
                                }
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setOpenModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}