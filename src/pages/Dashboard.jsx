import React, { useRef, useEffect } from 'react';
import { useTelematicsContext } from '../App';
import { Shield, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── EV Scooter top-down SVG ─────────────────────────────────────────────────
const EVScooterSVG = ({ immob }) => (
    <svg viewBox="0 0 160 360" xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', maxWidth: 180, height: 'auto', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.22))' }}>
        {/* Rear wheel */}
        <ellipse cx="80" cy="332" rx="26" ry="14" fill="#1a1a1a" />
        <ellipse cx="80" cy="332" rx="16" ry="8" fill="#2e2e2e" />
        <ellipse cx="80" cy="332" rx="7" ry="4" fill="#444" />
        {/* Body rear section */}
        <path d="M54 308 Q50 275 48 222 L112 222 Q110 275 106 308 Z" fill="#C0C0B4" />
        {/* Body highlight on rear */}
        <path d="M76 222 Q76 275 76 308 L84 308 Q84 275 84 222 Z" fill="rgba(255,255,255,0.18)" />
        {/* Main body */}
        <rect x="44" y="100" width="72" height="132" rx="22" fill="#D4D4C8" />
        {/* Body center highlight */}
        <rect x="74" y="108" width="10" height="116" rx="5" fill="rgba(255,255,255,0.28)" />
        {/* Seat */}
        <rect x="52" y="188" width="56" height="66" rx="14" fill="#AAAAA0" />
        <rect x="58" y="196" width="44" height="50" rx="10" fill="#989890" />
        {/* Seat stitching line */}
        <rect x="80" y="198" width="2" height="46" rx="1" fill="rgba(255,255,255,0.2)" />
        {/* Footrest platform */}
        <rect x="36" y="152" width="88" height="44" rx="12" fill="#C6C6BA" />
        <rect x="36" y="152" width="88" height="10" rx="8" fill="rgba(255,255,255,0.22)" />
        {/* EV badge on footrest */}
        <text x="80" y="178" fontSize="16" textAnchor="middle" dominantBaseline="middle" fill="#C8F53C">⚡</text>
        {/* Frame neck */}
        <rect x="62" y="74" width="36" height="34" rx="11" fill="#CACABE" />
        {/* Handlebar stem */}
        <rect x="72" y="54" width="16" height="26" rx="5" fill="#999" />
        {/* Handlebar bar */}
        <rect x="24" y="48" width="112" height="13" rx="6.5" fill="#5a5a5a" />
        {/* Left grip - red if immobilized */}
        <rect x="16" y="45" width="18" height="20" rx="7" fill={immob ? '#ef4444' : '#3a3a3a'} />
        {/* Right grip */}
        <rect x="126" y="45" width="18" height="20" rx="7" fill="#3a3a3a" />
        {/* Left mirror */}
        <ellipse cx="14" cy="43" rx="6" ry="4" fill="#888" transform="rotate(-20, 14, 43)" />
        {/* Right mirror */}
        <ellipse cx="146" cy="43" rx="6" ry="4" fill="#888" transform="rotate(20, 146, 43)" />
        {/* Front fork */}
        <rect x="68" y="22" width="24" height="32" rx="6" fill="#B0B0A8" />
        {/* Front wheel */}
        <ellipse cx="80" cy="18" rx="26" ry="14" fill="#1a1a1a" />
        <ellipse cx="80" cy="18" rx="16" ry="8" fill="#2e2e2e" />
        <ellipse cx="80" cy="18" rx="7" ry="4" fill="#444" />
        {/* Headlight — lime green glow */}
        <ellipse cx="80" cy="8" rx="13" ry="7" fill="#C8F53C" />
        <ellipse cx="80" cy="8" rx="8" ry="4" fill="rgba(255,255,255,0.7)" />
        {/* Rear brake light */}
        <ellipse cx="80" cy="322" rx="10" ry="4" fill={immob ? '#ef4444' : '#f87171'} opacity="0.9" />
        {/* Rear turn signal dots */}
        <circle cx="58" cy="314" r="4" fill={immob ? '#ef4444' : '#f87171'} opacity="0.7" />
        <circle cx="102" cy="314" r="4" fill={immob ? '#ef4444' : '#f87171'} opacity="0.7" />
    </svg>
);

