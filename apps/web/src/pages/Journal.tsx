import { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Clock, Search, Filter, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';

export default function Journal() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
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

  // Form State
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trade Journal</h1>
          <p className="text-slate-500 mt-1">Log, analyze, and master your setups.</p>
        </div>
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center space-x-2 bg-brand text-white px-5 py-2.5 rounded-lg shadow-lg shadow-brand/20 hover:bg-brand-light transition-all transform hover:-translate-y-0.5 active:translate-y-0 font-medium"
        >
          <Plus size={20} />
          <span>Log Trade</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search pairs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-shadow text-sm"
          />
        </div>

        {/* Date Filter selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm shrink-0">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-600 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all_time">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-1.5 bg-white px-2 py-1.5 border border-slate-200 rounded-lg shadow-sm animate-in slide-in-from-left-2 duration-200">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-1.5 py-0.5 text-xs text-slate-600 font-semibold focus:outline-none border border-slate-100 rounded-md"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-1.5 py-0.5 text-xs text-slate-600 font-semibold focus:outline-none border border-slate-100 rounded-md"
              />
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors text-sm"
          >
            <Filter size={18} />
            <span>{statusFilter === 'ALL' ? 'Filters' : statusFilter}</span>
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
              <button onClick={() => { setStatusFilter('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'ALL' ? 'font-bold text-brand' : 'text-slate-700'}`}>All Trades</button>
              <button onClick={() => { setStatusFilter('OPEN'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'OPEN' ? 'font-bold text-brand' : 'text-slate-700'}`}>Open Trades</button>
              <button onClick={() => { setStatusFilter('CLOSED'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'CLOSED' ? 'font-bold text-brand' : 'text-slate-700'}`}>Closed Trades</button>
            </div>
          )}
        </div>
      </div>

      {/* Trade List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm font-medium">
                <th className="p-4 pl-6 font-medium">Pair</th>
                <th className="p-4 font-medium">Direction</th>
                <th className="p-4 font-medium">Entry / SL / TP</th>
                <th className="p-4 font-medium">Size</th>
                <th className="p-4 font-medium">Session</th>
                <th className="p-4 font-medium">Result</th>
                <th className="p-4 pr-6 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs tracking-tighter">
                        {trade.pair.substring(0, 3)}<br/>{trade.pair.substring(3)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{trade.pair}</div>
                        <div className="text-xs text-slate-500">{new Date(trade.openedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trade.direction === 'LONG' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {trade.direction === 'LONG' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{trade.direction}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-900">{trade.entryPrice}</div>
                    <div className="text-xs text-slate-500 mt-0.5">SL: {trade.slPrice} • TP: {trade.tpPrice}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-900">{trade.lotSize} Lots</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      <Clock size={12} />
                      <span>{trade.session.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    {trade.pnlUsd !== null ? (
                      <div>
                        <div className={`text-sm font-bold ${trade.pnlUsd > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trade.pnlUsd > 0 ? '+' : ''}${trade.pnlUsd.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">{trade.pipsResult} pips</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm italic">Pending</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {trade.status === 'OPEN' ? (
                      <button className="text-xs font-medium bg-brand/10 text-brand px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors">
                        Close Trade
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Trade Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">Log a Trade</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter the details of your new position.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pair</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.pair} onChange={e => setNewTrade({...newTrade, pair: e.target.value})} placeholder="e.g. EURUSD" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.direction} onChange={e => setNewTrade({...newTrade, direction: e.target.value})}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entry</label>
                  <input type="number" step="0.00001" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.entryPrice} onChange={e => setNewTrade({...newTrade, entryPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stop Loss</label>
                  <input type="number" step="0.00001" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.slPrice} onChange={e => setNewTrade({...newTrade, slPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Take Profit</label>
                  <input type="number" step="0.00001" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.tpPrice} onChange={e => setNewTrade({...newTrade, tpPrice: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Size</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.lotSize} onChange={e => setNewTrade({...newTrade, lotSize: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand" value={newTrade.session} onChange={e => setNewTrade({...newTrade, session: e.target.value})}>
                    <option value="LONDON">London</option>
                    <option value="NEW_YORK">New York</option>
                    <option value="TOKYO">Tokyo</option>
                    <option value="SYDNEY">Sydney</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSaveTrade} className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors font-medium shadow-md">
                Save Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
