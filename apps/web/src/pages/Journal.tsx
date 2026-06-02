import { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Clock, Search, Filter, Calendar, UploadCloud } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';
import CSVImporterModal from '../components/CSVImporterModal';

export default function Journal() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, CLOSED
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all_time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const currentUser = useAuthStore(state => state.currentUser);
  const trades = useTradeStore(state => state.trades);
  const loadUserTrades = useTradeStore(state => state.loadUserTrades);
  const addTrade = useTradeStore(state => state.addTrade);
  const closeTrade = useTradeStore(state => state.closeTrade);

  // Form State
  const [tradeToClose, setTradeToClose] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState({ pnlUsd: '', pipsResult: '' });
  const [newTrade, setNewTrade] = useState({
    pair: 'EURUSD',
    direction: 'LONG',
    entryPrice: '',
    slPrice: '',
    tpPrice: '',
    lotSize: '',
    session: 'NEW_YORK'
  });

  useEffect(() => {
    if (currentUser) {
      loadUserTrades(currentUser.email);
    }
  }, [currentUser, loadUserTrades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesSearch = trade.pair.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || trade.status === statusFilter;
      
      if (!matchesSearch || !matchesStatus) return false;

      const tradeDate = new Date(trade.openedAt);
      const now = new Date();

      if (dateFilter === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tradeDate >= sevenDaysAgo;
      } else if (dateFilter === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return tradeDate >= thirtyDaysAgo;
      } else if (dateFilter === 'this_year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return tradeDate >= startOfYear;
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (tradeDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (tradeDate > end) return false;
        }
      }
      return true;
    });
  }, [trades, searchQuery, statusFilter, dateFilter, customStartDate, customEndDate]);

  const handleSaveTrade = () => {
    if (!currentUser) return;
    
    addTrade(currentUser.email, {
      pair: newTrade.pair.trim().toUpperCase(),
      direction: newTrade.direction as 'LONG' | 'SHORT',
      entryPrice: parseFloat(newTrade.entryPrice) || 1.0850,
      slPrice: parseFloat(newTrade.slPrice) || 1.0800,
      tpPrice: parseFloat(newTrade.tpPrice) || 1.0950,
      lotSize: parseFloat(newTrade.lotSize) || 0.1,
      session: newTrade.session,
      pipsResult: null,
      pnlUsd: null,
      status: 'OPEN'
    });

    setNewTrade({
      pair: 'EURUSD',
      direction: 'LONG',
      entryPrice: '',
      slPrice: '',
      tpPrice: '',
      lotSize: '',
      session: 'NEW_YORK'
    });

    setIsLogModalOpen(false);
  };

  const handleCloseTrade = () => {
    if (!currentUser || !tradeToClose) return;
    const pnl = parseFloat(closeResult.pnlUsd) || 0;
    const pips = parseFloat(closeResult.pipsResult) || 0;
    closeTrade(currentUser.email, tradeToClose, pnl, pips);
    setTradeToClose(null);
    setCloseResult({ pnlUsd: '', pipsResult: '' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Trade Journal</h1>
          <p className="text-slate-400 mt-1 font-medium text-sm">Log, analyze, and master your setups.</p>
        </div>
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center space-x-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-bold border border-indigo-400/50"
        >
          <Plus size={20} />
          <span>Log Trade</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search pairs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-panel bg-slate-900/40 border border-white/10 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-white placeholder-slate-500"
          />
        </div>

        {/* Date Filter selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 glass-panel bg-slate-900/40 px-3 py-2.5 border border-white/10 rounded-xl shadow-sm shrink-0 transition-all hover:border-indigo-500/50">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all_time" className="bg-slate-900">All Time</option>
              <option value="7d" className="bg-slate-900">Last 7 Days</option>
              <option value="30d" className="bg-slate-900">Last 30 Days</option>
              <option value="this_year" className="bg-slate-900">This Year</option>
              <option value="custom" className="bg-slate-900">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-1.5 glass-panel bg-slate-900/40 px-2 py-1.5 border border-indigo-500/30 rounded-xl shadow-sm animate-in slide-in-from-left-2 duration-200 ring-1 ring-indigo-500/10">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-slate-200 bg-slate-900 font-semibold focus:outline-none border border-slate-700 rounded-lg hover:border-indigo-500/50 transition-colors"
              />
              <span className="text-xs text-slate-500 font-bold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-slate-200 bg-slate-900 font-semibold focus:outline-none border border-slate-700 rounded-lg hover:border-indigo-500/50 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2.5 glass-panel bg-slate-900/40 border border-white/10 rounded-xl text-slate-200 font-semibold hover:bg-slate-800 shadow-sm transition-all text-sm hover:border-indigo-500/50"
          >
            <Filter size={18} />
            <span>{statusFilter === 'ALL' ? 'Filters' : statusFilter}</span>
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 glass-panel bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-20 py-2 backdrop-blur-xl">
              <button onClick={() => { setStatusFilter('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${statusFilter === 'ALL' ? 'font-bold text-indigo-400' : 'text-slate-300 font-medium'}`}>All Trades</button>
              <button onClick={() => { setStatusFilter('OPEN'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${statusFilter === 'OPEN' ? 'font-bold text-indigo-400' : 'text-slate-300 font-medium'}`}>Open Trades</button>
              <button onClick={() => { setStatusFilter('CLOSED'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors ${statusFilter === 'CLOSED' ? 'font-bold text-indigo-400' : 'text-slate-300 font-medium'}`}>Closed Trades</button>
            </div>
          )}
        </div>
      </div>

      {/* Trade List */}
      <div className="glass-panel bg-slate-900/40 rounded-[2rem] shadow-sm border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-900/20">
                <th className="p-5 pl-6">Pair</th>
                <th className="p-5">Direction</th>
                <th className="p-5">Entry / SL / TP</th>
                <th className="p-5">Size</th>
                <th className="p-5">Session</th>
                <th className="p-5">Result</th>
                <th className="p-5 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-display font-bold text-white text-[10px] tracking-wider leading-tight shadow-inner">
                        {trade.pair.substring(0, 3)}<br/>{trade.pair.substring(3)}
                      </div>
                      <div>
                        <div className="font-display font-bold text-white">{trade.pair}</div>
                        <div className="text-xs text-slate-500 font-medium">{new Date(trade.openedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {trade.direction === 'LONG' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{trade.direction}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-200 font-display">{trade.entryPrice}</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">SL: {trade.slPrice} • TP: {trade.tpPrice}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-200">{trade.lotSize} <span className="text-xs text-slate-500 font-medium ml-0.5">Lots</span></div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/50 border border-white/5 px-2.5 py-1 rounded-md">
                      <Clock size={12} className="text-slate-500" />
                      <span>{trade.session.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    {trade.pnlUsd !== null ? (
                      <div>
                        <div className={`text-sm font-display font-bold ${trade.pnlUsd > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.pnlUsd > 0 ? '+' : ''}${trade.pnlUsd.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{trade.pipsResult} pips</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs font-medium italic">Pending</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {trade.status === 'OPEN' ? (
                      <button 
                        onClick={() => setTradeToClose(trade.id)}
                        className="text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                      >
                        Close Trade
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-800/50 border border-white/5 px-4 py-1.5 rounded-xl uppercase tracking-wider">
                        Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12">
                    <div className="mt-8 text-center text-slate-500 text-sm">
                      No trades logged yet. Start by logging your first trade or import from CSV!
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CSVImporterModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />

      {/* Log Trade Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50 w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-display font-bold text-white mb-1">Log a Trade</h2>
            <p className="text-slate-400 mb-8 text-sm font-medium">Enter the details of your new position.</p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pair</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={newTrade.pair} onChange={e => setNewTrade({...newTrade, pair: e.target.value})} placeholder="e.g. EURUSD" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Direction</label>
                  <select className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium cursor-pointer" value={newTrade.direction} onChange={e => setNewTrade({...newTrade, direction: e.target.value})}>
                    <option value="LONG" className="bg-slate-900">LONG</option>
                    <option value="SHORT" className="bg-slate-900">SHORT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Entry</label>
                  <input type="number" step="0.00001" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={newTrade.entryPrice} onChange={e => setNewTrade({...newTrade, entryPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stop Loss</label>
                  <input type="number" step="0.00001" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={newTrade.slPrice} onChange={e => setNewTrade({...newTrade, slPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Take Profit</label>
                  <input type="number" step="0.00001" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={newTrade.tpPrice} onChange={e => setNewTrade({...newTrade, tpPrice: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lot Size</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={newTrade.lotSize} onChange={e => setNewTrade({...newTrade, lotSize: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Session</label>
                  <select className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium cursor-pointer" value={newTrade.session} onChange={e => setNewTrade({...newTrade, session: e.target.value})}>
                    <option value="LONDON" className="bg-slate-900">London</option>
                    <option value="NEW_YORK" className="bg-slate-900">New York</option>
                    <option value="TOKYO" className="bg-slate-900">Tokyo</option>
                    <option value="SYDNEY" className="bg-slate-900">Sydney</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <button 
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm"
              >
                <UploadCloud size={18} />
                <span>Import CSV</span>
              </button>
              <button onClick={() => setIsLogModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-bold text-sm">
                Cancel
              </button>
              <button onClick={handleSaveTrade} className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-bold shadow-lg shadow-indigo-500/20 text-sm">
                Save Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {tradeToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50 w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-display font-bold text-white mb-1">Close Trade</h2>
            <p className="text-slate-400 mb-8 text-sm font-medium">Enter final result of the trade.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Final PnL (USD)</label>
                <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={closeResult.pnlUsd} onChange={e => setCloseResult({...closeResult, pnlUsd: e.target.value})} placeholder="e.g. 150.50 or -50.00" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pips Result</label>
                <input type="number" step="0.1" className="w-full px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" value={closeResult.pipsResult} onChange={e => setCloseResult({...closeResult, pipsResult: e.target.value})} placeholder="e.g. 25.5 or -10" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-10">
              <button onClick={() => setTradeToClose(null)} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-bold text-sm">
                Cancel
              </button>
              <button onClick={handleCloseTrade} className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-bold shadow-lg shadow-indigo-500/20 text-sm">
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
