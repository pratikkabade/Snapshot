import { Counter } from "../components/Counter"
import { ContainerBlock, ContainerText } from "../components/core/ContainerBlock"
import { DateDifference } from "../widgets/DateDifference"
import { GoogleSignIn } from "../widgets/GoogleSignIn"
import { Schedule } from "../widgets/Schedule"
import { TasksWidget } from "../widgets/TasksWidget"
import { TodayWidget } from "../widgets/TodayWidget"
import TradingViewWidget from "../widgets/TradingViewWidget"
import { WeatherWidget } from "../widgets/WeatherWidget"
import TaskManager from "../widgets/tasks/TaskManager"


export const Home = () => {
    return (
        <div className="flex flex-row flex-wrap justify-center mx-auto w-4/5">

            <ContainerBlock>
                <TodayWidget />
            </ContainerBlock>

            <ContainerBlock>
                <ContainerText>
                    Sign In
                </ContainerText>
                <GoogleSignIn />
            </ContainerBlock>

            <ContainerBlock>
                <ContainerText>
                    Tasks
                </ContainerText>
                <div className="w-64 h-full">
                    <TaskManager />
                </div>
            </ContainerBlock>


            <ContainerBlock>
                <ContainerText>
                    Counter
                </ContainerText>
                <Counter />
            </ContainerBlock>

            <ContainerBlock>
                <ContainerText>
                    Tasks
                </ContainerText>
                <div className="scroll h-64">
                    <TasksWidget />
                </div>
            </ContainerBlock>

            <ContainerBlock>
                <ContainerText>
                    Interval
                </ContainerText>
                <DateDifference />
            </ContainerBlock>


            {/* <div className="lg:w-2/5 w-full h-96 m-5 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl flex flex-row justify-center"> */}
            {/* <ContainerBlock>
                <WeatherWidget />
            </ContainerBlock> */}
            {/* </div> */}

            <ContainerBlock>
                <ContainerText>
                    Schedule
                </ContainerText>
                <Schedule />
            </ContainerBlock>


            <ContainerBlock>
                <ContainerText>
                    Stock Updates
                </ContainerText>
                <TradingViewWidget />
            </ContainerBlock>

        </div>
    )
}