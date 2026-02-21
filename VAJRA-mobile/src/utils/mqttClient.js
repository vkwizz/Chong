import mqtt from 'mqtt';
import { parsePacket } from './packetParser';

const CLUSTER_URL = '2c5f5e646e50448aa8061f20af50b0a2.s1.eu.hivemq.cloud';
const MQTT_USERNAME = 'telematics_device';
const MQTT_PASSWORD = 'VajraSecure2024';

export const MQTT_CONFIG = {
    brokerUrl: `wss://${CLUSTER_URL}:8884/mqtt`,
    topics: {
        // Matches 'telematics/887744556677882/up'
        telemetry: 'telematics/+/up',
        // Assuming control uses a similar 'down' or 'cmd' topic
        control: 'telematics/+/down',
    },
};

let client = null;
let listeners = [];
let immobilizerListeners = [];
let connected = false;

export const connectionStatus = { get connected() { return connected; } };

let currentTargetImei = '887744556677882';

export function setMqttImei(imei) {
    if (currentTargetImei === imei) return;
    currentTargetImei = imei;
    if (client && connected) {
        // Re-subscribe if IMEI changes
        client.unsubscribe('telematics/+/up');
        client.unsubscribe('telematics/+/down');
        client.subscribe(`telematics/${imei}/up`, { qos: 1 });
        client.subscribe(`telematics/${imei}/down`, { qos: 1 });
    }
}

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
        const isControl = topic.endsWith('/down');
        const isTelemetry = topic.endsWith('/up');

        // 1. Try JSON parsing first (for control commands or specific feedback)
        try {
            const cmd = JSON.parse(raw);
            if (isControl && cmd.command === 'SET_DO') {
                const state = cmd.state === 1 || cmd.state === true;
                immobilizerListeners.forEach(cb => cb({ state, acknowledged: true }));
                return;
            }
        } catch {
            // Not JSON, continue to packet parsing
        }

        // 2. Try raw packet parsing ($DATA or $CTRL strings)
        const parsed = parsePacket(raw);
        if (parsed) {
            listeners.forEach(cb => cb(parsed));
        }
    });
    client.on('error', (err) => { console.error('[MQTT]', err.message); onStatus?.('error'); });
    client.on('reconnect', () => onStatus?.('reconnecting'));
    client.on('close', () => { connected = false; onStatus?.('disconnected'); });
}

export function publishImmobilizerCommand(state, imei = '887744556677882') {
    const payload = JSON.stringify({
        immobilize: state ? 1 : 0,
        timestamp: Math.floor(Date.now() / 1000),
    });
    const topic = `telematics/${imei}/down`;
    if (client && connected) {
        client.publish(topic, payload, { qos: 1 });
        console.log(`[MQTT] Published to ${topic}: ${payload}`);
    }
    // Optimistically update listeners
    setTimeout(() => immobilizerListeners.forEach(cb => cb({ state, acknowledged: true })), connected ? 300 : 100);
}

export function publishFrequencyCommand(seconds) {
    const payload = JSON.stringify({
        command: 'SET_FREQ',
        interval_seconds: seconds,
        timestamp: Math.floor(Date.now() / 1000),
    });
    if (client && connected) {
        client.publish(MQTT_CONFIG.topics.control, payload, { qos: 1 });
        console.log('[MQTT] Published frequency command:', seconds, 's');
    }
}

export function publishOptimizerMode(mode, imei = '887744556677882') {
    const payload = JSON.stringify({
        mode: mode, // 'HIGH', 'MID', 'LOW'
        timestamp: Math.floor(Date.now() / 1000),
    });
    const topic = `telematics/${imei}/down`;
    if (client && connected) {
        client.publish(topic, payload, { qos: 1 });
        console.log(`[MQTT] Published to ${topic}: ${payload}`);
    }
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
