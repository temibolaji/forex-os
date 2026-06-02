import { create } from 'zustand';

// Force empty string so all requests use relative paths (e.g. /api/...)
// This ensures they go through the Vercel proxy in production and Vite proxy in dev.
export const API_URL = '';

export interface User {
  id: string;
  email: string;
  currency?: string;
}

interface AuthState {
  currentUser: User | null;
  error: string | null;
  isLoading: boolean;
  initialBalance: number;
  setInitialBalance: (balance: number) => void;
  dailyLossLimit: number | null;
  setDailyLossLimit: (limit: number | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, currency: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUser: null,
  error: null,
  isLoading: true, // Start true while we check session on load
  initialBalance: 10000,
  dailyLossLimit: null,

  setInitialBalance: (balance) => {
    set({ initialBalance: balance });
    // Keep it synced locally
    const user = get().currentUser;
    if (user) {
      localStorage.setItem(`forexos_initialBalance_${user.email}`, balance.toString());
    }
  },

  setDailyLossLimit: (limit) => {
    const user = get().currentUser;
    if (user) {
      if (limit === null) {
        localStorage.removeItem(`forexos_dll_${user.email}`);
      } else {
        localStorage.setItem(`forexos_dll_${user.email}`, limit.toString());
      }
    }
    set({ dailyLossLimit: limit });
  },

  login: async (email, password) => {
    set({ error: null, isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        set({ error: 'Server returned an invalid response. It might be waking up.', isLoading: false });
        return false;
      }
      
      if (!res.ok) {
        set({ error: data?.message || 'Login failed', isLoading: false });
        return false;
      }
      
      localStorage.setItem('forexos_token', data.accessToken);
      
      const user = data.user;
      const initialBalanceStr = localStorage.getItem(`forexos_initialBalance_${user.email}`);
      const initialBalance = initialBalanceStr ? parseFloat(initialBalanceStr) : 10000;
      
      const storedLimit = localStorage.getItem(`forexos_dll_${user.email}`);
      const dailyLossLimit = storedLimit ? parseFloat(storedLimit) : null;
      
      set({ currentUser: user, error: null, isLoading: false, initialBalance, dailyLossLimit });
      return true;
    } catch (err) {
      set({ error: 'Network error occurred. Please try again.', isLoading: false });
      return false;
    }
  },

  register: async (email, password, currency) => {
    set({ error: null, isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, accountCurrency: currency }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        set({ error: 'Server returned an invalid response. It might be waking up.', isLoading: false });
        return false;
      }

      if (!res.ok) {
        set({ error: data?.message || 'Registration failed', isLoading: false });
        return false;
      }
      
      // Auto login after register
      return await get().login(email, password);
    } catch (err) {
      set({ error: 'Network error occurred. Please try again.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    localStorage.removeItem('forexos_token');
    set({ currentUser: null, error: null, isLoading: false, initialBalance: 10000, dailyLossLimit: null });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('forexos_token', data.accessToken);
        
        // We need the user payload from the token
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          const user = { id: payload.sub, email: payload.email };
          
          const initialBalanceStr = localStorage.getItem(`forexos_initialBalance_${user.email}`);
          const initialBalance = initialBalanceStr ? parseFloat(initialBalanceStr) : 10000;
          
          const storedLimit = localStorage.getItem(`forexos_dll_${user.email}`);
          const dailyLossLimit = storedLimit ? parseFloat(storedLimit) : null;
          
          set({ currentUser: user, isLoading: false, initialBalance, dailyLossLimit });
        } catch(e) {
          set({ currentUser: null, isLoading: false });
        }
      } else {
        // Fallback: check if we have a valid token in localStorage
        const token = localStorage.getItem('forexos_token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
              const user = { id: payload.sub, email: payload.email };
              const initialBalanceStr = localStorage.getItem(`forexos_initialBalance_${user.email}`);
              const initialBalance = initialBalanceStr ? parseFloat(initialBalanceStr) : 10000;
              const storedLimit = localStorage.getItem(`forexos_dll_${user.email}`);
              const dailyLossLimit = storedLimit ? parseFloat(storedLimit) : null;
              
              set({ currentUser: user, isLoading: false, initialBalance, dailyLossLimit });
              return;
            }
          } catch(e) {}
        }
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      // Fallback: check if we have a valid token in localStorage on network error
      const token = localStorage.getItem('forexos_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            const user = { id: payload.sub, email: payload.email };
            const initialBalanceStr = localStorage.getItem(`forexos_initialBalance_${user.email}`);
            const initialBalance = initialBalanceStr ? parseFloat(initialBalanceStr) : 10000;
            const storedLimit = localStorage.getItem(`forexos_dll_${user.email}`);
            const dailyLossLimit = storedLimit ? parseFloat(storedLimit) : null;
            
            set({ currentUser: user, isLoading: false, initialBalance, dailyLossLimit });
            return;
          }
        } catch(e) {}
      }
      set({ currentUser: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
