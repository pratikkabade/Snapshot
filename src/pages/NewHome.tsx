import { TimeExchange } from "../components/TimeExchange"
import Clipboard from "../widgets/Clipboard"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { TodayWidget } from "../widgets/TodayWidget"
import NoteManager from "../widgets/notes/NoteManager"
import TaskManager from "../widgets/tasks/TaskManager"

export const NewHome = () => {
    return (
        <section className="flex flex-col bg-sky-50 gap-10">
            <div className="flex flex-row max-sm:flex-col justify-between items-center">
                <GoogleSignIn />
                <div className="flex flex-row max-sm:flex-col cursor-default justify-center items-center max-sm:mt-10 !max-sm:text-center">
                    <TimeExchange />
                    <TodayWidget />
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4 px-10">
                <div className="bg-white rounded-xl shadow-md col-span-1 max-sm:col-span-4">
                    <TaskManager />
                </div>
                <div className="bg-white rounded-xl shadow-md col-span-2 max-sm:col-span-4">
                    <NoteManager />
                </div>
                <div className="bg-white rounded-xl shadow-md col-span-1 max-sm:col-span-4">
                    <Clipboard />
                </div>
            </div>
        </section>
    )
}