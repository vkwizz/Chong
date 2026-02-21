import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';
import 'react-native-url-polyfill/auto';

global.Buffer = Buffer;
global.process = process;

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

    // Track whether we are actually receiving live data so we can skip the sim loop
    const mqttConnectedRef = useRef(false);

    // ── Helper: ingest a parsed packet into context state ──────────────────────
    const ingestPacket = (pkt) => {
        if (!pkt) return;

        setLatestPacket(pkt);
        setPacketHistory(prev => [pkt, ...prev].slice(0, 50));

        // Update voltage history only when the packet actually carries voltage
        if (pkt.analogVoltage !== null && pkt.analogVoltage !== undefined) {
            const t = new Date().toLocaleTimeString('en', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });
            setVoltageHistory(prev => [...prev, { t, v: pkt.analogVoltage }].slice(-30));
        }

        // Update ignition & immobilizer ONLY when the device sends those fields.
        // The hardware sends 1/0 for both every packet — but even for "minimal" packets
        // the parser will have ignitionStatus = 0 / immobilizerStatus = 0 (device default).
        // We trust whatever the device sent.
        if (pkt.ignitionStatus !== undefined && pkt.ignitionStatus !== null) {
            setIgnitionActive(pkt.ignitionStatus === 1);
        }
        if (pkt.immobilizerStatus !== undefined && pkt.immobilizerStatus !== null) {
            setImmobActive(pkt.immobilizerStatus === 1);
        }
    };

    useEffect(() => {
        // ── 1. Connect to HiveMQ ──────────────────────────────────────────────
        connectMQTT((status) => {
            setMqttStatus(status);
            mqttConnectedRef.current = status === 'connected';
        });

        // ── 2. Listen for telemetry packets from HiveMQ ───────────────────────
        const unsubPackets = onPacketReceived((pkt) => {
            ingestPacket(pkt);
        });

        // ── 3. Listen for control commands (immobilizer ACK from broker) ───────
        const unsubControl = onControlReceived(({ state }) => {
            // Broker ACK — sync local state; hardware will confirm via next telemetry packet
            setImmobilizer(state);
            setImmobActive(state);
            setIgnition(!state);
            setIgnitionActive(!state);
        });

        // ── 4. Simulation loop — only fires when NOT connected to live MQTT ───
        //       Stops itself the moment a live connection is established.
        const simInterval = setInterval(() => {
            if (mqttConnectedRef.current) return; // live data → skip simulation
            const pkt = generateSimulatedPacket();
            if (pkt) {
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

    // ── Manual immobilizer toggle (from Control screen) ───────────────────────
    const handleImmobToggle = (val) => {
        // 1. Send command to hardware via MQTT
        publishImmobilizerCommand(val, latestPacket?.imei);

        // 2. Local state updates
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
        </TelematicsContext.Provider>
    );
}
