import { useEffect } from "react"
import { TimeExchange } from "../components/TimeExchange"
import Clipboard from "../widgets/Clipboard"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { Schedule } from "../widgets/Schedule"
import { TodayWidget } from "../widgets/TodayWidget"
import NoteManager from "../widgets/notes/NoteManager"
import TaskManager from "../widgets/tasks/TaskManager"
import ContactManager from "../widgets/ContactManager"
import BookmarkManager from "../widgets/BookmarkManager"
import TimeTracker from "../widgets/TimeTracker"
import RoadmapManager from "../widgets/notes/Roadmap"

export const NewHome = () => {
    useEffect(() => {
        document.title = "Snapshot"
    }, [])
    return (
        <section className="flex flex-col bg-sky-50 gap-10">
            <div className="flex flex-row max-md:flex-col justify-between items-center">
                <GoogleSignIn />
                <div className="flex flex-row max-md:flex-col cursor-default justify-center items-center max-md:mt-10 !max-md:text-center">
                    <TimeExchange />
                    <TodayWidget />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4 px-10 max-md:px-2">
                <div className="col-span-1 max-md:col-span-4">
                    <TaskManager />
                </div>
                <div className="col-span-2 max-md:col-span-4">
                    <NoteManager />
                </div>
                <div className="col-span-1 max-md:col-span-4">
                    <Clipboard />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4 px-10 max-md:px-2">
                <div className="col-span-3 max-md:col-span-4">
                    <Schedule />
                </div>
                <div className="col-span-1 max-md:col-span-4">
                    <ContactManager />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-10 max-md:px-2">
                <div className="col-span-1 max-md:col-span-3">
                    <BookmarkManager />
                </div>
                <div className="col-span-2 max-md:col-span-3">
                    <TimeTracker />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-10 max-md:px-2">
                <div className="col-span-1 max-md:col-span-3">
                    <RoadmapManager />
                </div>
            </div>
        </section >
    )
}