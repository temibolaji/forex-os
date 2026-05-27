import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  currency?: string;
}

interface AuthState {
  currentUser: User | null;
  error: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, currency: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  error: null,
  isLoading: true, // Start true while we check session on load

  login: async (email, password) => {
    set({ error: null, isLoading: true });
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.message || 'Login failed', isLoading: false });
        return false;
      }
      
      localStorage.setItem('forexos_token', data.accessToken);
      set({ currentUser: data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ error: 'Network error occurred. Please try again.', isLoading: false });
      return false;
    }
  },

  register: async (email, password, currency) => {
    set({ error: null, isLoading: true });
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, accountCurrency: currency }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.message || 'Registration failed', isLoading: false });
        return false;
      }
      
      // Auto login after register
      return await useAuthStore.getState().login(email, password);
    } catch (err) {
      set({ error: 'Network error occurred. Please try again.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch(e) {}
    localStorage.removeItem('forexos_token');
    set({ currentUser: null, error: null, isLoading: false });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('forexos_token', data.accessToken);
        
        // We need the user payload from the token
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          set({ currentUser: { id: payload.sub, email: payload.email }, isLoading: false });
        } catch(e) {
          set({ currentUser: null, isLoading: false });
        }
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      set({ currentUser: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
