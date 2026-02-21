import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useTelematicsContext } from '../_layout';
import { HARDCODED_ROUTE } from '../../src/utils/dataSimulator';

const LIME = '#B8E840';
const DARK = '#1C1C1E';

/* ─────────────────────────────────────────────────────────── */
/*  Build the full Leaflet HTML — all pro features inside      */
/* ─────────────────────────────────────────────────────────── */
function buildMapHTML({ initLat, initLon, initSpeed, initImmob, initVoltPct, initSignal, zones, packetHistory }) {

  const zonesJson = JSON.stringify(zones.map(z => ({ lat: z.lat, lon: z.lon, radius: z.radius, name: z.name })));
  // Trail: last 30 positions from packet history (oldest → newest) -- only include packets that have GPS
  const trailJson = JSON.stringify(
    [...packetHistory].reverse().filter(p => p.hasGps && p.latitude !== null).slice(0, 30).map(p => [p.latitude, p.longitude])
  );
  // Heatmap points
  const heatJson = JSON.stringify(
    packetHistory.filter(p => p.hasGps && p.latitude !== null).slice(0, 40).map(p => [p.latitude, p.longitude, 0.6])
  );
  const signalBars = 3; // real packets don't include signal strength; show 3 bars as default

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
html,body,#map{width:100%;height:100%;background:#0d1117;}

/* ── Telemetry HUD (top-left) ── */
.hud{
  position:fixed;top:16px;left:16px;z-index:900;
  background:rgba(13,17,23,0.88);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,0.07);border-radius:20px;
  padding:14px 18px;min-width:150px;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
}
.hud-speed{font-size:42px;font-weight:900;color:${LIME};line-height:1;letter-spacing:-2px;}
.hud-speed-unit{font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;margin-bottom:10px;}
.hud-row{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:10px;}
.hud-label{font-size:9px;color:rgba(255,255,255,0.35);font-weight:700;text-transform:uppercase;letter-spacing:.8px;}
.hud-val{font-size:14px;font-weight:900;color:#fff;}
.hud-sub{font-size:9px;color:rgba(255,255,255,0.4);font-weight:600;}
.signal-bars{display:flex;align-items:flex-end;gap:2px;height:14px;}
.bar{width:4px;background:rgba(255,255,255,0.15);border-radius:2px;}
.bar.active{background:${LIME};}
.divider{height:1px;background:rgba(255,255,255,0.06);margin:10px 0;}

/* ── Status pill (top-right) ── */
.status-pill{
  position:fixed;top:16px;right:16px;z-index:900;
  display:flex;align-items:center;gap:8px;
  background:rgba(13,17,23,0.88);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,0.07);border-radius:100px;
  padding:9px 16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);
}
.status-dot{width:9px;height:9px;border-radius:50%;}
.status-text{font-size:11px;font-weight:800;color:#fff;letter-spacing:.5px;}

/* ── Floating controls (right-center) ── */
.fab-stack{
  position:fixed;right:16px;top:50%;transform:translateY(-50%);
  z-index:900;display:flex;flex-direction:column;gap:10px;
}
.fab{
  width:48px;height:48px;border-radius:15px;
  background:rgba(13,17,23,0.88);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,0.08);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
  box-shadow:0 4px 20px rgba(0,0,0,0.5);
  transition:background .15s,transform .12s,border-color .15s;user-select:none;
  position:relative;
}
.fab svg{width:20px;height:20px;stroke:rgba(255,255,255,0.6);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:stroke .15s;}
.fab:active{background:rgba(184,232,64,0.2);transform:scale(0.91);}
.fab:active svg,.fab.active-layer svg{stroke:${LIME};}
.fab.active-layer{background:rgba(184,232,64,0.12);border-color:rgba(184,232,64,0.28);}
/* label on hover */
.fab::after{
  content:attr(data-label);
  position:absolute;right:calc(100% + 10px);white-space:nowrap;
  background:rgba(13,17,23,0.92);color:#fff;
  font-size:10px;font-weight:800;letter-spacing:.5px;
  border-radius:8px;padding:5px 10px;
  border:1px solid rgba(255,255,255,0.07);
  opacity:0;pointer-events:none;transform:translateX(6px);
  transition:opacity .15s,transform .15s;
}
.fab:hover::after{opacity:1;transform:translateX(0);}

