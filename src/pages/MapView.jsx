import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTelematicsContext } from '../App';
import { HARDCODED_ROUTE, GEOFENCE_POLYGON } from '../utils/dataSimulator';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const vehicleIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#3b82f6,#06b6d4);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    box-shadow:0 0 16px rgba(59,130,246,0.7), 0 0 4px rgba(0,0,0,0.5);
    border:2px solid white;
  ">🚗</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

function RecenterMap({ lat, lon }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) {
            map.panTo([lat, lon], { animate: true, duration: 1 });
        }
    }, [lat, lon, map]);
    return null;
}

export default function MapView() {
    const ctx = useTelematicsContext();
    const pkt = ctx?.latestPacket;

    const lat = pkt?.latitude ?? HARDCODED_ROUTE[0].lat;
    const lon = pkt?.longitude ?? HARDCODED_ROUTE[0].lon;
    const speed = pkt?.speed ?? 0;
    const immob = ctx?.immobActive ?? false;
    const fixValid = pkt?.fixStatus === 1;

    const routeCoords = HARDCODED_ROUTE.map(p => [p.lat, p.lon]);
    const geofenceCoords = GEOFENCE_POLYGON.map(p => [p.lat, p.lon]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
            {/* Header */}
            <div className="header-bar">
                <div>
                    <div className="header-title">🗺️ Live Map</div>
                    <div className="header-subtitle">Bangalore Route Track</div>
                </div>
                <div className={`pill ${fixValid ? 'pill-green' : 'pill-orange'}`}>
                    <span className="dot" />
                    {fixValid ? 'GPS FIXED' : 'NO FIX'}
                </div>
            </div>

            {/* Speed overlay */}
            <div style={{
                position: 'absolute', top: 76, left: 16, zIndex: 500,
                background: 'rgba(10,12,20,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 14, padding: '10px 16px',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', flexDirection: 'column',
            }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{speed.toFixed(0)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>km/h</span>
            </div>

            {/* Immob overlay */}
            <div style={{
                position: 'absolute', top: 76, right: 16, zIndex: 500,
                background: 'rgba(10,12,20,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 14, padding: '10px 14px',
                border: `1px solid ${immob ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'}`,
            }}>
                <div style={{ fontSize: 11, color: immob ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {immob ? '🔴 IMMOB' : '🟢 MOBILE'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {lat.toFixed(4)}, {lon.toFixed(4)}
                </div>
            </div>

            {/* Map */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer
                    center={[lat, lon]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        maxZoom={19}
                    />

                    {/* Geofence */}
                    <Polygon
                        positions={geofenceCoords}
                        color="#f59e0b"
                        fillColor="#f59e0b"
                        fillOpacity={0.08}
                        weight={2}
                        dashArray="6,4"
                    />

                    {/* Route Polyline */}
                    <Polyline
                        positions={routeCoords}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                    />

                    {/* Vehicle Marker */}
                    <Marker position={[lat, lon]} icon={vehicleIcon}>
                        <Popup>
                            <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 150 }}>
                                <strong>Vehicle ID: 887744556677882</strong><br />
                                Speed: {speed.toFixed(1)} km/h<br />
                                Status: {immob ? '🔴 Immobilized' : '🟢 Mobile'}<br />
                                Lat: {lat.toFixed(6)}<br />
                                Lon: {lon.toFixed(6)}
                            </div>
                        </Popup>
                    </Marker>

                    <RecenterMap lat={lat} lon={lon} />
                </MapContainer>
            </div>

            {/* Bottom info strip */}
            <div style={{
                padding: '12px 16px',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 20,
                paddingBottom: 'calc(var(--nav-height) + 12px)',
            }}>
                {[
                    { label: 'Lat', value: `${lat.toFixed(5)}° N` },
                    { label: 'Lon', value: `${lon.toFixed(5)}° E` },
                    { label: 'HDOP', value: pkt?.hdop?.toFixed(2) ?? '1.20' },
                    { label: 'PDOP', value: pkt?.pdop?.toFixed(2) ?? '1.80' },
                ].map(({ label, value }) => (
                    <div key={label} style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)', marginTop: 2 }}>{value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
