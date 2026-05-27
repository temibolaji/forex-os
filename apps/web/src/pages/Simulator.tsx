import { useState, useMemo } from 'react';
import { Play, LineChart, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Simulator() {
  const [startingBalance, setStartingBalance] = useState('10000');
  const [winRate, setWinRate] = useState('55');
  const [avgWin, setAvgWin] = useState('120');
  const [avgLoss, setAvgLoss] = useState('80');
  const [iterations, setIterations] = useState('1000');
  const [tradesCount, setTradesCount] = useState('100');
  const [isRunning, setIsRunning] = useState(false);
  
  // Results State
  const [results, setResults] = useState<any>(null);

  const runSimulation = () => {
    setIsRunning(true);
    
    // Defer to allow UI to update to loading state
    setTimeout(() => {
      const balance = parseFloat(startingBalance) || 10000;
      const wRate = (parseFloat(winRate) || 50) / 100;
      const aWin = parseFloat(avgWin) || 100;
      const aLoss = parseFloat(avgLoss) || 100;
      const iters = parseInt(iterations) || 1000;
      const trades = parseInt(tradesCount) || 100;

      let totalMaxDrawdown = 0;
      let totalFinalEquity = 0;
      let ruinedCount = 0;

      // Track a few sample paths to render visually
      const samplePaths: number[][] = [];
      const numSamples = 5;

      for (let i = 0; i < iters; i++) {
        let currentEquity = balance;
        let peakEquity = balance;
        let maxDrawdown = 0;
        let isRuined = false;
        const currentPath: number[] = [balance];

        for (let t = 0; t < trades; t++) {
          if (currentEquity <= 0) {
            isRuined = true;
            currentEquity = 0;
            if (i < numSamples) currentPath.push(0);
            break;
          }

          const isWin = Math.random() < wRate;
          if (isWin) {
            currentEquity += aWin;
          } else {
            currentEquity -= aLoss;
          }

          if (i < numSamples) {
            currentPath.push(currentEquity);
          }

          if (currentEquity > peakEquity) {
            peakEquity = currentEquity;
          }

          const drawdown = peakEquity - currentEquity;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
        }

        if (i < numSamples) {
          samplePaths.push(currentPath);
        }

        if (isRuined || currentEquity <= 0) {
          ruinedCount++;
        }
        totalMaxDrawdown += maxDrawdown;
        totalFinalEquity += currentEquity;
      }

      setResults({
        baseStats: { winRate: wRate, avgWin: aWin, avgLoss: aLoss },
        expectedMaxDrawdownUsd: (totalMaxDrawdown / iters).toFixed(2),
        expectedFinalEquityUsd: (totalFinalEquity / iters).toFixed(2),
        riskOfRuin: ((ruinedCount / iters) * 100).toFixed(1),
        samplePaths
      });
      
      setIsRunning(false);
    }, 100);
  };

  // Convert the 5 sample paths to SVG path strings
  const svgPaths = useMemo(() => {
    if (!results || !results.samplePaths) return [];
    
    // Find absolute bounds for plotting
    let minEquity = parseFloat(startingBalance) || 10000;
    let maxEquity = parseFloat(startingBalance) || 10000;
    
    results.samplePaths.forEach((path: number[]) => {
      path.forEach(val => {
        if (val < minEquity) minEquity = val;
        if (val > maxEquity) maxEquity = val;
      });
    });

    const range = maxEquity - minEquity || 1;
    const numTrades = parseInt(tradesCount) || 100;

    return results.samplePaths.map((path: number[]) => {
      return path.map((val, idx) => {
        const x = (idx / numTrades) * 100;
        // Invert y so higher equity is at the top of the SVG box
        const y = 100 - ((val - minEquity) / range) * 100;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
    });
  }, [results, startingBalance, tradesCount]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Drawdown Simulator</h1>
        <p className="text-slate-500 mt-1 font-medium">Stress-test your edge and visualize equity fluctuations using Monte Carlo methods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Controls Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Simulation Parameters</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Starting Balance ($)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all font-bold text-slate-800 outline-none"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
              />
            </div>

            {/* Win Rate, Win Size, Loss Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Win Rate (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold text-slate-800 outline-none text-sm"
                  value={winRate}
                  onChange={(e) => setWinRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Avg Win ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold text-slate-800 outline-none text-sm"
                  value={avgWin}
                  onChange={(e) => setAvgWin(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Avg Loss ($)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold text-slate-800 outline-none text-sm"
                  value={avgLoss}
                  onChange={(e) => setAvgLoss(e.target.value)}
                />
              </div>
            </div>

            {/* Trades and Iterations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Trades per Sim</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold text-slate-800 outline-none text-sm"
                  value={tradesCount}
                  onChange={(e) => setTradesCount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Iterations</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold text-slate-800 outline-none text-sm"
                  value={iterations}
                  onChange={(e) => setIterations(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
              Note: Higher iteration counts calculate more precise curves but require more browser processing.
            </p>

            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="w-full mt-4 flex justify-center items-center space-x-2 py-3.5 px-4 bg-brand hover:bg-brand-dark text-white rounded-xl shadow transition-transform active:scale-[0.98] font-bold disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-white" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Run stress test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results / Visual Panel */}
        <div className="lg:col-span-2">
          {results ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Stats overview banner */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 md:p-8 rounded-2xl shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full pointer-events-none blur-3xl"></div>
                
                <h3 className="text-indigo-300 font-bold text-xs tracking-wider uppercase mb-6 flex items-center space-x-2">
                  <LineChart size={16} />
                  <span>Stress Test Projections</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Expected Max Drawdown</div>
                    <div className="text-4xl font-extrabold text-rose-400 tracking-tight">
                      -${parseFloat(results.expectedMaxDrawdownUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Projected Average Balance</div>
                    <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                      ${parseFloat(results.expectedFinalEquityUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Path Visualization */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sample Simulation Paths (5 Runs)</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Visual Matrix</span>
                </div>
                <div className="h-64 w-full bg-slate-950 rounded-xl relative overflow-hidden p-4 border border-slate-800">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-rows-4 grid-cols-5 pointer-events-none opacity-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="border-t border-white w-full h-full"></div>
                    ))}
                  </div>

                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {svgPaths.map((dStr: string, idx: number) => {
                      const colors = [
                        'stroke-emerald-400',
                        'stroke-sky-400',
                        'stroke-indigo-400',
                        'stroke-amber-400',
                        'stroke-rose-400'
                      ];
                      return (
                        <path
                          key={idx}
                          d={dStr}
                          fill="none"
                          className={`${colors[idx % colors.length]} transition-all duration-700`}
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span>Start (Trade 0)</span>
                  <span>End (Trade {tradesCount})</span>
                </div>
              </div>

              {/* System Safety / Risk of Ruin Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Mathematical Expectancy</div>
                  <div className="text-2xl font-black text-slate-800">
                    ${((parseFloat(winRate) / 100) * parseFloat(avgWin) - (1 - parseFloat(winRate) / 100) * parseFloat(avgLoss)).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">Average payout expected per trade</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Risk of Ruin</div>
                    <div className="text-2xl font-black text-slate-800">{results.riskOfRuin}%</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">Probability of capital total loss</div>
                  </div>
                  {parseFloat(results.riskOfRuin) < 5 ? (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-2xl flex items-center justify-center animate-bounce">
                      <ShieldCheck size={24} />
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-2xl flex items-center justify-center animate-pulse">
                      <AlertTriangle size={24} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm text-slate-500 mb-4">
                <LineChart size={32} className="animate-pulse" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-700 mb-1">Ready to Simulate</h3>
              <p className="max-w-xs text-sm text-slate-500 leading-relaxed">
                Click the run button to stress-test your edge and project your mathematical model over 1,000s of scenarios.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
