import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Image,
} from 'react-native';
import Svg, { Ellipse, Rect, Path, Text as SvgText, Circle } from 'react-native-svg';
import { useTelematicsContext } from '../_layout';
import { useRouter } from 'expo-router';
import { Shield, FileSearch, Map, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

function EVScooterSVG({ immob }) {
    return (
        <Svg viewBox="0 0 160 360" width={160} height={280}>
            {/* Rear wheel */}
            <Ellipse cx="80" cy="332" rx="26" ry="14" fill="#1a1a1a" />
            <Ellipse cx="80" cy="332" rx="16" ry="8" fill="#2e2e2e" />
            <Ellipse cx="80" cy="332" rx="7" ry="4" fill="#444" />
            {/* Body rear */}
            <Path d="M54 308 Q50 275 48 222 L112 222 Q110 275 106 308 Z" fill="#C0C0B4" />
            {/* Main body */}
            <Rect x="44" y="100" width="72" height="132" rx="22" fill="#D4D4C8" />
            {/* Body highlight */}
            <Rect x="74" y="108" width="10" height="116" rx="5" fill="rgba(255,255,255,0.28)" />
            {/* Seat */}
            <Rect x="52" y="188" width="56" height="66" rx="14" fill="#AAAAA0" />
            <Rect x="58" y="196" width="44" height="50" rx="10" fill="#989890" />
            {/* Footrest */}
            <Rect x="36" y="152" width="88" height="44" rx="12" fill="#C6C6BA" />
            {/* EV label */}
            <SvgText x="80" y="178" fontSize="18" textAnchor="middle" fill={LIME}>⚡</SvgText>
            {/* Frame neck */}
            <Rect x="62" y="74" width="36" height="34" rx="11" fill="#CACABE" />
            {/* Handlebar */}
            <Rect x="72" y="54" width="16" height="26" rx="5" fill="#999" />
            <Rect x="24" y="48" width="112" height="13" rx="6" fill="#5a5a5a" />
            {/* Left grip — red if immob */}
            <Rect x="16" y="45" width="18" height="20" rx="7" fill={immob ? '#ef4444' : '#3a3a3a'} />
            <Rect x="126" y="45" width="18" height="20" rx="7" fill="#3a3a3a" />
            {/* Front fork */}
            <Rect x="68" y="22" width="24" height="32" rx="6" fill="#B0B0A8" />
            {/* Front wheel */}
            <Ellipse cx="80" cy="18" rx="26" ry="14" fill="#1a1a1a" />
            <Ellipse cx="80" cy="18" rx="16" ry="8" fill="#2e2e2e" />
            <Ellipse cx="80" cy="18" rx="7" ry="4" fill="#444" />
            {/* Headlight */}
            <Ellipse cx="80" cy="8" rx="13" ry="7" fill={LIME} />
            <Ellipse cx="80" cy="8" rx="8" ry="4" fill="rgba(255,255,255,0.7)" />
            {/* Brake light */}
            <Ellipse cx="80" cy="322" rx="10" ry="4" fill={immob ? '#ef4444' : '#f87171'} />
            <Circle cx="58" cy="314" r="4" fill={immob ? '#ef4444' : '#f87171'} />
            <Circle cx="102" cy="314" r="4" fill={immob ? '#ef4444' : '#f87171'} />
        </Svg>
    );
}

export default function Dashboard() {
    const ctx = useTelematicsContext();
    const router = useRouter();
    const scrollY = useRef(new Animated.Value(0)).current;

    const p = ctx?.latestPacket;
    const speed = p?.speed ?? 0;
    const ign = p?.ignitionStatus === 1;
    const immob = ctx?.immobActive ?? false;
    const volt = p?.analogVoltage ?? 0;
    const voltPct = Math.min(100, (volt / 5) * 100);
    const voltColor = volt < 2 ? '#ef4444' : volt < 3.5 ? '#f59e0b' : LIME;

    return (
        <View style={S.root}>
            {/* Header: Hello [User] + Profile Icon */}
            <View style={S.header}>
                <View>
                    <Text style={S.headerSub}>Hello,</Text>
                    <Text style={S.headerTitle}>Vajra Driver</Text>
                </View>
                <View style={S.profileCircle}>
                    <User size={32} color={DARK} style={{ alignSelf: 'center', marginTop: 10 }} />
                    <View style={S.profilePlaceholder} />
                </View>
            </View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={S.scrollContent}
            >
                {/* Hero Card: "Chong" + Side Scooter Image */}
                <View style={S.heroCard}>
                    <Text style={S.chongText}>Chong</Text>
                    <Image
                        source={require('../../assets/scooter_side.png')}
                        style={S.scooterImage}
                    />
                </View>

                {/* Grid Row: Charging Station + Battery */}
                <View style={S.gridRow}>
                    {/* Charging Station Card */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/(tabs)/map')}
                        style={S.chargingCard}
                    >
                        <Text style={S.cardTitle}>Charging{"\n"}Station</Text>
                        <View style={S.stationBox}>
                            <Map color={DARK} size={30} strokeWidth={1.5} />
                        </View>
                        <Text style={S.cardHint}>Find nearest</Text>
                    </TouchableOpacity>

                    {/* Battery Vertical Indicator */}
                    <View style={S.batteryCard}>
                        <Text style={S.cardTitle}>Battery</Text>
                        <View style={S.battContainer}>
                            <View style={S.battOuter}>
                                <View style={[S.battFill, { height: `${voltPct}%`, backgroundColor: voltColor }]} />
                            </View>
                            <View style={S.battLabelSide}>
                                <Text style={[S.battPctText, { color: voltColor }]}>{voltPct.toFixed(0)}%</Text>
                                <Text style={S.battStatus}>{ign ? 'Discharging' : 'Standby'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Status Toggles Section */}
                <View style={S.statusSection}>
                    <View style={S.statusRow}>
                        <View>
                            <Text style={S.statusLabel}>Ignition Signal</Text>
                            <Text style={S.statusSub}>Digital Input (DI1)</Text>
                        </View>
                        <View style={S.toggleWrap}>
                            <Text style={[S.toggleLabel, ign && S.toggleActive]}>ON</Text>
                            <View style={S.toggleDivider} />
                            <Text style={[S.toggleLabel, !ign && S.toggleActiveRed]}>OFF</Text>
                        </View>
                    </View>

                    <View style={S.statusRow}>
                        <View>
                            <Text style={S.statusLabel}>Immobilizer</Text>
                            <Text style={S.statusSub}>Digital Output (DO1)</Text>
                        </View>
                        <View style={S.toggleWrap}>
                            <Text style={[S.toggleLabel, immob && S.toggleActiveRed]}>ON</Text>
                            <View style={S.toggleDivider} />
                            <Text style={[S.toggleLabel, !immob && S.toggleActive]}>OFF</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={S.actionRow}>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/control')}
                        style={[S.quickBtn, { backgroundColor: DARK }]}
                    >
                        <Shield color={LIME} size={18} />
                        <Text style={S.quickBtnText}>Control</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/packet')}
                        style={[S.quickBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' }]}
                    >
                        <FileSearch color={DARK} size={18} />
                        <Text style={[S.quickBtnText, { color: DARK }]}>Packet</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    header: {
        paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerSub: { fontSize: 13, color: '#999', fontWeight: '600' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: DARK },
    profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ddd', overflow: 'hidden', position: 'relative' },
    profilePlaceholder: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.05)' },
    scrollContent: { paddingHorizontal: 24 },
    heroCard: {
        backgroundColor: '#fff', borderRadius: 32, padding: 24, height: SCREEN_HEIGHT * 0.38,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
        marginBottom: 20, overflow: 'hidden', justifyContent: 'space-between',
    },
    chongText: { fontSize: 36, fontWeight: '800', color: DARK, letterSpacing: -1 },
    scooterImage: { width: '100%', height: '70%', resizeMode: 'contain', marginTop: 10 },
    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 20, height: SCREEN_HEIGHT * 0.32 },
    chargingCard: {
        flex: 1, backgroundColor: LIME, borderRadius: 28, padding: 24,
        justifyContent: 'space-between',
    },
    cardTitle: { fontSize: 18, fontWeight: '800', color: DARK, lineHeight: 22 },
    stationBox: { width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
    cardHint: { fontSize: 12, color: DARK, opacity: 0.6, fontWeight: '600' },
    batteryCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 28, padding: 24,
        justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    },
    battContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, flex: 1, marginTop: 10 },
    battOuter: { width: 28, height: '90%', backgroundColor: '#f0f0f0', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', justifyContent: 'flex-end' },
    battFill: { width: '100%', borderRadius: 6 },
    battLabelSide: { flex: 1, paddingBottom: 5 },
    battPctText: { fontSize: 24, fontWeight: '900' },
    battStatus: { fontSize: 9, color: '#999', fontWeight: '700', textTransform: 'uppercase' },
    statusSection: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 20 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    statusLabel: { fontSize: 14, fontWeight: '800', color: DARK },
    statusSub: { fontSize: 10, color: '#aaa', fontWeight: '500', marginTop: 2 },
    toggleWrap: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 100, padding: 4, alignItems: 'center' },
    toggleLabel: { fontSize: 10, fontWeight: '800', color: '#bbb', paddingHorizontal: 12, paddingVertical: 6 },
    toggleDivider: { width: 1, height: 10, backgroundColor: '#ddd' },
    toggleActive: { color: DARK, backgroundColor: LIME, borderRadius: 100 },
    toggleActiveRed: { color: '#fff', backgroundColor: '#ef4444', borderRadius: 100 },
    actionRow: { flexDirection: 'row', gap: 12 },
    quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 100 },
    quickBtnText: { color: LIME, fontSize: 15, fontWeight: '800' },
});
