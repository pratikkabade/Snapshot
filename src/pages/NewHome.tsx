import { DateDifference } from "../widgets/DateDifference"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { Schedule } from "../widgets/Schedule"
import { TodayWidget } from "../widgets/TodayWidget"
import TradingViewWidget from "../widgets/TradingViewWidget"
import NoteManager from "../widgets/notes/NoteManager"
import TaskManager from "../widgets/tasks/TaskManager"

export const NewHome = () => {
    return (
        <section className="flex flex-col">
            <div className="flex justify-between items-center">
                <GoogleSignIn />
                <TodayWidget />
            </div>
            <div className="flex flex-row justify-center">
            <div className="flex flex-row justify-around flex-wrap lg:w-2/3 items-center">
                <div className="border-2 border-slate-400 rounded-xl lg:w-96 md:w-64 sm:w-48 max-sm:w-3/4 mb-10 h-fit">
                    <NoteManager />
                </div>
                <div className="border-2 border-slate-400 rounded-xl max-sm:w-3/4">
                    <TaskManager />
                </div>
            </div>
            </div>

            <div className="flex flex-row justify-around align-middle items-center flex-wrap mt-10">
                <Schedule />
                <DateDifference />
                <TradingViewWidget />
            </div>
        </section>
    )
}