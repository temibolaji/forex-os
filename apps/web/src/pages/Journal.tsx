import { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Clock, Search, UploadCloud } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';
import CSVImporterModal from '../components/CSVImporterModal';

export default function Journal() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, CLOSED

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
    session: 'NEW_YORK',
    setupTags: '',
    emotion: 'Neutral',
    screenshotUrl: '',
    notes: ''
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

    const entry = parseFloat(newTrade.entryPrice) || 1.0850;
    const sl = parseFloat(newTrade.slPrice) || 1.0800;
    const tp = parseFloat(newTrade.tpPrice) || 1.0950;
    
    // Calculate Planned R:R
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const plannedRR = risk > 0 ? (reward / risk) : 0;
    
    addTrade(currentUser.email, {
      pair: newTrade.pair.trim().toUpperCase(),
      direction: newTrade.direction as 'LONG' | 'SHORT',
      entryPrice: entry,
      slPrice: sl,
      tpPrice: tp,
      lotSize: parseFloat(newTrade.lotSize) || 0.1,
      session: newTrade.session,
      setupTags: newTrade.setupTags.trim() ? newTrade.setupTags.split(',').map(t => t.trim().toUpperCase()) : [],
      emotion: newTrade.emotion,
      plannedRR: parseFloat(plannedRR.toFixed(2)),
      screenshotUrl: newTrade.screenshotUrl.trim() || undefined,
      notes: newTrade.notes.trim() || undefined,
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
      session: 'NEW_YORK',
      setupTags: '',
      emotion: 'Neutral',
      screenshotUrl: '',
      notes: ''
    });
    setIsLogModalOpen(false);
  };

  const handleCloseTrade = () => {
    if (!currentUser || !tradeToClose) return;
    const trade = trades.find(t => t.id === tradeToClose);
    if (!trade) return;

    const pnl = parseFloat(closeResult.pnlUsd) || 0;
    const pips = parseFloat(closeResult.pipsResult) || 0;
    
    // Calculate Actual R:R
    // Note: This relies on USD risk. But we don't have exact USD risk stored.
    // Instead we can use pips for RR if we have initial SL pips.
    // We assume 1 standard lot = $10 per pip roughly, but since we don't know the pair pip value exactly,
    // we use the pip risk:
    // To get SL risk in pips, we just need to convert entry/SL difference to pips.
    // A simple hack: actualRR = pipsResult / initialSlRiskPips
    // However, entry-sl could be in fractional format (0.0050 = 50 pips).
    const isJpy = trade.pair.includes('JPY');
    const multiplier = isJpy ? 100 : 10000;
    const initialSlRiskPips = Math.abs(trade.entryPrice - trade.slPrice) * multiplier;
    
    const actualRR = initialSlRiskPips > 0 ? parseFloat((pips / initialSlRiskPips).toFixed(2)) : 0;

    closeTrade(currentUser.email, tradeToClose, pnl, pips, actualRR);
    setTradeToClose(null);
    setCloseResult({ pnlUsd: '', pipsResult: '' });
  };

  
  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Trade Journal</h1>
          <p className="page-subtitle">Log, analyze, and master your setups.</p>
        </div>
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: 999 }}
        >
          <Plus size={18} />
          <span>Log Trade</span>
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
          <input 
            type="text" 
            placeholder="Search pairs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="all_time">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
              />
            </div>
          )}

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="ALL">All Trades</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Trade List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead className="table-head">
              <tr>
                <th style={{ paddingLeft: 24 }}>Pair</th>
                <th>Direction</th>
                <th>Entry / SL / TP</th>
                <th>Size</th>
                <th>Session</th>
                <th>Result</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Status</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ paddingLeft: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.1 }}>
                        {trade.pair.substring(0, 3)}<br/>{trade.pair.substring(3)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{trade.pair}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(trade.openedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={trade.direction === 'LONG' ? 'pill pill-bull' : 'pill pill-bear'}>
                      {trade.direction === 'LONG' ? <TrendingUp size={12} style={{ marginRight: 4 }} /> : <TrendingDown size={12} style={{ marginRight: 4 }} />}
                      {trade.direction}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{trade.entryPrice}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      SL: {trade.slPrice} • TP: {trade.tpPrice}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{trade.lotSize} <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Lots</span></div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      <Clock size={12} />
                      {trade.session.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {trade.pnlUsd !== null ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: trade.pnlUsd > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {trade.pnlUsd > 0 ? '+' : ''}${trade.pnlUsd.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {trade.pipsResult} pips
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24 }}>
                    {trade.status === 'OPEN' ? (
                      <button 
                        onClick={() => setTradeToClose(trade.id)}
                        className="btn btn-ghost"
                        style={{ border: '1px solid var(--border-strong)', fontSize: 12, padding: '6px 12px' }}
                      >
                        Close Trade
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    No trades logged yet. Start by logging your first trade or import from CSV!
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Log a Trade</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Enter the details of your new position.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Pair</label>
                  <input type="text" className="input" value={newTrade.pair} onChange={e => setNewTrade({...newTrade, pair: e.target.value})} placeholder="e.g. EURUSD" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Direction</label>
                  <select className="input" value={newTrade.direction} onChange={e => setNewTrade({...newTrade, direction: e.target.value})}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Entry</label>
                  <input type="number" step="0.00001" className="input" value={newTrade.entryPrice} onChange={e => setNewTrade({...newTrade, entryPrice: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Stop Loss</label>
                  <input type="number" step="0.00001" className="input" value={newTrade.slPrice} onChange={e => setNewTrade({...newTrade, slPrice: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Take Profit</label>
                  <input type="number" step="0.00001" className="input" value={newTrade.tpPrice} onChange={e => setNewTrade({...newTrade, tpPrice: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Lot Size</label>
                  <input type="number" step="0.01" className="input" value={newTrade.lotSize} onChange={e => setNewTrade({...newTrade, lotSize: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Session</label>
                  <select className="input" value={newTrade.session} onChange={e => setNewTrade({...newTrade, session: e.target.value})}>
                    <option value="LONDON">London</option>
                    <option value="NEW_YORK">New York</option>
                    <option value="TOKYO">Tokyo</option>
                    <option value="SYDNEY">Sydney</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Strategy Tags</label>
                  <input type="text" className="input" value={newTrade.setupTags} onChange={e => setNewTrade({...newTrade, setupTags: e.target.value})} placeholder="e.g. SMC, Breakout" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Emotion</label>
                  <select className="input" value={newTrade.emotion} onChange={e => setNewTrade({...newTrade, emotion: e.target.value})}>
                    <option value="Neutral">Neutral / Calm</option>
                    <option value="Confident">Confident</option>
                    <option value="FOMO">FOMO</option>
                    <option value="Revenge">Revenge</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Tired">Tired</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Notes</label>
                <textarea className="input" value={newTrade.notes} onChange={e => setNewTrade({...newTrade, notes: e.target.value})} style={{ minHeight: 80 }} placeholder="Why did you take this trade?"></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
              <button onClick={() => setIsCsvModalOpen(true)} className="btn btn-ghost" style={{ marginRight: 'auto' }}>
                <UploadCloud size={16} style={{ marginRight: 6 }} /> Import CSV
              </button>
              <button onClick={() => setIsLogModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveTrade} className="btn btn-primary" style={{ borderRadius: 999 }}>Save Trade</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {tradeToClose && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>Close Trade</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Enter final result of the trade.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Final PnL (USD)</label>
                <input type="number" step="0.01" className="input" value={closeResult.pnlUsd} onChange={e => setCloseResult({...closeResult, pnlUsd: e.target.value})} placeholder="e.g. 150.50" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Pips Result</label>
                <input type="number" step="0.1" className="input" value={closeResult.pipsResult} onChange={e => setCloseResult({...closeResult, pipsResult: e.target.value})} placeholder="e.g. 25.5" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
              <button onClick={() => setTradeToClose(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCloseTrade} className="btn btn-primary" style={{ borderRadius: 999 }}>Confirm Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
