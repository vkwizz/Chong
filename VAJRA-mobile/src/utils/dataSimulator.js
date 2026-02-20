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
    operator: '03', operatorName: 'Airtel',
    signalStrength: 21, mcc: 404, mnc: 10,
};

let frameCounter = 1;
let routeIndex = 0;
let analogVoltage = 3.8;
let ignitionOn = true;
let immobilizerOn = false;

export function generateSimulatedPacket() {
    routeIndex = (routeIndex + 1) % (HARDCODED_ROUTE.length - 1);
    const pos = HARDCODED_ROUTE[routeIndex];
    analogVoltage += (Math.random() - 0.5) * 0.2;
    analogVoltage = Math.min(5.0, Math.max(0.0, parseFloat(analogVoltage.toFixed(1))));
    const speed = parseFloat((30 + Math.random() * 60).toFixed(2));
    const sig = Math.max(5, Math.min(31, CELLULAR_INFO.signalStrength + Math.floor((Math.random() - 0.5) * 4)));
    const nowUtc = Math.floor(Date.now() / 1000);
    const packet = buildPacket({
        imei: CELLULAR_INFO.imei,
        packetStatus: 1, frameNumber: frameCounter++,
        operator: CELLULAR_INFO.operator, signalStrength: sig,
        mcc: CELLULAR_INFO.mcc, mnc: CELLULAR_INFO.mnc,
        fixStatus: 1, latitude: pos.lat, nsInd: 'N',
        longitude: pos.lon, ewInd: 'E',
        hdop: 1.2, pdop: 1.8, speed,
        ignitionStatus: ignitionOn ? 1 : 0,
        immobilizerStatus: immobilizerOn ? 1 : 0,
        analogVoltage, dateTime: nowUtc,
    });
    return parsePacket(packet);
}

export function setIgnition(val) { ignitionOn = val; }
export function setImmobilizer(val) { immobilizerOn = val; }
export function getImmobilizerState() { return immobilizerOn; }
