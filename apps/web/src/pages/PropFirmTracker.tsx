import { useState, useMemo } from 'react';
import { Target, AlertTriangle, ShieldCheck, TrendingDown, Trophy } from 'lucide-react';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';

export default function PropFirmTracker() {
  const [targetProfitPct, setTargetProfitPct] = useState(8);
  const [maxDailyLossPct, setMaxDailyLossPct] = useState(5);
  const [maxOverallLossPct, setMaxOverallLossPct] = useState(10);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const trades = useTradeStore(state => state.trades);
  const initialBalance = useAuthStore(state => state.initialBalance);

  // Calculate current equity and max drawdowns
  const { currentEquity, todayPnl, maxDrawdownUsd, isFailed, isPassed } = useMemo(() => {
    let equity = initialBalance;
    let peakEquity = initialBalance;
    let maxDdUsd = 0;
    
    // Calculate Today's PnL
    let todayPnlUsd = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closedTrades = [...trades]
      .filter(t => t.status === 'CLOSED' && t.pnlUsd !== null)
      .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());

    closedTrades.forEach(t => {
      equity += t.pnlUsd!;
      if (equity > peakEquity) peakEquity = equity;
      const drawdown = peakEquity - equity;
      if (drawdown > maxDdUsd) maxDdUsd = drawdown;

      const d = new Date(t.openedAt);
      if (d >= today) {
        todayPnlUsd += t.pnlUsd!;
      }
    });

    const targetUsd = initialBalance * (targetProfitPct / 100);
    const dailyLossLimitUsd = initialBalance * (maxDailyLossPct / 100);
    const overallLossLimitUsd = initialBalance * (maxOverallLossPct / 100);

    const isFailed = maxDdUsd >= overallLossLimitUsd || Math.abs(Math.min(0, todayPnlUsd)) >= dailyLossLimitUsd;
    const isPassed = !isFailed && (equity - initialBalance) >= targetUsd;

    return {
      currentEquity: equity,
      todayPnl: todayPnlUsd,
      maxDrawdownUsd: maxDdUsd,
      isFailed,
      isPassed
    };
  }, [trades, initialBalance, targetProfitPct, maxDailyLossPct, maxOverallLossPct]);

  const targetProfitUsd = initialBalance * (targetProfitPct / 100);
  const maxDailyLossUsd = initialBalance * (maxDailyLossPct / 100);
  const maxOverallLossUsd = initialBalance * (maxOverallLossPct / 100);

  const currentProfitUsd = currentEquity - initialBalance;
  const targetProgress = Math.min(100, Math.max(0, (currentProfitUsd / targetProfitUsd) * 100));
  
  const dailyLossProgress = Math.min(100, Math.max(0, (Math.abs(Math.min(0, todayPnl)) / maxDailyLossUsd) * 100));
  const overallLossProgress = Math.min(100, Math.max(0, (maxDrawdownUsd / maxOverallLossUsd) * 100));

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight flex items-center gap-3">
            <Trophy className="text-amber-400" size={28} />
            Prop Firm Tracker
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Monitor your progress against funding challenge rules.</p>
        </div>
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
        >
          Configure Rules
        </button>
      </div>

      {isConfigOpen && (
        <div className="glass-panel bg-slate-900/60 p-6 rounded-[2xl] border border-indigo-500/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Challenge Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Profit (%)</label>
              <input type="number" className="w-full px-4 py-2.5 bg-slate-800 border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500" value={targetProfitPct} onChange={e => setTargetProfitPct(parseFloat(e.target.value) || 8)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Max Daily Loss (%)</label>
              <input type="number" className="w-full px-4 py-2.5 bg-slate-800 border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500" value={maxDailyLossPct} onChange={e => setMaxDailyLossPct(parseFloat(e.target.value) || 5)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Max Overall Loss (%)</label>
              <input type="number" className="w-full px-4 py-2.5 bg-slate-800 border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500" value={maxOverallLossPct} onChange={e => setMaxOverallLossPct(parseFloat(e.target.value) || 10)} />
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {isPassed ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-500/5">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
            <Trophy className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-emerald-400">Challenge Passed!</h2>
            <p className="text-emerald-300/80 text-sm font-medium mt-1">You have hit your profit target without breaching any drawdown rules.</p>
          </div>
        </div>
      ) : isFailed ? (
        <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl flex items-center gap-4 shadow-lg shadow-rose-500/5">
          <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="text-rose-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-rose-400">Challenge Failed</h2>
            <p className="text-rose-300/80 text-sm font-medium mt-1">You have breached a drawdown limit.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Target Profit */}
        <div className="glass-panel bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-indigo-400" /> Target Profit
            </h2>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">{targetProfitPct}%</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-display font-black text-white">${Math.max(0, currentProfitUsd).toFixed(2)}</div>
              <div className="text-sm font-medium text-slate-400 mt-1">of ${targetProfitUsd.toFixed(2)}</div>
            </div>
            <div className="text-2xl font-black text-indigo-400">{targetProgress.toFixed(1)}%</div>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${targetProgress}%` }}></div>
          </div>
        </div>

        {/* Max Daily Loss */}
        <div className="glass-panel bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingDown size={16} className="text-amber-400" /> Max Daily Loss
            </h2>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">{maxDailyLossPct}%</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-display font-black text-white">${Math.abs(Math.min(0, todayPnl)).toFixed(2)}</div>
              <div className="text-sm font-medium text-slate-400 mt-1">of ${maxDailyLossUsd.toFixed(2)}</div>
            </div>
            <div className={`text-2xl font-black ${dailyLossProgress > 80 ? 'text-rose-400' : 'text-amber-400'}`}>{dailyLossProgress.toFixed(1)}%</div>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className={`h-full ${dailyLossProgress > 80 ? 'bg-rose-500' : 'bg-amber-500'} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${dailyLossProgress}%` }}></div>
          </div>
        </div>

        {/* Max Overall Loss */}
        <div className="glass-panel bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-rose-400" /> Max Overall Loss
            </h2>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">{maxOverallLossPct}%</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-display font-black text-white">${maxDrawdownUsd.toFixed(2)}</div>
              <div className="text-sm font-medium text-slate-400 mt-1">of ${maxOverallLossUsd.toFixed(2)}</div>
            </div>
            <div className={`text-2xl font-black ${overallLossProgress > 80 ? 'text-rose-400' : 'text-rose-400'}`}>{overallLossProgress.toFixed(1)}%</div>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${overallLossProgress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
