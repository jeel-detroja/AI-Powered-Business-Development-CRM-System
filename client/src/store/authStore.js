import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/index';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuth: (user, token) => set({ user, token, isHydrated: true }),
      clearUser: () => set({ user: null, token: null }),

      login: async (credentials) => {
        const res = await authService.login(credentials);
        const { user, token } = res.data.data;
        set({ user, token, isHydrated: true });
        return user;
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {}
        set({ user: null, token: null, isHydrated: true });
      },

      fetchMe: async () => {
        try {
          const res = await authService.me();
          const user = res.data.data.user;
          set({ user, isHydrated: true });
          return user;
        } catch (err) {
          // If server returns 401 Unauthorized, clear cached session
          if (err.response?.status === 401) {
            set({ user: null, token: null, isHydrated: true });
          } else {
            // In case of network error or server startup, don't clear cached user
            set({ isHydrated: true });
          }
          return null;
        }
      },
    }),
    {
      name: 'nexora-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ isHydrated: true });
      },
    }
  )
);


