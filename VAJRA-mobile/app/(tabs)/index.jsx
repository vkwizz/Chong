import React, { useRef, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Image,
} from 'react-native';
import WebView from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';
import { useTelematicsContext } from '../_layout';
import { useRouter } from 'expo-router';
import {
    Shield, FileSearch, Map, Settings,
    ChevronDown, Activity, Compass, Calendar, Gauge, User, Bell, LogOut,
    Lock, Headphones, Zap
} from 'lucide-react-native';
import { publishFrequencyCommand } from '../../src/utils/mqttClient';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

export default function Dashboard() {
    const ctx = useTelematicsContext();
    const router = useRouter();
    const scrollY = useRef(new Animated.Value(0)).current;

    const [showDiag, setShowDiag] = useState(false);
    const [showBatt, setShowBatt] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [dataRate, setDataRate] = useState('optimized'); // 'saver', 'optimized', 'performance'
    const diagAnim = useRef(new Animated.Value(0)).current;
    const battAnim = useRef(new Animated.Value(0)).current;
    const settingsAnim = useRef(new Animated.Value(0)).current;
    const imgScale = useRef(new Animated.Value(1)).current;
    const battScale = useRef(new Animated.Value(1)).current;

    const p = ctx?.latestPacket;
    const speed = Math.round(p?.speed ?? 0);
    const immob = ctx?.immobActive ?? false;
    const ign = immob ? false : (p?.ignitionStatus === 1);
    const volt = p?.analogVoltage ?? 0;
    const voltPct = Math.min(100, (volt / 5) * 100);
    const voltColor = volt < 2 ? '#ef4444' : volt < 3.5 ? '#f59e0b' : LIME;

    // Simulated odometer derived from packet frame count
    const odemeter = (p?.frameNumber ?? 0) * 0.12;

    useEffect(() => {
        Animated.timing(diagAnim, {
            toValue: showDiag ? 1 : 0,
            duration: 420,
            useNativeDriver: true,
        }).start();
    }, [showDiag]);

    useEffect(() => {
        Animated.timing(battAnim, {
            toValue: showBatt ? 1 : 0,
            duration: 450,
            useNativeDriver: true,
        }).start();
    }, [showBatt]);

    useEffect(() => {
        Animated.timing(settingsAnim, {
            toValue: showSettings ? 1 : 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [showSettings]);

    const onPressHero = () => {
        Animated.sequence([
            Animated.timing(imgScale, { toValue: 1.08, duration: 180, useNativeDriver: true }),
            Animated.timing(imgScale, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start(() => setShowDiag(true));
    };

    const onSelectDataRate = (rate) => {
        setDataRate(rate);
        const seconds = rate === 'saver' ? 60 : rate === 'performance' ? 1 : 10;
        publishFrequencyCommand(seconds);
    };

    const onPressBattery = () => {
        Animated.sequence([
            Animated.timing(battScale, { toValue: 1.12, duration: 180, useNativeDriver: true }),
            Animated.timing(battScale, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start(() => setShowBatt(true));
    };

    const diagTranslateY = diagAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT, 0],
    });

    const battTranslateY = battAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT, 0],
    });

    const settingsTranslateY = settingsAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [SCREEN_HEIGHT, 0],
    });

    const mainScale = Animated.add(diagAnim, Animated.add(settingsAnim, battAnim)).interpolate({
        inputRange: [0, 1, 3],
        outputRange: [1, 0.95, 0.9],
    });

    return (
        <View style={S.root}>
            <Animated.View style={[S.mainWrap, { transform: [{ scale: mainScale }] }]}>

                {/* ── Header ── */}
                <View style={S.header}>
                    <View>
                        <Text style={S.headerSub}>Hello,</Text>
                        <Text style={S.headerTitle}>VK</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={S.profileCircle}>
                        <Settings color={DARK} size={22} strokeWidth={2} style={{ alignSelf: 'center', marginTop: 11 }} />
                    </TouchableOpacity>
                </View>

                {/* ── Scrollable content ── */}
                <Animated.ScrollView
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={S.scrollContent}
                >
                    {/* Hero Card */}
                    <TouchableOpacity activeOpacity={1} onPress={onPressHero} style={S.heroCard}>
                        <View style={S.chongHeader}>
                            <Text style={S.chongText}>Chong</Text>
                            <View style={S.premiumBadge}>
                                <Text style={S.premiumText}>PREMIUM</Text>
                            </View>
                        </View>
                        <View style={S.imageContainer}>
                            <Animated.Image
                                source={require('../../assets/scooter_side1.png')}
                                style={[S.scooterImage, { transform: [{ scale: imgScale }] }]}
                            />
                        </View>
                        <View style={S.chongFooter}>
                            <Text style={S.scooterModel}>GTS Super 300</Text>
                            <Text style={S.tapHint}>Tap for details</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Grid Row: Map + Battery */}
                    <View style={S.gridRow}>
                        {/* Mini Map card */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push('/(tabs)/map')}
                            style={S.chargingCard}
                        >
                            <View style={S.cardHeader}>
                                <Text style={S.cardTitle}>Live{"\n"}Map</Text>
                                <Map color={DARK} size={22} strokeWidth={2.5} />
                            </View>

                            <View style={S.miniMapWrapper}>
                                <WebView
                                    pointerEvents="none"
                                    scrollEnabled={false}
                                    source={{
                                        html: `<!DOCTYPE html><html><head>
                                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                    <style>*{margin:0;padding:0;}#map{width:100%;height:100%;}.leaflet-control-attribution{display:none!important;}</style>
                                    </head><body><div id="map"></div><script>
                                    var m=L.map('map',{zoomControl:false,attributionControl:false}).setView([${p?.latitude || 12.9716},${p?.longitude || 77.5946}],15);
                                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(m);
                                    L.circle([${p?.latitude || 12.9716},${p?.longitude || 77.5946}],{color:'#B8E840',fillColor:'#B8E840',fillOpacity:0.5,radius:80}).addTo(m);
                                    </script></body></html>` }}
                                    style={S.miniMap}
                                    javaScriptEnabled
                                    originWhitelist={['*']}
                                    mixedContentMode="always"
                                />
                                <View style={S.mapOverlay}>
                                    <View style={S.innerBox}>
                                        <Text style={S.distLabel}>NEARBY</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={S.cardHint}>Open full map →</Text>
                        </TouchableOpacity>

                        {/* Battery card */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={onPressBattery}
                            style={S.batteryCard}
                        >
                            {/* Wave fill background */}
                            <View style={S.waveBackground}>
                                <View style={[S.waveFill, { height: `${voltPct}%`, backgroundColor: 'rgba(184,232,64,0.14)' }]}>
                                    <Svg height={24} width="150%" viewBox="0 0 100 20" style={S.waveSvg}>
                                        <Path d="M0 10 Q 25 20 50 10 T 100 10" fill="none" stroke="rgba(184,232,64,0.28)" strokeWidth="2" />
                                    </Svg>
                                </View>
                            </View>

                            <Text style={S.battEnergyLabel}>Battery</Text>
                            <View style={S.battContent}>
                                <Animated.Image
                                    source={require('../../assets/scooter_front1.png')}
                                    style={[S.battScooterImage, { transform: [{ scale: battScale }] }]}
                                />
                                <Text style={[S.battPctHuge, { color: voltColor }]}>{voltPct.toFixed(0)}%</Text>
                            </View>
                            <Text style={S.powerSaveLabel}>{voltPct > 20 ? 'Standard mode' : '⚠️ Low battery'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Status Section */}
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

                        <View style={[S.statusRow, { borderBottomWidth: 0 }]}>
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
            </Animated.View>

            {/* ── Diagnostics Overlay ── */}
            <Animated.View
                style={[S.diagOverlay, { transform: [{ translateY: diagTranslateY }] }]}
                pointerEvents={showDiag ? 'auto' : 'none'}
            >
                <View style={S.diagHeader}>
                    <TouchableOpacity onPress={() => setShowDiag(false)} style={S.closeBtn}>
                        <ChevronDown color={DARK} size={26} />
                    </TouchableOpacity>
                    <Text style={S.diagTitle}>Vehicle Details</Text>
                    <Activity color={LIME} size={20} />
                </View>

                <View style={S.diagContent}>
                    <View style={S.diagTopRow}>
                        <View style={S.diagGridLeft}>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Total km</Text>
                                <Text style={S.diagValue}>{odemeter.toFixed(1)}</Text>
                                <Compass size={16} color="#999" />
                            </View>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Service date</Text>
                                <Text style={S.diagValue}>24-11</Text>
                                <Calendar size={16} color="#999" />
                            </View>
                        </View>

                        {/* Charge bar */}
                        <View style={S.diagChargePanel}>
                            <Text style={S.diagLabel}>Charge</Text>
                            <View style={S.diagChargeOuter}>
                                <View style={[S.diagChargeFill, { height: `${voltPct}%`, backgroundColor: voltColor }]} />
                            </View>
                            <Text style={[S.diagChargeText, { color: voltColor }]}>{voltPct.toFixed(0)}%</Text>
                        </View>
                    </View>

                    <View style={S.diagMidRow}>
                        <View style={S.diagCardWide}>
                            <Text style={S.diagLabel}>Diagnostics</Text>
                            <View style={S.diagoStats}>
                                <View style={S.diagoItem}>
                                    <View style={[S.statusDot, { backgroundColor: LIME }]} />
                                    <Text style={S.diagoText}>Engine OK</Text>
                                </View>
                                <View style={S.diagoItem}>
                                    <View style={[S.statusDot, { backgroundColor: LIME }]} />
                                    <Text style={S.diagoText}>Brakes OK</Text>
                                </View>
                            </View>
                        </View>
                        <View style={S.diagCard}>
                            <Text style={S.diagLabel}>Speed</Text>
                            <Text style={S.diagValue}>{speed}</Text>
                            <Gauge size={16} color="#999" />
                        </View>
                    </View>

                    <View style={S.diagScooterContainer}>
                        <Image
                            source={require('../../assets/scooter_side1.png')}
                            style={S.diagScooterImage}
                            width={300}
                            height={300}
                        />
                    </View>
                </View>
            </Animated.View>

            {/* ── Battery Analysis Overlay ── */}
            <Animated.View
                style={[S.diagOverlay, { transform: [{ translateY: battTranslateY }] }]}
                pointerEvents={showBatt ? 'auto' : 'none'}
            >
                <View style={S.diagHeader}>
                    <TouchableOpacity onPress={() => setShowBatt(false)} style={S.closeBtn}>
                        <ChevronDown color={DARK} size={26} />
                    </TouchableOpacity>
                    <Text style={S.diagTitle}>Battery Analysis</Text>
                    <Activity color={LIME} size={20} />
                </View>

                <View style={S.diagContent}>
                    <View style={S.battTopSection}>
                        <Image
                            source={require('../../assets/scooter_top1.png')}
                            style={S.uprightScooter}
                        />
                        <View style={S.battMetricsLeft}>
                            <View style={S.miniCard}>
                                <Text style={S.miniLabel}>Warranty</Text>
                                <Text style={S.miniVal}>24 Months</Text>
                            </View>
                            <View style={S.miniCard}>
                                <Text style={S.miniLabel}>Analysis</Text>
                                <Text style={S.miniVal}>Healthy</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ gap: 16, marginBottom: 20 }}>
                        {/* Row 1: Original Placeholders */}
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Temperature</Text>
                                <Text style={S.diagValue}>32°C</Text>
                            </View>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Battery Life</Text>
                                <Text style={S.diagValue}>98%</Text>
                            </View>
                        </View>
                        {/* Row 2: Live Voltage Metrics */}
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Max / Current V</Text>
                                <Text style={S.diagValue}>9.9V <Text style={{ fontSize: 16, color: '#999' }}>/ {volt.toFixed(1)}V</Text></Text>
                            </View>
                            <View style={S.diagCard}>
                                <Text style={S.diagLabel}>Battery Health</Text>
                                <Text style={[S.diagValue, { color: Math.min(100, (volt / 9.9) * 100) > 80 ? LIME : Math.min(100, (volt / 9.9) * 100) > 40 ? '#f59e0b' : '#ef4444' }]}>
                                    {Math.min(100, (volt / 9.9) * 100).toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={S.battMainCharge}>
                        <Text style={S.diagLabel}>Battery Charge</Text>
                        <View style={S.horizChargeOuter}>
                            <View style={[S.horizChargeFill, { width: `${voltPct}%`, backgroundColor: voltColor }]} />
                        </View>
                        <Text style={S.diagValue}>{voltPct.toFixed(0)}%</Text>
                    </View>
                </View>
            </Animated.View>

            {/* ── Settings Overlay ── */}
            <Animated.View
                style={[S.diagOverlay, { transform: [{ translateY: settingsTranslateY }] }]}
                pointerEvents={showSettings ? 'auto' : 'none'}
            >
                <View style={S.diagHeader}>
                    <TouchableOpacity onPress={() => setShowSettings(false)} style={S.closeBtn}>
                        <ChevronDown color={DARK} size={26} />
                    </TouchableOpacity>
                    <Text style={S.diagTitle}>Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={S.diagContent}>
                    <View style={S.settingsSection}>
                        <TouchableOpacity style={S.settingsItem}>
                            <View style={S.settingsIconWrap}>
                                <User color={DARK} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={S.settingsItemLabel}>Account Details</Text>
                                <Text style={S.settingsItemSub}>Profile, Personal Info</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={S.settingsItem}>
                            <View style={S.settingsIconWrap}>
                                <Bell color={DARK} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={S.settingsItemLabel}>Notifications</Text>
                                <Text style={S.settingsItemSub}>Alerts, Sound, Vibrate</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[S.settingsItem, { borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }]}>
                            <View style={S.settingsIconWrap}>
                                <Shield color={DARK} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={S.settingsItemLabel}>Security</Text>
                                <Text style={S.settingsItemSub}>Password, Geofence</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={S.dataRateSection}>
                            <View style={S.settingsItemHeader}>
                                <Zap color={DARK} size={20} />
                                <Text style={S.settingsItemLabel}>Data Optimizer</Text>
                            </View>
                            <Text style={S.settingsItemSub}>Adjust transmission rate to save data costs</Text>
                            <View style={S.rateRow}>
                                <TouchableOpacity
                                    onPress={() => onSelectDataRate('saver')}
                                    style={[S.rateOpt, dataRate === 'saver' && S.rateOptActive]}
                                >
                                    <Text style={[S.rateText, dataRate === 'saver' && S.rateTextActive]}>Saver</Text>
                                    <Text style={S.rateSub}>60s</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => onSelectDataRate('optimized')}
                                    style={[S.rateOpt, dataRate === 'optimized' && S.rateOptActive]}
                                >
                                    <Text style={[S.rateText, dataRate === 'optimized' && S.rateTextActive]}>Auto</Text>
                                    <Text style={S.rateSub}>10s</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => onSelectDataRate('performance')}
                                    style={[S.rateOpt, dataRate === 'performance' && S.rateOptActive]}
                                >
                                    <Text style={[S.rateText, dataRate === 'performance' && S.rateTextActive]}>Turbo</Text>
                                    <Text style={S.rateSub}>1s</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[S.settingsItem, { borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }]}>
                            <View style={S.settingsIconWrap}>
                                <Lock color={DARK} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={S.settingsItemLabel}>Privacy & Legal Info</Text>
                                <Text style={S.settingsItemSub}>Terms, Privacy Policy</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[S.settingsItem, { borderBottomWidth: 0 }]}>
                            <View style={S.settingsIconWrap}>
                                <Headphones color={DARK} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={S.settingsItemLabel}>Contact Us</Text>
                                <Text style={S.settingsItemSub}>Support, Feedback</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={S.logOutBtn}>
                        <LogOut color="#ef4444" size={20} />
                        <Text style={S.logOutText}>Log Out</Text>
                    </TouchableOpacity>

                    <View style={S.appVersionBox}>
                        <Text style={S.appVersionText}>Vajra App v2.4.1</Text>
                    </View>
                </View>
            </Animated.View>

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
    profileCircle: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
        overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
    },
    profilePlaceholder: { width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.06)' },
    scrollContent: { paddingHorizontal: 24 },

    /* hero */
    heroCard: {
        backgroundColor: '#fff', borderRadius: 36, padding: 24,
        height: SCREEN_HEIGHT * 0.38,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 28, elevation: 8,
        marginBottom: 20, overflow: 'hidden',
    },
    chongHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chongText: { fontSize: 36, fontWeight: '900', color: DARK, letterSpacing: -1.5 },
    premiumBadge: { backgroundColor: DARK, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    premiumText: { color: LIME, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scooterImage: { width: '130%', height: '100%', resizeMode: 'contain' },
    chongFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    scooterModel: { fontSize: 14, fontWeight: '800', color: '#333' },
    tapHint: { fontSize: 11, color: '#bbb', fontWeight: '600' },

    /* grid */
    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 20, height: SCREEN_HEIGHT * 0.28 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },

    /* map card */
    chargingCard: {
        flex: 1, backgroundColor: LIME, borderRadius: 32, padding: 20,
        justifyContent: 'space-between',
        shadowColor: LIME, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5,
    },
    cardTitle: { fontSize: 17, fontWeight: '900', color: DARK, lineHeight: 20, letterSpacing: -0.5 },
    miniMapWrapper: {
        width: '100%', flex: 1, borderRadius: 18, overflow: 'hidden',
        position: 'relative', backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 8,
    },
    miniMap: { width: '100%', height: '100%', opacity: 0.85 },
    mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    innerBox: { backgroundColor: DARK, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    distLabel: { color: LIME, fontSize: 11, fontWeight: '900' },
    cardHint: { fontSize: 10, color: DARK, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    /* battery card */
    batteryCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 32, padding: 20,
        justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
        overflow: 'hidden', position: 'relative',
    },
    waveBackground: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end', zIndex: 0 },
    waveFill: { width: '100%', position: 'relative' },
    waveSvg: { position: 'absolute', top: -12, left: -20 },
    battEnergyLabel: { fontSize: 12, color: '#999', fontWeight: '800', textAlign: 'center', zIndex: 1 },
    battContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
    battScooterImage: { width: 70, height: 85, resizeMode: 'contain' },
    battPctHuge: { fontSize: 38, fontWeight: '900', letterSpacing: -2, zIndex: 1 },
    powerSaveLabel: { fontSize: 10, color: '#999', fontWeight: '700', textAlign: 'center', zIndex: 1 },

    /* status */
    statusSection: {
        backgroundColor: '#fff', borderRadius: 32, padding: 22, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
    statusLabel: { fontSize: 15, fontWeight: '800', color: DARK },
    statusSub: { fontSize: 11, color: '#bbb', fontWeight: '600', marginTop: 2 },
    toggleWrap: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 100, padding: 4, alignItems: 'center' },
    toggleLabel: { fontSize: 10, fontWeight: '900', color: '#ccc', paddingHorizontal: 12, paddingVertical: 7 },
    toggleDivider: { width: 1, height: 10, backgroundColor: '#eee' },
    toggleActive: { color: DARK, backgroundColor: LIME, borderRadius: 100 },
    toggleActiveRed: { color: '#fff', backgroundColor: '#ef4444', borderRadius: 100 },

    /* actions */
    actionRow: { flexDirection: 'row', gap: 12 },
    quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 58, borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
    quickBtnText: { color: LIME, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },

    /* diagnostics overlay */
    diagOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: CREAM, borderTopLeftRadius: 40, borderTopRightRadius: 40,
        paddingTop: 52,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, elevation: 24,
    },
    diagHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, marginBottom: 24,
    },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    diagTitle: { fontSize: 18, fontWeight: '900', color: DARK },

    diagContent: { flex: 1, paddingHorizontal: 24 },
    diagTopRow: { flexDirection: 'row', gap: 16, height: 210, marginBottom: 16 },
    diagGridLeft: { flex: 1.2, gap: 16 },
    diagCard: { flex: 1, backgroundColor: '#fff', borderRadius: 28, padding: 16, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    diagLabel: { fontSize: 10, fontWeight: '800', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6 },
    diagValue: { fontSize: 26, fontWeight: '900', color: DARK },

    diagChargePanel: { flex: 0.75, backgroundColor: DARK, borderRadius: 28, padding: 16, alignItems: 'center', justifyContent: 'space-between' },
    diagChargeOuter: { width: 14, height: 110, backgroundColor: '#2a2a2a', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
    diagChargeFill: { width: '100%', borderRadius: 8 },
    diagChargeText: { fontSize: 15, fontWeight: '900' },

    diagMidRow: { flexDirection: 'row', gap: 16, height: 110, marginBottom: 16 },
    diagCardWide: { flex: 1.5, backgroundColor: '#fff', borderRadius: 28, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    diagoStats: { marginTop: 8, gap: 8 },
    diagoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    diagoText: { fontSize: 13, fontWeight: '700', color: DARK },

    diagScooterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -10 },
    diagScooterImage: { width: width * 1.1, height: 220, resizeMode: 'contain' },

    // Battery Overlay Unique Styles
    battTopSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    uprightScooter: { width: 140, height: 280, resizeMode: 'contain', transform: [{ rotate: '90deg' }] },
    battMetricsLeft: { gap: 12, flex: 1, paddingLeft: 20 },
    miniCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    miniLabel: { fontSize: 10, fontWeight: '800', color: '#999', textTransform: 'uppercase' },
    miniVal: { fontSize: 16, fontWeight: '900', color: DARK },
    battInfoGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    battMainCharge: { backgroundColor: '#fff', borderRadius: 28, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
    horizChargeOuter: { height: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginVertical: 12, overflow: 'hidden' },
    horizChargeFill: { height: '100%', borderRadius: 8 },

    mainWrap: { flex: 1 },
    /* settings unique */
    settingsSection: { backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    settingsIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f8f8f8', alignItems: 'center', justifyContent: 'center' },
    settingsItemLabel: { fontSize: 15, fontWeight: '800', color: DARK },
    settingsItemSub: { fontSize: 11, color: '#aaa', fontWeight: '600', marginTop: 2 },
    logOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 58, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 20 },
    logOutText: { fontSize: 15, fontWeight: '900', color: '#ef4444' },
    appVersionBox: { marginTop: 'auto', marginBottom: 40, alignItems: 'center' },
    appVersionText: { fontSize: 12, color: '#ccc', fontWeight: '700' },

    /* data rate unique */
    dataRateSection: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    settingsItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
    rateRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    rateOpt: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' },
    rateOptActive: { borderColor: DARK, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    rateText: { fontSize: 13, fontWeight: '800', color: '#666' },
    rateTextActive: { color: DARK },
    rateSub: { fontSize: 9, color: '#aaa', fontWeight: '700', marginTop: 2 },
});
