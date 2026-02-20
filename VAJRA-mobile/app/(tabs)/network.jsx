import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTelematicsContext } from '../_layout';
import { CELLULAR_INFO } from '../../src/utils/dataSimulator';

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
                <View style={[SM.fill, { width: `${pct}%`, backgroundColor: color, shadowColor: color }]} />
            </View>
            <Text style={[SM.label, { color }]}>{pct >= 70 ? 'Excellent' : pct >= 40 ? 'Good' : 'Weak'}</Text>
            {/* Bar segments */}
            <View style={SM.bars}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[SM.bar, { height: 8 + i * 4, backgroundColor: i < Math.round(value / 4) ? color : '#eee' }]} />
                ))}
            </View>
        </View>
    );
}

const SM = StyleSheet.create({
    wrap: { alignItems: 'center', gap: 8 },
    val: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
    track: { width: '100%', height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 4 },
    bar: { width: 10, borderRadius: 3 },
});

export default function NetworkScreen() {
    const ctx = useTelematicsContext();
    const p = ctx?.latestPacket;
    const oper = p?.operator ?? 'Airtel';
    const sig = p?.signalStrength ?? CELLULAR_INFO.signalStrength;
    const mcc = p?.mcc ?? CELLULAR_INFO.mcc;
    const mnc = p?.mnc ?? CELLULAR_INFO.mnc;
    const fix = p?.fixStatus === 1;
    const lat = p?.latitude?.toFixed(6) ?? '--';
    const lon = p?.longitude?.toFixed(6) ?? '--';
    const imei = p?.imei ?? CELLULAR_INFO.imei;
    const ts = p?.dateTimeFormatted ?? new Date().toUTCString();
    const mqtt = ctx?.mqttStatus ?? 'simulated';
    const mqttColor = mqtt === 'connected' ? LIME : mqtt === 'connecting' ? '#f59e0b' : '#999';

    return (
        <View style={S.root}>
            <View style={S.header}>
                <Text style={S.headerTitle}>📡 Network</Text>
                <View style={[S.pill, { backgroundColor: mqttColor + '18' }]}>
                    <View style={[S.dot, { backgroundColor: mqttColor }]} />
                    <Text style={[S.pillText, { color: mqttColor }]}>{mqtt.toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

                {/* Operator card */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>Cellular Network</Text>
                    <Text style={[S.opName, { color: '#1a1a1a' }]}>{oper}</Text>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>MCC</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>{mcc}</Text></View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>MNC</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>{mnc}</Text>
                        </View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>Standard</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>GSM/LTE</Text>
                        </View>
                    </View>
                </View>

                {/* Signal card */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>Signal Strength (RSSI)</Text>
                    <SignalMeter value={sig} />
                </View>

                {/* GPS card */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <View style={S.rowBetween}>
                        <Text style={S.label}>GPS / GNSS</Text>
                        <View style={[S.pill, { backgroundColor: fix ? 'rgba(184,232,64,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                            <View style={[S.dot, { backgroundColor: fix ? LIME : '#ef4444' }]} />
                            <Text style={[S.pillText, { color: fix ? LIME : '#ef4444' }]}>{fix ? 'FIXED' : 'NO FIX'}</Text>
                        </View>
                    </View>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>Latitude</Text><Text style={[S.cellVal, { color: LIME, fontFamily: 'Courier' }]}>{lat}°N</Text></View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>Longitude</Text><Text style={[S.cellVal, { color: LIME, fontFamily: 'Courier' }]}>{lon}°E</Text>
                        </View>
                    </View>
                    <View style={S.row}>
                        <View style={S.cell}><Text style={S.cellLabel}>HDOP</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>{p?.hdop?.toFixed(2) ?? '1.20'}</Text></View>
                        <View style={[S.cell, { borderLeftWidth: 1, borderLeftColor: '#f2f2f2' }]}>
                            <Text style={S.cellLabel}>PDOP</Text><Text style={[S.cellVal, { color: '#1a1a1a' }]}>{p?.pdop?.toFixed(2) ?? '1.80'}</Text>
                        </View>
                    </View>
                </View>

                {/* Device info */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>Device Identity</Text>
                    {[
                        ['IMEI', imei],
                        ['Protocol', 'MQTTS over WSS'],
                        ['Broker', 'HiveMQ Cloud'],
                        ['Port', '8884 (WSS/TLS)'],
                        ['Topic sub', '…/data'],
                        ['Topic pub', '…/control'],
                    ].map(([k, v]) => (
                        <View key={k} style={S.tableRow}>
                            <Text style={S.tableKey}>{k}</Text>
                            <Text style={[S.tableVal, { color: '#999' }]}>{v}</Text>
                        </View>
                    ))}
                </View>

                {/* Timestamp */}
                <View style={[S.cardDark, { backgroundColor: 'white' }]}>
                    <Text style={S.label}>UTC Timestamp</Text>
                    <Text style={[S.opName, { fontSize: 13, fontFamily: 'Courier', color: '#bbb' }]}>{ts}</Text>
                </View>
                <View style={{ height: 24 }} />
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
    cardDark: { backgroundColor: DARK, borderRadius: 22, padding: 18, marginBottom: 12, gap: 10 },
    label: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    opName: { fontSize: 28, fontWeight: '900', color: 'white' },
    row: { flexDirection: 'row', marginTop: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cell: { flex: 1, padding: 10 },
    cellLabel: { fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    cellVal: { fontSize: 15, fontWeight: '700', color: 'white' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
    tableKey: { fontSize: 11, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    tableVal: { fontSize: 12, color: '#888', fontFamily: 'Courier', textAlign: 'right', flex: 1, marginLeft: 10 },
});

