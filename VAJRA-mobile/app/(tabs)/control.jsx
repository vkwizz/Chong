import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Alert,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';
import WebView from 'react-native-webview';
import { useTelematicsContext } from '../_layout';
import { Shield, AlertTriangle, MapPin, Trash2, PlusCircle, Zap, X, ChevronRight } from 'lucide-react-native';

const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';
const RED = '#ef4444';
const AMBER = '#f59e0b';

/* ─── SVG polygonal geofence preview ─── */
function GeoPolygonPreview({ inside, size = 160 }) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.36;
    const color = inside ? LIME : RED;
    // Abstract hexagon
    const pts = `${cx},${cy - r} ${cx + r * 0.86},${cy - r * 0.5} ${cx + r * 0.86},${cy + r * 0.5} ${cx},${cy + r} ${cx - r * 0.86},${cy + r * 0.5} ${cx - r * 0.86},${cy - r * 0.5}`;
    return (
        <Svg width={size} height={size}>
            <Polygon points={pts} stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.07} strokeDasharray="6 4" />
            <Line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.4} />
            <Line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke={color} strokeWidth={1.5} opacity={0.4} />
            <Circle cx={inside ? cx + 10 : cx + 70} cy={inside ? cy + 10 : cy - 10} r={8} fill={color} opacity={0.9} />
            <Circle cx={inside ? cx + 10 : cx + 70} cy={inside ? cy + 10 : cy - 10} r={3.5} fill="#fff" />
            <SvgText x={cx} y={size - 4} textAnchor="middle" fill={color} fontSize={9} fontWeight="800" opacity={0.85}>
                {inside ? 'INSIDE ZONE' : 'OUTSIDE ZONE'}
            </SvgText>
        </Svg>
    );
}

