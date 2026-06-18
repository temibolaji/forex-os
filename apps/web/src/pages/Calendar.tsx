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
        // Fetch via Forex Factory public JSON API directly
        const res = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`);
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
            // FF date format is ISO but usually implies EST, we parse it directly. The browser auto-converts to local time.
            scheduledAt: item.date, 
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
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Economic Calendar</h1>
          <p className="page-subtitle">Stay ahead of high-impact market events.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <select 
          className="input"
          style={{ width: 'auto' }}
          value={filterImpact}
          onChange={(e) => setFilterImpact(e.target.value)}
        >
          <option value="ALL">All Impacts</option>
          <option value="HIGH">High Impact Only</option>
          <option value="MEDIUM">Medium Impact</option>
          <option value="LOW">Low Impact</option>
        </select>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="ALL">This Week</option>
            <option value="TODAY">Today</option>
            <option value="TOMORROW">Tomorrow</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
          
          {dateFilter === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 13 }}
              />
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <Filter size={16} />
            <span>{filterCurrency === 'ALL' ? 'More Filters' : `Currency: ${filterCurrency}`}</span>
          </button>

          {isFilterOpen && (
            <div className="card" style={{ position: 'absolute', left: 0, top: '100%', marginTop: 8, zIndex: 20, width: 200, padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px', marginBottom: 4 }}>Filter by Currency</div>
              {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map((curr) => (
                <button 
                  key={curr}
                  onClick={() => { setFilterCurrency(curr); setIsFilterOpen(false); }} 
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: filterCurrency === curr ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: filterCurrency === curr ? 600 : 400, borderRadius: 6, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {curr === 'ALL' ? 'All Currencies' : curr}
                  {filterCurrency === curr && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)', marginBottom: 16 }} size={32} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading economic events...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'var(--bg-tertiary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CalendarIcon size={32} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No events found for this period.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead className="table-head">
                <tr>
                  <th style={{ paddingLeft: 24 }}>Time / Currency</th>
                  <th>Impact</th>
                  <th>Event</th>
                  <th>Actual</th>
                  <th>Forecast</th>
                  <th style={{ paddingRight: 24 }}>Previous</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredEvents.map((event) => {
                  const eventTime = new Date(event.scheduledAt).getTime();
                  const timeDiff = currentTime.getTime() - eventTime;
                  // Highlight if event is happening within 1 hour before to 1 hour after now
                  const isCurrent = Math.abs(timeDiff) <= 60 * 60 * 1000;
                  
                  return (
                    <tr key={event.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: isCurrent ? 'rgba(10, 132, 255, 0.08)' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ paddingLeft: 24, borderLeft: isCurrent ? '4px solid var(--accent-blue)' : '4px solid transparent' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: isCurrent ? 'var(--accent-blue)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} style={{ opacity: isCurrent ? 1 : 0.5 }} />
                            {new Date(event.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, width: 'fit-content', marginTop: 6, background: isCurrent ? 'rgba(10, 132, 255, 0.15)' : 'var(--bg-tertiary)', color: isCurrent ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                            {event.currency}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={
                          event.impact === 'HIGH' ? 'pill pill-bear' :
                          event.impact === 'MEDIUM' ? 'pill' :
                          'pill'
                        } style={event.impact === 'MEDIUM' ? { background: 'rgba(255, 159, 10, 0.15)', color: 'var(--accent-orange)' } : event.impact === 'LOW' ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : {}}>
                          {event.impact === 'HIGH' && <AlertCircle size={12} style={{ marginRight: 4 }} />}
                          {event.impact}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14, color: isCurrent ? '#fff' : 'var(--text-primary)' }}>
                          {event.name}
                        </div>
                        {isCurrent && <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)', background: 'rgba(10, 132, 255, 0.15)', padding: '2px 6px', borderRadius: 4, marginTop: 4, border: '1px solid rgba(10, 132, 255, 0.3)' }}>Happening Now</span>}
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: 14 }}>-</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{event.forecast}</div>
                      </td>
                      <td style={{ paddingRight: 24 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-secondary)' }}>{event.previous}</div>
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