export default function Dashboard() {
    const ctx = useTelematicsContext();
    const navigate = useNavigate();
    const scooterRef = useRef(null);

    const pkt = ctx?.latestPacket;
    const speed = pkt?.speed ?? 0;
    const ignition = pkt?.ignitionStatus === 1;
    const immob = ctx?.immobActive ?? false;
    const voltage = pkt?.analogVoltage ?? 0;
    const signal = pkt?.signalStrength ?? 0;
    const fixValid = pkt?.fixStatus === 1;
    const operator = pkt?.operator ?? 'Airtel';
    const frameNum = pkt?.frameNumber ?? '--';
    const lat = pkt?.latitude?.toFixed(5) ?? '--';
    const lon = pkt?.longitude?.toFixed(5) ?? '--';
    const imei = pkt?.imei ?? '887744556677882';

    const voltPct = Math.min(100, (voltage / 5) * 100);
    const voltColor = voltage < 2 ? '#ef4444' : voltage < 3.5 ? '#f59e0b' : '#B8E840';
    const bars = signal >= 25 ? 4 : signal >= 18 ? 3 : signal >= 10 ? 2 : signal >= 4 ? 1 : 0;

    // Parallax scroll effect on scooter
    useEffect(() => {
        const page = document.querySelector('.page');
        if (!page) return;
        const handleScroll = () => {
            if (scooterRef.current) {
                const y = page.scrollTop;
                const ty = Math.min(y * 0.32, 70);
                const sc = Math.min(1 + y * 0.0007, 1.12);
                const op = Math.max(0.2, 1 - y * 0.0025);
                scooterRef.current.style.transform = `translateY(${ty}px) scale(${sc})`;
                scooterRef.current.style.opacity = op;
            }
        };
        page.addEventListener('scroll', handleScroll, { passive: true });
        return () => page.removeEventListener('scroll', handleScroll);
    }, []);

    const S = {
        page: { background: '#F2EDE8', minHeight: '100%' },
        header: {
            padding: '16px 20px 12px',
            background: '#F2EDE8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 50,
        },
        hero: {
            background: 'linear-gradient(180deg, #F2EDE8 0%, #E8E0D4 100%)',
            padding: '4px 24px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            overflow: 'hidden', minHeight: 300, position: 'relative',
        },
        content: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
        cardLight: { background: '#fff', borderRadius: 22, padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
        cardDark: { background: '#1C1C1E', borderRadius: 22, padding: '18px' },
        label: { fontSize: 10, color: '#AAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
        labelDark: { fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
    };

    return (
        <div style={S.page}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={S.header}>
                <div>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Smart Telematics</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px', marginTop: 1 }}>
                        VAJRA <span style={{ color: '#bbb', fontWeight: 400 }}>Fleet</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Signal bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 17 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                width: 4, borderRadius: 2,
                                background: i <= bars ? '#B8E840' : '#ddd',
                                height: i === 1 ? 4 : i === 2 ? 8 : i === 3 ? 12 : 17,
                            }} />
                        ))}
                    </div>
                    {/* LIVE pill */}
                    <div style={{
                        background: '#1a1a1a', borderRadius: 100, padding: '6px 12px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#B8E840', animation: 'pulse-dot 1.5s infinite', boxShadow: '0 0 6px #B8E840' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#B8E840', letterSpacing: '0.5px' }}>LIVE</span>
                    </div>
                </div>
            </div>

            {/* ── Hero Scooter Section ────────────────────────────────── */}
            <div style={S.hero}>
                {/* Model name */}
                <div style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.6px' }}>VAJRA-1</div>
                    <div style={{ fontSize: 12, color: '#999', fontWeight: 500, marginTop: 2 }}>
                        ESP32 Smart Telematics · ···{imei.slice(-6)}
                    </div>
                </div>

                {/* Scooter with parallax + glow */}
                <div ref={scooterRef} style={{ width: 180, position: 'relative', willChange: 'transform', transition: 'opacity 0.08s' }}>
                    {/* Radial glow ring */}
                    <div style={{
                        position: 'absolute', inset: '-40px',
                        background: `radial-gradient(circle at 50% 50%, ${immob ? 'rgba(239,68,68,0.18)' : 'rgba(184,229,64,0.22)'} 0%, transparent 65%)`,
                        pointerEvents: 'none',
                    }} />
                    {/* Outer ring */}
                    <div style={{
                        position: 'absolute', inset: '-16px', borderRadius: '50%',
                        border: `2px solid ${immob ? 'rgba(239,68,68,0.2)' : 'rgba(184,229,64,0.2)'}`,
                        pointerEvents: 'none',
                    }} />
                    <EVScooterSVG immob={immob} />
                </div>

                {/* Status badges — below scooter */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 20, zIndex: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* Ignition */}
                    <div style={{
                        background: ignition ? '#1a1a1a' : '#e8e2da', borderRadius: 100, padding: '7px 14px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ignition ? '#B8E840' : '#bbb', boxShadow: ignition ? '0 0 8px #B8E840' : 'none' }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: ignition ? '#B8E840' : '#999', letterSpacing: '0.3px' }}>
                            IGN {ignition ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    {/* Immobilizer */}
                    <div style={{
                        background: immob ? '#ef4444' : '#1a1a1a', borderRadius: 100, padding: '7px 14px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.3px' }}>
                            🔒 {immob ? 'IMMOB' : 'READY'}
                        </span>
                    </div>
                    {/* Speed badge */}
                    <div style={{ background: '#B8E840', borderRadius: 100, padding: '7px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#1a1a1a' }}>{speed.toFixed(0)} km/h</span>
                    </div>
                </div>
            </div>

            {/* ── Data Cards ─────────────────────────────────────────── */}
            <div style={S.content}>

                {/* DI + DO cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* DI */}
                    <div style={{ ...S.cardDark }}>
                        <div style={S.labelDark}>Digital Input</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: ignition ? '#B8E840' : '#3a3a3a', lineHeight: 1 }}>
                            {ignition ? 'ON' : 'OFF'}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>Ignition Signal</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#444', marginTop: 3 }}>
                            DI1 = {ignition ? 'HIGH (1)' : 'LOW (0)'}
                        </div>
                    </div>
                    {/* DO */}
                    <div style={{ ...S.cardDark, background: immob ? '#ef4444' : '#1C1C1E' }}>
                        <div style={{ ...S.labelDark, color: immob ? 'rgba(255,255,255,0.6)' : '#555' }}>Digital Output</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: immob ? 'white' : '#3a3a3a', lineHeight: 1 }}>
                            {immob ? 'ON' : 'OFF'}
                        </div>
                        <div style={{ fontSize: 11, color: immob ? 'rgba(255,255,255,0.7)' : '#666', marginTop: 6 }}>Immobilizer</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: immob ? 'rgba(255,255,255,0.5)' : '#444', marginTop: 3 }}>
                            DO1 = {immob ? 'HIGH (1)' : 'LOW (0)'}
                        </div>
                    </div>
                </div>

                {/* Analog Voltage Card */}
                <div style={S.cardDark}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={S.labelDark}>Analog Input (AI) — 0–5V</div>
                            <div style={{ fontSize: 38, fontWeight: 900, color: voltColor, lineHeight: 1, letterSpacing: '-1px' }}>
                                {voltage.toFixed(1)}<span style={{ fontSize: 18, fontWeight: 500, color: '#444' }}> V</span>
                            </div>
                            <div style={{ marginTop: 14, background: '#2a2a2a', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${voltPct}%`, height: '100%', borderRadius: 8,
                                    background: `linear-gradient(90deg, ${voltColor}66, ${voltColor})`,
                                    transition: 'width 0.8s ease',
                                    boxShadow: `0 0 12px ${voltColor}55`,
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 9, color: '#444' }}>0V</span>
                                <span style={{ fontSize: 9, color: '#444' }}>5V</span>
                            </div>
                        </div>
                        {/* Vertical battery bar */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginLeft: 18 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: voltColor }}>{voltPct.toFixed(0)}%</div>
                            {/* Battery terminal nub */}
                            <div style={{ width: 16, height: 5, background: '#444', borderRadius: '4px 4px 0 0' }} />
                            <div style={{
                                width: 32, height: 80, background: '#2a2a2a', borderRadius: 8,
                                position: 'relative', overflow: 'hidden', border: '1.5px solid #3a3a3a',
                            }}>
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    height: `${voltPct}%`,
                                    background: `linear-gradient(180deg, ${voltColor} 0%, ${voltColor}88 100%)`,
                                    transition: 'height 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                                    borderRadius: '0 0 6px 6px',
                                    boxShadow: `0 -4px 12px ${voltColor}55`,
                                }} />
                            </div>
                            <div style={{ fontSize: 9, color: '#555', fontWeight: 700 }}>AI1</div>
                        </div>
                    </div>
                </div>

                {/* Network trio row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[
                        { label: 'Operator', value: operator, icon: '📡' },
                        { label: 'GPS Fix', value: fixValid ? 'FIXED' : 'NO FIX', icon: '🛰️', color: fixValid ? '#B8E840' : '#ef4444' },
                        { label: 'Frame', value: `#${frameNum}`, icon: '📦', color: '#888' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} style={{ ...S.cardLight, padding: '14px 12px' }}>
                            <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: color ?? '#1a1a1a', lineHeight: 1.1 }}>{value}</div>
                            <div style={{ fontSize: 9, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Location card */}
                <div onClick={() => navigate('/map')} style={{ ...S.cardDark, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={S.labelDark}>📍 Location</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#B8E840', fontWeight: 700 }}>{lat}° N</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#B8E840', fontWeight: 700, marginTop: 4 }}>{lon}° E</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>SPEED</div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>{speed.toFixed(0)}</div>
                            <div style={{ fontSize: 12, color: '#555' }}>km/h</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {[['HDOP', pkt?.hdop?.toFixed(2) ?? '1.20'], ['PDOP', pkt?.pdop?.toFixed(2) ?? '1.80']].map(([k, v]) => (
                                <div key={k}>
                                    <div style={{ fontSize: 9, color: '#555', fontWeight: 700 }}>{k}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>{v}</div>
                                </div>
                            ))}
                        </div>
                        <span style={{ fontSize: 12, color: '#B8E840', fontWeight: 800 }}>View Map →</span>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={() => navigate('/control')} style={{
                        background: immob ? '#ef4444' : '#B8E840',
                        border: 'none', borderRadius: 18, padding: '16px 14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 14,
                        color: immob ? 'white' : '#1a1a1a',
                        boxShadow: `0 6px 20px ${immob ? 'rgba(239,68,68,0.35)' : 'rgba(184,229,64,0.45)'}`,
                        transition: 'transform 0.15s, box-shadow 0.15s',
                    }}>
                        <Shield size={20} /> Control
                    </button>
                    <button onClick={() => navigate('/packet')} style={{
                        background: 'white', border: 'none', borderRadius: 18, padding: '16px 14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#1a1a1a',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
                    }}>
                        <FileSearch size={20} /> Packets
                    </button>
                </div>

                {/* UTC timestamp */}
                <div style={{ ...S.cardLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>🕐 UTC Time</div>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#666', fontWeight: 700, textAlign: 'right' }}>
                        {pkt?.dateTimeFormatted?.slice(0, 25) ?? new Date().toUTCString().slice(0, 25)}
                    </div>
                </div>

                <div style={{ height: 4 }} />
            </div>
        </div>
    );
}