/* ── Alert banners ── */
.alerts{
  position:fixed;top:80px;left:50%;transform:translateX(-50%);
  z-index:950;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;
}
.alert{
  display:flex;align-items:center;gap:8px;
  border-radius:100px;padding:8px 18px;
  font-size:12px;font-weight:800;letter-spacing:.3px;
  backdrop-filter:blur(12px);border:1px solid;
  animation:slideIn .3s ease;
}
.alert-red  {background:rgba(239,68,68,0.18);border-color:rgba(239,68,68,0.35);color:#fc8181;}
.alert-amber{background:rgba(245,158,11,0.18);border-color:rgba(245,158,11,0.30);color:#fcd34d;}
.alert-lime {background:rgba(184,232,64,0.12);border-color:rgba(184,232,64,0.25);color:${LIME};}
@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}

/* ── Timeline picker (bottom) ── */
.tl-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:900;
  background:rgba(13,17,23,0.94);backdrop-filter:blur(18px);
  border-top:1px solid rgba(255,255,255,0.06);
  padding:14px 18px 30px;
}
.tl-header{
  display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;
}
.tl-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;}
.tl-badge{
  font-size:9px;font-weight:900;letter-spacing:.8px;
  border-radius:100px;padding:3px 10px;
  background:rgba(184,232,64,0.12);color:${LIME};
  border:1px solid rgba(184,232,64,0.22);
}
.tl-row{display:flex;gap:10px;align-items:flex-end;}
.tl-group{flex:1;display:flex;flex-direction:column;gap:5px;}
.tl-label{font-size:9px;font-weight:800;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:.8px;}
.tl-inputs{display:flex;gap:6px;}
.tl-input{
  flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
  border-radius:10px;padding:8px 10px;color:#fff;
  font-size:11px;font-weight:700;font-family:-apple-system,sans-serif;
  outline:none;-webkit-appearance:none;appearance:none;
  color-scheme:dark;
}
.tl-input:focus{border-color:rgba(184,232,64,0.35);background:rgba(184,232,64,0.05);}
.tl-divider{width:1px;background:rgba(255,255,255,0.06);align-self:stretch;margin-bottom:0;}
.tl-apply{
  background:${LIME};color:#0d1117;
  border:none;border-radius:12px;padding:10px 16px;
  font-size:11px;font-weight:900;letter-spacing:.5px;
  cursor:pointer;white-space:nowrap;
  transition:opacity .15s,transform .1s;
}
.tl-apply:active{opacity:0.8;transform:scale(0.96);}

/* coords */
.coords{
  position:fixed;bottom:72px;left:50%;transform:translateX(-50%);z-index:900;
  background:rgba(13,17,23,0.7);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.05);border-radius:100px;
  padding:5px 14px;font-family:monospace;font-size:10px;
  color:rgba(184,232,64,0.7);font-weight:700;white-space:nowrap;pointer-events:none;
}

/* zone tooltip */
.leaflet-tooltip{
  background:rgba(13,17,23,0.92)!important;border:1px solid rgba(184,232,64,0.25)!important;
  color:${LIME}!important;font-size:11px!important;font-weight:800!important;
  border-radius:10px!important;box-shadow:0 4px 20px rgba(0,0,0,0.5)!important;
  padding:5px 12px!important;letter-spacing:.3px;
}
.leaflet-tooltip-left::before,.leaflet-tooltip-right::before,.leaflet-tooltip-top::before,.leaflet-tooltip-bottom::before{
  border-color:transparent!important;
}
</style>
</head>
<body>
<div id="map"></div>

<!-- Telemetry HUD -->
<div class="hud">
  <div class="hud-speed" id="hudSpeed">${Math.round(initSpeed)}</div>
  <div class="hud-speed-unit">km / h</div>
  <div class="divider"></div>
  <div class="hud-row">
    <div>
      <div class="hud-label">Battery</div>
      <div class="hud-val" id="hudBatt">${Math.round(initVoltPct)}%</div>
    </div>
    <div>
      <div class="hud-label">Range</div>
      <div class="hud-val" id="hudRange">${Math.round(initVoltPct * 1.1)} km</div>
    </div>
  </div>
  <div class="hud-row" style="margin-top:6px">
    <div class="hud-label">Signal</div>
    <div class="signal-bars" id="signalBars">
      <div class="bar" style="height:4px"></div>
      <div class="bar" style="height:7px"></div>
      <div class="bar" style="height:10px"></div>
      <div class="bar" style="height:13px"></div>
    </div>
  </div>
</div>

