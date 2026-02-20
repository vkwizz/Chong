import mqtt from 'mqtt';
import { parsePacket } from './packetParser';

// ─────────────────────────────────────────────────────────────────────────────
// HiveMQ Cloud Config
// Replace YOUR_CLUSTER_URL with your HiveMQ cluster hostname
// e.g. abc123.s1.eu.hivemq.cloud
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTER_URL = '2c5f5e646e50448aa8061f20af50b0a2.s1.eu.hivemq.cloud'; // e.g. abc123.s1.eu.hivemq.cloud
const MQTT_USERNAME = 'telematics_device';
const MQTT_PASSWORD = 'VajraSecure2024';  // whatever you set in HiveMQ console

export const MQTT_CONFIG = {
    brokerUrl: `wss://${CLUSTER_URL}:8884/mqtt`,
    topics: {
        telemetry: 'telematics/device/887744556677882/data',
        control: 'telematics/device/887744556677882/control',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let client = null;
let listeners = [];
let immobilizerListeners = [];
let connected = false;

export const connectionStatus = { get connected() { return connected; }, simulated: false };

// ─────────────────────────────────────────────────────────────────────────────
// Connect to HiveMQ
// ─────────────────────────────────────────────────────────────────────────────
export function connectMQTT(onStatus) {
    if (CLUSTER_URL === 'YOUR_CLUSTER_URL') {
        console.warn('[MQTT] No cluster URL set — running in simulation mode.');
        onStatus?.('simulated');
        return;
    }

    console.log('[MQTT] Connecting to', MQTT_CONFIG.brokerUrl);
    onStatus?.('connecting');

    client = mqtt.connect(MQTT_CONFIG.brokerUrl, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: `vajra_dashboard_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
    });

    client.on('connect', () => {
        console.log('[MQTT] Connected to HiveMQ Cloud ✓');
        connected = true;
        onStatus?.('connected');

        // Subscribe to incoming telemetry (device → app)
        client.subscribe(MQTT_CONFIG.topics.telemetry, { qos: 1 }, (err) => {
            if (err) console.error('[MQTT] Subscribe telemetry error:', err);
            else console.log('[MQTT] Subscribed to', MQTT_CONFIG.topics.telemetry);
        });

        // Subscribe to control topic (server → app, for immobilizer acks / commands)
        client.subscribe(MQTT_CONFIG.topics.control, { qos: 1 }, (err) => {
            if (err) console.error('[MQTT] Subscribe control error:', err);
            else console.log('[MQTT] Subscribed to', MQTT_CONFIG.topics.control);
        });
    });

    client.on('message', (topic, message) => {
        try {
            const raw = message.toString();
            console.log('[MQTT] Received on', topic, ':', raw.slice(0, 80));

            // ── Control topic → immobilizer command ─────────────────────────
            if (topic === MQTT_CONFIG.topics.control) {
                try {
                    const cmd = JSON.parse(raw);
                    // cmd = { command: "SET_DO", pin: "DO1", state: 0 or 1 }
                    if (cmd.command === 'SET_DO') {
                        const state = cmd.state === 1 || cmd.state === true;
                        console.log('[MQTT] Immobilizer command received, state:', state);
                        immobilizerListeners.forEach(cb => cb({ state, acknowledged: true }));
                    }
                } catch (e) {
                    console.error('[MQTT] Control parse error:', e);
                }
                return;
            }

            // ── Telemetry topic → packet data ────────────────────────────────
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch {
                parsed = parsePacket(raw);
            }
            if (parsed) listeners.forEach(cb => cb(parsed));
        } catch (e) {
            console.error('[MQTT] Message error:', e);
        }
    });

    client.on('error', (err) => {
        console.error('[MQTT] Error:', err.message);
        onStatus?.('error');
    });

    client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting...');
        onStatus?.('reconnecting');
    });

    client.on('close', () => {
        connected = false;
        onStatus?.('disconnected');
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Publish Immobilizer Command
// ─────────────────────────────────────────────────────────────────────────────
export function publishImmobilizerCommand(state) {
    const payload = JSON.stringify({
        command: 'SET_DO',
        pin: 'DO1',
        state: state ? 1 : 0,
        timestamp: Math.floor(Date.now() / 1000),
    });

    if (client && connected) {
        client.publish(MQTT_CONFIG.topics.control, payload, { qos: 1 }, (err) => {
            if (err) console.error('[MQTT] Publish error:', err);
            else console.log('[MQTT] Published immobilizer command:', payload);
        });
    } else {
        console.warn('[MQTT] Not connected — simulating command ack');
    }

    // Always fire ack (real or simulated)
    setTimeout(() => {
        immobilizerListeners.forEach(cb => cb({ state, acknowledged: true }));
    }, connected ? 500 : 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Publish Data Frequency Command
// ─────────────────────────────────────────────────────────────────────────────
export function publishFrequencyCommand(seconds) {
    const payload = JSON.stringify({
        command: 'SET_FREQ',
        interval_seconds: seconds,
        timestamp: Math.floor(Date.now() / 1000),
    });

    if (client && connected) {
        client.publish(MQTT_CONFIG.topics.control, payload, { qos: 1 }, (err) => {
            if (err) console.error('[MQTT] Frequency publish error:', err);
            else console.log('[MQTT] Published frequency command:', payload);
        });
    } else {
        console.warn('[MQTT] Not connected — frequency command simulated');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions (used by simulator when no real MQTT)
// ─────────────────────────────────────────────────────────────────────────────
export function onPacketReceived(cb) {
    listeners.push(cb);
    return () => { listeners = listeners.filter(l => l !== cb); };
}

export function onControlReceived(cb) {
    immobilizerListeners.push(cb);
    return () => { immobilizerListeners = immobilizerListeners.filter(l => l !== cb); };
}

// Called by simulator when no real MQTT connection
export function emitPacket(parsed) {
    listeners.forEach(cb => cb(parsed));
}
