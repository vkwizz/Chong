import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Dimensions, KeyboardAvoidingView, Platform, ScrollView,
    ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTelematicsContext } from './_layout';
import { Shield, User, Lock, ArrowRight, Zap, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyCredentials, syncUserToCloud } from '../src/utils/mongodb';

const { width, height } = Dimensions.get('window');
const LIME = '#B8E840';
const DARK = '#1C1C1E';
const CREAM = '#F2EDE8';

export default function AuthScreen() {
    const router = useRouter();
    const ctx = useTelematicsContext();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [imei, setImei] = useState('');

    const handleAuth = async () => {
        if (!username || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        // Simulate network delay for MongoDB "sync"
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            if (isLogin) {
                // Verify credentials via MongoDB utility
                const user = await verifyCredentials(username, password);

                if (user) {
                    await AsyncStorage.setItem('user_session', JSON.stringify(user));
                    await syncUserToCloud(user); // Sync to cloud
                    ctx.login(user);
                } else {
                    Alert.alert('Login Failed', 'Invalid username or password.');
                    setLoading(false);
                    return;
                }
            } else {
                // Sign Up logic
                if (!imei) {
                    Alert.alert('IMEI Required', 'Please provide your device IMEI.');
                    setLoading(false);
                    return;
                }
                const newUser = { username, password, imei, name: username.toUpperCase() };
                await syncUserToCloud(newUser); // Save to cloud
                await AsyncStorage.setItem('user_session', JSON.stringify(newUser));
                ctx.login(newUser);
            }
        } catch (e) {
            Alert.alert('Error', 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={S.root}
        >
            <ScrollView contentContainerStyle={S.scroll}>
                <View style={S.header}>
                    <View style={S.logoContainer}>
                        <Zap color={LIME} size={42} strokeWidth={2.5} />
                    </View>
                    <Text style={S.title}>VAJRA</Text>
                    <Text style={S.subtitle}>INTELLIGENT TELEMATICS</Text>
                </View>

                <View style={S.form}>
                    <Text style={S.formTitle}>{isLogin ? 'Welcome Back' : 'Get Started'}</Text>
                    <Text style={S.formSub}>
                        {isLogin ? 'Sign in to access your vehicle' : 'Register your new Vajra device'}
                    </Text>

                    <View style={S.inputGroup}>
                        <View style={S.inputIcon}>
                            <User color={DARK} size={20} opacity={0.4} />
                        </View>
                        <TextInput
                            style={S.input}
                            placeholder="Username"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    {!isLogin && (
                        <View style={S.inputGroup}>
                            <View style={S.inputIcon}>
                                <Shield color={DARK} size={20} opacity={0.4} />
                            </View>
                            <TextInput
                                style={S.input}
                                placeholder="Device IMEI"
                                placeholderTextColor="#999"
                                value={imei}
                                onChangeText={setImei}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    <View style={S.inputGroup}>
                        <View style={S.inputIcon}>
                            <Lock color={DARK} size={20} opacity={0.4} />
                        </View>
                        <TextInput
                            style={S.input}
                            placeholder="Password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[S.mainBtn, loading && S.btnDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={DARK} />
                        ) : (
                            <>
                                <Text style={S.mainBtnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                                <ArrowRight color={DARK} size={20} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={S.switchBtn}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={S.switchText}>
                            {isLogin ? "Don't have an account? " : "Already registered? "}
                            <Text style={{ color: LIME, fontWeight: '900' }}>
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={S.footer}>
                    <Text style={S.footerText}>Secure direct-link to Vajra Cloud</Text>
                    <View style={S.dbBadge}>
                        <View style={S.dbDot} />
                        <Text style={S.dbText}>MongoDB Live Sync</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: DARK },
    scroll: { flexGrow: 1, paddingHorizontal: 40, paddingTop: 100, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 60 },
    logoContainer: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(184,232,64,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, borderWidth: 1, borderColor: 'rgba(184,232,64,0.2)'
    },
    title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 10 },
    subtitle: { fontSize: 10, color: LIME, fontWeight: '800', letterSpacing: 4, marginTop: 8 },

    form: { flex: 1 },
    formTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
    formSub: { fontSize: 14, color: '#666', marginBottom: 32 },

    inputGroup: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 16,
        marginBottom: 16, height: 64, paddingHorizontal: 20
    },
    inputIcon: { marginRight: 16 },
    input: { flex: 1, fontSize: 16, fontWeight: '600', color: DARK },

    mainBtn: {
        backgroundColor: LIME, height: 64, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginTop: 24,
        shadowColor: LIME, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    btnDisabled: { opacity: 0.6 },
    mainBtnText: { fontSize: 18, fontWeight: '900', color: DARK },

    switchBtn: { marginTop: 32, alignItems: 'center' },
    switchText: { fontSize: 14, color: '#666' },

    footer: { marginTop: 'auto', alignItems: 'center', gap: 12 },
    footerText: { fontSize: 12, color: '#333', fontWeight: '700' },
    dbBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100
    },
    dbDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#47A248' }, // Mongo Green
    dbText: { color: '#999', fontSize: 10, fontWeight: '800' }
});
