import { useState } from 'react';
import { TrendingUp, Target, Activity, Award, Calendar, ArrowUpRight, ShieldCheck, Maximize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock analytics data from the API
const metrics = {
  totalTrades: 124,
  winRate: 58.4,
  profitFactor: 1.85,
  expectancyUsd: 42.50,
  avgRR: 1.5,
  totalPnl: 5270.00
};

export default function Dashboard() {
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState('all_time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Welcome & Filter Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome back. Here's your trading performance and structural metrics.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-3 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm shrink-0">
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
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-left-2 duration-200">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg"
              />
              <span className="text-xs text-slate-400 font-semibold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target size={14} className="text-brand" /> Total Trades
          </div>
          <div className="text-3xl font-black text-slate-800">{metrics.totalTrades}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100/60 bg-emerald-50/10 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-emerald-600 animate-pulse" /> Win Rate
          </div>
          <div className="text-3xl font-black text-emerald-600">{metrics.winRate}%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity size={14} className="text-indigo-600" /> Profit Factor
          </div>
          <div className="text-3xl font-black text-slate-800">{metrics.profitFactor}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-sky-600" /> Expectancy
          </div>
          <div className="text-3xl font-black text-slate-800">${metrics.expectancyUsd.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-5 rounded-2xl shadow-md relative overflow-hidden col-span-2 md:col-span-1 group hover:shadow-lg transition-all">
          <div className="absolute top-[-50%] right-[-20%] w-full h-full bg-white/10 rounded-full blur-xl pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-200" /> Net Profit
          </div>
          <div className="text-3xl font-black text-white flex items-center gap-1">
            ${metrics.totalPnl.toLocaleString()}
            <ArrowUpRight size={20} className="text-emerald-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Colorful Equity Curve Chart */}
        <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Equity Curve (Growth)
            </h2>
            
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                All-Time High
              </span>
              <button 
                onClick={() => setIsChartExpanded(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-slate-100 bg-white"
                title="Expand View"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          <div className="h-72 w-full bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-end relative overflow-hidden px-4 pt-6 pb-8">
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-6 opacity-30">
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
            </div>

            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-emerald-500 overflow-visible relative z-10">
              <defs>
                <linearGradient id="chartGreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Shaded Area under the curve */}
              <path d="M0,100 L0,80 L16.6,73.3 L33.3,77.5 L50,56.6 L66.6,60 L83.3,33.3 L100,10 V100 H0 Z" fill="url(#chartGreenGradient)" />
              {/* Glowing Line */}
              <path d="M0,80 L16.6,73.3 L33.3,77.5 L50,56.6 L66.6,60 L83.3,33.3 L100,10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {/* Highlight Circle Dots */}
              <circle cx="0" cy="80" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              <circle cx="16.6" cy="73.3" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              <circle cx="33.3" cy="77.5" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              <circle cx="50" cy="56.6" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              <circle cx="66.6" cy="60" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              <circle cx="83.3" cy="33.3" r="1.5" className="fill-white stroke-emerald-500 stroke-2" />
              {/* Glowing Pulse Endpoint */}
              <circle cx="100" cy="10" r="2.5" className="fill-emerald-500 animate-ping" />
              <circle cx="100" cy="10" r="1.8" className="fill-emerald-600 stroke-white stroke-1" />
            </svg>

            {/* X-Axis Labels */}
            <div className="absolute inset-x-4 bottom-2 flex justify-between text-[10px] text-slate-400 font-bold tracking-wide">
              <span>Oct 1</span>
              <span>Oct 5</span>
              <span>Oct 10</span>
              <span>Oct 15</span>
              <span>Oct 20</span>
              <span>Oct 25</span>
              <span>Oct 30</span>
            </div>
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-3">Session Performance</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">London Session</span>
                <span className="font-bold text-emerald-600">+$3,200</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">New York Session</span>
                <span className="font-bold text-emerald-600">+$2,450</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-700">Tokyo Session</span>
                <span className="font-bold text-rose-600">-$380</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades Widget */}
        <div className="xl:col-span-3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Recent Trades</h2>
            <Link to="/journal" className="text-sm font-bold text-brand hover:text-brand-dark transition-colors bg-brand/5 px-3.5 py-1.5 rounded-xl">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 pl-0 font-bold">Pair</th>
                  <th className="p-3 font-bold">Direction</th>
                  <th className="p-3 font-bold">Result</th>
                  <th className="p-3 font-bold text-right pr-0">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 pl-0 font-bold text-slate-900">EURUSD</td>
                  <td className="p-3 text-emerald-600 font-semibold text-sm">LONG</td>
                  <td className="p-3 font-bold text-emerald-600">+$452.00</td>
                  <td className="p-3 pr-0 text-right text-slate-500 text-sm font-semibold">Today</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 pl-0 font-bold text-slate-900">GBPJPY</td>
                  <td className="p-3 text-rose-600 font-semibold text-sm">SHORT</td>
                  <td className="p-3 font-bold text-rose-600">-$150.00</td>
                  <td className="p-3 pr-0 text-right text-slate-500 text-sm font-semibold">Yesterday</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 pl-0 font-bold text-slate-900">XAUUSD</td>
                  <td className="p-3 text-emerald-600 font-semibold text-sm">LONG</td>
                  <td className="p-3 font-bold text-emerald-600">+$1,200.00</td>
                  <td className="p-3 pr-0 text-right text-slate-500 text-sm font-semibold">Oct 24</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expanded Chart Overlay Modal */}
      {isChartExpanded && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" />
                  <span>Equity Curve (Expanded View)</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comprehensive Performance Analytics</p>
              </div>
              <button 
                onClick={() => setIsChartExpanded(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200/60 bg-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body with Large Chart */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col space-y-6">
              <div className="h-[400px] w-full bg-slate-950 rounded-2xl relative overflow-hidden p-6 border border-slate-800 shadow-inner flex flex-col justify-end">
                {/* Dotted Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-8 opacity-10">
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                  <div className="border-b border-dashed border-white w-full"></div>
                </div>

                {/* Main large SVG curve */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-emerald-400 overflow-visible relative z-10">
                  <defs>
                    <linearGradient id="expandedChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Shaded Area under the curve */}
                  <path d="M0,100 L0,80 L16.6,73.3 L33.3,77.5 L50,56.6 L66.6,60 L83.3,33.3 L100,10 V100 H0 Z" fill="url(#expandedChartGradient)" />
                  {/* Line */}
                  <path d="M0,80 L16.6,73.3 L33.3,77.5 L50,56.6 L66.6,60 L83.3,33.3 L100,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  
                  {/* Visual anchor dots with tooltips / value indicators */}
                  <circle cx="0" cy="80" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  <circle cx="16.6" cy="73.3" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  <circle cx="33.3" cy="77.5" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  <circle cx="50" cy="56.6" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  <circle cx="66.6" cy="60" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  <circle cx="83.3" cy="33.3" r="1.5" className="fill-slate-950 stroke-emerald-400 stroke-2" />
                  
                  {/* Glowing end pin */}
                  <circle cx="100" cy="10" r="2.5" className="fill-emerald-400 animate-ping" />
                  <circle cx="100" cy="10" r="1.8" className="fill-emerald-400 stroke-slate-950 stroke-1" />
                </svg>

                {/* Grid X Labels */}
                <div className="absolute inset-x-6 bottom-3 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Oct 1 (Start)</span>
                  <span>Oct 5</span>
                  <span>Oct 10</span>
                  <span>Oct 15</span>
                  <span>Oct 20</span>
                  <span>Oct 25</span>
                  <span>Oct 30 (ATH)</span>
                </div>
              </div>

              {/* Extended Details Panel inside Expanded Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starting Balance</span>
                  <div className="text-lg font-bold text-slate-800">$10,000.00</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Balance</span>
                  <div className="text-lg font-bold text-emerald-600">$15,270.00</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Absolute Return</span>
                  <div className="text-lg font-bold text-emerald-600">+52.70%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
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
