import React from 'react';
import { useTelematicsContext } from '../App';
import { Wifi, Signal, Globe, Network as NetworkIcon } from 'lucide-react';
import { CELLULAR_INFO } from '../utils/dataSimulator';

function SignalStrengthMeter({ strength }) {
    const pct = Math.round((strength / 31) * 100);
    const color = strength >= 20 ? '#10b981' : strength >= 10 ? '#f59e0b' : '#ef4444';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Signal Strength</span>
                <span style={{ fontSize: 15, fontWeight: 800, color }}>{strength} / 31</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 8,
                    background: `linear-gradient(90deg, ${color}55, ${color})`,
                    boxShadow: `0 0 10px ${color}55`,
                    transition: 'width 0.5s ease',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Poor</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Excellent</span>
            </div>
        </div>
    );
}

const OPERATORS = {
    '00': { name: 'Unknown', color: '#475569', flag: '❓' },
    '01': { name: 'BSNL', color: '#3b82f6', flag: '📶' },
    '02': { name: 'Vi (Vodafone Idea)', color: '#8b5cf6', flag: '📶' },
    '03': { name: 'Airtel', color: '#ef4444', flag: '📶' },
    '04': { name: 'JIO', color: '#3b82f6', flag: '📶' },
};

export default function Network() {
    const ctx = useTelematicsContext();
    const pkt = ctx?.latestPacket;

    const opCode = pkt?.operatorCode ?? CELLULAR_INFO.operator;
    const op = OPERATORS[opCode] ?? OPERATORS['00'];
    const signal = pkt?.signalStrength ?? CELLULAR_INFO.signalStrength;
    const mcc = pkt?.mcc ?? CELLULAR_INFO.mcc;
    const mnc = pkt?.mnc ?? CELLULAR_INFO.mnc;
    const imei = pkt?.imei ?? CELLULAR_INFO.imei;
    const isLive = pkt?.packetStatus === 1;
    const frameNum = pkt?.frameNumber ?? '--';

    const dbm = -113 + 2 * signal;
    const bars = signal >= 25 ? 4 : signal >= 18 ? 3 : signal >= 10 ? 2 : signal >= 4 ? 1 : 0;

    return (
        <div>
            <div className="header-bar">
                <div>
                    <div className="header-title">📡 Network Info</div>
                    <div className="header-subtitle">Cellular & Packet Status</div>
                </div>
                <div className={`pill ${isLive ? 'pill-green' : 'pill-orange'}`}>
                    <span className="dot" />
                    {isLive ? 'LIVE' : 'HISTORY'}
                </div>
            </div>

            <div className="page-content">
                {/* Operator Card */}
                <div className="hero-card fade-in" style={{ background: `linear-gradient(135deg, ${op.color}22 0%, #0a0c14 100%)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: `${op.color}22`,
                            border: `2px solid ${op.color}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28,
                        }}>
                            {op.flag}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Network Operator</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: op.color }}>{op.name}</div>
                        </div>
                    </div>

                    <SignalStrengthMeter strength={signal} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
                        {[
                            { label: 'RSSI', value: `${dbm} dBm`, color: op.color },
                            { label: 'Bars', value: `${bars} / 4`, color: op.color },
                            { label: 'Raw', value: `${signal} / 31`, color: op.color },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Identity */}
                <div className="card fade-in fade-in-1">
                    <div className="section-head"><span className="section-title">Device Identity</span></div>
                    <table className="data-table">
                        <tbody>
                            <tr><td>IMEI</td><td style={{ color: 'var(--accent-cyan)' }}>{imei}</td></tr>
                            <tr><td>MCC</td><td>{mcc} (India)</td></tr>
                            <tr><td>MNC</td><td>{mnc} ({op.name})</td></tr>
                            <tr><td>Operator</td><td>{op.name} (Code: {opCode})</td></tr>
                            <tr><td>Packet Status</td><td>
                                <span className={`pill ${isLive ? 'pill-green' : 'pill-orange'}`} style={{ fontSize: 11 }}>
                                    {isLive ? '1 — Live' : '0 — History'}
                                </span>
                            </td></tr>
                            <tr><td>Frame #</td><td>{frameNum}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* GPS Info */}
                <div className="card fade-in fade-in-2">
                    <div className="section-head"><span className="section-title">GPS Status</span></div>
                    <table className="data-table">
                        <tbody>
                            <tr><td>Fix Status</td><td>
                                <span className={`pill ${pkt?.fixStatus === 1 ? 'pill-green' : 'pill-red'}`} style={{ fontSize: 11 }}>
                                    {pkt?.fixStatus === 1 ? '1 — Valid Fix' : '0 — No Fix'}
                                </span>
                            </td></tr>
                            <tr><td>Latitude</td><td>{pkt?.latitude?.toFixed(6) ?? '--'}° {pkt?.nsInd ?? 'N'}</td></tr>
                            <tr><td>Longitude</td><td>{pkt?.longitude?.toFixed(6) ?? '--'}° {pkt?.ewInd ?? 'E'}</td></tr>
                            <tr><td>Speed</td><td>{pkt?.speed?.toFixed(2) ?? '--'} km/h</td></tr>
                            <tr><td>HDOP</td><td>{pkt?.hdop?.toFixed(2) ?? '--'}</td></tr>
                            <tr><td>PDOP</td><td>{pkt?.pdop?.toFixed(2) ?? '--'}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* Timestamp */}
                <div className="card fade-in fade-in-3">
                    <div className="section-head"><span className="section-title">UTC Timestamp</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
                            {pkt?.dateTimeFormatted ?? new Date().toUTCString()}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div className="metric-label">Unix Epoch (s)</div>
                                <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>
                                    {pkt?.dateTime ?? Math.floor(Date.now() / 1000)}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="metric-label">Timezone</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>UTC (Coordinated Universal Time)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MQTT Connection */}
                <div className="card fade-in fade-in-4">
                    <div className="section-head"><span className="section-title">MQTT Connection</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div className="conn-dot" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>Simulated Connection</span>
                    </div>
                    <table className="data-table">
                        <tbody>
                            <tr><td>Broker</td><td>HiveMQ Cloud (Free Tier)</td></tr>
                            <tr><td>Protocol</td><td>MQTTS (WSS:8884)</td></tr>
                            <tr><td>Security</td><td>TLS 1.2 + JWT Auth</td></tr>
                            <tr><td>QoS</td><td>1 (At least once)</td></tr>
                            <tr><td>Update Rate</td><td>2 seconds</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
