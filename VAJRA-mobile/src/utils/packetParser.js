/**
 * Telematics Packet Parser — Strictly following Hardware Command
 * 
 * USER COMMAND: "the 5 part from the data packet is always the voltage"
 * Mapping:
 * Index 0: Length
 * Index 1: Type ("DATA")
 * Index 2: IMEI
 * Index 3: Sequence
 * Index 4: VOLTAGE (5th part) <-- LATEST COMMAND
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
        if (parts.length < 4) return null;

        const type = parts[1]; // "DATA" or "CTRL"

        if (type === 'CTRL') {
            return {
                raw, crcValid, type,
                dataLen: parseInt(parts[0], 10),
                immobilizerStatus: parseInt(parts[2] || '0', 10),
                ignitionStatus: parseInt(parts[3] || '0', 10),
            };
        }

        // DATA packet handling (requires at least 11 parts for full mapping)
        if (parts.length < 5) return null;

        // STICKY RULE: 5th part (index 4) is ALWAYS voltage (RAW PERCENTAGE per user)
        const analogVoltage = parseInt(parts[4], 10);

        const imei = parts[2];
        const seq = parts[3];
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
            frameNumber: parseInt(seq || '0', 10),
            timestamp,
            fixStatus: 1,
            ignitionStatus: parseInt(parts[9] || '1', 10),
            immobilizerStatus: parseInt(parts[10] || '0', 10),
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

export function buildPacket({ imei, latitude, longitude, analogVoltage, dateTime, speed = 0, ignitionStatus = 1, immobilizerStatus = 0 }) {
    const ts = dateTime ?? Math.floor(Date.now() / 1000);
    const latRaw = Math.round((latitude ?? 0) * 1_000_000);
    const lonRaw = Math.round((longitude ?? 0) * 1_000_000);
    const voltRaw = Math.round((analogVoltage ?? 0) * 100);
    const speedRaw = Math.round(speed * 10).toFixed(0);

    // len,DATA,IMEI,seq,VOLT,ts,lat,lon,speed,ign,immob
    const inner = `DATA,${imei},0,${voltRaw},${ts},${latRaw},${lonRaw},${speedRaw},${ignitionStatus},${immobilizerStatus}`;
    const payload = `${inner.length + 3},${inner}`;
    const crc = computeXorCrc(payload).toString(16).toUpperCase();
    return `$${payload}*${crc}`;
}