/* ─── Leaflet map HTML for drawing polygons ─── */
function buildDrawHTML(centerLat, centerLon, polygon) {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; background:#0d1117; }
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:false,attributionControl:false}).setView([${centerLat},${centerLon}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);

var pts = ${JSON.stringify(polygon)};
var poly = L.polygon(pts, {color: '#B8E840', weight: 2.5, fillColor: '#B8E840', fillOpacity: 0.15, dashArray:'8 5'}).addTo(map);

var markers = [];
function drawR() {
  markers.forEach(m => map.removeLayer(m)); markers = [];
  pts.forEach(p => {
    var cIcon = L.divIcon({html:'<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #B8E840"></div>',className:'',iconAnchor:[6,6]});
    var m = L.marker(p, {icon: cIcon}).addTo(map);
    markers.push(m);
  });
}
drawR();

map.on('click', function(e) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'add', lat: e.latlng.lat, lon: e.latlng.lng }));
});
window.updatePoly = function(newPts) {
  pts = newPts;
  poly.setLatLngs(newPts);
  drawR();
};
</script>
</body></html>`;
}

/* ─── Leaflet map HTML for polygonal preview ─── */
function buildZoneMapHTML(zone, vehicleLat, vehicleLon) {
    const polyStr = JSON.stringify(zone.polygon || []);
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
    <div class="zone-meta">📍 Polygonal Zone · ${zone.polygon ? zone.polygon.length : 0} points</div>
  </div>
  <div id="pill" class="pill" style="background:rgba(184,232,64,0.14);color:#B8E840;">INSIDE</div>
</div>
<script>
var polyPts = ${polyStr};
var map = L.map('map',{zoomControl:true,attributionControl:false});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);

var p = L.polygon(polyPts, {
  color:'#B8E840', weight:2.5,
  fillColor:'#B8E840', fillOpacity:0.08, dashArray:'8 5'
}).addTo(map);
if(polyPts.length > 0) map.fitBounds(p.getBounds(), {padding: [30,30]});

var vIcon = L.divIcon({html:'<div style="font-size:26px;filter:drop-shadow(0 0 6px #B8E840)">🛵</div>',className:'',iconAnchor:[13,13]});
var vm = L.marker([${vehicleLat},${vehicleLon}],{icon:vIcon}).addTo(map);

function isInside(lat, lon, vs) {
    if(!vs || vs.length < 3) return false;
    var x = lat, y = lon;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function upd(){
    var ins = isInside(${vehicleLat}, ${vehicleLon}, polyPts);
    var pEl = document.getElementById('pill');
    pEl.style.background=ins?'rgba(184,232,64,0.14)':'rgba(239,68,68,0.12)';
    pEl.style.color=ins?'#B8E840':'#ef4444';
    pEl.textContent=ins?'INSIDE':'OUTSIDE';
}
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
    const [geoModalOpen, setGeoModalOpen] = useState(false);
    const [geoName, setGeoName] = useState('');
    const [geoPolygon, setGeoPolygon] = useState([]);

    const [mapZone, setMapZone] = useState(null);
    const mapWebRef = useRef(null);
    const drawWebRef = useRef(null);
    const zoneMapHtmlRef = useRef(null); // frozen HTML for zone map
    const drawHtmlRef = useRef(''); // frozen HTML for drawing
    const prevInsideRef = useRef({});

    const openDrawModal = () => {
        drawHtmlRef.current = buildDrawHTML(lat, lon, []);
        setGeoName(''); setGeoPolygon([]);
        setGeoModalOpen(true);
    };

    // Freeze zone map HTML when zone is opened — never changes after that
    const openZoneMap = (zone) => {
        zoneMapHtmlRef.current = buildZoneMapHTML(zone, lat, lon);
        setMapZone(zone);
    };

    const requestToggle = (val) => { setPendingImmob(val); setShowImmobModal(true); };
    const confirmToggle = () => {
        setShowImmobModal(false);
        ctx.handleImmobToggle(pendingImmob);
    };

    const handleDrawMsg = (event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'add') {
            const newPts = [...geoPolygon, [data.lat, data.lon]];
            setGeoPolygon(newPts);
            drawWebRef.current?.injectJavaScript(`window.updatePoly(${JSON.stringify(newPts)});true;`);
        }
    };

    const addZone = () => {
        if (!geoName.trim()) { Alert.alert('Name required', 'Enter a zone name.'); return; }
        if (geoPolygon.length < 3) { Alert.alert('Invalid Polygon', 'Draw at least 3 points on the map.'); return; }
        setZones(prev => [...prev, { id: Date.now().toString(), name: geoName.trim(), polygon: geoPolygon }]);
        setGeoName(''); setGeoPolygon([]);
        setGeoModalOpen(false);
    };

    const removeZone = (id) => {
        delete prevInsideRef.current[id];
        setZones(prev => prev.filter(z => z.id !== id));
        if (mapZone?.id === id) setMapZone(null);
    };

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

    /* live vehicle update in map modal */
    useEffect(() => {
        mapWebRef.current?.injectJavaScript(`window.updateVehicle&&window.updateVehicle(${lat},${lon});true;`);
    }, [lat, lon]);

    /* auto-immobilize logic has been moved to global RootLayout for background persistence */

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <View>
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
                    <TouchableOpacity onPress={openDrawModal} style={S.addBtn}>
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
                        <Text style={S.emptyText}>Add a polygonal geofence to automatically{'\n'}stop the vehicle when it leaves the area.</Text>
                        <TouchableOpacity onPress={openDrawModal} style={S.emptyBtn}>
                            <PlusCircle size={16} color={DARK} />
                            <Text style={S.emptyBtnText}>Draw First Zone</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    zones.map(zone => {
                        const inside = isInsidePolygon(lat, lon, zone.polygon);
                        const color = inside ? LIME : RED;
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
                                            <Text style={S.zoneMeta}>Polygon · {zone.polygon.length} points</Text>
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
                                        <GeoPolygonPreview inside={inside} size={160} />
                                    </View>

                                    <View style={S.zoneStats}>
                                        <Text style={S.zoneStatHead}>Geometry</Text>
                                        <Text style={[S.zoneStatBig, { color }]}>{zone.polygon.length} pts</Text>

                                        <View style={S.divider} />

                                        <View style={S.zoneStatRow}>
                                            <Text style={S.zoneStatLabel}>Status</Text>
                                            <Text style={[S.zoneStatVal, { color }]}>{inside ? 'Safe' : 'Breached'}</Text>
                                        </View>
                                        <View style={S.zoneStatRow}>
                                            <Text style={S.zoneStatLabel}>Vertices</Text>
                                            <Text style={[S.zoneStatVal, { color }]}>{zone.polygon.length}</Text>
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

            {/* ── Draw Zone Modal ── */}
            <Modal visible={geoModalOpen} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: DARK }}>
                    <View style={S.mapHeader}>
                        <View>
                            <Text style={S.mapHeaderTitle}>Draw Polygon Zone</Text>
                            <Text style={S.mapHeaderSub}>Tap on the map to add boundaries</Text>
                        </View>
                        <TouchableOpacity onPress={() => setGeoModalOpen(false)} style={S.mapCloseBtn}>
                            <X size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        ref={drawWebRef}
                        source={{ html: drawHtmlRef.current }}
                        onMessage={handleDrawMsg}
                        style={{ flex: 1 }}
                        javaScriptEnabled domStorageEnabled
                    />
                    <View style={{ padding: 20, backgroundColor: DARK, borderTopWidth: 1, borderColor: '#333' }}>
                        <Text style={[S.inputLabel, { color: '#ccc' }]}>Zone Name</Text>
                        <TextInput style={[S.input, { backgroundColor: '#1C1C1E', color: '#fff', borderColor: '#444' }]} placeholder="e.g. Office Area" placeholderTextColor="#666" value={geoName} onChangeText={setGeoName} />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                            <TouchableOpacity onPress={() => { setGeoPolygon([]); drawWebRef.current?.injectJavaScript(`window.updatePoly([]);true;`); }} style={[S.modalBtn, { flex: 1, backgroundColor: '#333', marginTop: 0 }]}>
                                <Text style={[S.modalBtnText, { color: '#fff' }]}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={addZone} style={[S.modalBtn, { flex: 2, backgroundColor: LIME, marginTop: 0 }]}>
                                <Text style={[S.modalBtnText, { color: DARK }]}>Save Zone ({geoPolygon.length} pts)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Zone Map Modal ── */}
            <Modal visible={!!mapZone} transparent={false} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#0d1117' }}>
                    <View style={S.mapHeader}>
                        <View>
                            <Text style={S.mapHeaderTitle}>{mapZone?.name}</Text>
                            <Text style={S.mapHeaderSub}>Polygonal geofence · {mapZone?.polygon?.length || 0} pts</Text>
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
