import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, Clock, Filter, Check, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function CalendarComponent() {
  const [filterImpact, setFilterImpact] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, TOMORROW, CUSTOM
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to keep highlight accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setIsLoading(true);
        // Using Forex Factory's public JSON CDN
        const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        if (!res.ok) throw new Error('Failed to fetch calendar');
        const data = await res.json();
        
        // Transform FF JSON schema to match our UI
        const transformedEvents = data.map((item: any, index: number) => {
          let impact = 'LOW';
          if (item.impact === 'High') impact = 'HIGH';
          else if (item.impact === 'Medium') impact = 'MEDIUM';

          return {
            id: String(index),
            name: item.title,
            currency: item.country,
            impact: impact,
            scheduledAt: item.date, // ISO date string from FF
            forecast: item.forecast || '-',
            previous: item.previous || '-',
          };
        });
        setEvents(transformedEvents);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const impactMatch = filterImpact === 'ALL' || e.impact === filterImpact;
      const currencyMatch = filterCurrency === 'ALL' || e.currency === filterCurrency;
      
      if (!impactMatch || !currencyMatch) return false;

      const eventDate = new Date(e.scheduledAt);
      const now = new Date();

      if (dateFilter === 'TODAY') {
        return eventDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'TOMORROW') {
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        return eventDate.toDateString() === tomorrowDate.toDateString();
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (eventDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (eventDate > end) return false;
        }
      }
      return true;
    });
  }, [filterImpact, filterCurrency, dateFilter, customStartDate, customEndDate, events]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Economic Calendar</h1>
          <p className="text-slate-400 mt-1 font-medium">Stay ahead of high-impact market events.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select 
          className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-semibold shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm hover:border-white/20 cursor-pointer"
          value={filterImpact}
          onChange={(e) => setFilterImpact(e.target.value)}
        >
          <option value="ALL">All Impacts</option>
          <option value="HIGH">High Impact Only</option>
          <option value="MEDIUM">Medium Impact</option>
          <option value="LOW">Low Impact</option>
        </select>

        {/* Date Filter selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-2.5 border border-white/10 rounded-xl shadow-sm shrink-0 transition-all hover:border-white/20">
            <CalendarIcon size={16} className="text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">This Week</option>
              <option value="TODAY">Today</option>
              <option value="TOMORROW">Tomorrow</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1.5 border border-indigo-500/20 rounded-xl shadow-sm animate-in slide-in-from-left-2 duration-200">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-white font-semibold focus:outline-none bg-slate-800 border border-white/10 rounded-lg transition-colors color-scheme-dark"
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-xs text-slate-500 font-bold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-white font-semibold focus:outline-none bg-slate-800 border border-white/10 rounded-lg transition-colors color-scheme-dark"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-semibold hover:bg-slate-800 shadow-sm transition-all text-sm hover:border-white/20"
          >
            <Filter size={18} className="text-slate-400" />
            <span>{filterCurrency === 'ALL' ? 'More Filters' : `Currency: ${filterCurrency}`}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-20 py-2 backdrop-blur-xl">
              <div className="px-4 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-800/50">Filter by Currency</div>
              {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map((curr) => (
                <button 
                  key={curr}
                  onClick={() => { setFilterCurrency(curr); setIsFilterOpen(false); }} 
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-800 transition-colors ${filterCurrency === curr ? 'font-bold text-indigo-400' : 'text-slate-300 font-medium'}`}
                >
                  {curr === 'ALL' ? 'All Currencies' : curr}
                  {filterCurrency === curr && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel bg-slate-900/40 rounded-3xl shadow-xl shadow-black/20 border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-slate-400 font-medium">Loading economic events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
              <CalendarIcon className="text-slate-500" size={32} />
            </div>
            <p className="text-slate-400 font-medium">No events found for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Time / Currency</th>
                  <th className="p-4">Impact</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Actual</th>
                  <th className="p-4">Forecast</th>
                  <th className="p-4 pr-6">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((event) => {
                  const eventTime = new Date(event.scheduledAt).getTime();
                  const timeDiff = Math.abs(currentTime.getTime() - eventTime);
                  // Highlight if event is happening within 1 hour from now
                  const isCurrent = timeDiff <= 60 * 60 * 1000;
                  
                  return (
                    <tr key={event.id} className={`transition-colors group ${isCurrent ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-white/5 border-l-4 border-transparent'}`}>
                      <td className="p-4 pl-4 align-top">
                        <div className="flex flex-col">
                          <span className={`font-semibold flex items-center gap-1.5 text-sm ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                            <Clock size={14} className={isCurrent ? 'text-indigo-400 animate-pulse' : 'text-slate-500'} />
                            {new Date(event.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded border w-fit ${isCurrent ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
                            {event.currency}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          event.impact === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          event.impact === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-800 text-slate-400 border-white/10'
                        }`}>
                          {event.impact === 'HIGH' && <AlertCircle size={12} />}
                          <span>{event.impact}</span>
                        </span>
                      </td>
                      <td className={`p-4 font-semibold text-sm align-top ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                        {event.name}
                        {isCurrent && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">Happening Now</span>}
                      </td>
                      <td className="p-4 align-top">
                        <span className="text-slate-600 text-sm italic">-</span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-300 align-top">
                        {event.forecast}
                      </td>
                      <td className="p-4 pr-6 text-sm text-slate-500 font-medium align-top">
                        {event.previous}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
