import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Image,
} from 'react-native';
import Svg, { Ellipse, Rect, Path, Text as SvgText, Circle } from 'react-native-svg';
import { useTelematicsContext } from '../_layout';
import { useRouter } from 'expo-router';
import { Shield, FileSearch } from 'lucide-react-native';

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
    const sig = p?.signalStrength ?? 0;
    const fix = p?.fixStatus === 1;
    const oper = p?.operator ?? 'Airtel';
    const frame = p?.frameNumber ?? '--';
    const lat = p?.latitude?.toFixed(5) ?? '--';
    const lon = p?.longitude?.toFixed(5) ?? '--';
    const imei = p?.imei ?? '887744556677882';
    const voltPct = Math.min(100, (volt / 5) * 100);
    const voltColor = volt < 2 ? '#ef4444' : volt < 3.5 ? '#f59e0b' : LIME;
    const bars = sig >= 25 ? 4 : sig >= 18 ? 3 : sig >= 10 ? 2 : sig >= 4 ? 1 : 0;

    const scooterY = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, 60], extrapolate: 'clamp' });
    const scooterScale = scrollY.interpolate({ inputRange: [0, 200], outputRange: [1, 1.1], extrapolate: 'clamp' });
    const scooterOpacity = scrollY.interpolate({ inputRange: [0, 180], outputRange: [1, 0.3], extrapolate: 'clamp' });

    return (
        <View style={S.root}>
            {/* Sticky header */}
            <View style={S.header}>
                <View>
                    <Text style={S.headerSub}>Smart Telematics</Text>
                    <Text style={S.headerTitle}>VAJRA <Text style={S.headerGray}>Fleet</Text></Text>
                </View>
                <View style={S.headerRight}>
                    {/* Signal bars */}
                    <View style={S.signalWrap}>
                        {[4, 7, 11, 16].map((h, i) => (
                            <View key={i} style={[S.sigBar, { height: h, backgroundColor: i < bars ? LIME : '#ddd' }]} />
                        ))}
                    </View>
                    <View style={S.livePill}>
                        <View style={S.liveDot} />
                        <Text style={S.liveText}>LIVE</Text>
                    </View>
                </View>
            </View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={S.hero}>
                    <View style={S.heroTitleWrap}>
                        <Text style={S.heroTitle}>VAJRA-1</Text>
                        <Text style={S.heroSub}>ESP32 Smart Telematics · ···{String(imei).slice(-6)}</Text>
                    </View>
                    <Animated.View style={[S.scooterWrap, { transform: [{ translateY: scooterY }, { scale: scooterScale }], opacity: scooterOpacity }]}>
                        {/* Glow */}
                        <View style={[S.glowRing, { borderColor: immob ? 'rgba(239,68,68,0.3)' : 'rgba(184,232,64,0.3)' }]} />
                        <Image
                            source={require('../../assets/scooter_top.png')}
                            style={{ width: 180, height: 280, resizeMode: 'contain' }}
                        />
                    </Animated.View>
                    {/* Status badges */}
                    <View style={S.badgeRow}>
                        <View style={[S.badge, { backgroundColor: ign ? '#1a1a1a' : '#e8e2da' }]}>
                            <View style={[S.badgeDot, { backgroundColor: ign ? LIME : '#bbb' }]} />
                            <Text style={[S.badgeText, { color: ign ? LIME : '#999' }]}>IGN {ign ? 'ON' : 'OFF'}</Text>
                        </View>
                        <View style={[S.badge, { backgroundColor: immob ? '#ef4444' : '#1a1a1a' }]}>
                            <Text style={[S.badgeText, { color: 'white' }]}>🔒 {immob ? 'IMMOB' : 'READY'}</Text>
                        </View>
                        <View style={[S.badge, { backgroundColor: LIME }]}>
                            <Text style={[S.badgeText, { color: '#1a1a1a' }]}>{speed.toFixed(0)} km/h</Text>
                        </View>
                    </View>
                </View>

                {/* Cards */}
                <View style={S.cards}>

                    {/* DI + DO */}
                    <View style={S.row2}>
                        <View style={[S.cardDark, { flex: 1 }]}>
                            <Text style={S.cardLabel}>Digital Input</Text>
                            <Text style={[S.cardBig, { color: ign ? LIME : '#3a3a3a' }]}>{ign ? 'ON' : 'OFF'}</Text>
                            <Text style={S.cardSub}>Ignition Signal</Text>
                            <Text style={S.mono}>DI1 = {ign ? 'HIGH (1)' : 'LOW (0)'}</Text>
                        </View>
                        <View style={[S.cardDark, { flex: 1, backgroundColor: immob ? '#ef4444' : DARK }]}>
                            <Text style={[S.cardLabel, { color: immob ? 'rgba(255,255,255,0.6)' : '#555' }]}>Digital Output</Text>
                            <Text style={[S.cardBig, { color: immob ? 'white' : '#3a3a3a' }]}>{immob ? 'ON' : 'OFF'}</Text>
                            <Text style={[S.cardSub, { color: immob ? 'rgba(255,255,255,0.7)' : '#666' }]}>Immobilizer</Text>
                            <Text style={[S.mono, { color: immob ? 'rgba(255,255,255,0.6)' : '#444' }]}>DO1 = {immob ? 'HIGH (1)' : 'LOW (0)'}</Text>
                        </View>
                    </View>

                    {/* Voltage card */}
                    <View style={S.cardDark}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={S.cardLabel}>Analog Input (AI) — 0–5V</Text>
                                <Text style={[S.voltBig, { color: voltColor }]}>{volt.toFixed(1)} <Text style={{ fontSize: 18, color: '#444', fontWeight: '500' }}>V</Text></Text>
                                <View style={S.voltTrack}>
                                    <View style={[S.voltFill, { width: `${voltPct}%`, backgroundColor: voltColor }]} />
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                    <Text style={S.axisLabel}>0V</Text><Text style={S.axisLabel}>5V</Text>
                                </View>
                            </View>
                            {/* Vertical battery bar */}
                            <View style={S.battWrap}>
                                <Text style={[S.battPct, { color: voltColor }]}>{voltPct.toFixed(0)}%</Text>
                                <View style={S.battNub} />
                                <View style={S.battOuter}>
                                    <View style={[S.battFill, { height: `${voltPct}%`, backgroundColor: voltColor }]} />
                                </View>
                                <Text style={S.battLabel}>AI1</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info trio */}
                    <View style={S.row3}>
                        {[
                            { label: 'Operator', val: oper, icon: '📡' },
                            { label: 'GPS Fix', val: fix ? 'FIXED' : 'NO FIX', icon: '🛰️', c: fix ? LIME : '#ef4444' },
                            { label: 'Frame', val: `#${frame}`, icon: '📦', c: '#888' },
                        ].map(({ label, val, icon, c }) => (
                            <View key={label} style={[S.cardLight, { flex: 1 }]}>
                                <Text style={{ fontSize: 20, marginBottom: 6 }}>{icon}</Text>
                                <Text style={[S.cardBigSm, { color: c ?? '#1a1a1a' }]}>{val}</Text>
                                <Text style={S.miniLabel}>{label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Location card */}
                    <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(tabs)/map')} style={S.cardDark}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={S.cardLabel}>📍 Location</Text>
                                <Text style={[S.mono, { color: LIME, fontSize: 14, marginTop: 6 }]}>{lat}° N</Text>
                                <Text style={[S.mono, { color: LIME, fontSize: 14, marginTop: 4 }]}>{lon}° E</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={S.cardLabel}>SPEED</Text>
                                <Text style={[S.cardBig, { color: 'white', fontSize: 42 }]}>{speed.toFixed(0)}</Text>
                                <Text style={S.cardSub}>km/h</Text>
                            </View>
                        </View>
                        <View style={S.divider} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                {[['HDOP', p?.hdop?.toFixed(2) ?? '1.20'], ['PDOP', p?.pdop?.toFixed(2) ?? '1.80']].map(([k, v]) => (
                                    <View key={k}>
                                        <Text style={S.miniLabel}>{k}</Text>
                                        <Text style={[S.cardSub, { fontWeight: '700' }]}>{v}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={[S.cardSub, { color: LIME, fontWeight: '800' }]}>View Map →</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Action buttons */}
                    <View style={S.row2}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/control')} activeOpacity={0.8}
                            style={[S.actionBtn, { backgroundColor: immob ? '#ef4444' : LIME, flex: 1 }]}>
                            <Shield size={20} color={immob ? 'white' : '#1a1a1a'} />
                            <Text style={[S.actionText, { color: immob ? 'white' : '#1a1a1a' }]}>Control</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/packet')} activeOpacity={0.8}
                            style={[S.actionBtn, { backgroundColor: 'white', flex: 1 }]}>
                            <FileSearch size={20} color="#1a1a1a" />
                            <Text style={[S.actionText, { color: '#1a1a1a' }]}>Packets</Text>
                        </TouchableOpacity>
                    </View>

                    {/* UTC time */}
                    <View style={S.cardLight}>
                        <Text style={S.cardLabel}>🕐 UTC Timestamp</Text>
                        <Text style={[S.mono, { color: '#666', fontSize: 11, marginTop: 4 }]}>
                            {p?.dateTimeFormatted?.slice(0, 28) ?? new Date().toUTCString()}
                        </Text>
                    </View>
                    <View style={{ height: 16 }} />
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    header: {
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
        backgroundColor: CREAM, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
    },
    headerSub: { fontSize: 10, color: '#aaa', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5, marginTop: 2 },
    headerGray: { color: '#bbb', fontWeight: '400' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    signalWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 17 },
    sigBar: { width: 4, borderRadius: 2 },
    livePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIME },
    liveText: { fontSize: 10, fontWeight: '800', color: LIME, letterSpacing: 0.5 },
    hero: { backgroundColor: '#EAE4DC', paddingHorizontal: 24, paddingTop: 8, alignItems: 'center', minHeight: 320 },
    heroTitleWrap: { alignSelf: 'flex-start', marginBottom: 8 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.6 },
    heroSub: { fontSize: 12, color: '#999', marginTop: 2 },
    scooterWrap: { width: 170, alignItems: 'center', position: 'relative', marginBottom: 8 },
    glowRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, top: 20, alignSelf: 'center' },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7, gap: 6 },
    badgeDot: { width: 7, height: 7, borderRadius: 4 },
    badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    cards: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
    row2: { flexDirection: 'row', gap: 10 },
    row3: { flexDirection: 'row', gap: 8 },
    cardDark: { backgroundColor: DARK, borderRadius: 22, padding: 18, gap: 4 },
    cardLight: { backgroundColor: 'white', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    cardLabel: { fontSize: 10, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    cardBig: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
    cardBigSm: { fontSize: 13, fontWeight: '900', lineHeight: 16 },
    cardSub: { fontSize: 11, color: '#666', marginTop: 2 },
    mono: { fontFamily: 'Courier', fontSize: 10, color: '#444', marginTop: 2 },
    voltBig: { fontSize: 40, fontWeight: '900', letterSpacing: -1, lineHeight: 46 },
    voltTrack: { backgroundColor: '#2a2a2a', borderRadius: 8, height: 10, marginTop: 12, overflow: 'hidden' },
    voltFill: { height: '100%', borderRadius: 8 },
    axisLabel: { fontSize: 9, color: '#444' },
    battWrap: { alignItems: 'center', gap: 4, marginLeft: 16 },
    battPct: { fontSize: 13, fontWeight: '900' },
    battNub: { width: 16, height: 5, backgroundColor: '#444', borderRadius: 4 },
    battOuter: { width: 32, height: 80, backgroundColor: '#2a2a2a', borderRadius: 8, overflow: 'hidden', borderWidth: 1.5, borderColor: '#3a3a3a', justifyContent: 'flex-end' },
    battFill: { width: '100%', borderRadius: 6 },
    battLabel: { fontSize: 9, color: '#555', fontWeight: '700' },
    miniLabel: { fontSize: 9, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
    divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    actionText: { fontSize: 14, fontWeight: '800' },
});
