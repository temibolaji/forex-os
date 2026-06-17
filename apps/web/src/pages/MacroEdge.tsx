import { useState, useEffect } from 'react';
import { TrendingUp, Globe2, AlertCircle, Percent, Loader2, ArrowRight } from 'lucide-react';

interface CurrencyStrength {
  currency: string;
  change: number;
}

const CENTRAL_BANKS = [
  { bank: 'Federal Reserve', code: 'USD', rate: 5.50, nextMeeting: 'July 31, 2026' },
  { bank: 'European Central Bank', code: 'EUR', rate: 4.25, nextMeeting: 'July 18, 2026' },
  { bank: 'Bank of England', code: 'GBP', rate: 5.25, nextMeeting: 'August 1, 2026' },
  { bank: 'Bank of Japan', code: 'JPY', rate: 0.10, nextMeeting: 'July 31, 2026' },
  { bank: 'Reserve Bank of Australia', code: 'AUD', rate: 4.35, nextMeeting: 'August 6, 2026' },
  { bank: 'Bank of Canada', code: 'CAD', rate: 4.75, nextMeeting: 'July 24, 2026' },
  { bank: 'Swiss National Bank', code: 'CHF', rate: 1.25, nextMeeting: 'September 26, 2026' },
  { bank: 'Reserve Bank of New Zealand', code: 'NZD', rate: 5.50, nextMeeting: 'August 14, 2026' },
];

