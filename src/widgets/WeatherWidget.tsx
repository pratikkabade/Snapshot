import { useState, useEffect } from 'react';
import { ReverseMapAddressFormatted, ReverseMapAddressRaw } from '../services/ReverseMap';
import { Popover } from 'flowbite-react';

export const WeatherWidget = () => {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null)
    const [rain, setRain] = useState(null)
    const [wind, setWind] = useState(null)
    const [h, setH] = useState(null)

    // set h as current hour and avoid multiple rerender
    useEffect(() => {
        const date = new Date();
        var H = date.getHours();
        // if (H < 23) {
        //     H = H - 1;
        // }
        setH(H);
    }, []);

    // usestate to store the coordinates
    const [LAT, setLat] = useState(null);
    const [LONG, setLong] = useState(null);

    // get the coordinates from the browser
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLong(longitude);
    });
    // console.log('https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LONG + '&hourly=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&timezone=Asia%2FBangkok&forecast_days=1')

    const fetchData = async () => {
        try {
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LONG + '&hourly=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&timezone=Asia%2FBangkok&forecast_days=1');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const temperatureData = data.hourly.temperature_2m[h];
            const humidityData = data.hourly.relative_humidity_2m[h];
            const rainData = data.hourly.rain[h];
            const windData = data.hourly.wind_speed_10m[h];
            setTemperature(temperatureData);
            setHumidity(humidityData);
            setRain(rainData);
            setWind(windData);
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    };

    if (h !== null) {
        fetchData();
    }

    return (
        <>
            {temperature ? (
                <>
                    <Popover
                        aria-labelledby="profile-popover"
                        content={
                            <div className="bg-gray-50 p-3 flex flex-col justify-center items-center">
                                <div className='flex flex-col'>
                                    <div>
                                        <ReverseMapAddressRaw />
                                    </div>
                                    <div>Humidity:
                                        <span className='font-bold ml-2'>
                                            {humidity}
                                        </span>
                                    </div>
                                    <div>Rain:
                                        <span className='font-bold ml-2'>
                                            {rain} %
                                        </span>
                                    </div>
                                    <div>Wind:
                                        <span className='font-bold ml-2'>
                                            {wind} Km/h
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <div className="flex flex-col">
                            <div className=' -ml-1 flex flex-row align-middle items-center'>
                                {h > 6 && h < 18 ? (
                                    <img
                                        src='https://img.icons8.com/color/48/000000/sun--v1.png'
                                        alt='sun'
                                        className='h-10 w-10'
                                    />
                                ) : (
                                    <img
                                        src='https://img.icons8.com/color/48/000000/moon-satellite.png'
                                        alt='moon'
                                        className='h-10 w-10'
                                    />
                                )}

                                <div className='flex flex-row align-top text-sm mt-1'>
                                    <span className='text-2xl font-bold ml-2'>
                                        {temperature}
                                    </span>
                                    °C
                                </div>
                                <div className='flex flex-row text-3xl font-extralight ml-3 mt-1 w-20 break-words'>
                                    <ReverseMapAddressFormatted />
                                </div>
                            </div>
                        </div>
                    </Popover>
                </>
            ) : (
                <div className='text-red-700 text-right'>
                    <p>
                        Please enable location access
                    </p>
                    <p>
                        to get the weather data
                    </p>
                </div>
            )}
        </>
    );
};
