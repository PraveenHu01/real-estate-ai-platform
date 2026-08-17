import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, School, HeartPulse, Train, ShoppingBag, Utensils } from 'lucide-react';

// Custom Leaflet Icons
const createCustomIcon = (color) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px ${color};"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const propIcon = createCustomIcon('#3b82f6');
const schoolIcon = createCustomIcon('#10b981');
const hospitalIcon = createCustomIcon('#ef4444');
const metroIcon = createCustomIcon('#8b5cf6');
const mallIcon = createCustomIcon('#f59e0b');

export default function FacilityDistanceMap({ lat = 23.2333, lng = 77.4343, title = "Property Location", facilities = {} }) {
  const [position, setPosition] = useState([lat, lng]);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  const nearbyPlaces = [
    { type: 'School', name: 'Delhi Public School / St. Xavier', dist: facilities.school_dist_m || 450, icon: School, color: 'text-emerald-400', lat: lat + 0.003, lng: lng + 0.002, markerIcon: schoolIcon },
    { type: 'Hospital', name: 'AIIMS / City Care Hospital', dist: facilities.hospital_dist_m || 800, icon: HeartPulse, color: 'text-red-400', lat: lat - 0.004, lng: lng + 0.005, markerIcon: hospitalIcon },
    { type: 'Metro Station', name: 'Central Metro Line', dist: facilities.metro_dist_m || 1200, icon: Train, color: 'text-purple-400', lat: lat + 0.007, lng: lng - 0.004, markerIcon: metroIcon },
    { type: 'Shopping Mall', name: 'DB City / Phoenix Mall', dist: facilities.mall_dist_m || 1500, icon: ShoppingBag, color: 'text-amber-400', lat: lat - 0.006, lng: lng - 0.006, markerIcon: mallIcon },
  ];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interactive Location & Facility Radius</h3>
            <p className="text-xs text-slate-400">GPS: {lat.toFixed(4)}, {lng.toFixed(4)} · Calculated facility radius</p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-blue-300 font-semibold text-xs transition"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Open in Google Maps</span>
        </a>
      </div>

      {/* Map Display */}
      <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
        <MapContainer center={position} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Main Property */}
          <Marker position={position} icon={propIcon}>
            <Popup>
              <div className="text-xs font-bold text-slate-900">{title}</div>
            </Popup>
          </Marker>
          <Circle center={position} radius={1500} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }} />

          {/* Nearby markers */}
          {nearbyPlaces.map((p, idx) => (
            <Marker key={idx} position={[p.lat, p.lng]} icon={p.markerIcon}>
              <Popup>
                <div className="text-xs font-bold text-slate-900">{p.name} ({p.dist} meters)</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Facilities Distance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {nearbyPlaces.map((p, idx) => {
          const IconComp = p.icon;
          return (
            <div key={idx} className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center space-x-3">
              <IconComp className={`w-5 h-5 ${p.color}`} />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">{p.type}</span>
                <span className="text-sm font-bold text-white">
                  {p.dist >= 1000 ? `${(p.dist / 1000).toFixed(1)} km` : `${p.dist} m`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
