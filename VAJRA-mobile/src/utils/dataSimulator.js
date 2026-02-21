/**
 * Offline / demo simulation — generates packets in the REAL hardware format.
 * Used ONLY when the MQTT broker is not reachable (sim fallback).
 */
import { buildPacket, parsePacket } from './packetParser';

export const HARDCODED_ROUTE = [
    { lat: 12.971599, lon: 77.594566 },
    { lat: 12.975867, lon: 77.600413 },
    { lat: 12.978900, lon: 77.608100 },
    { lat: 12.984000, lon: 77.614500 },
    { lat: 12.990000, lon: 77.620000 },
    { lat: 12.995000, lon: 77.628000 },
    { lat: 12.985000, lon: 77.635000 },
    { lat: 12.974000, lon: 77.638000 },
    { lat: 12.965000, lon: 77.626000 },
    { lat: 12.960000, lon: 77.613000 },
    { lat: 12.963000, lon: 77.600000 },
    { lat: 12.971599, lon: 77.594566 },
];

export const GEOFENCE_POLYGON = [
    { lat: 12.990000, lon: 77.580000 },
    { lat: 12.990000, lon: 77.640000 },
    { lat: 12.955000, lon: 77.640000 },
    { lat: 12.955000, lon: 77.580000 },
];

export const CELLULAR_INFO = {
    imei: '887744556677882',
};

let routeIndex = 0;
let chargePercentage = 98; // User wants raw percentage (0-100)
let ignitionOn = true;
let immobilizerOn = false;

export function generateSimulatedPacket() {
    routeIndex = (routeIndex + 1) % (HARDCODED_ROUTE.length - 1);
    const pos = HARDCODED_ROUTE[routeIndex];

    // Simulate small percentage fluctuation
    chargePercentage += (Math.random() - 0.5) * 0.4;
    chargePercentage = parseFloat(Math.min(100, Math.max(0, chargePercentage)).toFixed(1));

    const nowUtc = Math.floor(Date.now() / 1000);

    const rawPacket = buildPacket({
        imei: CELLULAR_INFO.imei,
        ignitionStatus: ignitionOn ? 1 : 0,
        latitude: pos.lat,
        longitude: pos.lon,
        analogVoltage: chargePercentage,
        dateTime: nowUtc,
        speed: 0
    });

    return parsePacket(rawPacket);
}

export function setIgnition(val) { ignitionOn = val; }
export function setImmobilizer(val) { immobilizerOn = val; }
export function getImmobilizerState() { return immobilizerOn; }
