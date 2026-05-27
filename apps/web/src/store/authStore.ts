import { create } from 'zustand';

export interface User {
  email: string;
  currency: string;
  registeredAt: string;
  passwordHash: string; // stored for local verification
}

interface AuthState {
  currentUser: User | null;
  usersList: User[];
  error: string | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, currency: string) => boolean;
  logout: () => void;
  clearError: () => void;
}

// Helper to load state from localStorage
const loadUsers = (): User[] => {
  try {
    const raw = localStorage.getItem('forexos_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadSession = (): User | null => {
  try {
    const raw = localStorage.getItem('forexos_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: loadSession(),
  usersList: loadUsers(),
  error: null,

  login: (email, password) => {
    set({ error: null });
    const trimmedEmail = email.trim().toLowerCase();
    const users = get().usersList;
    
    const user = users.find(u => u.email === trimmedEmail);
    if (!user) {
      set({ error: 'No account found with this email address.' });
      return false;
    }
    
    if (user.passwordHash !== password) {
      set({ error: 'Incorrect password. Please try again.' });
      return false;
    }

    // Set active user session
    localStorage.setItem('forexos_current_user', JSON.stringify(user));
    set({ currentUser: user });
    return true;
  },

  register: (email, password, currency) => {
    set({ error: null });
    const trimmedEmail = email.trim().toLowerCase();
    const users = [...get().usersList];

    // Enforce account duplication check
    if (users.some(u => u.email === trimmedEmail)) {
      set({ error: 'An account with this email already exists.' });
      return false;
    }

    // ENFORCE CAP OF 10 USERS FOR FREE RESOURCES
    if (users.length >= 10) {
      set({ error: 'Registration cap reached! This terminal is strictly limited to 10 users for free hosting efficiency.' });
      return false;
    }

    const newUser: User = {
      email: trimmedEmail,
      currency,
      registeredAt: new Date().toISOString(),
      passwordHash: password // simple local persistence
    };

    users.push(newUser);
    localStorage.setItem('forexos_users', JSON.stringify(users));
    localStorage.setItem('forexos_current_user', JSON.stringify(newUser));
    
    set({ usersList: users, currentUser: newUser });
    return true;
  },

  logout: () => {
    localStorage.removeItem('forexos_current_user');
    set({ currentUser: null, error: null });
  },

  clearError: () => set({ error: null })
}));
