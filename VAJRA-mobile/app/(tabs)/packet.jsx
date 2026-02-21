import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTelematicsContext } from '../_layout';

const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

// Field definitions matching the real HiveMQ hardware packet format:
// $<datalen>,<IMEI>,<fixStatus>,<ignition>,<immob>,<field6>,<timestamp>[,<lat>,<lon>,<voltage>]*<CRC>
const FIELD_DEFS = [
    { key: 'dataLen', label: 'Data Length', section: 'header', color: '#f59e0b' },
    { key: 'imei', label: 'IMEI', section: 'header', color: '#f59e0b' },
    { key: 'fixStatus', label: 'Fix Status', section: 'data', color: '#10b981', hint: '1=Valid GPS fix, 0=No fix' },
    { key: 'ignitionStatus', label: 'Ignition (DI1)', section: 'data', color: '#8b5cf6', hint: '1=ON, 0=OFF' },
    { key: 'immobilizerStatus', label: 'Immobilizer (DO1)', section: 'data', color: '#ef4444', hint: '1=ACTIVE, 0=OFF' },
    { key: 'field6', label: 'Field 6', section: 'data', color: '#10b981' },
    { key: 'dateTime', label: 'Timestamp (Unix)', section: 'data', color: '#f59e0b' },
    { key: 'dateTimeFormatted', label: 'DateTime (UTC)', section: 'data', color: '#f59e0b' },
    { key: 'latitude', label: 'Latitude', section: 'data', color: LIME },
    { key: 'longitude', label: 'Longitude', section: 'data', color: LIME },
    { key: 'hasGps', label: 'GPS Present', section: 'data', color: LIME, hint: 'true when lat/lon present in packet' },
    { key: 'analogVoltage', label: 'Battery Charge (%)', section: 'data', color: '#f59e0b', hint: 'raw value used directly' },
    { key: 'crcValid', label: 'CRC Valid', section: 'tail', color: '#ef4444' },
];

export default function PacketScreen() {
    const ctx = useTelematicsContext();
    const p = ctx?.latestPacket;

    return (
        <View style={S.root}>
            <View style={S.header}>
                <View>
                    <Text style={S.headerTitle}>📦 Packet Viewer</Text>
                    {p && <Text style={S.headerSub}>IMEI {p.imei} · CRC {p.crcValid ? '✅ OK' : '❌ FAIL'}</Text>}
                </View>
            </View>

            <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

                {/* Raw packet */}
                <View style={S.rawCard}>
                    <Text style={S.rawLabel}>Raw Packet String</Text>
                    {p ? (
                        <Text style={S.mono} selectable>
                            <Text style={{ color: '#f59e0b' }}>$</Text>
                            <Text style={{ color: '#10b981' }}>{p.raw?.slice(1, p.raw.lastIndexOf('*')) ?? ''}</Text>
                            <Text style={{ color: '#8b5cf6' }}>*</Text>
                            <Text style={{ color: '#ef4444' }}>{p.raw?.slice(p.raw.lastIndexOf('*') + 1) ?? ''}</Text>
                        </Text>
                    ) : (
                        <Text style={[S.mono, { color: '#555' }]}>Waiting for packet...</Text>
                    )}
                </View>

                {/* Legend */}
                <View style={S.legendRow}>
                    {[['#f59e0b', 'Header'], ['#10b981', 'Data'], ['#8b5cf6', 'Tail'], ['#ef4444', 'CRC']].map(([c, l]) => (
                        <View key={l} style={S.legendItem}>
                            <View style={[S.legendDot, { backgroundColor: c }]} />
                            <Text style={S.legendText}>{l}</Text>
                        </View>
                    ))}
                </View>

                {/* Field table */}
                <View style={S.tableCard}>
                    <Text style={S.tableTitle}>Field Breakdown</Text>

                    {['header', 'data', 'tail'].map(section => (
                        <View key={section}>
                            <Text style={S.sectionLabel}>{section.toUpperCase()}</Text>
                            {FIELD_DEFS.filter(f => f.section === section).map(({ key, label, color, hint }) => {
                                let val = p?.[key];
                                if (key === 'crcValid') val = p?.crcValid ? 'VALID' : 'INVALID';
                                else if (key === 'hasGps') val = val ? 'YES' : 'NO';
                                else if (typeof val === 'number') val = key === 'analogVoltage' ? val.toFixed(2) + ' V' : val.toString();
                                else if (key === 'latitude' || key === 'longitude') val = val !== null && val !== undefined ? val.toFixed(6) : '--';
                                else if (val === undefined || val === null) val = '--';
                                return (
                                    <View key={key} style={S.fieldRow}>
                                        <View style={S.fieldLeft}>
                                            <View style={[S.fieldDot, { backgroundColor: color }]} />
                                            <View>
                                                <Text style={S.fieldLabel}>{label}</Text>
                                                {hint && <Text style={S.fieldHint}>{hint}</Text>}
                                            </View>
                                        </View>
                                        <Text style={[S.fieldVal, { color }]} selectable>{String(val)}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
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
    headerSub: { fontSize: 11, color: '#999', marginTop: 3, fontFamily: 'Courier' },
    scroll: { flex: 1, padding: 16 },
    rawCard: { backgroundColor: DARK, borderRadius: 18, padding: 16, marginBottom: 10 },
    rawLabel: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    mono: { fontFamily: 'Courier', fontSize: 11, lineHeight: 18, color: LIME },
    legendRow: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: '#777', fontWeight: '600' },
    tableCard: { backgroundColor: 'white', borderRadius: 18, padding: 16 },
    tableTitle: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
    sectionLabel: { fontSize: 9, color: '#bbb', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2', marginBottom: 4 },
    fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
    fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    fieldDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    fieldLabel: { fontSize: 12, color: '#1a1a1a', fontWeight: '600' },
    fieldHint: { fontSize: 9, color: '#999', marginTop: 2 },
    fieldVal: { fontSize: 12, fontFamily: 'Courier', fontWeight: '700', textAlign: 'right', maxWidth: 140 },
});

