/**
 * Telematics Packet Parser — Strictly following Hardware Command
 * 
 * USER COMMAND: "the 5 part from the data packet is always the voltage"
 * USER COMMAND: "when the 3 value in the packet that is the ignition value is 0..."
 * 
 * Mapping:
 * Index 0: Length
 * Index 1: Type ("DATA")
 * Index 2: IGNITION (3rd part) <-- LATEST COMMAND
 * Index 3: IMEI (4th part)
 * Index 4: VOLTAGE (5th part) <-- PERSISTENT COMMAND
 * Index 5: Timestamp
 * Index 6: Lat
 * Index 7: Lon
 * Index 8: Speed
 */

export function computeXorCrc(data) {
    let crc = 0;
    for (let i = 0; i < data.length; i++) crc ^= data.charCodeAt(i);
    return crc;
}

export function parsePacket(raw) {
    try {
        if (!raw || !raw.startsWith('$')) return null;

        const starIdx = raw.lastIndexOf('*');
        if (starIdx === -1) return null;

        const crcStr = raw.slice(starIdx + 1).trim();
        const payload = raw.slice(1, starIdx);
        const computedCrc = computeXorCrc(payload);
        const crcValid = computedCrc === parseInt(crcStr, 16);

        const parts = payload.split(',');
        if (parts.length < 5) return null;

        const type = parts[1]; // "DATA"

        // Index 2 is Ignition (3rd part)
        const ignitionStatus = parseInt(parts[2], 10);
        // Index 3 is IMEI (4th part)
        const imei = parts[3];
        // Index 4 is Voltage (5th part)
        const analogVoltage = parseInt(parts[4], 10);

        const ts = parts[5];
        const latVal = parts[6];
        const lonVal = parts[7];
        const speedVal = parts[8];

        const timestamp = parseInt(ts, 10);
        const speed = speedVal ? parseInt(speedVal, 10) / 100 : 0;

        const latRaw = parseInt(latVal, 10);
        const lonRaw = parseInt(lonVal, 10);
        const hasGps = !!(latRaw !== 0 && lonRaw !== 0 && !isNaN(latRaw));

        return {
            raw, crcValid, imei, type,
            dataLen: parseInt(parts[0], 10),
            frameNumber: timestamp % 10000,
            timestamp,
            fixStatus: 1,
            ignitionStatus: ignitionStatus === 1 ? 1 : 0,
            immobilizerStatus: 0,
            dateTime: timestamp,
            dateTimeFormatted: new Date(timestamp * 1000).toUTCString(),
            latitude: hasGps ? latRaw / 1_000_000 : null,
            longitude: hasGps ? lonRaw / 1_000_000 : null,
            hasGps,
            analogVoltage,
            speed
        };
    } catch (e) {
        console.warn('[Parser Error]', e.message);
        return null;
    }
}

export function buildPacket({ imei, latitude, longitude, analogVoltage, dateTime, speed = 0, ignitionStatus = 1 }) {
    const ts = dateTime ?? Math.floor(Date.now() / 1000);
    const latRaw = Math.round((latitude ?? 0) * 1_000_000);
    const lonRaw = Math.round((longitude ?? 0) * 1_000_000);
    const voltRaw = Math.round((analogVoltage ?? 0));
    const speedRaw = Math.round(speed * 100);

    // len,DATA,ign,IMEI,VOLT,ts,lat,lon,speed
    const inner = `DATA,${ignitionStatus},${imei},${voltRaw},${ts},${latRaw},${lonRaw},${speedRaw}`;
    const payload = `${inner.length + 3},${inner}`;
    const crc = computeXorCrc(payload).toString(16).toUpperCase();
    return `$${payload}*${crc}`;
}
