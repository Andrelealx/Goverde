import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface TenantInfo {
  nome: string;
  slug: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: string;
  tenantId: string;
  tenant: TenantInfo;
}

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  setUsuario: (usuario: Usuario) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,

      login: async (email, senha) => {
        const { data } = await api.post('/api/auth/login', { email, senha });
        localStorage.setItem('accessToken', data.accessToken);
        set({ usuario: data.usuario, accessToken: data.accessToken });
      },

      logout: async () => {
        try {
          await api.post('/api/auth/logout');
        } finally {
          localStorage.removeItem('accessToken');
          set({ usuario: null, accessToken: null });
          window.location.href = '/login';
        }
      },

      setUsuario: (usuario) => set({ usuario }),
    }),
    {
      name: 'goverde-auth',
      partialize: (state) => ({ usuario: state.usuario }),
    }
  )
);
