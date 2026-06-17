import { useState, useMemo } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { ShieldAlert, TrendingDown, Target, Play, ShieldCheck, Info } from 'lucide-react';

export default function RiskSimulator() {
  const trades = useTradeStore(state => state.trades);
  
  const [trials, setTrials] = useState(100);
  const [riskPerTrade, setRiskPerTrade] = useState(1); // 1%
  const [simulations, setSimulations] = useState<number[][]>([]);
  const [riskOfRuin, setRiskOfRuin] = useState<number | null>(null);

  // Compute baseline stats from actual trades
  const stats = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.actualRR !== undefined && t.actualRR > 0);
    
    if (closedTrades.length === 0) return { winRate: 0.5, avgRR: 2, hasData: false };

    let wins = 0;
    let totalRR = 0;

    closedTrades.forEach(t => {
      if (t.pnlUsd! > 0) wins++;
      totalRR += t.actualRR!;
    });

    const winRate = wins / closedTrades.length;
    const avgRR = totalRR / closedTrades.length;

    return { winRate, avgRR, hasData: true };
  }, [trades]);

  const runSimulation = () => {
    // Run Monte Carlo: 100 simulations of `trials` trades
    const numSimulations = 100;
    const newSimulations: number[][] = [];
    let ruinedCount = 0;

    const { winRate, avgRR } = stats;
    
    for (let i = 0; i < numSimulations; i++) {
      let balance = 100; // Start at 100%
      const equityCurve = [balance];
      let ruined = false;

      for (let j = 0; j < trials; j++) {
        const isWin = Math.random() < winRate;
        if (isWin) {
          balance += riskPerTrade * avgRR;
        } else {
          balance -= riskPerTrade;
        }

        equityCurve.push(balance);

        // Define ruin as losing 50% of the account
        if (balance <= 50) {
          ruined = true;
        }
      }

      newSimulations.push(equityCurve);
      if (ruined) ruinedCount++;
    }

    setSimulations(newSimulations);
    setRiskOfRuin((ruinedCount / numSimulations) * 100);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-rose-400" size={28} />
          Monte Carlo Simulator
        </h1>
        <p className="text-slate-400 mt-2 font-medium text-sm max-w-2xl">
          Uses your actual Win Rate and Average R:R to simulate thousands of random trade sequences. 
          This mathematically projects your Risk of Ruin (chance of hitting a 50% drawdown).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-sm">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Target size={14} className="text-indigo-400" /> Your Win Rate
          </div>
          <div className="text-3xl font-display font-black text-white">
            {(stats.winRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-sm">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <TrendingDown size={14} className="text-amber-400" /> Your Avg Actual R:R
          </div>
          <div className="text-3xl font-display font-black text-white">
            1 : {stats.avgRR.toFixed(2)}
          </div>
        </div>

        <div className={`glass-panel p-6 rounded-3xl border shadow-sm ${riskOfRuin !== null && riskOfRuin > 10 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className={riskOfRuin !== null && riskOfRuin > 10 ? 'text-rose-400' : 'text-emerald-400'} /> 
            Risk of Ruin (50% DD)
          </div>
          <div className={`text-3xl font-display font-black ${riskOfRuin !== null && riskOfRuin > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {riskOfRuin !== null ? `${riskOfRuin.toFixed(1)}%` : '--'}
          </div>
        </div>
      </div>

      <div className="glass-panel bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Trades per Simulation</label>
            <input 
              type="number" 
              className="w-full px-4 py-2.5 bg-slate-800 border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium" 
              value={trials} 
              onChange={e => setTrials(parseInt(e.target.value) || 100)} 
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Risk Per Trade (%)</label>
            <input 
              type="number" 
              step="0.5"
              className="w-full px-4 py-2.5 bg-slate-800 border-slate-700 text-slate-100 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium" 
              value={riskPerTrade} 
              onChange={e => setRiskPerTrade(parseFloat(e.target.value) || 1)} 
            />
          </div>
          <button 
            onClick={runSimulation}
            disabled={!stats.hasData}
            className="flex items-center justify-center space-x-2 bg-indigo-500 text-white px-8 py-3 rounded-xl hover:bg-indigo-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            <span>Run 100 Simulations</span>
          </button>
        </div>

        {!stats.hasData && (
          <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
            <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-300">
              Not enough data. You need at least 1 closed trade with actual R:R logged to run the simulator.
            </p>
          </div>
        )}

        {simulations.length > 0 && (
          <div className="mt-8 h-80 w-full relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2 opacity-10">
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
              <div className="border-b border-white w-full"></div>
            </div>
            
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {simulations.map((sim, i) => {
                // Find global min and max for scaling
                const flatSims = simulations.flat();
                const globalMax = Math.max(...flatSims, 110);
                const globalMin = Math.min(...flatSims, 40);
                const range = globalMax - globalMin;

                const points = sim.map((val, idx) => {
                  const x = (idx / (trials)) * 100;
                  const y = 100 - ((val - globalMin) / range) * 100;
                  return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ');

                const isRuined = sim[sim.length - 1] <= 50;

                return (
                  <path 
                    key={i} 
                    d={points} 
                    fill="none" 
                    stroke={isRuined ? '#f43f5e' : '#6366f1'} 
                    strokeWidth="0.5" 
                    opacity="0.3"
                    vectorEffect="non-scaling-stroke" 
                  />
                );
              })}
              {/* Baseline 100% */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="#fff" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" vectorEffect="non-scaling-stroke" />
              {/* 50% Ruin Line */}
              <line x1="0" y1="90" x2="100" y2="90" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,4" opacity="0.8" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="absolute bottom-0 right-0 text-rose-400 text-xs font-bold bg-slate-900/80 px-2 py-1 rounded">Ruin Threshold (50%)</div>
          </div>
        )}
      </div>
    </div>
  );
}
