import { TimeExchange } from "../components/TimeExchange"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { TodayWidget } from "../widgets/TodayWidget"
import NoteManager from "../widgets/notes/NoteManager"
import TaskManager from "../widgets/tasks/TaskManager"

export const NewHome = () => {
    return (
        <section className="flex flex-col bg-slate-50">
            <div className="flex flex-row max-sm:flex-col justify-between items-center">
                <GoogleSignIn />
                <TodayWidget />
            </div>
            <div className="flex flex-col justify-center items-center">
                <div className="flex flex-row justify-between max-md:flex-col flex-wrap items-center w-11/12">
                    <div className="flex flex-col max-md:w-full w-3/6 justify-center items-center">
                        <div className="bg-white rounded-3xl w-48 cursor-pointer shadow-md hover:shadow-lg p-5">
                            <TimeExchange />
                        </div>

                        <div className="bg-white rounded-xl max-md:w-full w-full h-fit m-2 shadow-md">
                            <NoteManager />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl max-md:w-full w-2/6 m-2 shadow-md">
                        <TaskManager />
                    </div>
                </div>
            </div>
        </section>
    )
}