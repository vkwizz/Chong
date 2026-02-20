import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Shield, BarChart2, Wifi, FileText, Settings } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './index.css';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import DeviceControl from './pages/DeviceControl';
import Analytics from './pages/Analytics';
import Network from './pages/Network';
import PacketViewer from './pages/PacketViewer';
import { generateSimulatedPacket, setImmobilizer } from './utils/dataSimulator';
import { emitPacket, connectMQTT, onControlReceived } from './utils/mqttClient';

// ─── Global State Context ────────────────────────────────────────────────────
export const TelematicsContext = createContext(null);

export function useTelematicsContext() {
  return useContext(TelematicsContext);
}

// ─── Toast ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }

// ─── Bottom Nav ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/control', icon: Shield, label: 'Control' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/network', icon: Wifi, label: 'Network' },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <div className="nav-icon-wrap">
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
function AppInner() {
  const [latestPacket, setLatestPacket] = useState(null);
  const [packetHistory, setPacketHistory] = useState([]);
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [immobActive, setImmobActive] = useState(false);
  const [mqttStatus, setMqttStatus] = useState('simulated');
  const addToast = useToast();

  useEffect(() => {
    // Try connecting to real HiveMQ broker
    connectMQTT((status) => {
      setMqttStatus(status);
      if (status === 'connected') addToast('📡 Connected to HiveMQ Cloud', 'success');
      if (status === 'error') addToast('⚠️ MQTT error — using simulation', 'error');
    });

    // ── Listen for incoming immobilizer control commands from MQTT ──────────
    // This fires when HiveMQ publishes {"command":"SET_DO","state":1} to the control topic
    const unsubControl = onControlReceived(({ state }) => {
      setImmobilizer(state);
      setImmobActive(state);
      addToast(
        state ? '🔴 Immobilizer ON — via MQTT' : '🟢 Immobilizer OFF — via MQTT',
        state ? 'error' : 'success'
      );
    });

    // Simulation loop (runs regardless, supplements real MQTT)
    const interval = setInterval(() => {
      const pkt = generateSimulatedPacket();
      if (pkt) {
        emitPacket(pkt);
        setLatestPacket(pkt);
        setPacketHistory(prev => [pkt, ...prev].slice(0, 50));
        setVoltageHistory(prev => [
          ...prev,
          { t: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), v: pkt.analogVoltage }
        ].slice(-30));
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      unsubControl(); // clean up MQTT listener on unmount
    };
  }, []);

  const handleImmobToggle = (val) => {
    setImmobilizer(val);
    setImmobActive(val);
    addToast(
      val ? '🔴 Immobilizer ACTIVATED' : '🟢 Immobilizer DEACTIVATED',
      val ? 'error' : 'success'
    );
  };

  const ctx = { latestPacket, packetHistory, voltageHistory, immobActive, handleImmobToggle, mqttStatus };

  return (
    <TelematicsContext.Provider value={ctx}>
      <div className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/control" element={<DeviceControl />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/network" element={<Network />} />
          <Route path="/packet" element={<PacketViewer />} />
        </Routes>
      </div>
      <BottomNav />
    </TelematicsContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BrowserRouter>
  );
}
