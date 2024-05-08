import { TimeExchange } from "../components/TimeExchange"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { TodayWidget } from "../widgets/TodayWidget"
import NoteManager from "../widgets/notes/NoteManager"
import TaskManager from "../widgets/tasks/TaskManager"

export const NewHome = () => {
    return (
        <section className="flex flex-col">
            <div className="flex flex-row max-sm:flex-col justify-between items-center">
                <GoogleSignIn />
                <TodayWidget />
            </div>
            <div className="flex flex-row justify-center">
                <div className="flex flex-row justify-around flex-wrap  items-center">
                    <div className="border-2 border-slate-400 rounded-xl lg:w-96 md:w-64 sm:w-48 max-sm:w-3/4 max-sm:mb-10 h-fit m-2 shadow-md">
                        <NoteManager />
                    </div>
                    <div className="border-2 border-slate-400 rounded-xl lg:w-96 md:w-80 sm:w-72 max-sm:w-3/4 m-2 shadow-md">
                        <TaskManager />
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-center my-10">
                <div className="border-2 border-slate-400 rounded-3xl cursor-pointer hover:bg-slate-50 hover:shadow-md">
                    <TimeExchange />
                </div>
            </div>

        </section>
    )
}