export default function MacroEdge() {
  const [strengthData, setStrengthData] = useState<CurrencyStrength[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Divergence Calculator State
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [quoteCurrency, setQuoteCurrency] = useState('JPY');

  useEffect(() => {
    const fetchCurrencyStrength = async () => {
      try {
        setIsLoading(true);
        // Get last 7 days to ensure we have at least 2 valid trading days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        
        const endStr = endDate.toISOString().split('T')[0];
        const startStr = startDate.toISOString().split('T')[0];

        const res = await fetch(`https://api.frankfurter.dev/v1/${startStr}..${endStr}?base=USD&symbols=EUR,GBP,JPY,AUD,CAD,CHF,NZD`);
        if (!res.ok) throw new Error('Failed to fetch rates');
        
        const data = await res.json();
        const dates = Object.keys(data.rates).sort();
        
        if (dates.length < 2) throw new Error('Not enough data points');
        
        const latestDate = dates[dates.length - 1];
        const previousDate = dates[dates.length - 2];
        
        const latestRates = data.rates[latestDate];
        const previousRates = data.rates[previousDate];

        // We use USD as base.
        // If 1 USD = 150 JPY yesterday, and 155 JPY today.
        // JPY weakened vs USD. JPY value in USD = 1/150 -> 1/155.
        // Change = ( (1/155) - (1/150) ) / (1/150) = (150/155) - 1.
        
        const changes: CurrencyStrength[] = [];
        
        let totalChange = 0;
        
        Object.keys(latestRates).forEach(curr => {
          const oldVal = previousRates[curr];
          const newVal = latestRates[curr];
          // Change relative to USD
          const change = (oldVal / newVal) - 1;
          totalChange += change;
          changes.push({ currency: curr, change: change * 100 });
        });

        // USD change relative to USD is 0.
        changes.push({ currency: 'USD', change: 0 });
        
        // Calculate the average change to center the strengths
        const avgChange = (totalChange * 100) / 8; // 8 currencies including USD

        // Center all changes around the average so it represents relative strength against the basket
        const normalizedChanges = changes.map(c => ({
          currency: c.currency,
          change: c.change - avgChange
        })).sort((a, b) => b.change - a.change); // Sort strongest to weakest

        setStrengthData(normalizedChanges);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencyStrength();
  }, []);

  const baseRate = CENTRAL_BANKS.find(b => b.code === baseCurrency)?.rate || 0;
  const quoteRate = CENTRAL_BANKS.find(b => b.code === quoteCurrency)?.rate || 0;
  const yieldSpread = baseRate - quoteRate;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Macro Edge</h1>
        <p className="text-slate-400 mt-1 font-medium">Fundamental analysis tools for institutional edge.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Currency Strength Meter */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <TrendingUp size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Daily Strength</h2>
              <p className="text-xs text-slate-400 font-medium">Last 24h rolling performance</p>
            </div>
          </div>

          <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-sm text-slate-400 font-medium">Calculating matrix...</p>
              </div>
            ) : (
              <div className="space-y-5 relative z-10">
                {strengthData.map((item) => {
                  const isPositive = item.change > 0;
                  const maxAbs = Math.max(...strengthData.map(d => Math.abs(d.change)));
                  const widthPercent = (Math.abs(item.change) / maxAbs) * 100;
                  
                  return (
                    <div key={item.currency} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-200">{item.currency}</span>
                        <span className={`font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{item.change.toFixed(2)}%
                        </span>
                      </div>
                      
                      {/* Zero center line layout */}
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
                        {/* Center marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10"></div>
                        
                        <div className="w-1/2 flex justify-end pr-0.5">
                          {!isPositive && (
                            <div 
                              className="h-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-l-full" 
                              style={{ width: `${widthPercent}%` }}
                            />
                          )}
                        </div>
                        <div className="w-1/2 flex justify-start pl-0.5">
                          {isPositive && (
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-r-full" 
                              style={{ width: `${widthPercent}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start space-x-3">
            <AlertCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300 leading-relaxed font-medium">
              Pair the strongest currency with the weakest currency to find the highest probability trends for the day. Avoid trading currencies near the center against each other (consolidation).
            </p>
          </div>
        </div>

        {/* Central Bank Divergence Matrix */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Globe2 size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Central Bank Rates</h2>
              <p className="text-xs text-slate-400 font-medium">Yield divergence tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Calculator Card */}
            <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Percent size={14} className="text-amber-400" /> Yield Spread
              </h3>
              
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Base</label>
                  <select 
                    value={baseCurrency}
                    onChange={e => setBaseCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                  >
                    {CENTRAL_BANKS.map(b => <option key={b.code} value={b.code}>{b.code}</option>)}
                  </select>
                </div>
                <div className="w-8 flex items-center justify-center shrink-0 pt-6">
                  <ArrowRight size={20} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quote</label>
                  <select 
                    value={quoteCurrency}
                    onChange={e => setQuoteCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                  >
                    {CENTRAL_BANKS.map(b => <option key={b.code} value={b.code}>{b.code}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-auto bg-slate-950/50 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">Spread Advantage</div>
                  <div className="text-2xl font-black text-white">{baseCurrency}{quoteCurrency}</div>
                </div>
                <div className={`text-3xl font-black ${yieldSpread > 0 ? 'text-emerald-400' : yieldSpread < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {yieldSpread > 0 ? '+' : ''}{yieldSpread.toFixed(2)}%
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2">
                 <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${yieldSpread > 0 ? 'bg-emerald-500' : yieldSpread < 0 ? 'bg-rose-500' : 'bg-slate-500'}`} />
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">
                   {yieldSpread > 0 
                    ? `Institutional capital flows towards yield. ${baseCurrency} pays ${yieldSpread.toFixed(2)}% more than ${quoteCurrency}, creating a fundamental Long bias.` 
                    : yieldSpread < 0 
                    ? `${quoteCurrency} pays ${Math.abs(yieldSpread).toFixed(2)}% more than ${baseCurrency}. Holding short positions earns rollover swap, creating a fundamental Short bias.`
                    : `Both currencies offer identical yields. Capital flow will depend purely on relative economic data.`}
                 </p>
              </div>
            </div>

            {/* Rates Table */}
            <div className="glass-panel bg-slate-900/40 p-0 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 bg-slate-900/60">
                 <h3 className="text-sm font-bold text-slate-300">Global Interest Rates</h3>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-white/5">
                    {CENTRAL_BANKS.sort((a,b) => b.rate - a.rate).map(bank => (
                      <tr key={bank.code} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-white/5">
                              {bank.code}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-200">{bank.bank}</span>
                              <span className="text-[10px] text-slate-500 font-medium">Next: {bank.nextMeeting}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <span className="text-sm font-bold text-white">{bank.rate.toFixed(2)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
