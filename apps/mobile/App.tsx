import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import { useAuthStore } from './src/stores/auth.store';
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const { restaurarSessao, carregando } = useAuthStore();

  useEffect(() => {
    restaurarSessao();
  }, []);

  if (carregando) return <LoadingScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Navigation />
    </GestureHandlerRootView>
  );
}
