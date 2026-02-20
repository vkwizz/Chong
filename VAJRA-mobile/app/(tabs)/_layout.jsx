import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { LayoutDashboard, Map, Shield, BarChart2, Activity } from 'lucide-react-native';

const LIME = '#B8E840';
const DARK = '#1C1C1E';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: DARK,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: LIME,
                tabBarInactiveTintColor: '#666',
                tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
            }}
        >
            <Tabs.Screen name="index" options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} strokeWidth={2.4} />,
            }} />
            <Tabs.Screen name="map" options={{
                title: 'Map',
                tabBarIcon: ({ color, size }) => <Map color={color} size={size - 2} strokeWidth={2.4} />,
            }} />
            <Tabs.Screen name="control" options={{
                title: 'Control',
                tabBarIcon: ({ color, size }) => <Shield color={color} size={size - 2} strokeWidth={2.4} />,
            }} />
            <Tabs.Screen name="analytics" options={{
                title: 'Stats',
                tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size - 2} strokeWidth={2.4} />,
            }} />
            <Tabs.Screen name="packet" options={{
                title: 'Network',
                tabBarIcon: ({ color, size }) => <Activity color={color} size={size - 2} strokeWidth={2.4} />,
            }} />
        </Tabs>
    );
}

