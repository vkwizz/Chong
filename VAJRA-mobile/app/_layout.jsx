import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';

global.Buffer = Buffer;
global.process = process;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { generateSimulatedPacket, setImmobilizer, setIgnition } from '../src/utils/dataSimulator';
import { emitPacket, connectMQTT, onControlReceived } from '../src/utils/mqttClient';

export const TelematicsContext = createContext(null);
export const useTelematicsContext = () => useContext(TelematicsContext);

export default function RootLayout() {
    const [latestPacket, setLatestPacket] = useState(null);
    const [packetHistory, setPacketHistory] = useState([]);
    const [voltageHistory, setVoltageHistory] = useState([]);
    const [immobActive, setImmobActive] = useState(false);
    const [ignitionActive, setIgnitionActive] = useState(true);
    const [zones, setZones] = useState([]);   // shared geofence zones
    const [mqttStatus, setMqttStatus] = useState('simulated');

    useEffect(() => {
        // Try HiveMQ connection
        connectMQTT((status) => setMqttStatus(status));

        // Listen for MQTT control commands (immobilizer)
        const unsubControl = onControlReceived(({ state }) => {
            setImmobilizer(state);
            setImmobActive(state);
            // Sync ignition with immobilizer state
            setIgnition(!state);
            setIgnitionActive(!state);
        });

        // Simulation loop — every 2s
        const interval = setInterval(() => {
            const pkt = generateSimulatedPacket();
            if (pkt) {
                emitPacket(pkt);
                setLatestPacket(pkt);
                setPacketHistory(prev => [pkt, ...prev].slice(0, 50));
                const t = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                setVoltageHistory(prev => [...prev, { t, v: pkt.analogVoltage }].slice(-30));
            }
        }, 2000);

        return () => { clearInterval(interval); unsubControl(); };
    }, []);

    const handleImmobToggle = (val) => {
        setImmobilizer(val);
        setImmobActive(val);
        // Sync ignition with immobilizer state
        setIgnition(!val);
        setIgnitionActive(!val);
    };

    return (
        <TelematicsContext.Provider value={{ latestPacket, packetHistory, voltageHistory, immobActive, handleImmobToggle, mqttStatus, ignitionActive, zones, setZones }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
        </TelematicsContext.Provider>
    );
}
