import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface Tenant { nome: string; slug: string; }
interface Usuario { id: string; nome: string; email: string; papel: string; tenantId: string; tenant: Tenant; }
interface AuthState { usuario: Usuario | null; carregando: boolean; }

// Estado global em memória — sem dependência externa (evita conflito de React duplicado)
let state: AuthState = { usuario: null, carregando: true };
const listeners = new Set<() => void>();

function setState(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn());
}

export function useAuthStore() {
  const [, tick] = useState(0);

  useEffect(() => {
    const notify = () => tick((n) => n + 1);
    listeners.add(notify);
    return () => { listeners.delete(notify); };
  }, []);

  return {
    usuario: state.usuario,
    carregando: state.carregando,

    login: async (email: string, senha: string) => {
      const { data } = await api.post('/api/auth/login', { email, senha });
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
      setState({ usuario: data.usuario });
    },

    logout: async () => {
      try { await api.post('/api/auth/logout'); } catch {}
      await AsyncStorage.multiRemove(['accessToken', 'usuario']);
      setState({ usuario: null });
    },

    restaurarSessao: async () => {
      try {
        const results = await AsyncStorage.multiGet(['usuario', 'accessToken']);
        const usuarioStr = results[0][1];
        const token = results[1][1];
        if (usuarioStr && token) {
          setState({ usuario: JSON.parse(usuarioStr), carregando: false });
          return;
        }
      } catch {}
      setState({ carregando: false });
    },
  };
}