<!-- Status pill -->
<div class="status-pill">
  <div class="status-dot" id="statusDot" style="background:${initImmob ? '#ef4444' : LIME}"></div>
  <div class="status-text" id="statusText">${initImmob ? 'IMMOBILIZED' : 'MOBILE'}</div>
</div>

<!-- Floating controls -->
<div class="fab-stack">
  <!-- Center on vehicle -->
  <div class="fab" id="btnCenter" data-label="CENTER">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/></svg>
  </div>
  <!-- Compass / north reset -->
  <div class="fab" id="btnCompass" data-label="NORTH">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="12,2 15.5,10 12,12" fill="${LIME}" stroke="none"/><polygon points="12,22 8.5,14 12,12" fill="rgba(255,255,255,0.25)" stroke="none"/><line x1="12" y1="2" x2="12" y2="22" stroke-width="0"/></svg>
  </div>
  <!-- Layer toggle -->
  <div class="fab" id="btnLayers" data-label="LAYERS">
    <svg id="layerIcon" viewBox="0 0 24 24"><polygon points="12,2 22,8.5 12,15 2,8.5"/><polyline points="2,15 12,21.5 22,15"/></svg>
  </div>
  <!-- Heatmap -->
  <div class="fab" id="btnHeat" data-label="HEATMAP">
    <svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-3 7-7 0-2.5-1.5-5-3-6.5C14.5 7 13 5 13 3c0 0-1 1.5-1 3.5 0 1-.5 2-1.5 2S9 7.5 9 6.5C7.5 8 6 11 6 14c0 4 2.5 8 6 8z"/></svg>
  </div>
</div>

<!-- Alerts -->
<div class="alerts" id="alertsBox"></div>

<!-- Timeline picker -->
<div class="tl-bar">
  <div class="tl-header">
    <span class="tl-title">Movement Timeline</span>
    <span class="tl-badge" id="tlBadge">LIVE</span>
  </div>
  <div class="tl-row">
    <div class="tl-group">
      <div class="tl-label">Start</div>
      <div class="tl-inputs">
        <input class="tl-input" type="date" id="startDate" />
        <input class="tl-input" type="time" id="startTime" />
      </div>
    </div>
    <div class="tl-divider"></div>
    <div class="tl-group">
      <div class="tl-label">End</div>
      <div class="tl-inputs">
        <input class="tl-input" type="date" id="endDate" />
        <input class="tl-input" type="time" id="endTime" />
      </div>
    </div>
    <button class="tl-apply" id="tlApply">APPLY</button>
  </div>
</div>

<!-- Coords -->
<div class="coords" id="coordsBar">${initLat.toFixed(5)}° N &nbsp;·&nbsp; ${initLon.toFixed(5)}° E</div>

<script>
var LIME = '${LIME}';
var map = L.map('map',{zoomControl:false,attributionControl:false}).setView([${initLat},${initLon}],15);

/* ── Map tile layers ── */
var layers = {
  dark:       L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}),
  satellite:  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}),
  streets:    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}),
};
var layerKeys = ['dark','satellite','streets'];
var layerIdx  = 0;
layers.dark.addTo(map);



/* ── Movement trail (recent history) ── */
var trailData = ${trailJson};
var trailLine = null;
if(trailData.length > 1){
  trailLine = L.polyline(trailData,{
    color:'rgba(184,232,64,0.85)',weight:4,opacity:1,lineJoin:'round',
    renderer: L.canvas()
  }).addTo(map);
}

/* ── Faint planned route ghost ── */
var routeData = ${JSON.stringify(HARDCODED_ROUTE ? HARDCODED_ROUTE.map(p => [p.lat, p.lon]) : [])};
if(routeData.length > 1){
  L.polyline(routeData,{
    color:'rgba(255,255,255,0.1)',weight:1.5,opacity:1,
    dashArray:'6 10',lineJoin:'round'
  }).addTo(map);
}

/* ── Heatmap layer ── */
var heatData   = ${heatJson};
var heatLayer  = null;
var heatVisible= false;
if(heatData.length > 0 && L.heatLayer){
  heatLayer = L.heatLayer(heatData,{radius:30,blur:20,maxZoom:17,minOpacity:0.5,gradient:{'0.2':'#0f172a','0.45':'#1e3a5f','0.65':'#4c1d95','0.85':'#365314','1':'#B8E840'}});
}

