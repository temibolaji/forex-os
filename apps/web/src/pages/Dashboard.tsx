import { useState, useMemo } from 'react';
import { ShieldCheck, Maximize2, X } from 'lucide-react';
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


  const isProfit = metrics.totalPnl >= 0;
  const pnlColor = isProfit ? 'var(--bull)' : 'var(--bear)';

  const sessions: { key: keyof typeof sessionPerformance; label: string; color: string }[] = [
    { key: 'LONDON',   label: 'London',   color: '#7c3aed' },
    { key: 'NEW_YORK', label: 'New York', color: '#00d37f' },
    { key: 'TOKYO',    label: 'Tokyo',    color: '#f5a623' },
    { key: 'SYDNEY',   label: 'Sydney',   color: '#38bdf8' },
  ];

  const empty = (msg: string) => (
    <div className="empty-state">{msg}</div>
  );

  return (
    <div className="page" style={{ paddingBottom: 48 }}>

      {/* ══ Header ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Performance overview & structural analytics</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {dailyLossLimit !== null && metrics.todayPnl <= -dailyLossLimit && (
            <div className="alert-danger">
              <ShieldCheck size={13} style={{ flexShrink: 0 }} />
              Daily loss limit reached — stop trading.
            </div>
          )}

          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ width: 'auto', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: 'var(--t1)', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="this_year">This year</option>
            <option value="all_time">All time</option>
            <option value="custom">Custom</option>
          </select>

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 10px' }}>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--t1)', fontSize: 12, outline: 'none', width: 120 }} />
              <span style={{ color: 'var(--t3)', fontSize: 11 }}>→</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--t1)', fontSize: 12, outline: 'none', width: 120 }} />
            </div>
          )}
        </div>
      </div>

      {/* ══ Top KPIs ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>

        {/* Net P&L — hero */}
        <div className="stat-card-hero" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label" style={{ color: 'rgba(196,181,253,0.6)' }}>Net Profit / Loss</div>
          <div className="stat-value" style={{ fontSize: 38, color: pnlColor }}>
            {isProfit ? '+' : ''}${metrics.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(196,181,253,0.5)' }}>
            {isProfit ? '↑' : '↓'} vs starting balance of ${initialBalance.toLocaleString()}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value bull">{metrics.winRate}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Profit Factor</div>
          <div className="stat-value">{metrics.profitFactor}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Expectancy</div>
          <div className="stat-value" style={{ color: metrics.expectancyUsd >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
            {metrics.expectancyUsd >= 0 ? '+' : ''}${metrics.expectancyUsd.toFixed(2)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Drawdown</div>
          <div className="stat-value bear">{(equityData.maxDrawdownPct || 0).toFixed(1)}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{metrics.totalTrades}</div>
        </div>
      </div>

      {/* ══ Mid Grid ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Equity Curve */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="card-title">Equity Curve</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: '#c4b5fd', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', padding: '3px 10px', borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c4b5fd', display: 'inline-block', boxShadow: '0 0 6px #c4b5fd' }} />
                Live
              </span>
              <button onClick={() => setIsChartExpanded(true)} className="btn btn-ghost" style={{ padding: '4px 7px', fontSize: 11 }}>
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          <div style={{ height: 200, position: 'relative', overflow: 'visible' }} onMouseLeave={() => setHoveredPoint(null)}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {[0,1,2,3].map(i => <div key={i} style={{ borderBottom: '1px solid var(--line)', width: '100%' }} />)}
            </div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={isProfit ? '#00d37f' : '#ff3b3b'} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={isProfit ? '#00d37f' : '#ff3b3b'} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#eqG)" />
              <path d={equityData.pathData} fill="none" stroke={isProfit ? '#00d37f' : '#ff3b3b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {equityData.points.map((p, i) => (
                <g key={i} onMouseEnter={() => setHoveredPoint(i)}>
                  <circle cx={p.x} cy={p.y} r="5" fill="transparent" style={{ cursor: 'crosshair' }} vectorEffect="non-scaling-stroke" />
                  {hoveredPoint === i && <circle cx={p.x} cy={p.y} r="3.5" fill="#000" stroke={isProfit ? '#00d37f' : '#ff3b3b'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
                </g>
              ))}
              {equityData.hasData && (
                <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="2.5" fill={isProfit ? '#00d37f' : '#ff3b3b'} stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              )}
            </svg>

            {/* Tooltip */}
            {hoveredPoint !== null && (
              <div style={{ position: 'absolute', zIndex: 20, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 11px', pointerEvents: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>{equityData.points[hoveredPoint].date}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em' }}>${equityData.points[hoveredPoint].balance.toFixed(2)}</div>
                {equityData.points[hoveredPoint].pnl !== 0 && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: equityData.points[hoveredPoint].pnl >= 0 ? 'var(--bull)' : 'var(--bear)', marginTop: 1 }}>
                    {equityData.points[hoveredPoint].pnl > 0 ? '+' : ''}{equityData.points[hoveredPoint].pnl.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Balance summary */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            {[
              { label: 'Start', value: `$${initialBalance.toLocaleString()}` },
              { label: 'Current', value: `$${(initialBalance + metrics.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
              { label: 'Return', value: `${metrics.totalPnl >= 0 ? '+' : ''}${(metrics.totalPnl / initialBalance * 100).toFixed(2)}%` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Performance */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="card-title" style={{ marginBottom: 18 }}>Session Performance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sessions.map(s => {
              const v = sessionPerformance[s.key];
              const pct = Math.max(6, (Math.abs(v) / maxSessionPerf) * 100);
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t2)' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: v >= 0 ? 'var(--bull)' : 'var(--bear)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {v >= 0 ? '+' : ''}${Math.abs(v).toFixed(2)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: v >= 0 ? s.color : 'var(--bear)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ Bottom Grid ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Psychology */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Psychology & Emotions</div>
          {emotionPerformance.length === 0 ? empty('No emotion data logged yet') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {emotionPerformance.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < emotionPerformance.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,166,35,0.1)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.2)' }}>{e.emotion}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{e.winRate.toFixed(0)}%</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: e.pnl >= 0 ? 'var(--bull)' : 'var(--bear)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {e.pnl > 0 ? '+' : ''}${e.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Efficiency */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Execution Efficiency</div>
          {efficiencyMetrics.avgPlannedRR === 0 ? empty('No R:R data logged yet') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Planned R:R', value: `1 : ${efficiencyMetrics.avgPlannedRR.toFixed(2)}`, color: 'var(--t1)' },
                { label: 'Actual R:R', value: `1 : ${efficiencyMetrics.avgActualRR.toFixed(2)}`, color: efficiencyMetrics.avgActualRR >= efficiencyMetrics.avgPlannedRR ? 'var(--bull)' : 'var(--bear)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.04em' }}>{s.value}</div>
                </div>
              ))}
              <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#c4b5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score</div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.06em', color: efficiencyMetrics.efficiencyScore >= 80 ? 'var(--bull)' : efficiencyMetrics.efficiencyScore >= 50 ? 'var(--gold)' : 'var(--bear)' }}>
                  {efficiencyMetrics.efficiencyScore.toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'rgba(196,181,253,0.5)', marginTop: 4 }}>
                  {efficiencyMetrics.efficiencyScore >= 80 ? 'Disciplined execution' : 'Cutting winners short'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Exposure */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title">Live Exposure</div>
            {currencyExposure.length > 0 && (
              <span className="pill pill-bull" style={{ fontSize: 10 }}>{currencyExposure.length} active</span>
            )}
          </div>
          {currencyExposure.length === 0 ? empty('No open positions') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currencyExposure.some(c => Math.abs(c[1]) > 1) && (
                <div style={{ background: 'var(--bear-dim)', border: '1px solid var(--bear-line)', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: 'var(--bear)', fontWeight: 500, marginBottom: 4 }}>
                  ⚠ High correlation — reduce size
                </div>
              )}
              {currencyExposure.map(([cur, exp]) => (
                <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>{cur}</span>
                  <span className={exp > 0 ? 'pill pill-bull' : 'pill pill-bear'}>
                    {exp > 0 ? `↑ LONG` : `↓ SHORT`} {Math.abs(exp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Strategy Performance ══ */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Strategy Performance</div>
        {strategyPerformance.length === 0 ? empty('No strategy tags found in closed trades') : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead className="table-head">
                <tr>
                  <th>Strategy</th>
                  <th>Trades</th>
                  <th>Win Rate</th>
                  <th style={{ textAlign: 'right' }}>Net PnL</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {strategyPerformance.map((s, i) => (
                  <tr key={i}>
                    <td><span className="pill pill-accent">{s.tag}</span></td>
                    <td style={{ color: 'var(--t2)' }}>{s.total}</td>
                    <td style={{ color: s.winRate >= 50 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>{s.winRate.toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: s.pnl > 0 ? 'var(--bull)' : s.pnl < 0 ? 'var(--bear)' : 'var(--t3)' }}>
                      {s.pnl > 0 ? '+' : ''}${s.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ Heatmap ══ */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title">Performance Heatmap</div>
          <div className="section-title">Day × Session</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', padding: '8px 14px 8px 0', textAlign: 'left', whiteSpace: 'nowrap' }}>Day</th>
                {['London', 'New York', 'Tokyo', 'Sydney'].map(s => (
                  <th key={s} style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)', padding: '8px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(day => (
                <tr key={day}>
                  <td style={{ padding: '5px 14px 5px 0', fontSize: 12, fontWeight: 600, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                    {['','Mon','Tue','Wed','Thu','Fri'][day]}
                  </td>
                  {['LONDON','NEW_YORK','TOKYO','SYDNEY'].map(sess => {
                    const cell = heatmapPerformance[day][sess];
                    const has = cell.total > 0;
                    const wr = has ? (cell.wins / cell.total) * 100 : 0;
                    const isPos = cell.pnl > 0;
                    return (
                      <td key={sess} style={{ padding: '4px 5px' }}>
                        <div style={{
                          height: 54,
                          borderRadius: 8,
                          background: !has ? 'var(--bg-2)' : isPos ? 'var(--bull-dim)' : 'var(--bear-dim)',
                          border: `1px solid ${!has ? 'var(--line)' : isPos ? 'var(--bull-line)' : 'var(--bear-line)'}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}>
                          {has ? (
                            <>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: isPos ? 'var(--bull)' : 'var(--bear)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                                {isPos ? '+' : ''}${cell.pnl.toFixed(0)}
                              </span>
                              <span style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2, fontWeight: 500 }}>
                                {wr.toFixed(0)}% · {cell.total}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--line-hover)', fontSize: 14, fontWeight: 300 }}>—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Recent Trades ══ */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title">Recent Trades</div>
          <Link to="/journal" style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd', textDecoration: 'none', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '4px 12px', borderRadius: 6 }}>
            View all →
          </Link>
        </div>
        {filteredTrades.length === 0 ? empty('No trades yet — log your first trade in Journal') : (
          <table style={{ minWidth: 480 }}>
            <thead className="table-head">
              <tr>
                <th>Pair</th>
                <th>Direction</th>
                <th>P/L</th>
                <th style={{ textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredTrades.slice(0, 6).map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{t.pair}</td>
                  <td><span className={t.direction === 'LONG' ? 'pill pill-bull' : 'pill pill-bear'}>{t.direction}</span></td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: t.pnlUsd != null && t.pnlUsd > 0 ? 'var(--bull)' : t.pnlUsd != null && t.pnlUsd < 0 ? 'var(--bear)' : 'var(--t3)' }}>
                    {t.pnlUsd != null ? `${t.pnlUsd > 0 ? '+' : ''}$${Math.abs(t.pnlUsd).toFixed(2)}` : <span className="pill pill-gold">Open</span>}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--t3)', fontSize: 12 }}>{new Date(t.openedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ Expanded Chart Modal ══ */}
      {isChartExpanded && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 860, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em' }}>Equity Curve — Expanded View</div>
              <button onClick={() => setIsChartExpanded(false)} className="btn btn-ghost" style={{ padding: '5px 8px' }}><X size={14} /></button>
            </div>
            <div style={{ padding: '22px 24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ height: 340, marginBottom: 20 }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="eqG2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={isProfit ? '#00d37f' : '#ff3b3b'} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={isProfit ? '#00d37f' : '#ff3b3b'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#eqG2)" />
                  <path d={equityData.pathData} fill="none" stroke={isProfit ? '#00d37f' : '#ff3b3b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Starting balance', value: `$${initialBalance.toLocaleString()}` },
                  { label: 'Current balance', value: `$${(initialBalance + metrics.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2})}` },
                  { label: 'Net return', value: `${metrics.totalPnl >= 0 ? '+' : ''}${(metrics.totalPnl / initialBalance * 100).toFixed(2)}%` },
                  { label: 'Max drawdown', value: `${(equityData.maxDrawdownPct || 0).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="stat-label">{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em', marginTop: 4 }}>{s.value}</div>
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
