import { useState, useMemo } from 'react';
import { TrendingUp, Target, Activity, Award, Calendar, ArrowUpRight, ShieldCheck, Maximize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTradeStore } from '../store/tradeStore';

export default function Dashboard() {
  const trades = useTradeStore(state => state.trades);
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

    return {
      totalTrades: filteredTrades.length,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      expectancyUsd,
      totalPnl
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

  const equityData = useMemo(() => {
    const closedTrades = [...filteredTrades]
      .filter(t => t.status === 'CLOSED' && t.pnlUsd !== null)
      .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());

    let currentBalance = 10000;
    
    if (closedTrades.length === 0) {
      return { points: [{ x: 0, y: 50, balance: 10000, pnl: 0, date: new Date().toLocaleDateString() }], pathData: 'M0,50 L100,50', minBalance: 10000, maxBalance: 10000, hasData: false };
    }

    let minBalance = 10000;
    let maxBalance = 10000;

    const dataPoints = closedTrades.map(t => {
      currentBalance += t.pnlUsd!;
      if (currentBalance < minBalance) minBalance = currentBalance;
      if (currentBalance > maxBalance) maxBalance = currentBalance;
      return {
        date: new Date(t.openedAt).toLocaleDateString(),
        balance: currentBalance,
        pnl: t.pnlUsd!
      };
    });

    // If only one trade, create a line from start to trade
    if (dataPoints.length === 1) {
      dataPoints.unshift({ date: 'Start', balance: 10000, pnl: 0 });
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

    return { points, pathData, minBalance, maxBalance, hasData: true };
  }, [filteredTrades]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 font-inter">
      {/* Welcome & Filter Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome back. Here's your trading performance and structural metrics.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0 transition-all hover:border-indigo-200">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-transparent text-slate-700 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-indigo-200 shadow-sm animate-in slide-in-from-left-2 duration-200 ring-1 ring-indigo-50">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
              />
              <span className="text-xs text-slate-400 font-semibold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target size={14} className="text-indigo-600" /> Total Trades
          </div>
          <div className="text-3xl font-black text-slate-800">{metrics.totalTrades}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-emerald-600 animate-pulse" /> Win Rate
          </div>
          <div className="text-3xl font-black text-emerald-600">{metrics.winRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity size={14} className="text-sky-600" /> Profit Factor
          </div>
          <div className="text-3xl font-black text-slate-800">{metrics.profitFactor}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-50 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-violet-600" /> Expectancy
          </div>
          <div className="text-3xl font-black text-slate-800">${metrics.expectancyUsd.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-2xl shadow-lg relative overflow-hidden col-span-2 md:col-span-1 group hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5">
          <div className="absolute top-[-50%] right-[-20%] w-full h-full bg-white/10 rounded-full blur-xl pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-200" /> Net Profit
          </div>
          <div className="text-3xl font-black text-white flex items-center gap-1">
            ${metrics.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <ArrowUpRight size={20} className="text-indigo-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Colorful Equity Curve Chart */}
        <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 transition-all hover:shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" /> Equity Curve (Growth)
            </h2>
            
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                All-Time High
              </span>
              <button 
                onClick={() => setIsChartExpanded(true)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer border border-slate-200 bg-white"
                title="Expand View"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          <div className="h-72 w-full bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-end relative overflow-visible px-4 pt-6 pb-8" onMouseLeave={() => setHoveredPoint(null)}>
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-6 opacity-30">
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
            </div>

            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-indigo-500 overflow-visible relative z-10">
              <defs>
                <linearGradient id="chartIndigoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#chartIndigoGradient)" />
              <path d={equityData.pathData} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              
              {equityData.points.map((p, i) => (
                <circle 
                  key={i}
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint === i ? "4" : "1.5"} 
                  className={`fill-white stroke-indigo-500 stroke-2 cursor-pointer transition-all duration-200`}
                  onMouseEnter={() => setHoveredPoint(i)}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {equityData.hasData && (
                <>
                  <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="2.5" className="fill-indigo-500 animate-ping" />
                  <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="1.8" className="fill-indigo-600 stroke-white stroke-1" />
                </>
              )}
            </svg>

            {hoveredPoint !== null && (
              <div 
                className="absolute z-20 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ 
                  left: `calc(1rem + ${equityData.points[hoveredPoint].x}% * 0.85)`, 
                  top: `calc(1.5rem + ${equityData.points[hoveredPoint].y}% * 0.7 - 10px)` 
                }}
              >
                <div className="text-slate-300 text-[10px] mb-0.5">{equityData.points[hoveredPoint].date}</div>
                <div>Bal: ${equityData.points[hoveredPoint].balance.toFixed(2)}</div>
                {equityData.points[hoveredPoint].pnl !== undefined && equityData.points[hoveredPoint].pnl !== 0 && (
                  <div className={equityData.points[hoveredPoint].pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {equityData.points[hoveredPoint].pnl > 0 ? "+" : ""}{equityData.points[hoveredPoint].pnl.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* X-Axis Labels */}
            <div className="absolute inset-x-4 bottom-2 flex justify-between text-[10px] text-slate-400 font-bold tracking-wide">
              {equityData.points.length > 2 ? (
                <>
                  <span>{equityData.points[0].date}</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>Today</span>
                </>
              ) : (
                <>
                  <span>Start</span>
                  <span>Today</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 transition-all hover:shadow-md">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Session Performance</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">London Session</span>
                <span className={`font-bold ${sessionPerformance.LONDON >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {sessionPerformance.LONDON >= 0 ? '+' : '-'}${Math.abs(sessionPerformance.LONDON).toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${sessionPerformance.LONDON >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full`} style={{ width: Math.max(5, (Math.abs(sessionPerformance.LONDON) / maxSessionPerf) * 100) + '%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">New York Session</span>
                <span className={`font-bold ${sessionPerformance.NEW_YORK >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
                  {sessionPerformance.NEW_YORK >= 0 ? '+' : '-'}${Math.abs(sessionPerformance.NEW_YORK).toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${sessionPerformance.NEW_YORK >= 0 ? 'bg-indigo-500' : 'bg-rose-500'} rounded-full`} style={{ width: Math.max(5, (Math.abs(sessionPerformance.NEW_YORK) / maxSessionPerf) * 100) + '%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Tokyo Session</span>
                <span className={`font-bold ${sessionPerformance.TOKYO >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {sessionPerformance.TOKYO >= 0 ? '+' : '-'}${Math.abs(sessionPerformance.TOKYO).toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${sessionPerformance.TOKYO >= 0 ? 'bg-amber-500' : 'bg-rose-500'} rounded-full`} style={{ width: Math.max(5, (Math.abs(sessionPerformance.TOKYO) / maxSessionPerf) * 100) + '%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Sydney Session</span>
                <span className={`font-bold ${sessionPerformance.SYDNEY >= 0 ? 'text-sky-500' : 'text-rose-500'}`}>
                  {sessionPerformance.SYDNEY >= 0 ? '+' : '-'}${Math.abs(sessionPerformance.SYDNEY).toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${sessionPerformance.SYDNEY >= 0 ? 'bg-sky-500' : 'bg-rose-500'} rounded-full`} style={{ width: Math.max(5, (Math.abs(sessionPerformance.SYDNEY) / maxSessionPerf) * 100) + '%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades Widget */}
        <div className="xl:col-span-3 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Recent Trades</h2>
            <Link to="/journal" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3.5 py-1.5 rounded-xl">View All</Link>
          </div>
          <div className="overflow-x-auto">
            {filteredTrades.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-semibold text-sm">No trades found. Go to Journal to log your first trade!</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-0 font-bold">Pair</th>
                    <th className="p-4 font-bold">Direction</th>
                    <th className="p-4 font-bold">Result</th>
                    <th className="p-4 font-bold text-right pr-0">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrades.slice(0, 5).map(trade => (
                    <tr key={trade.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-0 font-bold text-slate-900">{trade.pair}</td>
                      <td className={`p-4 font-semibold text-sm ${trade.direction === 'LONG' ? 'text-emerald-600' : 'text-rose-500'}`}>{trade.direction}</td>
                      <td className={`p-4 font-bold ${trade.pnlUsd !== null && trade.pnlUsd > 0 ? 'text-emerald-600' : trade.pnlUsd !== null && trade.pnlUsd < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {trade.pnlUsd !== null ? (trade.pnlUsd > 0 ? `+$${trade.pnlUsd.toFixed(2)}` : `-$${Math.abs(trade.pnlUsd).toFixed(2)}`) : 'OPEN'}
                      </td>
                      <td className="p-4 pr-0 text-right text-slate-500 text-sm font-semibold">{new Date(trade.openedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Chart Overlay Modal */}
      {isChartExpanded && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" />
                  <span>Equity Curve (Expanded View)</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comprehensive Performance Analytics</p>
              </div>
              <button 
                onClick={() => setIsChartExpanded(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200 bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col space-y-6">
              <div className="h-[400px] w-full bg-slate-950 rounded-3xl relative overflow-visible p-6 border border-slate-800 shadow-inner flex flex-col justify-end" onMouseLeave={() => setHoveredPoint(null)}>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-8 opacity-10">
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-indigo-500 overflow-visible relative z-10">
                  <defs>
                    <linearGradient id="expandedChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d={`${equityData.pathData} L100,100 L0,100 Z`} fill="url(#expandedChartGradient)" />
                  <path d={equityData.pathData} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  
                  {equityData.points.map((p, i) => (
                    <circle 
                      key={i}
                      cx={p.x} 
                      cy={p.y} 
                      r={hoveredPoint === i ? "4" : "1.5"} 
                      className="fill-slate-950 stroke-indigo-400 stroke-2 cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPoint(i)}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  
                  {equityData.hasData && (
                    <>
                      <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="2.5" className="fill-indigo-400 animate-ping" />
                      <circle cx="100" cy={equityData.points[equityData.points.length - 1].y} r="1.8" className="fill-indigo-400 stroke-slate-950 stroke-1" />
                    </>
                  )}
                </svg>

                {hoveredPoint !== null && (
                  <div 
                    className="absolute z-20 bg-white text-slate-900 text-sm font-bold px-4 py-3 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full border border-slate-200"
                    style={{ 
                      left: `calc(1.5rem + ${equityData.points[hoveredPoint].x}% * 0.9)`, 
                      top: `calc(1.5rem + ${equityData.points[hoveredPoint].y}% * 0.8 - 15px)` 
                    }}
                  >
                    <div className="text-slate-500 text-xs mb-1">{equityData.points[hoveredPoint].date}</div>
                    <div className="text-lg">Bal: ${equityData.points[hoveredPoint].balance.toFixed(2)}</div>
                    {equityData.points[hoveredPoint].pnl !== undefined && equityData.points[hoveredPoint].pnl !== 0 && (
                      <div className={`mt-1 ${equityData.points[hoveredPoint].pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {equityData.points[hoveredPoint].pnl > 0 ? "+" : ""}{equityData.points[hoveredPoint].pnl.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                <div className="absolute inset-x-6 bottom-3 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {equityData.points.length > 2 ? (
                    <>
                      <span>{equityData.points[0].date}</span>
                      <span>Today</span>
                    </>
                  ) : (
                    <>
                      <span>Start</span>
                      <span>Today</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starting Balance</span>
                  <div className="text-lg font-bold text-slate-800">$10,000.00</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Balance</span>
                  <div className="text-lg font-bold text-indigo-600">${(10000 + metrics.totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Absolute Return</span>
                  <div className="text-lg font-bold text-indigo-600">+{(metrics.totalPnl / 100).toFixed(2)}%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Drawdown</span>
                  <div className="text-lg font-bold text-rose-500">-2.3%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
