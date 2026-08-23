import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (event) => onClick?.(event.latlng.lat, event.latlng.lng) });
  return null;
}

function FocusMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 12));
  }, [map, position]);
  return null;
}

export default function GeoMap({ center, zoom = 12, height = "400px", radiusKm, lawyers = [], onLocationChange }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ width: "100%", height }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; Geoapify'
        url={`https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
      />
      <MapClickHandler onClick={onLocationChange} />
      <FocusMarker position={[center.lat, center.lng]} />
      <Marker position={[center.lat, center.lng]} icon={defaultIcon} />
      {radiusKm && <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#059669", fillColor: "#10B981", fillOpacity: 0.2 }} />}
      {lawyers.map((lawyer) => (
        lawyer.latitude != null && lawyer.longitude != null ? (
          <Marker key={lawyer.id} position={[lawyer.latitude, lawyer.longitude]} icon={defaultIcon} />
        ) : null
      ))}
    </MapContainer>
  );
}
