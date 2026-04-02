import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OcorrenciasScreen from '../screens/OcorrenciasScreen';
import NovaOcorrenciaScreen from '../screens/NovaOcorrenciaScreen';
import PontoScreen from '../screens/PontoScreen';
import VistoriasScreen from '../screens/VistoriasScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    Início: '🏠', Ocorrências: '⚠️', Ponto: '⏱️', Vistorias: '📋',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] ?? '•'}</Text>;
}

function OcorrenciasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OcorrenciasList" component={OcorrenciasScreen} />
      <Stack.Screen name="NovaOcorrencia" component={NovaOcorrenciaScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Ocorrências" component={OcorrenciasStack} />
      <Tab.Screen name="Ponto" component={PontoScreen} />
      <Tab.Screen name="Vistorias" component={VistoriasScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { usuario } = useAuthStore();
  return (
    <NavigationContainer>
      {usuario ? <AppTabs /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
