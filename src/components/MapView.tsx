"use client";

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── FIX LỖI ICON MARKER ──────────────────────────────────────────────────
// Trong Next.js, đường dẫn icon mặc định của Leaflet thường bị lỗi không tải được.
// Chúng ta cần gán lại icon bằng link CDN để nó hiện cái "ghim" màu xanh.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapViewProps {
  latitude: number;
  longitude: number;
}

export default function MapView({ latitude, longitude }: MapViewProps) {
  // Kiểm tra nếu không có tọa độ thì không render để tránh lỗi crash map
  if (!latitude || !longitude) {
    return (
      <div className="h-[300px] w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 italic text-sm">
        Không có dữ liệu tọa độ cho địa điểm này
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={16} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        {/* Lớp bản đồ từ OpenStreetMap - Miễn phí và nhẹ */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hiển thị cái ghim đúng vị trí đã lưu */}
        <Marker position={[latitude, longitude]} icon={icon} />
      </MapContainer>
    </div>
  );
}