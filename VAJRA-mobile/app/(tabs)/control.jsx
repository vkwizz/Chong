import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Alert,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import WebView from 'react-native-webview';
import { useTelematicsContext } from '../_layout';
import { publishImmobilizerCommand } from '../../src/utils/mqttClient';
import { Shield, AlertTriangle, MapPin, Trash2, PlusCircle, Zap, X, ChevronRight } from 'lucide-react-native';

const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';
const RED = '#ef4444';
const AMBER = '#f59e0b';

/* ─── SVG circular geofence preview ─── */
function GeoCirclePreview({ inside, dist, radius, size = 160 }) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.36;
    const ratio = Math.min(dist / radius, 1.55);
    // vehicle dot: centred if inside, pushed out if outside
    const dotX = inside ? cx + (dist / radius) * r * 0.6 : cx + r * ratio * 0.88;
    const dotY = cy;
    const color = inside ? LIME : RED;
    return (
        <Svg width={size} height={size}>
            {/* pulse ring */}
            <Circle cx={cx} cy={cy} r={r + 12} stroke={color} strokeWidth={0.8} strokeDasharray="3 5" fill="none" opacity={0.18} />
            {/* main geofence circle */}
            <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.07} />
            {/* crosshair at centre */}
            <Line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.4} />
            <Line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke={color} strokeWidth={1.5} opacity={0.4} />
            {/* vehicle dot */}
            <Circle cx={dotX} cy={dotY} r={8} fill={color} opacity={0.9} />
            <Circle cx={dotX} cy={dotY} r={3.5} fill="#fff" />
            {/* status label */}
            <SvgText x={cx} y={size - 4} textAnchor="middle" fill={color} fontSize={9} fontWeight="800" opacity={0.85}>
                {inside ? 'INSIDE ZONE' : 'OUTSIDE ZONE'}
            </SvgText>
        </Svg>
    );
}

