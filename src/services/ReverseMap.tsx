// useReverseGeocode.ts
import { useEffect, useState } from "react";

export const useReverseGeocode = () => {
    const [location, setLocation] = useState<string | null>(null);
    const [LAT, setLat] = useState<number | null>(null);
    const [LONG, setLong] = useState<number | null>(null);

    const key = 'cEn9X8v98jJGu0eVzpTVaflD1lBkO8GwMNS6F7hT';
    const site = 'https://api.olamaps.io/places/v1/reverse-geocode?latlng=';

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setLat(latitude);
            setLong(longitude);
        });
    }, []);

    useEffect(() => {
        const fetchName = async () => {
            try {
                const url = `${site}${LAT},${LONG}&api_key=${key}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Network error");

                const data = await response.json();
                const locationData = data.results?.[0]?.address_components
                    .find((component: any) => component.types.includes("locality"))?.short_name;
                setLocation(locationData || "Unknown");
            } catch (err) {
                console.error("Error fetching location:", err);
            }
        };

        if (LAT !== null && LONG !== null) {
            fetchName();
        }
    }, [LAT, LONG]);

    return location;
};


const formatLocation = (location: string): string => {
    const maxLength = 6;
    return location.length > maxLength ? location.slice(0, maxLength) + "..." : location;
};

export const ReverseMapAddressFormatted = () => {
    const location = useReverseGeocode();
    return <span>{location ? formatLocation(location) : "Fetching..."}</span>;
};

export const ReverseMapAddressRaw = () => {
    const location = useReverseGeocode();
    return <span>{location || "Fetching..."}</span>;
};
