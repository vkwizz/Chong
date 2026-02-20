import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Image,
} from 'react-native';
import WebView from 'react-native-webview';
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
                    <Text style={S.headerTitle}>VK</Text>
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
                            source={require('../../assets/scooter_side.jpeg')}
                            style={S.scooterImage}
                        />
                    </View>
                    <View style={S.chongFooter}>
                        <Text style={S.scooterModel}>GTS Super 300</Text>
                    </View>
                </View>

                {/* Grid Row: Charging Station + Battery */}
                <View style={S.gridRow}>
                    {/* Charging Station Card - Live Mini Map */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => router.push('/(tabs)/map')}
                        style={S.chargingCard}
                    >
                        <View style={S.cardHeader}>
                            <Text style={S.cardTitle}>Charging{"\n"}Station</Text>
                            <Map color={DARK} size={24} strokeWidth={2.5} />
                        </View>

                        <View style={S.miniMapWrapper}>
                            <WebView
                                pointerEvents="none"
                                scrollEnabled={false}
                                source={{
                                    html: `
                                    <html>
                                    <head>
                                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                        <style>
                                            * { margin:0; padding:0; }
                                            #map { width:100%; height:100%; background:#1c1c1e; }
                                            .leaflet-control-attribution { display:none !important; }
                                        </style>
                                    </head>
                                    <body>
                                        <div id="map"></div>
                                        <script>
                                            var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${p?.latitude || 12.9716}, ${p?.longitude || 77.5946}], 15);
                                            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
                                            L.circle([${p?.latitude || 12.9716}, ${p?.longitude || 77.5946}], { color: '#B8E840', fillColor: '#B8E840', fillOpacity: 0.6, radius: 100 }).addTo(map);
                                        </script>
                                    </body>
                                    </html>
                                `}}
                                style={S.miniMap}
                            />
                            <View style={S.mapOverlay}>
                                <View style={S.innerBox}>
                                    <Text style={S.distLabel}>NEAR BY</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={S.cardHint}>Open full map →</Text>
                    </TouchableOpacity>

                    {/* Battery Energy Card - Wavy Flow Effect */}
                    <View style={S.batteryCard}>
                        {/* The Wave Fill Background */}
                        <View style={S.waveBackground}>
                            <View style={[S.waveFill, { height: `${voltPct}%`, backgroundColor: 'rgba(184,232,64,0.15)' }]}>
                                <Svg height="24" width="150%" viewBox="0 0 100 20" style={S.waveSvg}>
                                    <Path
                                        d="M0 10 Q 25 20 50 10 T 100 10"
                                        fill="none"
                                        stroke="rgba(184,232,64,0.3)"
                                        strokeWidth="2"
                                    />
                                </Svg>
                            </View>
                        </View>

                        <Text style={S.battEnergyLabel}>Battery energy</Text>

                        <View style={S.battContent}>
                            <Image
                                source={require('../../assets/scooter_front.jpeg')}
                                style={S.battScooterImage}
                            />
                            <Text style={S.battPctHuge}>{voltPct.toFixed(0)}%</Text>
                        </View>

                        <Text style={S.powerSaveLabel}>{voltPct > 20 ? 'Standard mode' : 'Power saving mode'}</Text>
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
    miniMapWrapper: { width: '100%', height: 100, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(0,0,0,0.05)' },
    miniMap: { width: '100%', height: '100%', opacity: 0.8 },
    mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    innerBox: { backgroundColor: DARK, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
    distLabel: { color: LIME, fontSize: 12, fontWeight: '900' },
    cardHint: { fontSize: 11, color: DARK, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    batteryCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 32, padding: 20,
        justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
        position: 'relative', overflow: 'hidden',
    },
    waveBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end', zIndex: 0 },
    waveFill: { width: '100%', position: 'relative' },
    waveSvg: { position: 'absolute', top: -12, left: -20 },
    battEnergyLabel: { fontSize: 13, color: '#999', fontWeight: '800', textAlign: 'center', zIndex: 1 },
    battContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 1 },
    battScooterImage: { width: 80, height: 100, resizeMode: 'contain' },
    battPctHuge: { fontSize: 42, fontWeight: '900', color: DARK, letterSpacing: -2 },
    powerSaveLabel: { fontSize: 11, color: '#777', fontWeight: '800', textAlign: 'center', zIndex: 1 },

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
