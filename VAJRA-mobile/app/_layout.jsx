import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';

global.Buffer = Buffer;
global.process = process;

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Image, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Line } from 'react-native-svg';

/** ─── Global Utility: Geofence Check ─── */
const isInsidePolygon = (locLat, locLon, polygon) => {
    if (!polygon || polygon.length < 3) return false;
    let x = locLat, y = locLon;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const { width, height } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Custom Elegant B&W Animated Splash Screen (Scrolling Forest)
function SplashScreenOverlay({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Parallax animation layers
    const roadAnim = useRef(new Animated.Value(0)).current;
    const treeAnim = useRef(new Animated.Value(0)).current;
    const windAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Road scrolling (Fast)
        Animated.loop(
            Animated.timing(roadAnim, { toValue: -width, duration: 400, easing: Easing.linear, useNativeDriver: true })
        ).start();

        // Forest scrolling (Slow Parallax)
        Animated.loop(
            Animated.timing(treeAnim, { toValue: -width * 2, duration: 6000, easing: Easing.linear, useNativeDriver: true })
        ).start();

        // Wind lines (Medium)
        Animated.loop(
            Animated.timing(windAnim, { toValue: -width, duration: 600, easing: Easing.linear, useNativeDriver: true })
        ).start();

        // Fade out after 3 seconds
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => onFinish && onFinish());
        }, 3000);
    }, []);

    return (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505', zIndex: 9999, opacity: fadeAnim }]}>
            <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>

                {/* 1. LAYER: Distant Forest Parallax (Slow) */}
                <View style={{ position: 'absolute', top: height * 0.25, width: width * 3, height: 250, flexDirection: 'row', opacity: 0.2 }}>
                    <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: treeAnim }] }}>
                        {[...Array(6)].map((_, i) => (
                            <View key={i} style={{ width: width, height: 250, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 10 }}>
                                {/* Tree 1 */}
                                <View style={{ alignItems: 'center', marginRight: 20 }}>
                                    <View style={{ width: 60, height: 140, backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 }} />
                                    <View style={{ width: 10, height: 40, backgroundColor: '#666666' }} />
                                </View>
                                {/* Tree 2 */}
                                <View style={{ alignItems: 'center', marginRight: 40 }}>
                                    <View style={{ width: 90, height: 200, backgroundColor: '#FFFFFF', borderTopLeftRadius: 45, borderTopRightRadius: 45 }} />
                                    <View style={{ width: 14, height: 30, backgroundColor: '#666666' }} />
                                </View>
                                {/* Tree 3 */}
                                <View style={{ alignItems: 'center', marginRight: 10 }}>
                                    <View style={{ width: 40, height: 100, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
                                    <View style={{ width: 8, height: 20, backgroundColor: '#666666' }} />
                                </View>
                                {/* Tree 4 */}
                                <View style={{ alignItems: 'center', marginRight: 30 }}>
                                    <View style={{ width: 70, height: 160, backgroundColor: '#FFFFFF', borderTopLeftRadius: 35, borderTopRightRadius: 35 }} />
                                    <View style={{ width: 12, height: 45, backgroundColor: '#666666' }} />
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* Center Title - Minimal Layout */}
                <View style={{ position: 'absolute', top: height * 0.15, width: '100%', alignItems: 'center', zIndex: 5 }}>
                    <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: 8, textTransform: 'uppercase' }}>CHONG</Text>
                    <View style={{ width: 40, height: 2, backgroundColor: '#FFFFFF', opacity: 0.2, marginVertical: 12 }} />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#A0A0A0', letterSpacing: 10 }}>TELEMATICS</Text>
                </View>

                {/* 2. LAYER: Wind / Speed Streaks (Mid-ground) */}
                <View style={{ position: 'absolute', top: height * 0.45, width: width * 3, height: 120, flexDirection: 'row', opacity: 0.15 }}>
                    <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: windAnim }] }}>
                        {[...Array(5)].map((_, i) => (
                            <View key={i} style={{ width: width, height: 120, position: 'relative' }}>
                                <View style={{ position: 'absolute', top: 20, left: 50, width: 120, height: 1, backgroundColor: '#FFFFFF' }} />
                                <View style={{ position: 'absolute', top: 70, left: 180, width: 80, height: 2, backgroundColor: '#FFFFFF' }} />
                                <View style={{ position: 'absolute', top: 100, left: 20, width: 220, height: 1, backgroundColor: '#FFFFFF' }} />
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {/* 3. LAYER: The Scooter (Static White Silhouette Facing Right) */}
                <View style={{ alignItems: 'center', marginTop: 100, zIndex: 10 }}>
                    <Image
                        source={require('../assets/scooter_side1.png')}
                        style={{ width: 220, height: 140, tintColor: '#FFFFFF', opacity: 0.95, transform: [{ scaleX: -1 }] }}
                        resizeMode="contain"
                    />
                </View>

                {/* 4. LAYER: Minimalist Road (Fast) */}
                <View style={{ position: 'absolute', top: (height / 2) + 160, width: '100%', height: height / 2 }}>
                    <View style={{ height: 1, backgroundColor: '#FFFFFF', opacity: 0.2, shadowColor: '#FFFFFF', shadowRadius: 10, shadowOpacity: 1 }} />
                    <View style={{ width: width * 3, height: 2, marginTop: 40, flexDirection: 'row', opacity: 0.5 }}>
                        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: roadAnim }] }}>
                            {[...Array(20)].map((_, i) => (
                                <View key={i} style={{ width: 60, height: 2, backgroundColor: i % 2 === 0 ? '#FFFFFF' : 'transparent', marginRight: 40 }} />
                            ))}
                        </Animated.View>
                    </View>
                </View>

            </View>
        </Animated.View>
    );
}