/* ─── Leaflet map HTML ─── */
function buildZoneMapHTML(zone, vehicleLat, vehicleLon) {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; background:#0d1117; }
  .info {
    position:fixed; bottom:0; left:0; right:0; z-index:1000;
    background:rgba(17,21,32,0.97); padding:14px 20px 28px;
    border-top:1px solid rgba(255,255,255,0.06);
    display:flex; justify-content:space-between; align-items:center;
  }
  .zone-name { font-size:15px;font-weight:900;color:#fff; }
  .zone-meta { font-size:11px;color:#555;margin-top:3px; }
  .pill { font-size:11px;font-weight:800;border-radius:100px;padding:6px 14px; }
</style>
</head>
<body>
<div id="map"></div>
<div class="info">
  <div>
    <div class="zone-name">${zone.name}</div>
    <div class="zone-meta">📍 ${zone.lat.toFixed(5)}, ${zone.lon.toFixed(5)} &nbsp;·&nbsp; r = ${zone.radius} m</div>
  </div>
  <div id="pill" class="pill" style="background:rgba(184,232,64,0.14);color:#B8E840;">INSIDE</div>
</div>
<script>
var map = L.map('map',{zoomControl:true,attributionControl:false}).setView([${zone.lat},${zone.lon}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
L.circle([${zone.lat},${zone.lon}],{
  radius:${zone.radius}, color:'#B8E840', weight:2.5,
  fillColor:'#B8E840', fillOpacity:0.08, dashArray:'8 5'
}).addTo(map);
var cIcon = L.divIcon({html:'<div style="width:10px;height:10px;border-radius:50%;background:#B8E840;border:2px solid #fff"></div>',className:'',iconAnchor:[5,5]});
L.marker([${zone.lat},${zone.lon}],{icon:cIcon}).addTo(map);
var vIcon = L.divIcon({html:'<div style="font-size:26px;filter:drop-shadow(0 0 6px #B8E840)">🛵</div>',className:'',iconAnchor:[13,13]});
var vm = L.marker([${vehicleLat},${vehicleLon}],{icon:vIcon}).addTo(map);
function hav(a,b,c,d){var R=6371000,t=x=>x*Math.PI/180,dA=t(c-a),dB=t(d-b),q=Math.sin(dA/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dB/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}
function upd(){var d=hav(${zone.lat},${zone.lon},${vehicleLat},${vehicleLon}),ins=d<=${zone.radius},p=document.getElementById('pill');p.style.background=ins?'rgba(184,232,64,0.14)':'rgba(239,68,68,0.12)';p.style.color=ins?'#B8E840':'#ef4444';p.textContent=ins?'INSIDE':'OUTSIDE ('+Math.round(d)+'m)';}
upd();
window.updateVehicle=function(a,b){vm.setLatLng([a,b]);upd();};
</script>
</body></html>`;
}

export default function ControlScreen() {
    const ctx = useTelematicsContext();
    const immob = ctx?.immobActive ?? false;
    // If immob is on, context forces ignition off immediately (before next packet)
    const ign = immob ? false : (ctx?.ignitionActive ?? false);
    // GPS: may be null until first full packet with GPS data arrives
    const lat = ctx?.latestPacket?.latitude ?? 12.9716;
    const lon = ctx?.latestPacket?.longitude ?? 77.5946;
    const hasGps = ctx?.latestPacket?.hasGps ?? false;

    const [showImmobModal, setShowImmobModal] = useState(false);
    const [pendingImmob, setPendingImmob] = useState(false);
    const zones = ctx?.zones ?? [];
    const setZones = ctx?.setZones ?? (() => { });
    const [showGeoModal, setShowGeoModal] = useState(false);
    const [geoName, setGeoName] = useState('');
    const [geoRadius, setGeoRadius] = useState('500');
    const [geoLat, setGeoLat] = useState('');
    const [geoLon, setGeoLon] = useState('');
    const [mapZone, setMapZone] = useState(null);
    const mapWebRef = useRef(null);
    const zoneMapHtmlRef = useRef(null); // frozen HTML for zone map
    const prevInsideRef = useRef({});

    // Freeze zone map HTML when zone is opened — never changes after that
    const openZoneMap = (zone) => {
        zoneMapHtmlRef.current = buildZoneMapHTML(zone, lat, lon);
        setMapZone(zone);
    };

    const requestToggle = (val) => { setPendingImmob(val); setShowImmobModal(true); };
    const confirmToggle = () => {
        setShowImmobModal(false);
        ctx.handleImmobToggle(pendingImmob);
        publishImmobilizerCommand(pendingImmob);
    };

    const addZone = () => {
        const r = parseInt(geoRadius, 10);
        const la = parseFloat(geoLat || lat);
        const lo = parseFloat(geoLon || lon);
        if (!geoName.trim()) { Alert.alert('Name required', 'Enter a zone name.'); return; }
        if (isNaN(r) || r < 50) { Alert.alert('Invalid radius', 'Radius must be ≥ 50 m.'); return; }
        setZones(prev => [...prev, { id: Date.now().toString(), name: geoName.trim(), radius: r, lat: la, lon: lo }]);
        setGeoName(''); setGeoRadius('500'); setGeoLat(''); setGeoLon('');
        setShowGeoModal(false);
    };
    const removeZone = (id) => {
        delete prevInsideRef.current[id];
        setZones(prev => prev.filter(z => z.id !== id));
        if (mapZone?.id === id) setMapZone(null);
    };

    const distance = (z) => {
        const R = 6371000, rad = d => d * Math.PI / 180;
        const dLat = rad(lat - z.lat), dLon = rad(lon - z.lon);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(z.lat)) * Math.cos(rad(lat)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    /* live vehicle update in map modal */
    useEffect(() => {
        mapWebRef.current?.injectJavaScript(`window.updateVehicle&&window.updateVehicle(${lat},${lon});true;`);
    }, [lat, lon]);

    /* auto-immobilize on breach */
    useEffect(() => {
        zones.forEach(zone => {
            const dist = distance(zone), inside = dist <= zone.radius;
            const was = prevInsideRef.current[zone.id];
            if (was === undefined) { prevInsideRef.current[zone.id] = inside; return; }
            if (was && !inside && !immob) {
                ctx.handleImmobToggle(true);
                publishImmobilizerCommand(true);
                Alert.alert('🚨 Geofence Breach!', `Vehicle left "${zone.name}". Immobilizer activated.`, [{ text: 'OK' }]);
            }
            prevInsideRef.current[zone.id] = inside;
        });
    }, [lat, lon]);

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <View>
                    <Text style={S.headerSub}>Vajra</Text>
                    <Text style={S.headerTitle}>Device Control</Text>
                </View>
                <View style={[S.pill, { backgroundColor: immob ? 'rgba(239,68,68,0.12)' : 'rgba(184,232,64,0.12)' }]}>
                    <View style={[S.pillDot, { backgroundColor: immob ? RED : LIME }]} />
                    <Text style={[S.pillText, { color: immob ? RED : LIME }]}>{immob ? 'IMMOB ON' : 'ACTIVE'}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>

                {/* ── Ignition Status Card ── */}
                <View style={S.statusCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color={ign ? LIME : '#ccc'} />
                        <Text style={S.statusCardLabel}>Ignition</Text>
                        <Text style={S.statusCardSub}>· DI1</Text>
                    </View>
                    <View style={S.statusCardRow}>
                        <View>
                            <Text style={[S.statusCardBig, { color: ign ? '#3a5c00' : '#ccc' }]}>{ign ? 'ON' : 'OFF'}</Text>
                            <Text style={S.statusCardHint}>{ign ? 'Engine running' : 'Engine off'}</Text>
                        </View>
                        <View style={[S.statusIndicator, { backgroundColor: ign ? 'rgba(184,232,64,0.15)' : 'rgba(0,0,0,0.04)' }]}>
                            <View style={[S.indicatorDot, { backgroundColor: ign ? LIME : '#ddd' }]} />
                        </View>
                    </View>
                </View>

                {/* ── Immobilizer Card + Button ── */}
                <View style={[S.statusCard, { borderColor: immob ? 'rgba(239,68,68,0.3)' : 'rgba(184,232,64,0.2)', borderWidth: 1.5 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Shield size={16} color={immob ? RED : '#ccc'} />
                        <Text style={S.statusCardLabel}>Immobilizer</Text>
                        <Text style={S.statusCardSub}>· DO1</Text>
                    </View>
                    <View style={S.statusCardRow}>
                        <View>
                            <Text style={[S.statusCardBig, { color: immob ? RED : '#aaa' }]}>{immob ? 'ON' : 'OFF'}</Text>
                            <Text style={S.statusCardHint}>{immob ? 'Engine cut — DO1 HIGH' : 'Engine normal — DO1 LOW'}</Text>
                        </View>
                        <View style={[S.statusIndicator, { backgroundColor: immob ? 'rgba(239,68,68,0.12)' : 'rgba(184,232,64,0.12)' }]}>
                            <View style={[S.indicatorDot, { backgroundColor: immob ? RED : LIME }]} />
                        </View>
                    </View>
                    {/* Prominent immobilizer button */}
                    <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() => requestToggle(!immob)}
                        style={[S.immobBtn, { backgroundColor: immob ? '#fff5f5' : DARK, borderColor: immob ? RED : DARK }]}
                    >
                        <View style={[S.immobBtnIcon, { backgroundColor: immob ? RED : LIME }]}>
                            <Shield size={22} color={immob ? '#fff' : DARK} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[S.immobBtnTitle, { color: immob ? RED : '#fff' }]}>
                                {immob ? 'Deactivate Immobilizer' : 'Activate Immobilizer'}
                            </Text>
                            <Text style={[S.immobBtnSub, { color: immob ? '#f87171' : '#555' }]}>
                                {immob ? 'Tap to restore engine signal' : 'Tap to cut engine signal'}
                            </Text>
                        </View>
                        <ChevronRight size={18} color={immob ? RED : '#555'} />
                    </TouchableOpacity>
                </View>

                {/* warning */}
                {immob && (
                    <View style={S.warnCard}>
                        <AlertTriangle size={13} color={AMBER} />
                        <Text style={S.warnText}>Immobilizer is active — engine signal cut (DO1 HIGH).</Text>
                    </View>
                )}

                {/* ══════════════════════════════════════ */}
                {/*          GEOFENCING — HERO            */}
                {/* ══════════════════════════════════════ */}
                <View style={S.geoHeader}>
                    <View>
                        <Text style={S.geoTitle}>Geofencing</Text>
                        <Text style={S.geoSub}>Auto-immobilize on zone exit</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowGeoModal(true)} style={S.addBtn}>
                        <PlusCircle size={16} color={DARK} />
                        <Text style={S.addBtnText}>Add Zone</Text>
                    </TouchableOpacity>
                </View>

                {zones.length === 0 ? (
                    <View style={S.emptyCard}>
                        <View style={S.emptyCircle}>
                            <MapPin size={40} color={LIME} />
                        </View>
                        <Text style={S.emptyTitle}>No zones set up</Text>
                        <Text style={S.emptyText}>Add a geofence zone to automatically stop{'\n'}the vehicle when it leaves the area.</Text>
                        <TouchableOpacity onPress={() => setShowGeoModal(true)} style={S.emptyBtn}>
                            <PlusCircle size={16} color={DARK} />
                            <Text style={S.emptyBtnText}>Create First Zone</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    zones.map(zone => {
                        const dist = distance(zone);
                        const inside = dist <= zone.radius;
                        const color = inside ? LIME : RED;
                        const pct = Math.max(0, Math.min(100, (1 - dist / zone.radius) * 100));
                        return (
                            <TouchableOpacity
                                key={zone.id}
                                activeOpacity={0.9}
                                onPress={() => openZoneMap(zone)}
                                style={[S.zoneCard, { borderColor: inside ? 'rgba(184,232,64,0.35)' : 'rgba(239,68,68,0.3)' }]}
                            >
                                {/* Card header */}
                                <View style={S.rowBetween}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[S.zoneIconBox, { backgroundColor: inside ? 'rgba(184,232,64,0.15)' : 'rgba(239,68,68,0.10)' }]}>
                                            <MapPin size={20} color={color} />
                                        </View>
                                        <View>
                                            <Text style={S.zoneName}>{zone.name}</Text>
                                            <Text style={S.zoneMeta}>r = {zone.radius} m</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[S.zonePill, { backgroundColor: inside ? 'rgba(184,232,64,0.15)' : 'rgba(239,68,68,0.10)' }]}>
                                            <View style={[S.pillDot, { backgroundColor: color }]} />
                                            <Text style={[S.zonePillText, { color }]}>{inside ? 'INSIDE' : 'OUTSIDE'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeZone(zone.id)} style={S.deleteBtn}>
                                            <Trash2 size={16} color={RED} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Main body: circle preview left, stats right */}
                                <View style={S.zoneBody}>
                                    <View style={S.zoneCircleWrap}>
                                        <GeoCirclePreview inside={inside} dist={dist} radius={zone.radius} size={160} />
                                    </View>

                                    <View style={S.zoneStats}>
                                        {/* distance bar */}
                                        <Text style={S.zoneStatHead}>Distance from centre</Text>
                                        <Text style={[S.zoneStatBig, { color }]}>{Math.round(dist)} m</Text>
                                        <View style={S.progressTrack}>
                                            <View style={[S.progressFill, {
                                                width: `${Math.min(dist / zone.radius, 1) * 100}%`,
                                                backgroundColor: color,
                                            }]} />
                                        </View>
                                        <Text style={S.zoneStatSub}>of {zone.radius} m radius</Text>

                                        <View style={S.divider} />

                                        <View style={S.zoneStatRow}>
                                            <Text style={S.zoneStatLabel}>Status</Text>
                                            <Text style={[S.zoneStatVal, { color }]}>{inside ? 'Safe' : 'Breached'}</Text>
                                        </View>
                                        <View style={S.zoneStatRow}>
                                            <Text style={S.zoneStatLabel}>Remaining</Text>
                                            <Text style={[S.zoneStatVal, { color }]}>
                                                {inside ? `${Math.round(zone.radius - dist)} m` : '—'}
                                            </Text>
                                        </View>
                                        <View style={S.zoneStatRow}>
                                            <Text style={S.zoneStatLabel}>Lat / Lon</Text>
                                            <Text style={S.zoneStatVal}>{zone.lat.toFixed(3)}, {zone.lon.toFixed(3)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Tap-to-map footer */}
                                <View style={[S.zoneFooter, { backgroundColor: inside ? 'rgba(184,232,64,0.08)' : 'rgba(239,68,68,0.06)' }]}>
                                    <MapPin size={13} color={color} />
                                    <Text style={[S.zoneFooterText, { color }]}>Tap to open live map</Text>
                                    <ChevronRight size={13} color={color} style={{ marginLeft: 'auto' }} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Immobilizer Confirm Modal ── */}
            <Modal visible={showImmobModal} transparent animationType="slide">
                <View style={S.overlay}>
                    <View style={S.sheet}>
                        <View style={S.handle} />
                        <Text style={S.modalTitle}>{pendingImmob ? '⚠️ Activate Immobilizer?' : '✅ Deactivate Immobilizer?'}</Text>
                        <Text style={S.modalBody}>
                            {pendingImmob
                                ? 'This will cut the engine signal (DO1 HIGH). The vehicle will not start.'
                                : 'This will restore the engine signal (DO1 LOW). The vehicle can be started.'}
                        </Text>
                        <TouchableOpacity onPress={confirmToggle} style={[S.modalBtn, { backgroundColor: pendingImmob ? RED : LIME }]}>
                            <Text style={[S.modalBtnText, { color: pendingImmob ? '#fff' : DARK }]}>
                                {pendingImmob ? 'Yes, Immobilize' : 'Yes, Deactivate'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowImmobModal(false)} style={S.cancelBtn}>
                            <Text style={S.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Add Zone Modal ── */}
            <Modal visible={showGeoModal} transparent animationType="slide">
                <View style={S.overlay}>
                    <View style={S.sheet}>
                        <View style={S.handle} />
                        <Text style={S.modalTitle}>📍 Add Geofence Zone</Text>
                        <Text style={S.modalBody}>Leave coordinates blank to use the vehicle's current GPS position.</Text>
                        <Text style={S.inputLabel}>Zone Name</Text>
                        <TextInput style={S.input} placeholder="e.g. Home, Office" placeholderTextColor="#bbb" value={geoName} onChangeText={setGeoName} />
                        <Text style={S.inputLabel}>Radius (metres)</Text>
                        <TextInput style={S.input} placeholder="500" placeholderTextColor="#bbb" keyboardType="numeric" value={geoRadius} onChangeText={setGeoRadius} />
                        <Text style={S.inputLabel}>Centre Latitude (optional)</Text>
                        <TextInput style={S.input} placeholder={`${lat.toFixed(5)} (current)`} placeholderTextColor="#bbb" keyboardType="numeric" value={geoLat} onChangeText={setGeoLat} />
                        <Text style={S.inputLabel}>Centre Longitude (optional)</Text>
                        <TextInput style={S.input} placeholder={`${lon.toFixed(5)} (current)`} placeholderTextColor="#bbb" keyboardType="numeric" value={geoLon} onChangeText={setGeoLon} />
                        <TouchableOpacity onPress={addZone} style={[S.modalBtn, { backgroundColor: LIME, marginTop: 10 }]}>
                            <Text style={[S.modalBtnText, { color: DARK }]}>Create Zone</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowGeoModal(false)} style={S.cancelBtn}>
                            <Text style={S.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Zone Map Modal ── */}
            <Modal visible={!!mapZone} transparent={false} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#0d1117' }}>
                    <View style={S.mapHeader}>
                        <View>
                            <Text style={S.mapHeaderTitle}>{mapZone?.name}</Text>
                            <Text style={S.mapHeaderSub}>Circular geofence · r = {mapZone?.radius} m</Text>
                        </View>
                        <TouchableOpacity onPress={() => setMapZone(null)} style={S.mapCloseBtn}>
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {mapZone && (
                        <WebView
                            ref={mapWebRef}
                            source={{ html: zoneMapHtmlRef.current }}
                            style={{ flex: 1 }}
                            javaScriptEnabled domStorageEnabled
                            originWhitelist={['*']} mixedContentMode="always"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    header: {
        paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerSub: { fontSize: 13, color: '#999', fontWeight: '600' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: DARK },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
    pillDot: { width: 6, height: 6, borderRadius: 3 },
    pillText: { fontSize: 10, fontWeight: '800' },

    /* ignition + immobilizer cards */
    statusCard: {
        backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 12,
        gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    statusCardLabel: { fontSize: 13, fontWeight: '800', color: '#999' },
    statusCardSub: { fontSize: 12, color: '#ccc', fontWeight: '600' },
    statusCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusCardBig: { fontSize: 30, fontWeight: '900', lineHeight: 34 },
    statusCardHint: { fontSize: 12, color: '#bbb', fontWeight: '600', marginTop: 2 },
    statusIndicator: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    indicatorDot: { width: 14, height: 14, borderRadius: 7 },
    immobBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16,
        borderWidth: 1.5, marginTop: 2,
    },
    immobBtnIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    immobBtnTitle: { fontSize: 15, fontWeight: '900' },
    immobBtnSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },

    /* warning */
    warnCard: {
        backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 14, padding: 12,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
        flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 12,
    },
    warnText: { fontSize: 12, color: RED, flex: 1, fontWeight: '600' },

    /* geofence hero header */
    geoHeader: {
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
        marginTop: 8, marginBottom: 16,
    },
    geoTitle: { fontSize: 22, fontWeight: '900', color: DARK },
    geoSub: { fontSize: 12, color: '#aaa', fontWeight: '600', marginTop: 2 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LIME, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9 },
    addBtnText: { fontSize: 13, fontWeight: '800', color: DARK },

    /* empty state */
    emptyCard: {
        backgroundColor: '#fff', borderRadius: 32, padding: 36, alignItems: 'center', gap: 14,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16, elevation: 4,
    },
    emptyCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(184,232,64,0.12)', alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: DARK },
    emptyText: { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LIME, borderRadius: 100, paddingHorizontal: 22, paddingVertical: 13, marginTop: 4 },
    emptyBtnText: { fontSize: 14, fontWeight: '800', color: DARK },

    /* zone card */
    zoneCard: {
        backgroundColor: '#fff', borderRadius: 28, marginBottom: 20, borderWidth: 1.5, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 20, elevation: 6,
        padding: 20, gap: 18,
    },
    zoneIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    zoneName: { fontSize: 17, fontWeight: '900', color: DARK },
    zoneMeta: { fontSize: 12, color: '#aaa', fontWeight: '600', marginTop: 2 },
    zonePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
    zonePillText: { fontSize: 10, fontWeight: '800' },
    deleteBtn: { padding: 8, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10 },

    zoneBody: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    zoneCircleWrap: { alignItems: 'center', justifyContent: 'center' },
    zoneStats: { flex: 1, gap: 6 },
    zoneStatHead: { fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    zoneStatBig: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
    progressTrack: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
    progressFill: { height: 6, borderRadius: 3 },
    zoneStatSub: { fontSize: 10, color: '#ccc', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 6 },
    zoneStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
    zoneStatLabel: { fontSize: 11, color: '#bbb', fontWeight: '600' },
    zoneStatVal: { fontSize: 11, fontWeight: '800', color: DARK },

    zoneFooter: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 14, padding: 12, marginTop: -4,
    },
    zoneFooterText: { fontSize: 12, fontWeight: '700' },

    /* modals */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
    handle: { width: 40, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: DARK, marginBottom: 6 },
    modalBody: { fontSize: 13, color: '#aaa', lineHeight: 20, marginBottom: 12 },
    modalBtn: { borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
    modalBtnText: { fontSize: 15, fontWeight: '800' },
    cancelBtn: { borderRadius: 100, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f5f5f5', marginTop: 6 },
    cancelText: { fontSize: 14, color: '#aaa', fontWeight: '600' },
    inputLabel: { fontSize: 11, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginTop: 12 },
    input: { backgroundColor: '#f7f7f7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: DARK, fontSize: 14, borderWidth: 1, borderColor: '#eee' },

    /* map modal */
    mapHeader: {
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#111520', borderBottomWidth: 1, borderBottomColor: '#1e2030',
    },
    mapHeaderTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
    mapHeaderSub: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 2 },
    mapCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
});
