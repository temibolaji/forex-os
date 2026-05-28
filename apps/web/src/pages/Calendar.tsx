import { useState, useMemo } from 'react';
import { AlertCircle, Clock, Filter, Check, Calendar } from 'lucide-react';

export default function CalendarComponent() {
  const [filterImpact, setFilterImpact] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, TOMORROW, CUSTOM
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Mock data mimicking the API response
  const events: any[] = [];

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Economic Calendar</h1>
          <p className="text-slate-500 mt-1">Stay ahead of high-impact market events.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select 
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm hover:border-indigo-200"
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
          <div className="flex items-center space-x-2 bg-white px-3 py-2.5 border border-slate-200 rounded-xl shadow-sm shrink-0 transition-all hover:border-indigo-200">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="TOMORROW">Tomorrow</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center space-x-1.5 bg-white px-2 py-1.5 border border-indigo-200 rounded-xl shadow-sm animate-in slide-in-from-left-2 duration-200 ring-1 ring-indigo-50">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-1.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
              />
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-all text-sm hover:border-indigo-200"
          >
            <Filter size={18} />
            <span>{filterCurrency === 'ALL' ? 'More Filters' : `Currency: ${filterCurrency}`}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
              <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">Filter by Currency</div>
              {['ALL', 'USD', 'EUR', 'GBP', 'JPY'].map((curr) => (
                <button 
                  key={curr}
                  onClick={() => { setFilterCurrency(curr); setIsFilterOpen(false); }} 
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${filterCurrency === curr ? 'font-bold text-indigo-600' : 'text-slate-700 font-medium'}`}
                >
                  {curr === 'ALL' ? 'All Currencies' : curr}
                  {filterCurrency === curr && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm font-medium">
                <th className="p-4 pl-6 font-medium">Time / Currency</th>
                <th className="p-4 font-medium">Impact</th>
                <th className="p-4 font-medium">Event</th>
                <th className="p-4 font-medium">Actual</th>
                <th className="p-4 font-medium">Forecast</th>
                <th className="p-4 pr-6 font-medium">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(event.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-bold mt-1 px-2 py-0.5 bg-slate-100 rounded text-slate-600 w-fit">
                        {event.currency}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      event.impact === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                      event.impact === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {event.impact === 'HIGH' && <AlertCircle size={12} />}
                      <span>{event.impact}</span>
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    {event.name}
                  </td>
                  <td className="p-4">
                    <span className="text-slate-400 text-sm italic">-</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {event.forecast}
                  </td>
                  <td className="p-4 pr-6 text-sm text-slate-500">
                    {event.previous}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