/* ── Geofence zones ── */
var zones = ${zonesJson};
var zoneLayers = [];
zones.forEach(function(z){
  // Outer glow ring  
  L.circle([z.lat,z.lon],{
    radius:z.radius*1.18,color:LIME,weight:0,fillColor:LIME,fillOpacity:0.025
  }).addTo(map);
  // Dashed main circle
  var c = L.circle([z.lat,z.lon],{
    radius:z.radius,color:LIME,weight:2.5,opacity:0.85,
    fillColor:LIME,fillOpacity:0.07,dashArray:'8 5'
  }).addTo(map);
  // Centre pin
  L.circleMarker([z.lat,z.lon],{radius:5,color:'#fff',weight:2,fillColor:LIME,fillOpacity:1}).addTo(map);
  // Tooltip
  c.bindTooltip('📍 '+z.name,{permanent:true,direction:'top',opacity:1});
  zoneLayers.push(c);

  // CSS pulse animation on the circle element  
  (function pulse(circle){
    var expanding=true, opacity=0.07;
    setInterval(function(){
      if(expanding){opacity+=0.015;}else{opacity-=0.015;}
      if(opacity>=0.14){expanding=false;}
      if(opacity<=0.04){expanding=true;}
      circle.setStyle({fillOpacity:opacity});
    },80);
  })(c);
});

/* ── Vehicle marker ── */
function makeVIcon(immob){
  return L.divIcon({
    html:'<div style="position:relative;width:40px;height:40px">'
      +'<div style="position:absolute;inset:0;border-radius:50%;background:'+(immob?'#ef4444':LIME)+';opacity:0.22;animation:ping 2s cubic-bezier(0,0,.2,1) infinite"></div>'
      +'<div style="position:absolute;inset:6px;border-radius:50%;background:'+(immob?'rgba(239,68,68,0.15)':'rgba(184,232,64,0.15)')+';border:2px solid '+(immob?'#ef4444':LIME)+';display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1">🛵</div>'
      +'</div>',
    className:'',iconAnchor:[20,20]
  });
}
var style=document.createElement('style');
style.textContent='@keyframes ping{0%{transform:scale(.9);opacity:.22}70%{transform:scale(2);opacity:0}100%{transform:scale(2);opacity:0}}';
document.head.appendChild(style);
var vMarker=L.marker([${initLat},${initLon}],{icon:makeVIcon(${initImmob}),zIndexOffset:1000}).addTo(map);

/* ── Signal bars ── */
function updateSignalBars(bars){
  var els=document.querySelectorAll('.bar');
  els.forEach(function(b,i){
    b.className='bar'+(i<bars?' active':'');
  });
}
updateSignalBars(${signalBars});

/* ── Alerts ── */
var activeAlerts={};
function showAlert(id,cls,emoji,msg){
  if(activeAlerts[id]) return;
  var box=document.getElementById('alertsBox');
  var el=document.createElement('div');
  el.className='alert '+cls;
  el.innerHTML=emoji+' '+msg;
  box.appendChild(el);
  activeAlerts[id]=el;
  setTimeout(function(){el.remove();delete activeAlerts[id];},5000);
}
function clearAlert(id){
  if(activeAlerts[id]){activeAlerts[id].remove();delete activeAlerts[id];}
}

/* ── Floating control handlers ── */
document.getElementById('btnCenter').addEventListener('click',function(){
  map.flyTo(vMarker.getLatLng(),16,{animate:true,duration:1.2});
});
document.getElementById('btnCompass').addEventListener('click',function(){
  map.setBearing && map.setBearing(0);
  map.flyTo(map.getCenter(),map.getZoom(),{animate:true,duration:.5});
});
document.getElementById('btnLayers').addEventListener('click',function(){
  layers[layerKeys[layerIdx]].remove();
  layerIdx=(layerIdx+1)%layerKeys.length;
  layers[layerKeys[layerIdx]].addTo(map);
  var btn=document.getElementById('btnLayers');
  btn.classList.toggle('active-layer',layerIdx!==0);
  var labels=['LAYERS','SATELLITE','STREETS'];
  var icons=[
    '<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:rgba(255,255,255,0.6);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round"><polygon points="12,2 22,8.5 12,15 2,8.5"/><polyline points="2,15 12,21.5 22,15"/></svg>',
    '<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:rgba(255,255,255,0.6);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    '<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:rgba(255,255,255,0.6);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
  ];
  btn.innerHTML=icons[layerIdx];
  btn.setAttribute('data-label',labels[layerIdx]);
});
document.getElementById('btnHeat').addEventListener('click',function(){
  if(!heatLayer) return;
  var btn=document.getElementById('btnHeat');
  if(heatVisible){heatLayer.remove();btn.classList.remove('active-layer');}
  else{heatLayer.addTo(map);btn.classList.add('active-layer');}
  heatVisible=!heatVisible;
});

