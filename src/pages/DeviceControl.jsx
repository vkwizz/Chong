import React, { useState } from 'react';
import { useTelematicsContext, useToast } from '../App';
import { Shield, AlertTriangle, CheckCircle, Lock, Unlock } from 'lucide-react';
import { publishImmobilizerCommand } from '../utils/mqttClient';

export default function DeviceControl() {
    const ctx = useTelematicsContext();
    const addToast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [pendingState, setPendingState] = useState(false);
    const [loading, setLoading] = useState(false);

    const immob = ctx?.immobActive ?? false;
    const pkt = ctx?.latestPacket;
    const ignition = pkt?.ignitionStatus === 1;

    const requestToggle = (newState) => {
        setPendingState(newState);
        setShowModal(true);
    };

    const confirmToggle = async () => {
        setLoading(true);
        publishImmobilizerCommand(pendingState);
        await new Promise(r => setTimeout(r, 600));
        ctx.handleImmobToggle(pendingState);
        setLoading(false);
        setShowModal(false);
    };

    return (
        <div>
            <div className="header-bar">
                <div>
                    <div className="header-title">🔒 Device Control</div>
                    <div className="header-subtitle">Immobilizer & DO Management</div>
                </div>
                <div className={`pill ${immob ? 'pill-red' : 'pill-green'}`}>
                    <span className="dot dot-pulse" />
                    {immob ? 'IMMOB ON' : 'MOBILE'}
                </div>
            </div>

            <div className="page-content">
                {/* Main Immobilizer Card */}
                <div className={`immob-card ${immob ? 'immob-active' : 'immob-inactive'} fade-in`}>
                    <div className={`immob-icon ${immob ? 'immob-icon-active' : 'immob-icon-inactive'}`}>
                        {immob ? '🔴' : '🟢'}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                            {immob ? 'Vehicle Immobilized' : 'Vehicle Active'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {immob
                                ? 'DO pin is HIGH — Engine start is prevented. Vehicle cannot move.'
                                : 'DO pin is LOW — Immobilizer is disengaged. Normal operation.'}
                        </div>
                    </div>

                    {/* DO Pin Visual */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        width: '100%',
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>DO Pin (Immob)</div>
                        <div style={{
                            marginLeft: 'auto',
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 14, fontWeight: 800,
                            color: immob ? '#ef4444' : '#10b981',
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                            {immob ? 'HIGH (1)' : 'LOW (0)'}
                        </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                        className={`btn ${immob ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => requestToggle(!immob)}
                        style={{ marginTop: 4 }}
                    >
                        {immob
                            ? <><Unlock size={18} /> Deactivate Immobilizer</>
                            : <><Lock size={18} /> Activate Immobilizer</>
                        }
                    </button>
                </div>

                {/* Ignition Status */}
                <div className="card fade-in fade-in-1">
                    <div className="section-head"><span className="section-title">Digital Input (DI)</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>Ignition Status</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>DI1 — Engine ignition detection</div>
                        </div>
                        <div className={`pill ${ignition ? 'pill-green' : 'pill-red'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
                            <span className="dot dot-pulse" />
                            {ignition ? 'ON' : 'OFF'}
                        </div>
                    </div>
                    <div className="divider" style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                            <div className="metric-label">Signal Level</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: ignition ? '#10b981' : '#ef4444' }}>{ignition ? 'HIGH' : 'LOW'}</div>
                        </div>
                        <div>
                            <div className="metric-label">Binary</div>
                            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{ignition ? '1' : '0'}</div>
                        </div>
                        <div>
                            <div className="metric-label">MCU Pin</div>
                            <div style={{ fontSize: 16, fontWeight: 800 }}>DI1</div>
                        </div>
                    </div>
                </div>

                {/* Command History / MQTT Info */}
                <div className="card fade-in fade-in-2">
                    <div className="section-head"><span className="section-title">Control Protocol</span></div>
                    <table className="data-table">
                        <tbody>
                            <tr><td>Protocol</td><td>MQTTS (TLS)</td></tr>
                            <tr><td>Topic</td><td>telematics/device/.../control</td></tr>
                            <tr><td>QoS</td><td>1 (At least once)</td></tr>
                            <tr><td>Auth</td><td>JWT Token</td></tr>
                            <tr><td>Payload</td><td>{`{"command":"SET_DO","state":1}`}</td></tr>
                            <tr><td>Ack</td><td>~300ms (simulated)</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* Warning */}
                <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                }} className="fade-in fade-in-3">
                    <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Safety Notice</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Immobilization should only be activated when the vehicle is stationary. Activating while in motion can cause accidents. Current speed: <strong>{pkt?.speed?.toFixed(1) ?? '0.0'} km/h</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ fontSize: 32 }}>{pendingState ? '🔴' : '🟢'}</div>
                            <div className="modal-title">
                                {pendingState ? 'Activate Immobilizer?' : 'Deactivate Immobilizer?'}
                            </div>
                        </div>
                        <div className="modal-body">
                            {pendingState
                                ? 'This will send a HIGH signal to the DO pin via MQTT. The vehicle engine will be prevented from starting. Are you sure?'
                                : 'This will send a LOW signal to the DO pin via MQTT. The vehicle will be able to start normally. Confirm?'
                            }
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            <button
                                className={`btn ${pendingState ? 'btn-danger' : 'btn-success'}`}
                                onClick={confirmToggle}
                                disabled={loading}
                                style={{ flex: 1 }}
                            >
                                {loading ? '⏳ Sending...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
