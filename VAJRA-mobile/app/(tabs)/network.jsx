import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Network from 'expo-network';
import * as Cellular from 'expo-cellular';
import NetInfo from '@react-native-community/netinfo';
import { useTelematicsContext } from '../_layout';

const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

function SignalMeter({ value }) {
    const pct = Math.round((value / 31) * 100);
    const color = value >= 20 ? LIME : value >= 10 ? '#f59e0b' : '#ef4444';
    return (
        <View style={SM.wrap}>
            <Text style={[SM.val, { color }]}>{value}<Text style={{ fontSize: 14, color: '#999' }}>/31</Text></Text>
            <View style={SM.track}>
                <View style={[SM.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[SM.label, { color }]}>{pct >= 70 ? 'Excellent' : pct >= 40 ? 'Good' : 'Weak'}</Text>
        </View>
    );
}

const SM = StyleSheet.create({
    wrap: { alignItems: 'center', gap: 8 },
    val: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
    track: { width: '100%', height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

export default function NetworkScreen() {
    const ctx = useTelematicsContext();
    const p = ctx?.latestPacket;

    // Phone Network State
    const [phoneNet, setPhoneNet] = useState({ carrier: 'Scanning...', type: 'Checking...', strength: 3 });

    useEffect(() => {
        const updatePhoneInfo = async () => {
            try {
                const carrier = await Cellular.getCarrierNameAsync();
                const netState = await NetInfo.fetch();
                setPhoneNet({
                    carrier: carrier || 'WiFi / Unknown',
                    type: netState.type.toUpperCase(),
                    strength: netState.details?.strength || 3
                });
            } catch (e) {
                console.warn('Network Info Error:', e);
            }
        };
        updatePhoneInfo();
        const unsub = NetInfo.addEventListener(state => {
            setPhoneNet(prev => ({ ...prev, type: state.type.toUpperCase() }));
        });
        return unsub;
    }, []);

    const mqtt = ctx?.mqttStatus ?? 'simulated';
    const mqttColor = mqtt === 'connected' ? LIME : mqtt === 'connecting' ? '#f59e0b' : '#999';

    return (
        <View style={S.root}>
            <View style={S.header}>
                <Text style={S.headerTitle}>📡 Network Diagnostics</Text>
                <View style={[S.pill, { backgroundColor: mqttColor + '18' }]}>
                    <View style={[S.dot, { backgroundColor: mqttColor }]} />
                    <Text style={[S.pillText, { color: mqttColor }]}>{mqtt.toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

                {/* ── User Phone Network ── */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>User Phone Connection</Text>
                    <Text style={[S.opName, { color: '#1a1a1a', fontSize: 24 }]}>{phoneNet.carrier}</Text>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>Type</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>{phoneNet.type}</Text></View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>Status</Text><Text style={[S.cellVal, { color: LIME }]}>ACTIVE</Text>
                        </View>
                    </View>
                </View>

                {/* ── Telematics Hardware Network ── */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>Hardware (Telematics) Network</Text>
                    <Text style={[S.opName, { color: '#1a1a1a' }]}>{p?.operator || 'GSM/LTE'}</Text>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>IMEI</Text><Text style={[S.cellVal, { color: '#666', fontSize: 13, fontFamily: 'monospace' }]}>{p?.imei || '--'}</Text></View>
                    </View>
                </View>

                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>Hardware Signal Strength</Text>
                    <SignalMeter value={p?.signalStrength || 18} />
                </View>

                {/* ── Hardware Telemetry ── */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <View style={S.rowBetween}>
                        <Text style={S.label}>Hardware GPS & Speed</Text>
                        <View style={[S.pill, { backgroundColor: p?.hasGps ? 'rgba(184,232,64,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                            <View style={[S.dot, { backgroundColor: p?.hasGps ? LIME : '#ef4444' }]} />
                            <Text style={[S.pillText, { color: p?.hasGps ? LIME : '#ef4444' }]}>{p?.hasGps ? 'LIVE' : 'NO FIX'}</Text>
                        </View>
                    </View>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>SPEED</Text><Text style={[S.cellVal, { color: LIME, fontSize: 22 }]}>{p?.speed?.toFixed(1) || '0.0'} <Text style={{ fontSize: 12 }}>km/h</Text></Text></View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>Voltage</Text><Text style={[S.cellVal, { color: '#1a1a1a', fontSize: 22 }]}>{p?.analogVoltage?.toFixed(2) || '--'} <Text style={{ fontSize: 12 }}>V</Text></Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    header: {
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: CREAM,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 11, fontWeight: '700' },
    scroll: { flex: 1, padding: 16 },
    cardDark: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    label: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    opName: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
    row: { flexDirection: 'row', marginTop: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cell: { flex: 1, padding: 10 },
    cellLabel: { fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    cellVal: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
});
