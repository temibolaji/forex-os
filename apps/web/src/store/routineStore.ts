import { create } from 'zustand';

export interface RoutineLog {
  id: string;
  date: string; // YYYY-MM-DD
  habits: {
    sleep: boolean;
    backtest: boolean;
    noOvertrade: boolean;
    journal: boolean;
  };
  notes?: string;
}

interface RoutineState {
  logs: RoutineLog[];
  loadUserLogs: (userEmail: string) => void;
  saveLog: (userEmail: string, log: Omit<RoutineLog, 'id'>) => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  logs: [],

  loadUserLogs: (userEmail) => {
    try {
      const key = `forexos_routines_${userEmail.trim().toLowerCase()}`;
      const raw = localStorage.getItem(key);
      const logs = raw ? JSON.parse(raw) : [];
      set({ logs });
    } catch {
      set({ logs: [] });
    }
  },

  saveLog: (userEmail, logData) => {
    const key = `forexos_routines_${userEmail.trim().toLowerCase()}`;
    // Check if a log for this date already exists
    const existingIdx = get().logs.findIndex(l => l.date === logData.date);
    
    let updatedLogs = [...get().logs];
    
    if (existingIdx >= 0) {
      updatedLogs[existingIdx] = { ...updatedLogs[existingIdx], ...logData };
    } else {
      updatedLogs = [{ ...logData, id: Math.random().toString(36).substring(2, 9) }, ...updatedLogs];
    }
    
    // Sort by date descending
    updatedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    localStorage.setItem(key, JSON.stringify(updatedLogs));
    set({ logs: updatedLogs });
  }
}));
