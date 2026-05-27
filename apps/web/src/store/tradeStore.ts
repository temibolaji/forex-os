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
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],

  loadUserTrades: (userEmail) => {
    try {
      const key = `forexos_trades_${userEmail.trim().toLowerCase()}`;
      const raw = localStorage.getItem(key);
      const trades = raw ? JSON.parse(raw) : getMockTrades();
      set({ trades });
    } catch {
      set({ trades: getMockTrades() });
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
  }
}));

// Generates fallback mock trades for fresh users
const getMockTrades = (): Trade[] => [
  {
    id: '1',
    pair: 'EURUSD',
    direction: 'LONG',
    entryPrice: 1.0854,
    slPrice: 1.0820,
    tpPrice: 1.0920,
    lotSize: 1.0,
    session: 'LONDON',
    pipsResult: 45.2,
    pnlUsd: 452.0,
    status: 'CLOSED',
    openedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    pair: 'GBPJPY',
    direction: 'SHORT',
    entryPrice: 191.50,
    slPrice: 192.00,
    tpPrice: 190.00,
    lotSize: 0.5,
    session: 'NEW_YORK',
    pipsResult: null,
    pnlUsd: null,
    status: 'OPEN',
    openedAt: new Date().toISOString(),
  }
];
