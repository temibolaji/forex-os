import { useState } from 'react';
import { ArrowDownCircle, AlertTriangle } from 'lucide-react';

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
    // For pairs ending in USD, it's exactly 10 USD per standard lot per pip
    // For USDJPY, it's roughly (0.01 / 150.00) * 100,000 ≈ 6.66
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Position Sizer</h1>
        <p className="text-slate-500 mt-1">Calculate your exact lot size and protect your capital.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand/5 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Currency</label>
                <select
                  className="w-full md:w-2/3 px-4 py-3 bg-slate-600 text-white border border-slate-600 rounded-3xl focus:ring-2 focus:ring-brand focus:outline-none appearance-none font-medium"
                  value={accountCurrency}
                  onChange={(e) => setAccountCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Balance</label>
                <input
                  type="number"
                  className="w-full md:w-2/3 px-4 py-3 bg-slate-200/60 border border-transparent rounded-3xl focus:ring-2 focus:ring-brand focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Risk Percentage</label>
                <div className="relative w-full md:w-2/3">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-4 pr-8 py-3 bg-slate-200/60 border border-transparent rounded-3xl focus:ring-2 focus:ring-brand focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Stop Loss (pips)</label>
                <input
                  type="number"
                  className="w-full md:w-2/3 px-4 py-3 bg-slate-200/60 border border-transparent rounded-3xl focus:ring-2 focus:ring-brand focus:bg-white transition-all text-lg font-bold text-slate-800 outline-none"
                  value={slPips}
                  onChange={(e) => setSlPips(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Currency Pair</label>
                <select
                  className="w-full md:w-2/3 px-4 py-3 bg-slate-600 text-white border border-slate-600 rounded-3xl focus:ring-2 focus:ring-brand focus:outline-none appearance-none font-medium"
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

            <button type="button" className="w-full md:w-2/3 mt-8 bg-[#2bb921] hover:bg-[#25a01c] text-white font-medium py-4 px-4 rounded-[2rem] shadow transition-transform active:scale-95 text-lg">
              Calculate
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col pt-12 md:pt-8">
          <div className="flex items-center space-x-3 mb-6 pb-2 border-b border-slate-100">
            <h2 className="text-3xl font-extrabold text-slate-700 tracking-tight">Results</h2>
            <ArrowDownCircle size={24} className="text-slate-600 fill-slate-600" />
          </div>

          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="text-slate-600 font-bold mb-1">Amount at Risk</div>
              <div className="text-3xl font-extrabold text-slate-600">{results.monetaryRisk} {accountCurrency}</div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <div className="text-slate-600 font-bold mb-1">Position Size (units)</div>
              <div className="text-3xl font-extrabold text-slate-600">{results.units}</div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <div className="text-slate-600 font-bold mb-1">Standard Lots</div>
              <div className="text-3xl font-extrabold text-slate-600">{results.standardLots}</div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <div className="text-slate-600 font-bold mb-1">Mini Lots</div>
              <div className="text-3xl font-extrabold text-slate-600">{results.miniLots}</div>
            </div>

            <div>
              <div className="text-slate-600 font-bold mb-1">Micro Lots</div>
              <div className="text-3xl font-extrabold text-slate-600">{results.microLots}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Risk Warning / Info */}
      {parseFloat(riskPct) > 2.0 && (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-700 animate-in slide-in-from-bottom-2">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold">High Risk Warning</h4>
            <p className="text-sm mt-1">You are risking more than 2% of your account on a single trade. Professional traders typically risk between 0.5% and 1% to avoid high drawdowns.</p>
          </div>
        </div>
      )}
    </div>
  );
}
