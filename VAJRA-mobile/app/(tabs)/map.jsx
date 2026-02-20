import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import WebView from 'react-native-webview';
import { useTelematicsContext } from '../_layout';
import { HARDCODED_ROUTE, GEOFENCE_POLYGON } from '../../src/utils/dataSimulator';

const { width, height } = Dimensions.get('window');
const LIME = '#B8E840';
const CREAM = '#F2EDE8';

// Build the Leaflet HTML that runs inside WebView
function buildMapHTML(currentPos, speed, immob) {
  const routeJson = JSON.stringify(HARDCODED_ROUTE.map(p => [p.lat, p.lon]));
  const geofenceJson = JSON.stringify(GEOFENCE_POLYGON.map(p => [p.lat, p.lon]));
  const lat = currentPos?.lat ?? 12.9716;
  const lon = currentPos?.lon ?? 77.5946;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; background:#0d1117; }
  .speed-badge {
    position:fixed; top:16px; left:16px; z-index:1000;
    background:rgba(28,28,30,0.92); border-radius:16px;
    padding:10px 16px; backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.08);
  }
  .speed-badge .val { font-size:28px; font-weight:900; color:${LIME}; line-height:1; }
  .speed-badge .unit { font-size:12px; color:#888; }
  .status-badge {
    position:fixed; top:16px; right:16px; z-index:1000;
    background:${immob ? 'rgba(239,68,68,0.9)' : 'rgba(28,28,30,0.92)'}; border-radius:12px;
    padding:8px 14px; border:1px solid rgba(255,255,255,0.08);
    color:${immob ? 'white' : LIME}; font-size:11px; font-weight:700;
  }
  .coords-strip {
    position:fixed; bottom:16px; left:16px; right:16px; z-index:1000;
    background:rgba(28,28,30,0.92); border-radius:14px; padding:12px 16px;
    border:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between;
    align-items:center;
  }
  .coords-strip span { font-family:monospace; font-size:13px; color:${LIME}; font-weight:700; }
  .coords-strip small { font-size:10px; color:#555; }
</style>
</head>
<body>
<div id="map"></div>
<div class="speed-badge">
  <div class="val">${speed}</div>
  <div class="unit">km/h</div>
</div>
<div class="status-badge">${immob ? '🔴 IMMOB' : '🟢 MOBILE'}</div>
<div class="coords-strip">
  <span>${lat.toFixed(5)}° N</span>
  <small>GPS</small>
  <span>${lon.toFixed(5)}° E</span>
</div>
<script>
var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], 14);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

// Route
var route = ${routeJson};
L.polyline(route, { color:'${LIME}', weight:4, opacity:0.85, dashArray:'8,4' }).addTo(map);

// Geofence
var geo = ${geofenceJson};
geo.push(geo[0]);
L.polygon(geo, { color:'#f59e0b', weight:2, fillOpacity:0.08, dashArray:'6,4' }).addTo(map);

// Vehicle marker
var icon = L.divIcon({
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 8px ${LIME})">🛵</div>',
  className:'', iconAnchor:[14,14]
});
var marker = L.marker([${lat}, ${lon}], { icon }).addTo(map);

// Update vehicle position from React Native
window.updateVehicle = function(lat, lon, spd, immob) {
  marker.setLatLng([lat, lon]);
  document.querySelector('.speed-badge .val').textContent = spd;
  document.querySelector('.coords-strip span:first-child').textContent = lat.toFixed(5) + '° N';
  document.querySelector('.coords-strip span:last-child').textContent = lon.toFixed(5) + '° E';
  var sb = document.querySelector('.status-badge');
  sb.style.background = immob ? 'rgba(239,68,68,0.9)' : 'rgba(28,28,30,0.92)';
  sb.style.color = immob ? 'white' : '${LIME}';
  sb.textContent = immob ? '🔴 IMMOB' : '🟢 MOBILE';
  map.setView([lat, lon], map.getZoom());
};
</script>
</body>
</html>`;
}

export default function MapScreen() {
  const ctx = useTelematicsContext();
  const webRef = useRef(null);
  const p = ctx?.latestPacket;
  const immob = ctx?.immobActive ?? false;
  const speed = Math.round(p?.speed ?? 0);
  const currentPos = { lat: p?.latitude ?? 12.9716, lon: p?.longitude ?? 77.5946 };

  // Freeze initial HTML — never change source after first render
  const initialHTML = useRef(buildMapHTML(currentPos, speed, immob));

  // Push position + speed updates via JS injection only (no WebView reload)
  React.useEffect(() => {
    if (webRef.current && p) {
      webRef.current.injectJavaScript(
        `window.updateVehicle && window.updateVehicle(${p.latitude}, ${p.longitude}, ${Math.round(p.speed ?? 0)}, ${immob}); true;`
      );
    }
  }, [p, immob]);

  return (
    <View style={S.root}>
      <View style={S.header}>
        <Text style={S.headerTitle}>📍 Map View</Text>
        <View style={[S.pill, { backgroundColor: p?.fixStatus === 1 ? 'rgba(184,232,64,0.1)' : 'rgba(239,68,68,0.1)' }]}>
          <View style={[S.dot, { backgroundColor: p?.fixStatus === 1 ? LIME : '#ef4444' }]} />
          <Text style={[S.pillText, { color: p?.fixStatus === 1 ? LIME : '#ef4444' }]}>
            {p?.fixStatus === 1 ? 'GPS FIXED' : 'NO FIX'}
          </Text>
        </View>
      </View>
      <WebView
        ref={webRef}
        source={{ html: initialHTML.current }}
        style={S.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: CREAM,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  map: { flex: 1 },
});

