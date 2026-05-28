import { create } from 'zustand';

export interface Trade {
  id: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  lotSize: number;
  session: string;
  pipsResult: number | null;
  pnlUsd: number | null;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
}

interface TradeState {
  trades: Trade[];
  loadUserTrades: (userEmail: string) => void;
  addTrade: (userEmail: string, trade: Omit<Trade, 'id' | 'openedAt'>) => void;
  clearTrades: () => void;
  resetUserData: (userEmail: string) => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],

  loadUserTrades: (userEmail) => {
    try {
      const key = `forexos_trades_${userEmail.trim().toLowerCase()}`;
      const raw = localStorage.getItem(key);
      const trades = raw ? JSON.parse(raw) : [];
      set({ trades });
    } catch {
      set({ trades: [] });
    }
  },

  addTrade: (userEmail, tradeData) => {
    const key = `forexos_trades_${userEmail.trim().toLowerCase()}`;
    const newTrade: Trade = {
      ...tradeData,
      id: Math.random().toString(36).substring(2, 9),
      openedAt: new Date().toISOString()
    };

    const updated = [newTrade, ...get().trades];
    localStorage.setItem(key, JSON.stringify(updated));
    set({ trades: updated });
  },

  clearTrades: () => {
    set({ trades: [] });
  },

  resetUserData: (userEmail) => {
    const key = `forexos_trades_${userEmail.trim().toLowerCase()}`;
    localStorage.removeItem(key);
    set({ trades: [] });
  }
}));