/* ── Timeline date/time picker ── */
// Build timestamp list from trail data + packet history
var allPoints = ${trailJson}; // [lat,lon] ordered oldest→newest
var allTimes  = ${JSON.stringify([...packetHistory].reverse().slice(0, 30).map(p => p.dateTime * 1000))}; // ms timestamps

// Set default inputs to today
(function(){
  var now = new Date();
  var pad = function(n){return String(n).padStart(2,'0');};
  var dateStr = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  var startHour = pad(now.getHours()-1 < 0 ? 0 : now.getHours()-1);
  var endHour   = pad(now.getHours());
  document.getElementById('startDate').value = dateStr;
  document.getElementById('startTime').value = startHour+':00';
  document.getElementById('endDate').value   = dateStr;
  document.getElementById('endTime').value   = endHour+':'+pad(now.getMinutes());
})();

var filteredLine = null;

function applyTimeFilter(){
  var sd = document.getElementById('startDate').value;
  var st = document.getElementById('startTime').value;
  var ed = document.getElementById('endDate').value;
  var et = document.getElementById('endTime').value;
  if(!sd||!st||!ed||!et) return;

  var startMs = new Date(sd+'T'+st).getTime();
  var endMs   = new Date(ed+'T'+et).getTime();
  if(startMs >= endMs){ alert('Start must be before End'); return; }

  // Filter trail points by timestamp range
  var filtered = [];
  for(var i=0;i<allPoints.length;i++){
    var t = allTimes[i] || 0;
    if(t >= startMs && t <= endMs) filtered.push(allPoints[i]);
  }

  // Remove old filtered line
  if(filteredLine){ map.removeLayer(filteredLine); filteredLine=null; }

  // If we have a range, draw it orange; hide regular trail
  if(filtered.length > 0){
    filteredLine = L.polyline(filtered,{
      color:'#f59e0b', weight:5, opacity:1, lineJoin:'round'
    }).addTo(map);
    map.fitBounds(filteredLine.getBounds(), {padding:[40,40]});
    document.getElementById('tlBadge').textContent = filtered.length+' PTS';
    document.getElementById('tlBadge').style.background='rgba(245,158,11,0.14)';
    document.getElementById('tlBadge').style.color='#fcd34d';
    document.getElementById('tlBadge').style.borderColor='rgba(245,158,11,0.3)';
  } else {
    document.getElementById('tlBadge').textContent='NO DATA';
    document.getElementById('tlBadge').style.background='rgba(239,68,68,0.12)';
    document.getElementById('tlBadge').style.color='#fc8181';
    document.getElementById('tlBadge').style.borderColor='rgba(239,68,68,0.25)';
  }
}

document.getElementById('tlApply').addEventListener('click', applyTimeFilter);

// Clicking LIVE badge resets to live view
document.getElementById('tlBadge').addEventListener('click', function(){
  if(filteredLine){ map.removeLayer(filteredLine); filteredLine=null; }
  this.textContent='LIVE';
  this.style.background='rgba(184,232,64,0.12)';
  this.style.color='${LIME}';
  this.style.borderColor='rgba(184,232,64,0.22)';
  map.flyTo(vMarker.getLatLng(), 15, {animate:true,duration:1.2});
});

