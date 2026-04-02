import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface Tenant { nome: string; slug: string; }
interface Usuario { id: string; nome: string; email: string; papel: string; tenantId: string; tenant: Tenant; }

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  restaurarSessao: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  carregando: true,

  login: async (email, senha) => {
    const { data } = await api.post('/api/auth/login', { email, senha });
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
    set({ usuario: data.usuario });
  },

  logout: async () => {
    try { await api.post('/api/auth/logout'); } catch {}
    await AsyncStorage.multiRemove(['accessToken', 'usuario']);
    set({ usuario: null });
  },

  restaurarSessao: async () => {
    try {
      const usuarioStr = await AsyncStorage.getItem('usuario');
      const token = await AsyncStorage.getItem('accessToken');
      if (usuarioStr && token) {
        set({ usuario: JSON.parse(usuarioStr) });
      }
    } finally {
      set({ carregando: false });
    }
  },
}));
