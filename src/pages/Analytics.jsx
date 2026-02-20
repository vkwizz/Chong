import React from 'react';
import { useTelematicsContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Zap, Activity } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', fontSize: 12,
            }}>
                <div style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ color: '#10b981', fontWeight: 700 }}>{payload[0].value?.toFixed(2)}V</div>
            </div>
        );
    }
    return null;
}

export default function Analytics() {
    const ctx = useTelematicsContext();
    const vh = ctx?.voltageHistory ?? [];
    const pkt = ctx?.latestPacket;
    const history = ctx?.packetHistory ?? [];

    // Compute voltage stats
    const voltages = vh.map(d => d.v);
    const vMin = voltages.length ? Math.min(...voltages).toFixed(2) : '--';
    const vMax = voltages.length ? Math.max(...voltages).toFixed(2) : '--';
    const vAvg = voltages.length ? (voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(2) : '--';

    const diHistory = history.slice(0, 10).map((p, i) => ({
        frame: p.frameNumber,
        ign: p.ignitionStatus,
        immob: p.immobilizerStatus,
        v: p.analogVoltage,
    }));

    return (
        <div>
            <div className="header-bar">
                <div>
                    <div className="header-title">📊 Analytics</div>
                    <div className="header-subtitle">Analog & Digital Trends</div>
                </div>
                <div className="live-badge"><div className="live-dot" />LIVE</div>
            </div>

            <div className="page-content">
                {/* Voltage Stats Row */}
                <div className="metric-grid-3 fade-in">
                    {[
                        { label: 'Min', value: vMin, unit: 'V', color: '#ef4444' },
                        { label: 'Avg', value: vAvg, unit: 'V', color: '#3b82f6' },
                        { label: 'Max', value: vMax, unit: 'V', color: '#10b981' },
                    ].map(({ label, value, unit, color }) => (
                        <div key={label} className="metric-item">
                            <div className="metric-label">{label} Voltage</div>
                            <div className="metric-value" style={{ color, fontSize: 20 }}>{value}</div>
                            <div className="metric-unit">{unit}</div>
                        </div>
                    ))}
                </div>

                {/* Voltage Chart */}
                <div className="chart-container fade-in fade-in-1">
                    <div className="section-head">
                        <span className="section-title">Analog Voltage (AI)</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Last 30 readings</span>
                    </div>
                    {vh.length > 1 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={vh} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" />
                                <YAxis domain={[0, 5.5]} tick={{ fontSize: 9, fill: '#475569' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#vGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            Collecting data...
                        </div>
                    )}
                </div>

                {/* Current Values */}
                <div className="card fade-in fade-in-2">
                    <div className="section-head"><span className="section-title">Current Readings</span></div>
                    <div className="metric-grid">
                        <div className="metric-item">
                            <div className="metric-label">⚡ Analog (AI)</div>
                            <div className="metric-value" style={{ color: '#10b981' }}>{pkt?.analogVoltage?.toFixed(1) ?? '0.0'}</div>
                            <div className="metric-unit">Volts (0–5V)</div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">🚗 Speed</div>
                            <div className="metric-value" style={{ color: '#3b82f6' }}>{pkt?.speed?.toFixed(1) ?? '0.0'}</div>
                            <div className="metric-unit">km/h</div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">🔌 Ignition (DI)</div>
                            <div className="metric-value" style={{ color: pkt?.ignitionStatus ? '#10b981' : '#ef4444', fontSize: 16 }}>
                                {pkt?.ignitionStatus ? 'ON' : 'OFF'}
                            </div>
                            <div className="metric-unit">Digital Input</div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-label">🔒 Immob (DO)</div>
                            <div className="metric-value" style={{ color: ctx?.immobActive ? '#ef4444' : '#10b981', fontSize: 16 }}>
                                {ctx?.immobActive ? 'ON' : 'OFF'}
                            </div>
                            <div className="metric-unit">Digital Output</div>
                        </div>
                    </div>
                </div>

                {/* Recent Packet Log */}
                <div className="card fade-in fade-in-3">
                    <div className="section-head">
                        <span className="section-title">Recent Frames</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Last 10</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {diHistory.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Waiting for data...</div>
                        ) : (
                            diHistory.map((row) => (
                                <div key={row.frame} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                }}>
                                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>#{row.frame}</span>
                                    <span style={{ fontSize: 12, color: row.ign ? '#10b981' : '#ef4444', fontWeight: 700 }}>IGN:{row.ign ? 'ON' : 'OFF'}</span>
                                    <span style={{ fontSize: 12, color: row.immob ? '#ef4444' : '#10b981', fontWeight: 700 }}>DO:{row.immob ? 'HI' : 'LO'}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>{row.v?.toFixed(1)}V</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
