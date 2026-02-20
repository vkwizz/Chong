/**
 * Telematics Packet Parser (shared between web + mobile)
 * Format: $<datalen>|<IMEI>|<fields...>|*<CRC_HEX>
 */

export function computeXorCrc(data) {
    let crc = 0;
    for (let i = 0; i < data.length; i++) crc ^= data.charCodeAt(i);
    return crc;
}

export function parsePacket(raw) {
    try {
        if (!raw.startsWith('$')) return null;
        const starIdx = raw.lastIndexOf('*');
        if (starIdx === -1) return null;
        const crcStr = raw.slice(starIdx + 1);
        const payload = raw.slice(1, starIdx);
        const crcValid = computeXorCrc(payload) === parseInt(crcStr, 16);
        const parts = payload.split('|');
        if (parts.length < 3) return null;
        const imei = parts[1];
        const fields = parts.slice(2);
        if (fields.length < 18) return null;
        const [packetStatus, frameNumber, operator, signalStrength, mcc, mnc,
            fixStatus, latRaw, nsInd, lonRaw, ewInd, hdopRaw, pdopRaw, speedRaw,
            ignitionStatus, immobilizerStatus, analogVoltageRaw, dateTime] = fields;
        const opMap = { '00': 'Unknown', '01': 'BSNL', '02': 'VI', '03': 'Airtel', '04': 'JIO' };
        return {
            raw, crcValid, imei,
            packetStatus: parseInt(packetStatus),
            frameNumber: parseInt(frameNumber),
            operator: opMap[operator] || 'Unknown',
            operatorCode: operator,
            signalStrength: parseInt(signalStrength),
            mcc: parseInt(mcc), mnc: parseInt(mnc),
            fixStatus: parseInt(fixStatus),
            latitude: parseInt(latRaw) / 1_000_000,
            nsInd: parseInt(nsInd) === 0 ? 'N' : 'S',
            longitude: parseInt(lonRaw) / 1_000_000,
            ewInd: parseInt(ewInd) === 0 ? 'E' : 'W',
            hdop: parseInt(hdopRaw) / 100,
            pdop: parseInt(pdopRaw) / 100,
            speed: parseInt(speedRaw) / 100,
            ignitionStatus: parseInt(ignitionStatus),
            immobilizerStatus: parseInt(immobilizerStatus),
            analogVoltage: parseInt(analogVoltageRaw) / 10,
            dateTime: parseInt(dateTime),
            dateTimeFormatted: new Date(parseInt(dateTime) * 1000).toUTCString(),
        };
    } catch (e) {
        return null;
    }
}

export function buildPacket({ imei, packetStatus, frameNumber, operator, signalStrength,
    mcc, mnc, fixStatus, latitude, nsInd, longitude, ewInd, hdop, pdop,
    speed, ignitionStatus, immobilizerStatus, analogVoltage, dateTime }) {
    const fields = [packetStatus, frameNumber, operator, signalStrength, mcc, mnc, fixStatus,
        Math.round(latitude * 1_000_000), nsInd === 'N' ? 0 : 1,
        Math.round(longitude * 1_000_000), ewInd === 'E' ? 0 : 1,
        Math.round(hdop * 100), Math.round(pdop * 100), Math.round(speed * 100),
        ignitionStatus, immobilizerStatus, Math.round(analogVoltage * 10), dateTime,
    ].join('|');
    const payload = `${fields.length}|${imei}|${fields}`;
    const crc = computeXorCrc(payload).toString(16).toUpperCase().padStart(2, '0');
    return `$${payload}*${crc}`;
}
