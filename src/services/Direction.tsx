import { useState, useEffect } from "react";
import { GoogleAPIKey } from "../constants/GoogleAPIKey";

export const Direction = () => {
    const [LAT, setLat] = useState<number | null>(null);
    const [LONG, setLong] = useState<number | null>(null);
    const [direction, setDirection] = useState(null);

    useEffect(() => {
        // Fetch user's location
        const fetchUserLocation = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setLat(latitude);
                setLong(longitude);
            });
        };

        fetchUserLocation();
    }, []);

    useEffect(() => {
        // Fetch directions without using proxy server
        const fetchDirection = async () => {
            if (LAT !== null && LONG !== null) {
                try {
                    const origin = `${LAT},${LONG}`;
                    const destination = "Disneyland";
                    const apiKey = GoogleAPIKey; // Replace with your Google API key
                    const directionsURL = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;
                    
                    const response = await fetch(directionsURL, {
                        mode: 'no-cors'
                    });
                    if (!response.ok) {
                        // show error
                        console.error(response);
                    }
                    const data = await response.json();
                    const directionData = data.routes[0].legs[0].distance.text;
                    setDirection(directionData);
                } catch (error) {
                    console.error('Error fetching location data:', error);
                }
                console.log('Google Maps Directions API call');
            }
        };

        fetchDirection();
    }, [LAT, LONG]);

    
    return (
        <>
            <h1>Direction</h1>
            <p>Latitude: {LAT}</p>
            <p>Longitude: {LONG}</p>
            <p>Direction: {direction}</p>
        </>
    );
};
