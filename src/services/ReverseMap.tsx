import { useState } from "react";
import { GoogleAPIKey } from "../constants/GoogleAPIKey";

export const ReverseMap = () => {
    const [location, setLocation] = useState(null)

    // get the coordinates from the browser
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLong(longitude);
    });

    // usestate to store the coordinates
    const [LAT, setLat] = useState(null);
    const [LONG, setLong] = useState(null);

    const fetchName = async () => {
        try {
            const response = await fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + LAT + ',' + LONG + '&sensor=true&key=' + GoogleAPIKey);
            // const response = await fetch('https://geocode.maps.co/reverse?' + LAT + '=&' + LONG + '=&api_key=662e1d36b6295947532052urk85de7e');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data);
            const locationData = data.plus_code.compound_code.split(' ')[1].replace(',', ' ');
            // const locationData = data.address.city;
            setLocation(locationData);
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
        console.log('geocoding api call');
    }

    if (LAT !== null && LONG !== null) {
        fetchName();
    }

    return (
        <div>
            {location}
        </div>
    )
}