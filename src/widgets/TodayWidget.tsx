import { WeatherWidget } from "./WeatherWidget";

export const TodayWidget = () => {
    const myDate = new Date()

    let daysList = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    let monthsList = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Aug",
        "Oct",
        "Nov",
        "Dec",
    ];

    let date = myDate.getDate();
    let month = monthsList[myDate.getMonth() + 1];
    // let year = myDate.getFullYear();
    let day = daysList[myDate.getDay()];

    // get current time
    let hours = myDate.getHours();
    let greet = "";
    if (hours < 12) {
        greet = "Morning";
    } else if (hours < 17) {
        greet = "Afternoon";
    } else {
        greet = "Evening";
    }

    return (
        <div className="p-10 cursor-default">
            <h1 className="text-xl mb-2">Good {greet},</h1>
            <span className="text-3xl font-bold mr-2">{day},</span>
            <span className="text-3xl mr-3">{date}</span>
            <span className="text-3xl">{month}</span>
            <WeatherWidget />
        </div>
    )
}