import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, Alert, Modal,
} from 'react-native';
import { useTelematicsContext } from '../_layout';
import { publishImmobilizerCommand } from '../../src/utils/mqttClient';
import { Shield, AlertTriangle, Zap } from 'lucide-react-native';

const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

export default function ControlScreen() {
    const ctx = useTelematicsContext();
    const [showModal, setShowModal] = useState(false);
    const [pendingState, setPendingState] = useState(false);
    const immob = ctx?.immobActive ?? false;
    const ign = ctx?.latestPacket?.ignitionStatus === 1;

    const requestToggle = (val) => {
        setPendingState(val);
        setShowModal(true);
    };

    const confirmToggle = () => {
        setShowModal(false);
        ctx.handleImmobToggle(pendingState);
        publishImmobilizerCommand(pendingState);
    };

    return (
        <View style={S.root}>
            {/* Header */}
            <View style={S.header}>
                <Text style={S.headerTitle}>🔒 Device Control</Text>
                <View style={[S.pill, { backgroundColor: immob ? 'rgba(239,68,68,0.15)' : 'rgba(184,232,64,0.1)' }]}>
                    <View style={[S.dot, { backgroundColor: immob ? '#ef4444' : LIME }]} />
                    <Text style={[S.pillText, { color: immob ? '#ef4444' : LIME }]}>{immob ? 'IMMOB ON' : 'ACTIVE'}</Text>
                </View>
            </View>

            <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

                {/* Main immobilizer card */}
                <View style={[S.immobCard, { borderColor: immob ? 'rgba(239,68,68,0.4)' : 'rgba(184,232,64,0.3)' }]}>
                    <View style={[S.immobIcon, { backgroundColor: immob ? 'rgba(239,68,68,0.15)' : 'rgba(184,232,64,0.1)' }]}>
                        <Text style={{ fontSize: 44 }}>{immob ? '🔴' : '🟢'}</Text>
                    </View>
                    <Text style={[S.immobTitle, { color: immob ? '#ef4444' : LIME }]}>
                        {immob ? 'Engine Immobilized' : 'Vehicle Active'}
                    </Text>
                    <Text style={S.immobSub}>
                        {immob ? 'DO pin is HIGH — engine signal cut' : 'DO pin is LOW — engine running normally'}
                    </Text>
                    <View style={S.dosRow}>
                        <Text style={S.doLabel}>DO1 OUTPUT</Text>
                        <View style={[S.doPill, { backgroundColor: immob ? 'rgba(239,68,68,0.15)' : 'rgba(184,232,64,0.1)' }]}>
                            <Text style={[S.doValue, { color: immob ? '#ef4444' : LIME }]}>= {immob ? 'HIGH (1)' : 'LOW (0)'}</Text>
                        </View>
                    </View>
                    {/* Toggle button */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => requestToggle(!immob)}
                        style={[S.toggleBtn, {
                            backgroundColor: immob ? LIME : '#ef4444',
                            shadowColor: immob ? LIME : '#ef4444',
                        }]}
                    >
                        <Shield size={20} color={immob ? '#1a1a1a' : 'white'} />
                        <Text style={[S.toggleBtnText, { color: immob ? '#1a1a1a' : 'white' }]}>
                            {immob ? 'Deactivate Immobilizer' : 'Activate Immobilizer'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Ignition DI card */}
                <View style={[S.diCard, { backgroundColor: 'white' }]}>
                    <View>
                        <Text style={S.cardLabel}>Digital Input (DI1)</Text>
                        <Text style={S.cardLabelSub}>Ignition Signal</Text>
                    </View>
                    <View style={[S.doPill, { backgroundColor: ign ? 'rgba(184,232,64,0.1)' : 'rgba(0,0,0,0.04)' }]}>
                        <View style={[S.dot, { backgroundColor: ign ? LIME : '#555' }]} />
                        <Text style={[S.doValue, { color: ign ? LIME : '#666' }]}>{ign ? 'HIGH (1)' : 'LOW (0)'}</Text>
                    </View>
                </View>

                {/* MQTT info card */}
                <View style={S.infoCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <Zap size={18} color={LIME} />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>MQTT Control Protocol</Text>
                    </View>
                    {[
                        ['Command topic', 'telematics/device/…/control'],
                        ['Payload', '{"command":"SET_DO","state":1}'],
                        ['Protocol', 'MQTTS / WSS (TLS)'],
                        ['QoS', 'Level 1 (at least once)'],
                    ].map(([k, v]) => (
                        <View key={k} style={S.infoRow}>
                            <Text style={S.infoKey}>{k}</Text>
                            <Text style={S.infoVal}>{v}</Text>
                        </View>
                    ))}
                </View>

                {/* Warning */}
                <View style={S.warnCard}>
                    <AlertTriangle size={16} color="#f59e0b" />
                    <Text style={S.warnText}>
                        Activating the immobilizer while the vehicle is in motion may be dangerous. Use only when stationary.
                    </Text>
                </View>
                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Confirmation modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={S.modalOverlay}>
                    <View style={S.modalSheet}>
                        <View style={S.modalHandle} />
                        <Text style={S.modalTitle}>{pendingState ? '⚠️ Activate Immobilizer?' : '✅ Deactivate Immobilizer?'}</Text>
                        <Text style={S.modalBody}>
                            {pendingState
                                ? 'This will cut the engine signal by setting DO1 HIGH. The vehicle will not start.'
                                : 'This will restore the engine signal by setting DO1 LOW. The vehicle can be started.'}
                        </Text>
                        <TouchableOpacity onPress={confirmToggle}
                            style={[S.modalBtn, { backgroundColor: pendingState ? '#ef4444' : LIME }]}>
                            <Text style={[S.modalBtnText, { color: pendingState ? 'white' : '#1a1a1a' }]}>
                                {pendingState ? 'Yes, Immobilize' : 'Yes, Deactivate'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowModal(false)} style={S.modalCancelBtn}>
                            <Text style={S.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 11, fontWeight: '700' },
    scroll: { flex: 1, padding: 16 },
    immobCard: {
        backgroundColor: DARK, borderRadius: 24, padding: 24, borderWidth: 1.5,
        alignItems: 'center', gap: 12, marginBottom: 12,
    },
    immobIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
    immobTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
    immobSub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
    dosRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    doLabel: { fontSize: 11, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    doPill: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
    doValue: { fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
    toggleBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%',
        justifyContent: 'center', borderRadius: 16, paddingVertical: 16, marginTop: 8,
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    },
    toggleBtnText: { fontSize: 15, fontWeight: '800' },
    diCard: {
        backgroundColor: DARK, borderRadius: 18, padding: 18, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    },
    cardLabel: { fontSize: 14, color: '#1a1a1a', fontWeight: '700' },
    cardLabelSub: { fontSize: 11, color: '#999', marginTop: 2 },
    infoCard: { backgroundColor: DARK, borderRadius: 18, padding: 18, marginBottom: 12 },
    infoRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222', flexDirection: 'row', justifyContent: 'space-between' },
    infoKey: { fontSize: 11, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
    infoVal: { fontSize: 11, color: '#888', fontFamily: 'Courier', flex: 1.5, textAlign: 'right' },
    warnCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    warnText: { fontSize: 12, color: '#f59e0b', lineHeight: 18, flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#111520', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 10 },
    modalBody: { fontSize: 14, color: '#888', lineHeight: 22, marginBottom: 24 },
    modalBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
    modalBtnText: { fontSize: 15, fontWeight: '800' },
    modalCancelBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    modalCancelText: { fontSize: 14, color: '#666', fontWeight: '600' },
});

