import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Image,
} from 'react-native';
import Svg, { Ellipse, Rect, Path, Text as SvgText, Circle } from 'react-native-svg';
import { useTelematicsContext } from '../_layout';
import { useRouter } from 'expo-router';
import { Shield, FileSearch, Map, User } from 'lucide-react-native';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

// Side-scooter design implemented with high-res Image

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
                {/* Hero Card: "Chong" Luxury Section */}
                <View style={S.heroCard}>
                    <View style={S.chongHeader}>
                        <Text style={S.chongText}>Chong</Text>
                        <View style={S.premiumBadge}>
                            <Text style={S.premiumText}>PREMIUM</Text>
                        </View>
                    </View>
                    <View style={S.imageContainer}>
                        <View style={S.scooterGlow} />
                        <Image
                            source={require('../../assets/scooter_side.png')}
                            style={S.scooterImage}
                        />
                    </View>
                    <View style={S.chongFooter}>
                        <Text style={S.scooterModel}>GTS Super 300</Text>
                        <Text style={S.scooterStatus}>System v2.4 Active</Text>
                    </View>
                </View>

                {/* Grid Row: Charging Station + Battery */}
                <View style={S.gridRow}>
                    {/* Charging Station Card - Interactive Glass Look */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/(tabs)/map')}
                        style={S.chargingCard}
                    >
                        <View style={S.cardHeader}>
                            <Text style={S.cardTitle}>Charging{"\n"}Station</Text>
                            <Map color={DARK} size={24} strokeWidth={2.5} />
                        </View>
                        <View style={S.stationBox}>
                            <View style={S.innerBox}>
                                <Text style={S.distLabel}>2.4 km</Text>
                            </View>
                        </View>
                        <Text style={S.cardHint}>Navigate Now →</Text>
                    </TouchableOpacity>

                    {/* Battery Vertical Indicator - Sleek Design */}
                    <View style={S.batteryCard}>
                        <View style={S.cardHeader}>
                            <Text style={S.cardTitle}>Battery{"\n"}Status</Text>
                            <User size={20} color="#999" />
                        </View>
                        <View style={S.battContainer}>
                            <View style={S.battOuter}>
                                <Animated.View style={[S.battFill, { height: `${voltPct}%`, backgroundColor: voltColor }]} />
                            </View>
                            <View style={S.battLabelSide}>
                                <Text style={[S.battPctText, { color: DARK }]}>{voltPct.toFixed(0)}%</Text>
                                <Text style={[S.battStatus, { color: voltColor }]}>{ign ? 'DRIVING' : 'STATIONARY'}</Text>
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
    profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
    profilePlaceholder: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.02)' },
    scrollContent: { paddingHorizontal: 24 },

    // Chong Premium Card
    heroCard: {
        backgroundColor: '#fff', borderRadius: 36, padding: 24, height: SCREEN_HEIGHT * 0.4,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 30, elevation: 8,
        marginBottom: 20, overflow: 'hidden',
    },
    chongHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chongText: { fontSize: 38, fontWeight: '900', color: DARK, letterSpacing: -1.5 },
    premiumBadge: { backgroundColor: DARK, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    premiumText: { color: LIME, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    scooterGlow: { position: 'absolute', width: 220, height: 140, backgroundColor: LIME, borderRadius: 100, opacity: 0.15, transform: [{ scale: 1.2 }], filter: 'blur(40px)' },
    scooterImage: { width: '110%', height: '90%', resizeMode: 'contain', zIndex: 2 },
    chongFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    scooterModel: { fontSize: 14, fontWeight: '800', color: '#333' },
    scooterStatus: { fontSize: 11, fontWeight: '600', color: LIME, backgroundColor: DARK, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 20, height: SCREEN_HEIGHT * 0.28 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },

    chargingCard: {
        flex: 1, backgroundColor: LIME, borderRadius: 32, padding: 20,
        justifyContent: 'space-between', shadowColor: LIME, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5,
    },
    cardTitle: { fontSize: 17, fontWeight: '900', color: DARK, lineHeight: 20, letterSpacing: -0.5 },
    stationBox: { width: '100%', height: 60, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
    innerBox: { backgroundColor: DARK, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    distLabel: { color: LIME, fontSize: 12, fontWeight: '900' },
    cardHint: { fontSize: 11, color: DARK, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    batteryCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 32, padding: 20,
        justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
    },
    battContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, flex: 1, marginTop: 10 },
    battOuter: { width: 24, height: '85%', backgroundColor: '#f5f5f5', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', justifyContent: 'flex-end' },
    battFill: { width: '100%', borderRadius: 8 },
    battLabelSide: { flex: 1, paddingBottom: 5 },
    battPctText: { fontSize: 26, fontWeight: '900', color: DARK, letterSpacing: -1 },
    battStatus: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    statusSection: { backgroundColor: '#fff', borderRadius: 32, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
    statusLabel: { fontSize: 15, fontWeight: '800', color: DARK },
    statusSub: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 2 },
    toggleWrap: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 100, padding: 4, alignItems: 'center' },
    toggleLabel: { fontSize: 10, fontWeight: '900', color: '#ccc', paddingHorizontal: 14, paddingVertical: 8 },
    toggleDivider: { width: 1, height: 12, backgroundColor: '#eee' },
    toggleActive: { color: DARK, backgroundColor: LIME, borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    toggleActiveRed: { color: '#fff', backgroundColor: '#ef4444', borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },

    actionRow: { flexDirection: 'row', gap: 12 },
    quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    quickBtnText: { color: LIME, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
