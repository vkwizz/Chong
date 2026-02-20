import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTelematicsContext } from '../_layout';

const { width } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

export default function AnalyticsScreen() {
    const ctx = useTelematicsContext();
    const history = ctx?.voltageHistory ?? [];
    const pHistory = ctx?.packetHistory ?? [];

    const voltages = history.length > 0 ? history.map(h => h.v) : [0];
    const labels = history.length > 0
        ? history.filter((_, i) => i % Math.max(1, Math.floor(history.length / 6)) === 0).map(h => h.t.slice(0, 5))
        : ['--'];

    const min = Math.min(...voltages).toFixed(2);
    const max = Math.max(...voltages).toFixed(2);
    const avg = history.length > 0 ? (voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(2) : '0.00';
    const latest = voltages[voltages.length - 1]?.toFixed(1) ?? '0.0';
    const voltColor = parseFloat(latest) < 2 ? '#ef4444' : parseFloat(latest) < 3.5 ? '#f59e0b' : LIME;

    return (
        <View style={S.root}>
            <View style={S.header}>
                <Text style={S.headerTitle}>📊 Analytics</Text>
                <View style={S.pill}>
                    <View style={[S.dot, { backgroundColor: LIME }]} />
                    <Text style={S.pillText}>{pHistory.length} frames</Text>
                </View>
            </View>

            <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

                {/* Voltage big display */}
                <View style={[S.voltCard, { backgroundColor: 'white' }]}>
                    <Text style={S.voltLabel}>Current Analog Input (AI1)</Text>
                    <Text style={[S.voltBig, { color: voltColor }]}>{latest} <Text style={{ fontSize: 20, color: '#444', fontWeight: '400' }}>V</Text></Text>
                    <Text style={S.voltSub}>0–5V range · ÷10 encoding</Text>
                </View>

                {/* Stats grid */}
                <View style={S.statsRow}>
                    {[['MIN', min + ' V', '#3b82f6'], ['AVG', avg + ' V', LIME], ['MAX', max + ' V', '#ef4444']].map(([label, val, c]) => (
                        <View key={label} style={[S.statCard, { flex: 1, backgroundColor: 'white' }]}>
                            <Text style={[S.statLabel, { color: c }]}>{label}</Text>
                            <Text style={[S.statVal, { color: '#1a1a1a' }]}>{val}</Text>
                        </View>
                    ))}
                </View>

                {/* Chart */}
                <View style={S.chartCard}>
                    <Text style={S.chartTitle}>Voltage Trend (last {history.length} readings)</Text>
                    {history.length > 1 ? (
                        <LineChart
                            data={{
                                labels,
                                datasets: [{ data: voltages, color: () => LIME, strokeWidth: 2 }],
                            }}
                            width={width - 64}
                            height={200}
                            yAxisSuffix="V"
                            yAxisInterval={1}
                            chartConfig={{
                                backgroundColor: DARK,
                                backgroundGradientFrom: DARK,
                                backgroundGradientTo: '#111',
                                decimalPlaces: 1,
                                color: () => LIME,
                                labelColor: () => '#555',
                                style: { borderRadius: 16 },
                                propsForDots: { r: '4', strokeWidth: '1', stroke: LIME },
                                fillShadowGradient: LIME,
                                fillShadowGradientOpacity: 0.15,
                            }}
                            bezier
                            style={{ borderRadius: 16 }}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    ) : (
                        <View style={S.chartPlaceholder}>
                            <Text style={{ color: '#555' }}>Collecting data... ({history.length}/2 needed)</Text>
                        </View>
                    )}
                </View>

                {/* Packet log */}
                <View style={[S.logCard, { backgroundColor: 'white' }]}>
                    <Text style={S.chartTitle}>Recent Packets</Text>
                    {pHistory.slice(0, 10).map((p, i) => (
                        <View key={i} style={S.logRow}>
                            <Text style={S.logFrame}>#{p.frameNumber}</Text>
                            <Text style={S.logVolt}>{p.analogVoltage?.toFixed(1)}V</Text>
                            <Text style={S.logSpeed}>{p.speed?.toFixed(0)} km/h</Text>
                            <Text style={S.logTime}>{p.dateTimeFormatted?.slice(17, 25) ?? '--:--:--'}</Text>
                        </View>
                    ))}
                    {pHistory.length === 0 && <Text style={{ color: '#555', fontSize: 13 }}>No packets yet...</Text>}
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
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(184,232,64,0.1)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 11, fontWeight: '700', color: LIME },
    scroll: { flex: 1, padding: 16 },
    voltCard: { backgroundColor: DARK, borderRadius: 22, padding: 20, marginBottom: 12 },
    voltLabel: { fontSize: 10, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    voltBig: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
    voltSub: { fontSize: 12, color: '#444', marginTop: 6 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statCard: { backgroundColor: DARK, borderRadius: 18, padding: 16 },
    statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
    statVal: { fontSize: 20, fontWeight: '900', color: 'white' },
    chartCard: { backgroundColor: DARK, borderRadius: 22, padding: 16, marginBottom: 12 },
    chartTitle: { fontSize: 13, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
    chartPlaceholder: { height: 100, alignItems: 'center', justifyContent: 'center' },
    logCard: { backgroundColor: DARK, borderRadius: 22, padding: 18 },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
    logFrame: { color: '#bbb', fontFamily: 'Courier', fontSize: 11, width: 42 },
    logVolt: { color: LIME, fontFamily: 'Courier', fontSize: 12, fontWeight: '700', width: 42 },
    logSpeed: { color: '#888', fontFamily: 'Courier', fontSize: 11, width: 56 },
    logTime: { color: '#aaa', fontFamily: 'Courier', fontSize: 11, textAlign: 'right' },
});

