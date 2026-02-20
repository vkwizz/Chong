import mqtt from 'mqtt';
import { parsePacket } from './packetParser';

const CLUSTER_URL = '2c5f5e646e50448aa8061f20af50b0a2.s1.eu.hivemq.cloud';
const MQTT_USERNAME = 'telematics_device';
const MQTT_PASSWORD = 'VajraSecure2024';

export const MQTT_CONFIG = {
    brokerUrl: `wss://${CLUSTER_URL}:8884/mqtt`,
    topics: {
        telemetry: 'telematics/device/887744556677882/data',
        control: 'telematics/device/887744556677882/control',
    },
};

let client = null;
let listeners = [];
let immobilizerListeners = [];
let connected = false;

export const connectionStatus = { get connected() { return connected; } };

export function connectMQTT(onStatus) {
    if (!CLUSTER_URL || CLUSTER_URL === 'YOUR_CLUSTER_URL') {
        onStatus?.('simulated'); return;
    }
    onStatus?.('connecting');
    client = mqtt.connect(MQTT_CONFIG.brokerUrl, {
        username: MQTT_USERNAME, password: MQTT_PASSWORD,
        clientId: `vajra_rn_${Math.random().toString(16).slice(2, 8)}`,
        clean: true, reconnectPeriod: 3000, connectTimeout: 10000,
    });
    client.on('connect', () => {
        connected = true; onStatus?.('connected');
        client.subscribe(MQTT_CONFIG.topics.telemetry, { qos: 1 });
        client.subscribe(MQTT_CONFIG.topics.control, { qos: 1 });
    });
    client.on('message', (topic, message) => {
        const raw = message.toString();
        if (topic === MQTT_CONFIG.topics.control) {
            try {
                const cmd = JSON.parse(raw);
                if (cmd.command === 'SET_DO') {
                    const state = cmd.state === 1 || cmd.state === true;
                    immobilizerListeners.forEach(cb => cb({ state, acknowledged: true }));
                }
            } catch { }
            return;
        }
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = parsePacket(raw); }
        if (parsed) listeners.forEach(cb => cb(parsed));
    });
    client.on('error', (err) => { console.error('[MQTT]', err.message); onStatus?.('error'); });
    client.on('reconnect', () => onStatus?.('reconnecting'));
    client.on('close', () => { connected = false; onStatus?.('disconnected'); });
}

export function publishImmobilizerCommand(state) {
    const payload = JSON.stringify({
        command: 'SET_DO', pin: 'DO1',
        state: state ? 1 : 0, timestamp: Math.floor(Date.now() / 1000),
    });
    if (client && connected) client.publish(MQTT_CONFIG.topics.control, payload, { qos: 1 });
    setTimeout(() => immobilizerListeners.forEach(cb => cb({ state, acknowledged: true })), connected ? 500 : 300);
}

export function onPacketReceived(cb) {
    listeners.push(cb);
    return () => { listeners = listeners.filter(l => l !== cb); };
}
export function onControlReceived(cb) {
    immobilizerListeners.push(cb);
    return () => { immobilizerListeners = immobilizerListeners.filter(l => l !== cb); };
}
export function emitPacket(parsed) {
    listeners.forEach(cb => cb(parsed));
}