/* ── Update from React Native ── */
var speedHistory=[];
window.updateVehicle=function(lat,lon,spd,immob,voltPct,signal){
  // Always update live vehicle position
  vMarker.setLatLng([lat,lon]);
  vMarker.setIcon(makeVIcon(immob));
  map.panTo([lat,lon],{animate:true,duration:1.6,easeLinearity:.4});
  // HUD updates
  document.getElementById('hudSpeed').textContent=Math.round(spd);
  document.getElementById('hudBatt').textContent=Math.round(voltPct)+'%';
  document.getElementById('hudRange').textContent=Math.round(voltPct*1.1)+' km';
  document.getElementById('coordsBar').textContent=lat.toFixed(5)+'° N  ·  '+lon.toFixed(5)+'° E';
  // Status pill
  document.getElementById('statusDot').style.background=immob?'#ef4444':LIME;
  document.getElementById('statusText').textContent=immob?'IMMOBILIZED':'MOBILE';
  // Signal
  var bars=Math.ceil((signal/31)*4);
  updateSignalBars(bars);
  // Alerts
  speedHistory.push(spd);
  if(speedHistory.length>3) speedHistory.shift();
  var avgSpd=speedHistory.reduce(function(a,b){return a+b;},0)/speedHistory.length;
  if(avgSpd>80){showAlert('overspeed','alert-red','⚡','Overspeed detected: '+Math.round(avgSpd)+' km/h');}
  else{clearAlert('overspeed');}
  if(voltPct<20){showAlert('batt','alert-amber','🔋','Low battery: '+Math.round(voltPct)+'%');}
  else{clearAlert('batt');}
  if(immob){showAlert('immob','alert-red','🔒','Immobilizer is active');}
  else{clearAlert('immob');}
};
window.updateZones=function(newZones){
  var badge=document.getElementById('tlBadge');
  if(badge){badge.textContent='LIVE';badge.style.background='rgba(184,232,64,0.12)';badge.style.color='${LIME}';badge.style.borderColor='rgba(184,232,64,0.22)';}
  if(filteredLine){map.removeLayer(filteredLine);filteredLine=null;}
};
</script>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────── */
/*              MapScreen component                            */
/* ─────────────────────────────────────────────────────────── */
export default function MapScreen() {
  const ctx = useTelematicsContext();
  const webRef = useRef(null);
  const p = ctx?.latestPacket;
  const immob = ctx?.immobActive ?? false;
  const zones = ctx?.zones ?? [];
  const packetHistory = ctx?.packetHistory ?? [];

  // Real hardware packets: use null-safe GPS defaults (Bengaluru until first GPS fix)
  const initLat = p?.latitude ?? 12.9716;
  const initLon = p?.longitude ?? 77.5946;
  const hasGps = p?.hasGps ?? false;
  const fixOk = (p?.fixStatus ?? 0) >= 1;

  // Voltage: 10–14.5V lead-acid range → 0–100%
  const volt = p?.analogVoltage ?? null;
  const voltPct = volt !== null ? Math.min(100, Math.max(0, ((volt - 10) / 4.5) * 100)) : 0;

  // Rebuild HTML when zones list changes (key forces remount)
  const initialHTML = useMemo(
    () => buildMapHTML({ initLat, initLon, initSpeed: 0, initImmob: immob, initVoltPct: voltPct, initSignal: 3, zones, packetHistory }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zones.length]
  );

  // Memoize the SOURCE OBJECT too — React Native WebView reloads on ANY
  // reference change to `source`, even if the html string is identical.
  // This prevents the white-screen flash every 2s when GPS packets arrive.
  const webSource = useMemo(() => ({ html: initialHTML }), [initialHTML]);

  // Push live updates via JS injection only (no WebView reload)
  React.useEffect(() => {
    if (!p || !hasGps) return;  // skip if no GPS data in this packet
    webRef.current?.injectJavaScript(
      `window.updateVehicle && window.updateVehicle(${p.latitude},${p.longitude},0,${immob},${voltPct.toFixed(1)},3); true;`
    );
  }, [p, immob]);

  return (
    <View style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.headerSub}>Live tracking</Text>
          <Text style={S.headerTitle}>Vehicle Map</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {zones.length > 0 && (
            <View style={S.zoneCount}>
              <View style={S.zoneCountDot} />
              <Text style={S.zoneCountText}>{zones.length} ZONE{zones.length > 1 ? 'S' : ''}</Text>
            </View>
          )}
          <View style={[S.gpsPill, { backgroundColor: fixOk ? 'rgba(184,232,64,0.12)' : 'rgba(239,68,68,0.10)' }]}>
            <View style={[S.gpsDot, { backgroundColor: fixOk ? LIME : '#ef4444' }]} />
            <Text style={[S.gpsText, { color: fixOk ? LIME : '#ef4444' }]}>
              {fixOk ? 'GPS' : 'NO GPS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Map WebView */}
      <WebView
        key={zones.length}
        ref={webRef}
        source={webSource}
        style={[S.map, { backgroundColor: '#0d1117' }]}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: DARK,
  },
  headerSub: { fontSize: 12, color: '#444', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  gpsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  gpsDot: { width: 7, height: 7, borderRadius: 3.5 },
  gpsText: { fontSize: 11, fontWeight: '800' },
  zoneCount: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(184,232,64,0.1)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(184,232,64,0.2)' },
  zoneCountDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME },
  zoneCountText: { fontSize: 10, fontWeight: '800', color: LIME },
  map: { flex: 1 },
});
