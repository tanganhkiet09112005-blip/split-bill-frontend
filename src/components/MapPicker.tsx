"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix lỗi icon Marker không hiển thị do Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }: any) {
    const map = useMap();

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon}></Marker>
    );
}

export default function MapPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    // Mặc định ban đầu ở TP.HCM (hoặc vị trí của Sếp)
    const initialPos = { lat: 10.8231, lng: 106.6297 };

    useEffect(() => {
        if (position) {
            onLocationSelect(position.lat, position.lng);
        }
    }, [position, onLocationSelect]);

    return (
        <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <MapContainer
                center={initialPos}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            <p className="text-[10px] text-center text-slate-400 mt-1 italic">
                * Bấm vào bản đồ để chọn vị trí quán ăn
            </p>
        </div>
    );
}