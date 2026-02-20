import React from 'react';
import { useTelematicsContext } from '../App';
import { computeXorCrc } from '../utils/packetParser';

function FieldRow({ label, raw, decoded, color = 'var(--text-primary)', desc }) {
    return (
        <tr>
            <td style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', paddingRight: 8, verticalAlign: 'top', paddingTop: 9, paddingBottom: 9, borderBottom: '1px solid var(--border)', width: '28%' }}>{label}</td>
            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color, borderBottom: '1px solid var(--border)', paddingTop: 9, paddingBottom: 9 }}>
                <span style={{ color }}>{raw}</span>
                {decoded && <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{decoded}</div>}
            </td>
        </tr>
    );
}

export default function PacketViewer() {
    const ctx = useTelematicsContext();
    const pkt = ctx?.latestPacket;

    if (!pkt) {
        return (
            <div>
                <div className="header-bar">
                    <div className="header-title">📋 Packet Viewer</div>
                </div>
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', marginTop: 60 }}>
                    <div style={{ fontSize: 40 }}>📡</div>
                    <div style={{ marginTop: 12, fontSize: 14 }}>Waiting for first packet...</div>
                </div>
            </div>
        );
    }

    const raw = pkt.raw ?? '';
    const starIdx = raw.lastIndexOf('*');
    const headerPart = raw.slice(0, 1); // $
    const dataPart = raw.slice(1, starIdx);
    const tailPart = raw.slice(starIdx);

    const dataPayload = raw.slice(1, starIdx);
    const crcCalced = computeXorCrc(dataPayload).toString(16).toUpperCase().padStart(2, '0');
    const crcReceived = tailPart.slice(1);
    const crcOk = crcCalced === crcReceived;

    const operatorMap = { '00': 'Unknown', '01': 'BSNL', '02': 'VI', '03': 'Airtel', '04': 'JIO' };

    return (
        <div>
            <div className="header-bar">
                <div>
                    <div className="header-title">📋 Packet Viewer</div>
                    <div className="header-subtitle">Frame #{pkt.frameNumber} — Live Packet</div>
                </div>
                <div className={`pill ${crcOk ? 'pill-green' : 'pill-red'}`} style={{ fontSize: 11 }}>
                    {crcOk ? '✓ CRC OK' : '✗ CRC FAIL'}
                </div>
            </div>

            <div className="page-content">
                {/* Raw Packet */}
                <div className="card fade-in">
                    <div className="section-head"><span className="section-title">Raw Packet</span></div>
                    <div className="packet-raw">
                        <span className="packet-header-span">{headerPart}</span>
                        <span className="packet-data-span">{dataPart}</span>
                        <span className="packet-tail-span">*</span>
                        <span className="packet-crc-span">{crcReceived}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Header</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Data</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#8b5cf6' }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tail (*)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CRC</span>
                        </div>
                    </div>
                </div>

                {/* Header Fields */}
                <div className="card fade-in fade-in-1">
                    <div className="section-head">
                        <span className="section-title" style={{ color: '#f59e0b' }}>Header Fields</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <FieldRow label="Start Byte" raw="$" decoded="ASCII 36" color="#f59e0b" />
                            <FieldRow label="Data Length" raw={String(pkt.dataLen)} decoded={`${pkt.dataLen} bytes`} color="#f59e0b" />
                            <FieldRow label="IMEI" raw={pkt.imei} decoded="Unique device identifier" color="#f59e0b" />
                        </tbody>
                    </table>
                </div>

                {/* Data Fields */}
                <div className="card fade-in fade-in-2">
                    <div className="section-head">
                        <span className="section-title" style={{ color: '#10b981' }}>Data Fields</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <FieldRow label="Pkt Status" raw={String(pkt.packetStatus)} decoded={pkt.packetStatus === 1 ? '1 = Live' : '0 = History'} color="#10b981" />
                            <FieldRow label="Frame #" raw={String(pkt.frameNumber)} decoded="Incremental counter" color="#10b981" />
                            <FieldRow label="Operator" raw={pkt.operatorCode} decoded={`${operatorMap[pkt.operatorCode]} (03=Airtel, 04=JIO...)`} color="#10b981" />
                            <FieldRow label="Signal" raw={String(pkt.signalStrength)} decoded={`0–31 range (${(-113 + 2 * pkt.signalStrength)} dBm)`} color="#10b981" />
                            <FieldRow label="MCC" raw={String(pkt.mcc)} decoded="Mobile Country Code (India=404)" color="#3b82f6" />
                            <FieldRow label="MNC" raw={String(pkt.mnc)} decoded="Mobile Network Code" color="#3b82f6" />
                            <FieldRow label="Fix Status" raw={String(pkt.fixStatus)} decoded={pkt.fixStatus === 1 ? '1 = Valid Fix' : '0 = No Fix'} color="#3b82f6" />
                            <FieldRow label="Latitude" raw={String(Math.round(pkt.latitude * 1e6))} decoded={`÷1,000,000 = ${pkt.latitude.toFixed(6)}° ${pkt.nsInd}`} color="#06b6d4" />
                            <FieldRow label="N/S Ind" raw={pkt.nsInd === 'N' ? '0' : '1'} decoded={`0=N, 1=S → ${pkt.nsInd}`} color="#06b6d4" />
                            <FieldRow label="Longitude" raw={String(Math.round(pkt.longitude * 1e6))} decoded={`÷1,000,000 = ${pkt.longitude.toFixed(6)}° ${pkt.ewInd}`} color="#06b6d4" />
                            <FieldRow label="E/W Ind" raw={pkt.ewInd === 'E' ? '0' : '1'} decoded={`0=E, 1=W → ${pkt.ewInd}`} color="#06b6d4" />
                            <FieldRow label="HDOP" raw={String(Math.round(pkt.hdop * 100))} decoded={`÷100 = ${pkt.hdop.toFixed(2)}`} color="#8b5cf6" />
                            <FieldRow label="PDOP" raw={String(Math.round(pkt.pdop * 100))} decoded={`÷100 = ${pkt.pdop.toFixed(2)}`} color="#8b5cf6" />
                            <FieldRow label="Speed" raw={String(Math.round(pkt.speed * 100))} decoded={`÷100 = ${pkt.speed.toFixed(2)} km/h`} color="#8b5cf6" />
                            <FieldRow label="Ignition" raw={String(pkt.ignitionStatus)} decoded={pkt.ignitionStatus ? '1 = ON (DI HIGH)' : '0 = OFF (DI LOW)'} color={pkt.ignitionStatus ? '#10b981' : '#ef4444'} />
                            <FieldRow label="Immob" raw={String(pkt.immobilizerStatus)} decoded={pkt.immobilizerStatus ? '1 = ON (DO HIGH)' : '0 = OFF (DO LOW)'} color={pkt.immobilizerStatus ? '#ef4444' : '#10b981'} />
                            <FieldRow label="Voltage" raw={String(Math.round(pkt.analogVoltage * 10))} decoded={`÷10 = ${pkt.analogVoltage.toFixed(1)}V`} color="#f59e0b" />
                            <FieldRow label="DateTime" raw={String(pkt.dateTime)} decoded={`UTC: ${pkt.dateTimeFormatted}`} color="#f59e0b" />
                        </tbody>
                    </table>
                </div>

                {/* Tail / CRC */}
                <div className="card fade-in fade-in-3">
                    <div className="section-head">
                        <span className="section-title" style={{ color: '#8b5cf6' }}>Tail Fields</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <FieldRow label="End Char" raw="*" decoded="ASCII 42" color="#8b5cf6" />
                            <FieldRow label="CRC (rcvd)" raw={crcReceived} decoded="8-bit XOR of data between $ and *" color={crcOk ? '#10b981' : '#ef4444'} />
                            <FieldRow label="CRC (calc)" raw={crcCalced} decoded={crcOk ? '✓ Matches received CRC' : '✗ Mismatch — data corruption!'} color={crcOk ? '#10b981' : '#ef4444'} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
