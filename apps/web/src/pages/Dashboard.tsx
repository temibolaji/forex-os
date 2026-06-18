import { useState, useMemo } from 'react';
import { Calendar, ShieldCheck, Maximize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const trades = useTradeStore(state => state.trades);
  const dailyLossLimit = useAuthStore(state => state.dailyLossLimit);
  const initialBalance = useAuthStore(state => state.initialBalance);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState('all_time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.openedAt);
      const now = new Date();
      if (dateFilter === '7d') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateFilter === '30d') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return d >= monthAgo;
      }
      if (dateFilter === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'custom') {
        if (customStartDate && new Date(customStartDate) > d) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (end < d) return false;
        }
      }
      return true;
    });
  }, [trades, dateFilter, customStartDate, customEndDate]);

  const metrics = useMemo(() => {
    let winningTrades = 0;
    let losingTrades = 0;
    let totalPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null) {
        totalPnl += t.pnlUsd;
        if (t.pnlUsd > 0) { winningTrades++; grossProfit += t.pnlUsd; }
        else if (t.pnlUsd < 0) { losingTrades++; grossLoss += Math.abs(t.pnlUsd); }
      }
    });

    const closedTrades = winningTrades + losingTrades;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? grossProfit : 0);
    const expectancyUsd = closedTrades > 0 ? (totalPnl / closedTrades) : 0;

    // Calculate Today's PnL
    let todayPnl = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null) {
        const d = new Date(t.openedAt);
        if (d >= today) {
          todayPnl += t.pnlUsd;
        }
      }
    });

    return {
      totalTrades: filteredTrades.length,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      expectancyUsd,
      totalPnl,
      todayPnl
    };
  }, [filteredTrades]);

  const sessionPerformance = useMemo(() => {
    const perf = { LONDON: 0, NEW_YORK: 0, TOKYO: 0, SYDNEY: 0 };
    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null && t.session in perf) {
        perf[t.session as keyof typeof perf] += t.pnlUsd;
      }
    });
    return perf;
  }, [filteredTrades]);

  const maxSessionPerf = useMemo(() => {
    const max = Math.max(...Object.values(sessionPerformance).map(v => Math.abs(v)));
    return max > 0 ? max : 1;
  }, [sessionPerformance]);

  const heatmapPerformance = useMemo(() => {
    // days: 0 = Sun, 1 = Mon ... 6 = Sat
    // We care about 1,2,3,4,5 (Mon-Fri)
    const sessions = ['LONDON', 'NEW_YORK', 'TOKYO', 'SYDNEY'];
    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    
    // Initialize structure
    const grid: Record<number, Record<string, { pnl: number; wins: number; total: number }>> = {};
    days.forEach(d => {
      grid[d] = {};
      sessions.forEach(s => {
        grid[d][s] = { pnl: 0, wins: 0, total: 0 };
      });
    });

    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null && t.session) {
        const d = new Date(t.openedAt).getDay();
        if (days.includes(d) && sessions.includes(t.session)) {
          grid[d][t.session].pnl += t.pnlUsd;
          grid[d][t.session].total += 1;
          if (t.pnlUsd > 0) grid[d][t.session].wins += 1;
        }
      }
    });

    return grid;
  }, [filteredTrades]);

  // Strategy Performance Logic
  const strategyPerformance = useMemo(() => {
    const performance: Record<string, { pnl: number; winCount: number; lossCount: number; total: number }> = {};
    
    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null && t.setupTags && t.setupTags.length > 0) {
        t.setupTags.forEach(tag => {
          if (!performance[tag]) {
            performance[tag] = { pnl: 0, winCount: 0, lossCount: 0, total: 0 };
          }
          performance[tag].total += 1;
          performance[tag].pnl += t.pnlUsd!;
          if (t.pnlUsd! > 0) performance[tag].winCount += 1;
          else if (t.pnlUsd! < 0) performance[tag].lossCount += 1;
        });
      }
    });
    
    return Object.entries(performance)
      .map(([tag, data]) => ({
        tag,
        ...data,
        winRate: data.total > 0 ? (data.winCount / data.total) * 100 : 0
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Currency Exposure Logic
  const currencyExposure = useMemo(() => {
    const exposure: Record<string, number> = {};
    const openTrades = trades.filter(t => t.status === 'OPEN');
    
    openTrades.forEach(t => {
       // Assuming standard 6 char pair like EURUSD
       const cleanedPair = t.pair.replace(/[^A-Z]/gi, '').toUpperCase();
       if (cleanedPair.length >= 6) {
         const base = cleanedPair.substring(0, 3);
         const quote = cleanedPair.substring(3, 6);
         
         if (!exposure[base]) exposure[base] = 0;
         if (!exposure[quote]) exposure[quote] = 0;
         
         if (t.direction === 'LONG') {
           exposure[base] += 1;
           exposure[quote] -= 1;
         } else {
           exposure[base] -= 1;
           exposure[quote] += 1;
         }
       }
    });
    
    return Object.entries(exposure)
      .filter(([_, val]) => val !== 0)
      .sort((a, b) => b[1] - a[1]);
  }, [trades]);

  // Emotion Performance Logic
  const emotionPerformance = useMemo(() => {
    const performance: Record<string, { pnl: number; winCount: number; lossCount: number; total: number }> = {};
    
    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnlUsd !== null && t.emotion) {
        if (!performance[t.emotion]) {
          performance[t.emotion] = { pnl: 0, winCount: 0, lossCount: 0, total: 0 };
        }
        performance[t.emotion].total += 1;
        performance[t.emotion].pnl += t.pnlUsd;
        if (t.pnlUsd > 0) performance[t.emotion].winCount += 1;
        else if (t.pnlUsd < 0) performance[t.emotion].lossCount += 1;
      }
    });
    
    return Object.entries(performance)
      .map(([emotion, data]) => ({
        emotion,
        ...data,
        winRate: data.total > 0 ? (data.winCount / data.total) * 100 : 0
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [filteredTrades]);

  // Execution Efficiency Logic
  const efficiencyMetrics = useMemo(() => {
    let totalPlanned = 0;
    let totalActual = 0;
    let count = 0;

    filteredTrades.forEach(t => {
      if (t.status === 'CLOSED' && t.plannedRR !== undefined && t.actualRR !== undefined && t.plannedRR > 0) {
        totalPlanned += t.plannedRR;
        totalActual += t.actualRR;
        count++;
      }
    });

    if (count === 0) return { avgPlannedRR: 0, avgActualRR: 0, efficiencyScore: 0 };

    const avgPlannedRR = totalPlanned / count;
    const avgActualRR = totalActual / count;
    const efficiencyScore = avgPlannedRR > 0 ? (avgActualRR / avgPlannedRR) * 100 : 0;

    return { avgPlannedRR, avgActualRR, efficiencyScore };
  }, [filteredTrades]);

  const equityData = useMemo(() => {
    const closedTrades = [...filteredTrades]
      .filter(t => t.status === 'CLOSED' && t.pnlUsd !== null)
      .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());

    let currentBalance = initialBalance;
    
    if (closedTrades.length === 0) {
      return { points: [{ x: 0, y: 50, balance: initialBalance, pnl: 0, date: new Date().toLocaleDateString() }], pathData: 'M0,50 L100,50', minBalance: initialBalance, maxBalance: initialBalance, hasData: false, maxDrawdownPct: 0 };
    }

    let minBalance = initialBalance;
    let maxBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdownPct = 0;

    const dataPoints = closedTrades.map(t => {
      currentBalance += t.pnlUsd!;
      if (currentBalance < minBalance) minBalance = currentBalance;
      if (currentBalance > maxBalance) maxBalance = currentBalance;
      
      if (currentBalance > peakBalance) peakBalance = currentBalance;
      const drawdown = peakBalance - currentBalance;
      const drawdownPct = (drawdown / peakBalance) * 100;
      if (drawdownPct > maxDrawdownPct) maxDrawdownPct = drawdownPct;

      return {
        date: new Date(t.openedAt).toLocaleDateString(),
        balance: currentBalance,
        pnl: t.pnlUsd!
      };
    });

    // If only one trade, create a line from start to trade
    if (dataPoints.length === 1) {
      dataPoints.unshift({ date: 'Start', balance: initialBalance, pnl: 0 });
    }

    const yRange = maxBalance - minBalance || 100;
    const padding = yRange * 0.1;
    const paddedMin = minBalance - padding;
    const paddedMax = maxBalance + padding;
    const paddedRange = paddedMax - paddedMin;

    const points = dataPoints.map((p, i) => {
      const x = (i / (dataPoints.length - 1)) * 100;
      const y = 100 - ((p.balance - paddedMin) / paddedRange) * 100;
      return { ...p, x, y };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    return { points, pathData, minBalance, maxBalance, hasData: true, maxDrawdownPct };
  }, [filteredTrades]);

  // ── helper: stat card ──────────────────────────────────────
  const StatCard = ({ label, value, color = 'var(--text-primary)' }: { label: string; value: string; color?: string }) => (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="section-title" style={{ marginBottom: 6 }}>{label}</div>
      <div className="metric" style={{ color }}>{value}</div>
    </div>
  );

  // ── helper: card header ─────────────────────────────────────
  const CardHeader = ({ title }: { title: string }) => (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.01em', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>{title}</div>
  );

  const emptyState = (msg: string) => (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>{msg}</div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--font-sans)' }} className="animate-in">

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Dashboard</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 3 }}>Performance overview & analytics</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {dailyLossLimit !== null && metrics.todayPnl <= -dailyLossLimit && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
              <ShieldCheck size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span style={{ color: 'var(--red)', fontWeight: 600 }}>Daily loss limit reached — step away.</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '6px 10px' }}>
            <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <option value="7d" style={{ background: 'var(--surface-2)' }}>Last 7 Days</option>
              <option value="30d" style={{ background: 'var(--surface-2)' }}>Last 30 Days</option>
              <option value="this_year" style={{ background: 'var(--surface-2)' }}>This Year</option>
              <option value="all_time" style={{ background: 'var(--surface-2)' }}>All Time</option>
              <option value="custom" style={{ background: 'var(--surface-2)' }}>Custom</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '6px 10px' }}>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="input" style={{ padding: '0', background: 'transparent', border: 'none', fontSize: 12, width: 120 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="input" style={{ padding: '0', background: 'transparent', border: 'none', fontSize: 12, width: 120 }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard label="Total Trades" value={String(metrics.totalTrades)} />
        <StatCard label="Win Rate" value={`${metrics.winRate}%`} color="var(--green)" />
        <StatCard label="Profit Factor" value={metrics.profitFactor} />
        <StatCard label="Expectancy" value={`$${metrics.expectancyUsd.toFixed(2)}`} />
        <StatCard label="Max Drawdown" value={`${(equityData.maxDrawdownPct || 0).toFixed(1)}%`} color="var(--red)" />
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px 18px' }}>
          <div className="section-title" style={{ marginBottom: 6, color: 'rgba(165,180,252,0.7)' }}>Net Profit</div>
          <div className="metric" style={{ color: metrics.totalPnl >= 0 ? '#a5b4fc' : 'var(--red)' }}>
            {metrics.totalPnl >= 0 ? '+' : ''}${metrics.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Equity Curve — spans 2 cols */}
        <div className="card-lg" style={{ gridColumn: 'span 2', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>Equity Curve</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)', padding: '3px 9px', borderRadius: 999 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', display: 'inline-block' }} />
                Live
              </span>
              <button onClick={() => setIsChartExpanded(true)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 7, padding: '4px 6px', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
          <div style={{ height: 220, position: 'relative', overflow: 'visible' }} onMouseLeave={() => setHoveredPoint(null)}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.05 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ borderBottom: '1px solid #fff', width: '100%' }} />)}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', color: '#6366f1', overflow: 'visible' }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#eqGrad)" />
              <path d={equityData.pathData} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {equityData.points.map((p, i) => (
                <g key={i} onMouseEnter={() => setHoveredPoint(i)}>
                  <circle cx={p.x} cy={p.y} r="5" fill="transparent" style={{ cursor: 'pointer' }} vectorEffect="non-scaling-stroke" />
                  <circle cx={p.x} cy={p.y} r={hoveredPoint === i ? "4" : "0"} fill="#0a0a0f" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ transition: 'r 0.15s' }} />
                </g>
              ))}
              {equityData.hasData && (
                <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="2.5" fill="#6366f1" stroke="#0a0a0f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              )}
            </svg>
            {hoveredPoint !== null && (
              <div style={{ position: 'absolute', zIndex: 20, background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 9, padding: '8px 12px', pointerEvents: 'none', transform: 'translateX(-50%) translateY(-110%)', left: `calc(${equityData.points[hoveredPoint].x}% * 0.87 + 1%)`, top: `calc(${equityData.points[hoveredPoint].y}% * 0.8 + 5%)`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>{equityData.points[hoveredPoint].date}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>${equityData.points[hoveredPoint].balance.toFixed(2)}</div>
                {equityData.points[hoveredPoint].pnl !== 0 && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: equityData.points[hoveredPoint].pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {equityData.points[hoveredPoint].pnl > 0 ? '+' : ''}{equityData.points[hoveredPoint].pnl.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Session Performance */}
        <div className="card-lg" style={{ padding: '18px 20px' }}>
          <CardHeader title="Session Performance" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(['LONDON','NEW_YORK','TOKYO','SYDNEY'] as const).map(sess => {
              const labels: Record<string, string> = { LONDON: 'London', NEW_YORK: 'New York', TOKYO: 'Tokyo', SYDNEY: 'Sydney' };
              const v = sessionPerformance[sess];
              return (
                <div key={sess}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{labels[sess]}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>{v >= 0 ? '+' : ''}${Math.abs(v).toFixed(2)}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: v >= 0 ? 'var(--green)' : 'var(--red)', borderRadius: 2, width: Math.max(4, (Math.abs(v) / maxSessionPerf) * 100) + '%', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategy Performance — spans 2 cols */}
        <div className="card-lg" style={{ gridColumn: 'span 2', padding: '18px 20px' }}>
          <CardHeader title="Strategy Performance" />
          {strategyPerformance.length === 0 ? emptyState('No strategy tags found in closed trades.') : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 380 }}>
                <thead><tr className="table-header"><th style={{ textAlign: 'left' }}>Strategy</th><th style={{ textAlign: 'left' }}>Trades</th><th style={{ textAlign: 'left' }}>Win Rate</th><th style={{ textAlign: 'right' }}>Net PnL</th></tr></thead>
                <tbody>
                  {strategyPerformance.map((s, i) => (
                    <tr key={i} className="table-row">
                      <td><span className="badge badge-indigo">{s.tag}</span></td>
                      <td>{s.total}</td>
                      <td style={{ color: s.winRate >= 50 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{s.winRate.toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: s.pnl > 0 ? 'var(--green)' : s.pnl < 0 ? 'var(--red)' : 'var(--text-tertiary)' }}>
                        {s.pnl > 0 ? '+' : ''}${s.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Exposure */}
        <div className="card-lg" style={{ padding: '18px 20px' }}>
          <CardHeader title="Live Exposure" />
          {currencyExposure.length === 0 ? emptyState('No open trades.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currencyExposure.some(c => Math.abs(c[1]) > 1) && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, margin: 0 }}>⚠ Heavy exposure — correlated positions.</p>
                </div>
              )}
              {currencyExposure.map(([cur, exp]) => (
                <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{cur}</span>
                  <span className={exp > 0 ? 'badge badge-green' : 'badge badge-red'}>{exp > 0 ? `LONG +${exp}` : `SHORT ${exp}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Psychology */}
        <div className="card-lg" style={{ padding: '18px 20px' }}>
          <CardHeader title="Psychology & Emotions" />
          {emotionPerformance.length === 0 ? emptyState('No emotion data logged yet.') : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr className="table-header"><th style={{ textAlign: 'left' }}>Emotion</th><th style={{ textAlign: 'left' }}>WR</th><th style={{ textAlign: 'right' }}>PnL</th></tr></thead>
              <tbody>
                {emotionPerformance.map((e, i) => (
                  <tr key={i} className="table-row">
                    <td style={{ fontSize: 11 }}><span style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{e.emotion}</span></td>
                    <td style={{ fontWeight: 600, color: e.winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>{e.winRate.toFixed(0)}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: e.pnl > 0 ? 'var(--green)' : 'var(--red)' }}>{e.pnl > 0 ? '+' : ''}${e.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Execution Efficiency */}
        <div className="card-lg" style={{ padding: '18px 20px' }}>
          <CardHeader title="Execution Efficiency" />
          {efficiencyMetrics.avgPlannedRR === 0 ? emptyState('No R:R data logged yet.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '10px 12px' }}>
                  <div className="section-title" style={{ marginBottom: 4 }}>Planned R:R</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>1 : {efficiencyMetrics.avgPlannedRR.toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '10px 12px' }}>
                  <div className="section-title" style={{ marginBottom: 4 }}>Actual R:R</div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: efficiencyMetrics.avgActualRR >= efficiencyMetrics.avgPlannedRR ? 'var(--green)' : 'var(--red)' }}>1 : {efficiencyMetrics.avgActualRR.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 9, padding: '12px', textAlign: 'center' }}>
                <div className="section-title" style={{ marginBottom: 4, color: '#a5b4fc' }}>Efficiency Score</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: efficiencyMetrics.efficiencyScore >= 80 ? 'var(--green)' : efficiencyMetrics.efficiencyScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                  {efficiencyMetrics.efficiencyScore.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.6)', marginTop: 3 }}>
                  {efficiencyMetrics.efficiencyScore >= 80 ? 'Great — letting winners run.' : 'Cutting winners early.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Heatmap — full width */}
        <div className="card-lg" style={{ gridColumn: 'span 3', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Performance Heatmap</div>
            <span className="section-title">Day vs Session</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr>
                  <th className="table-header" style={{ textAlign: 'left', paddingBottom: 10, paddingRight: 16, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Day</th>
                  {['London','New York','Tokyo','Sydney'].map(s => <th key={s} className="table-header" style={{ textAlign: 'center', paddingBottom: 10, paddingInline: 6, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(day => {
                  const dayNames = ['','Mon','Tue','Wed','Thu','Fri'];
                  return (
                    <tr key={day}>
                      <td style={{ paddingRight: 16, paddingBlock: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>{dayNames[day]}</td>
                      {['LONDON','NEW_YORK','TOKYO','SYDNEY'].map(sess => {
                        const cell = heatmapPerformance[day][sess];
                        const has = cell.total > 0;
                        const wr = has ? (cell.wins / cell.total) * 100 : 0;
                        const bg = !has ? 'var(--surface-2)' : cell.pnl > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)';
                        const border = !has ? 'var(--border-subtle)' : cell.pnl > 0 ? 'var(--green-border)' : 'var(--red-border)';
                        const col = !has ? 'var(--text-muted)' : cell.pnl > 0 ? 'var(--green)' : 'var(--red)';
                        return (
                          <td key={sess} style={{ padding: '4px 6px' }}>
                            <div style={{ height: 56, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              {has ? (
                                <>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{cell.pnl > 0 ? '+' : ''}${cell.pnl.toFixed(0)}</span>
                                  <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 2 }}>{wr.toFixed(0)}% WR ({cell.total})</span>
                                </>
                              ) : <span style={{ color: 'var(--border-default)', fontSize: 11 }}>—</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades — full width */}
        <div className="card-lg" style={{ gridColumn: 'span 3', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Recent Trades</div>
            <Link to="/journal" style={{ fontSize: 11.5, fontWeight: 600, color: '#a5b4fc', textDecoration: 'none', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '4px 12px', borderRadius: 6 }}>View all →</Link>
          </div>
          {filteredTrades.length === 0 ? emptyState('No trades yet. Log your first trade in the Journal.') : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead><tr>
                <th className="table-header" style={{ textAlign: 'left' }}>Pair</th>
                <th className="table-header" style={{ textAlign: 'left' }}>Direction</th>
                <th className="table-header" style={{ textAlign: 'left' }}>Result</th>
                <th className="table-header" style={{ textAlign: 'right' }}>Date</th>
              </tr></thead>
              <tbody>
                {filteredTrades.slice(0, 5).map(t => (
                  <tr key={t.id} className="table-row">
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.pair}</td>
                    <td><span className={t.direction === 'LONG' ? 'badge badge-green' : 'badge badge-red'}>{t.direction}</span></td>
                    <td style={{ fontWeight: 700, color: t.pnlUsd != null && t.pnlUsd > 0 ? 'var(--green)' : t.pnlUsd != null && t.pnlUsd < 0 ? 'var(--red)' : 'var(--text-tertiary)' }}>
                      {t.pnlUsd != null ? `${t.pnlUsd > 0 ? '+' : ''}$${Math.abs(t.pnlUsd).toFixed(2)}` : 'OPEN'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(t.openedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {isChartExpanded && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div className="card-lg" style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Equity Curve — Expanded</span>
              <button onClick={() => setIsChartExpanded(false)} className="btn btn-ghost" style={{ padding: '5px 8px' }}><X size={14} /></button>
            </div>
            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ height: 360, position: 'relative' }} onMouseLeave={() => setHoveredPoint(null)}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', color: '#6366f1', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="eqGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#eqGrad2)" />
                  <path d={equityData.pathData} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
                {[
                  { label: 'Starting Balance', value: '$10,000.00' },
                  { label: 'Current Balance', value: `$${(10000 + metrics.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
                  { label: 'Net Profit', value: `${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toFixed(2)}` },
                  { label: 'Max Drawdown', value: `${(equityData.maxDrawdownPct || 0).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 9, padding: '12px 14px' }}>
                    <div className="section-title" style={{ marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