import { generateSimulatedPacket, setImmobilizer, setIgnition } from '../src/utils/dataSimulator';
import {
    emitPacket, connectMQTT,
    onPacketReceived, onControlReceived,
    publishImmobilizerCommand
} from '../src/utils/mqttClient';

export const TelematicsContext = createContext(null);
export const useTelematicsContext = () => useContext(TelematicsContext);

export default function RootLayout() {
    const [latestPacket, setLatestPacket] = useState(null);
    const [packetHistory, setPacketHistory] = useState([]);
    const [voltageHistory, setVoltageHistory] = useState([]);
    const [immobActive, setImmobActive] = useState(false);
    const [ignitionActive, setIgnitionActive] = useState(false); // unknown until first packet
    const [zones, setZones] = useState([]);
    const [mqttStatus, setMqttStatus] = useState('connecting');
    const [splashReady, setSplashReady] = useState(false);

    // Track whether we are actually receiving live data
    const mqttConnectedRef = useRef(false);
    // Persist real hardware data even when offline
    const hasReceivedHardwareData = useRef(false);

    const ingestPacket = (pkt) => {
        if (!pkt) return;

        // If we have received hardware data before, but now we are getting manual simulation
        // (e.g. while disconnected), only update history but keep latestPacket as last hardware data?
        // Actually, the user wants the UI to SHOW the last passed packet.

        const isSimulated = pkt.isSimulated;

        if (!isSimulated) {
            hasReceivedHardwareData.current = true;
        }

        // If we are currently disconnected/simulating BUT we have a real packet in memory,
        // we should keep the real packet as the 'latestPacket' for display.
        if (isSimulated && hasReceivedHardwareData.current) {
            // Only update history/logs, but don't overwrite the main dashboard display
            setPacketHistory(prev => [pkt, ...prev].slice(0, 50));
            return;
        }

        setLatestPacket(pkt);
        setPacketHistory(prev => [pkt, ...prev].slice(0, 50));

        if (pkt.analogVoltage !== null && pkt.analogVoltage !== undefined) {
            const t = new Date().toLocaleTimeString('en', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });
            setVoltageHistory(prev => [...prev, { t, v: pkt.analogVoltage }].slice(-30));
        }

        if (pkt.ignitionStatus !== undefined && pkt.ignitionStatus !== null) {
            setIgnitionActive(pkt.ignitionStatus === 1);
        }
        if (pkt.immobilizerStatus !== undefined && pkt.immobilizerStatus !== null) {
            setImmobActive(pkt.immobilizerStatus === 1);
        }
    };

    // Track geofence breach per zone ID
    const prevInsideRef = useRef({});

    /** ─── Global Geofence Enforcement ─── */
    useEffect(() => {
        if (!latestPacket || !latestPacket.hasGps || zones.length === 0 || immobActive) return;

        const { latitude, longitude } = latestPacket;

        zones.forEach(zone => {
            const insideNow = isInsidePolygon(latitude, longitude, zone.polygon);
            const wasInside = prevInsideRef.current[zone.id];

            // If we just crossed the boundary from inside to outside
            if (wasInside === true && insideNow === false) {
                // BREACH DETECTED
                handleImmobToggle(true);
                Alert.alert(
                    '🚨 Geofence Breach!',
                    `Vehicle has left safe zone "${zone.name}".\n\nImmobilizer activated for security.`,
                    [{ text: 'OK' }]
                );
            }

            // Update tracking
            prevInsideRef.current[zone.id] = insideNow;
        });
    }, [latestPacket, zones, immobActive]);

    useEffect(() => {
        connectMQTT((status) => {
            setMqttStatus(status);
            mqttConnectedRef.current = status === 'connected';
        });

        const unsubPackets = onPacketReceived((pkt) => {
            ingestPacket(pkt);
        });

        const unsubControl = onControlReceived(({ state }) => {
            setImmobilizer(state);
            setImmobActive(state);
            // Don't auto-flip ignition here, let the next packet from hardware confirm it
        });

        const simInterval = setInterval(() => {
            if (mqttConnectedRef.current) return;
            // Generate simulated packet with flag
            const pkt = generateSimulatedPacket();
            if (pkt) {
                pkt.isSimulated = true;
                emitPacket(pkt);
                ingestPacket(pkt);
            }
        }, 2000);

        return () => {
            clearInterval(simInterval);
            unsubPackets();
            unsubControl();
        };
    }, []);

    const handleImmobToggle = (val) => {
        publishImmobilizerCommand(val, latestPacket?.imei);
        setImmobilizer(val);
        setImmobActive(val);
        setIgnition(!val);
        setIgnitionActive(!val);
    };

    return (
        <TelematicsContext.Provider value={{
            latestPacket,
            packetHistory,
            voltageHistory,
            immobActive,
            handleImmobToggle,
            mqttStatus,
            ignitionActive,
            zones,
            setZones,
        }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
            {!splashReady && <SplashScreenOverlay onFinish={() => setSplashReady(true)} />}
        </TelematicsContext.Provider>
    );
}
