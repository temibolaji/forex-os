import { useState } from 'react';
import { ArrowDownCircle, AlertTriangle, Calculator } from 'lucide-react';

export default function PositionSizer() {
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [riskPct, setRiskPct] = useState<string>('1.0');
  const [pair, setPair] = useState('EURUSD');
  const [slPips, setSlPips] = useState<string>('15');

  // Simulated results based on the PRD formula behavior
  const calcResults = () => {
    const bal = parseFloat(accountBalance) || 0;
    const risk = parseFloat(riskPct) || 0;
    const pips = parseFloat(slPips) || 1;
    
    const monetaryRisk = bal * (risk / 100);
    // Simplified logic for frontend mock test
    const pipValue = pair.endsWith('USD') ? 10 : (pair === 'USDJPY' ? 6.66 : 10); 
    const rawLotSize = monetaryRisk / (pips * pipValue);
    const rawUnits = rawLotSize * 100000;

    return {
      units: rawUnits.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      standardLots: rawLotSize.toFixed(4),
      miniLots: (rawLotSize * 10).toFixed(4),
      microLots: (rawLotSize * 100).toFixed(4),
      monetaryRisk: monetaryRisk.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    };
  };

  const results = calcResults();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Calculator className="text-indigo-600" size={32} />
          Position Sizer
        </h1>
        <p className="text-slate-500 mt-1">Calculate your exact lot size and protect your capital.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 relative overflow-hidden transition-all hover:shadow-md">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <form onSubmit={(e) => e.preventDefault()} className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Currency</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none"
                  value={accountCurrency}
                  onChange={(e) => setAccountCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Risk Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Stop Loss (pips)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                  value={slPips}
                  onChange={(e) => setSlPips(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Currency Pair</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none"
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="XAUUSD">XAU/USD (Gold)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results Card */}
        <div className="bg-indigo-600 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-indigo-500/50 relative z-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">Results</h2>
            <ArrowDownCircle size={24} className="text-indigo-300" />
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <div className="text-indigo-200 font-semibold mb-1 text-sm uppercase tracking-wider">Amount at Risk</div>
              <div className="text-3xl font-black text-white">{results.monetaryRisk} {accountCurrency}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-indigo-500/50">
              <div>
                <div className="text-indigo-200 font-semibold mb-1 text-xs uppercase tracking-wider">Standard Lots</div>
                <div className="text-2xl font-black text-white">{results.standardLots}</div>
              </div>

              <div>
                <div className="text-indigo-200 font-semibold mb-1 text-xs uppercase tracking-wider">Mini Lots</div>
                <div className="text-2xl font-black text-white">{results.miniLots}</div>
              </div>

              <div>
                <div className="text-indigo-200 font-semibold mb-1 text-xs uppercase tracking-wider">Micro Lots</div>
                <div className="text-2xl font-black text-white">{results.microLots}</div>
              </div>
              
              <div>
                <div className="text-indigo-200 font-semibold mb-1 text-xs uppercase tracking-wider">Total Units</div>
                <div className="text-xl font-bold text-indigo-100 mt-1">{results.units}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Risk Warning / Info */}
      {parseFloat(riskPct) > 2.0 && (
        <div className="mt-8 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start space-x-4 text-rose-700 animate-in slide-in-from-bottom-4 shadow-sm">
          <div className="bg-rose-100 p-2 rounded-xl shrink-0">
            <AlertTriangle size={24} className="text-rose-600" />
          </div>
          <div>
            <h4 className="font-bold text-lg">High Risk Warning</h4>
            <p className="text-sm mt-1 font-medium text-rose-600/80">You are risking more than 2% of your account on a single trade. Professional traders typically risk between 0.5% and 1% to avoid high drawdowns.</p>
          </div>
        </div>
      )}
    </div>
  );
}
