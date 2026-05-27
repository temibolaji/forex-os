import { useState, useMemo, useEffect } from 'react';
import { Globe2, Clock, ShieldCheck, ChevronRight, HelpCircle, Layers, ArrowUpRight, Sun, Moon, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Session {
  name: string;
  startLocal: number; // local open hour
  endLocal: number;   // local close hour
  color: string;
  flag: string;
  tzOffset: number;   // UTC offset of the city in May
  tzName: string;     // e.g. AEST
  tzId: string;       // IANA Timezone ID
}

const SESSIONS_CONFIG: Session[] = [
  { name: 'Sydney', startLocal: 8, endLocal: 17, color: 'bg-blue-600', flag: '🇦🇺', tzOffset: 10, tzName: 'AEST', tzId: 'Australia/Sydney' },
  { name: 'Tokyo', startLocal: 9, endLocal: 18, color: 'bg-pink-600', flag: '🇯🇵', tzOffset: 9, tzName: 'JST', tzId: 'Asia/Tokyo' },
  { name: 'London', startLocal: 8, endLocal: 17, color: 'bg-sky-500', flag: '🇬🇧', tzOffset: 1, tzName: 'BST', tzId: 'Europe/London' },
  { name: 'New York', startLocal: 8, endLocal: 17, color: 'bg-emerald-600', flag: '🇺🇸', tzOffset: -4, tzName: 'EDT', tzId: 'America/New_York' }
];

const UTC_VOLUME_PROFILE = [
  20, 25, 30, 28, 25, 20, 22, 35, 65, 55, 45, 50, 60, 85, 95, 100, 90, 65, 45, 35, 30, 25, 22, 20
];

const TIMEZONES = [
  { name: 'Lagos (GMT +1)', tz: 'Africa/Lagos', offset: 1 },
  { name: 'UTC / GMT', tz: 'UTC', offset: 0 },
  { name: 'London (GMT +1)', tz: 'Europe/London', offset: 1 },
  { name: 'New York (GMT -4)', tz: 'America/New_York', offset: -4 },
  { name: 'Tokyo (GMT +9)', tz: 'Asia/Tokyo', offset: 9 },
  { name: 'Sydney (GMT +10)', tz: 'Australia/Sydney', offset: 10 },
  { name: 'Paris (GMT +2)', tz: 'Europe/Paris', offset: 2 },
  { name: 'Dubai (GMT +4)', tz: 'Asia/Dubai', offset: 4 },
  { name: 'Singapore (GMT +8)', tz: 'Asia/Singapore', offset: 8 }
];

export default function Sessions() {
  const [selectedTz, setSelectedTz] = useState('Lagos (GMT +1)');
  const [activeHour, setActiveHour] = useState(3); // default hour 3 (corresponding to 3 AM Lagos)
  const [is24Hour, setIs24Hour] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [currentMinutes, setCurrentMinutes] = useState(10);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  useEffect(() => {
    const now = new Date();
    setCurrentMinutes(now.getMinutes());
    setCurrentSeconds(now.getSeconds());
    setActiveHour(now.getHours());
  }, []);

  // Timezone Offset calculation
  const selectedTzObj = useMemo(() => {
    return TIMEZONES.find(t => t.name === selectedTz) || TIMEZONES[0];
  }, [selectedTz]);

  // Construct absolute UTC time in ms based on activeHour, selected offset, and current minutes
  const utcTimeMs = useMemo(() => {
    const baseDate = new Date();
    const utcTime = Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      activeHour - selectedTzObj.offset,
      currentMinutes,
      currentSeconds
    );
    return utcTime;
  }, [activeHour, selectedTzObj.offset, currentMinutes, currentSeconds]);

  // Translate local slider hour (0-23) to UTC hour (0-23)
  const activeHourUtc = useMemo(() => {
    return (activeHour - selectedTzObj.offset + 24) % 24;
  }, [activeHour, selectedTzObj.offset]);

  // Format active pin time and day in selected timezone using native Intl formatting
  const formattedPinTime = useMemo(() => {
    const dateObj = new Date(utcTimeMs);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: selectedTzObj.tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !is24Hour,
      hourCycle: is24Hour ? 'h23' : 'h12'
    });
    return formatter.format(dateObj).toLowerCase().replace(/\s+/g, ' ');
  }, [utcTimeMs, selectedTzObj.tz, is24Hour]);

  const formattedPinDay = useMemo(() => {
    const dateObj = new Date(utcTimeMs);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: selectedTzObj.tz,
      weekday: 'long'
    });
    return formatter.format(dateObj);
  }, [utcTimeMs, selectedTzObj.tz]);

  // Format cities date, time and active states using Intl browser timezone engine
  const formattedCities = useMemo(() => {
    return SESSIONS_CONFIG.map((session) => {
      const dateObj = new Date(utcTimeMs);

      // 1. Time string in city timezone
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: session.tzId,
        hour: 'numeric',
        minute: '2-digit',
        hour12: !is24Hour,
        hourCycle: is24Hour ? 'h23' : 'h12'
      });
      let timeStr = timeFormatter.format(dateObj).toLowerCase().replace(/\s+/g, ' ');

      // 2. Date string in city timezone
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: session.tzId,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const dateParts = dateFormatter.format(dateObj).split(', ');
      const weekday = dateParts[0];
      const monthDay = dateParts[1] || '';
      const dayNum = parseInt(monthDay.split(' ')[1] || '0');

      let suffix = 'th';
      if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
      else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
      else if (dayNum === 3 || dayNum === 23) suffix = 'rd';

      const dateStr = `${weekday} ${monthDay}${suffix} ${session.tzName} (UTC ${session.tzOffset >= 0 ? '+' : ''}${session.tzOffset})`;

      // 3. Local Hour in city for active state checks
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: session.tzId,
        hour: 'numeric',
        hour12: false
      });
      const localHour = parseInt(hourFormatter.format(dateObj));
      const isOpen = localHour >= session.startLocal && localHour < session.endLocal;

      return {
        ...session,
        timeStr,
        dateStr,
        isOpen,
        localHour
      };
    });
  }, [utcTimeMs, is24Hour]);

  // Volume badge states
  const currentVolumeValue = useMemo(() => {
    return UTC_VOLUME_PROFILE[activeHourUtc];
  }, [activeHourUtc]);

  const volumeState = useMemo(() => {
    if (currentVolumeValue >= 65) {
      return { label: 'High', color: 'bg-green-500', textColor: 'text-green-600', border: 'border-green-200', text: 'Trading Volume is usually high at this time of day.' };
    } else if (currentVolumeValue >= 25) {
      return { label: 'Medium', color: 'bg-amber-400', textColor: 'text-amber-500', border: 'border-amber-200', text: 'Trading Volume is usually medium at this time of day.' };
    } else {
      return { label: 'Low', color: 'bg-red-500', textColor: 'text-red-500', border: 'border-red-200', text: 'Trading Volume is usually low at this time of day.' };
    }
  }, [currentVolumeValue]);

  // Volume SVG Curve Paths and Gradient Stops
  const volumeChartData = useMemo(() => {
    const points = Array.from({ length: 24 }).map((_, h) => {
      const utcHour = (h - selectedTzObj.offset + 24) % 24;
      const volume = UTC_VOLUME_PROFILE[utcHour];
      const x = (h / 23) * 100;
      const y = 90 - volume * 0.7;
      return { x, y, volume };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L100,100 L0,100 Z`;

    const gradientStops = points.map((p, h) => {
      let color = '#ef4444'; // low (Red)
      if (p.volume >= 65) {
        color = '#22c55e'; // high (Green)
      } else if (p.volume >= 25) {
        color = '#eab308'; // medium (Yellow)
      }
      const pct = (h / 23) * 100;
      return { offset: `${pct.toFixed(1)}%`, color };
    });

    return { linePath, areaPath, gradientStops };
  }, [selectedTzObj.offset]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Market Hours</h1>
        <p className="text-slate-500 mt-1 font-medium text-sm md:text-base leading-relaxed">
          While stock markets have set opening and closing hours, forex is decentralized and trades 24 hours a day. This means that you can trade forex at any time of the day or night!
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* LEFT COLUMN: Main Tool and Articles */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* FOREX MARKET TIME ZONE CONVERTER CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-brand-light"></div>
            
            {/* Card Header & Controls */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Forex Market Time Zone Converter</h2>
                <div className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
                  <span>Learn more about</span>
                  <Link to="/wiki" className="text-brand hover:text-brand-light underline font-bold">Forex Market Hours</Link>
                </div>
              </div>

              {/* 24 Hour Time Toggle */}
              <div className="flex items-center space-x-2 select-none shrink-0">
                <span className="text-xs font-bold text-slate-500">24 Hour Time</span>
                <button 
                  onClick={() => setIs24Hour(!is24Hour)}
                  className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${is24Hour ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ${is24Hour ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>

            {/* Timezone Selector, Ruler and Custom Slider Container */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6 space-y-6 relative overflow-hidden">
              
              {/* Horizontal Header (Timezone Label + Ruler) */}
              <div className="flex items-center">
                {/* Timezone dropdown selector */}
                <div className="w-40 shrink-0 pr-4">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Timezone</label>
                  <div className="relative">
                    <select 
                      value={selectedTz}
                      onChange={(e) => setSelectedTz(e.target.value)}
                      className="w-full bg-indigo-600 text-white font-bold text-xs py-2 px-3 rounded-lg border-none shadow-sm cursor-pointer outline-none appearance-none hover:bg-indigo-700 transition-all pr-8"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.name} value={tz.name} className="bg-white text-slate-800">{tz.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white font-bold text-[8px]">▼</div>
                  </div>
                </div>

                {/* Hours Ruler */}
                <div className="flex-1 grid grid-cols-24 gap-px text-center relative select-none">
                  {/* Sun/Moon icons above ruler */}
                  <div className="absolute -top-5 left-[27%] text-slate-400 font-bold"><Sun size={12} className="inline mr-1" /></div>
                  <div className="absolute -top-5 left-[81%] text-slate-400 font-bold"><Moon size={12} className="inline mr-1" /></div>

                  {Array.from({ length: 24 }).map((_, h) => {
                    let displayHour = '';
                    if (is24Hour) {
                      displayHour = h.toString();
                    } else {
                      if (h === 0) displayHour = '•';
                      else if (h <= 12) displayHour = h.toString();
                      else displayHour = (h - 12).toString();
                    }
                    return (
                      <div key={h} className="text-[10px] font-extrabold text-slate-400 tracking-tight flex items-center justify-center">
                        {displayHour}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session Rows and Slider Marker Container */}
              <div className="relative pt-2">
                
                {/* FULL-HEIGHT VERTICAL TIMELINE LINE AND PIN MARKER */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 z-20 pointer-events-none transition-all duration-75 flex flex-col items-center"
                  style={{ left: `calc(10rem + ${((activeHour / 23) * 100) * 0.77}%)` }}
                >
                  {/* Teardrop Pin at the top */}
                  <div className="bg-indigo-600 text-white rounded-3xl rounded-br-none rotate-45 w-14 h-14 absolute -top-16 -translate-x-1/2 flex flex-col items-center justify-center shadow-lg border border-white/20 select-none">
                    <div className="-rotate-45 flex flex-col items-center justify-center space-y-0.5 mt-1">
                      <Clock size={10} className="text-white/80" />
                      <span className="text-[10px] font-black leading-none">{formattedPinTime}</span>
                      <span className="text-[8px] font-bold opacity-80 leading-none capitalize mt-0.5">{formattedPinDay}</span>
                    </div>
                  </div>

                  {/* Capsule slider thumb at the bottom, overlapping the volume chart */}
                  <div className="w-5 h-12 bg-white border border-slate-300 rounded-full shadow absolute bottom-2 -translate-x-1/2 flex flex-col items-center justify-between p-1 select-none pointer-events-auto cursor-ew-resize">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <div className={`w-2 h-2 rounded-full ${volumeState.color} border border-white`}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                  </div>
                </div>

                {/* Range input stretching across the interactive grid */}
                <input 
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={activeHour}
                  onChange={(e) => setActiveHour(parseInt(e.target.value))}
                  className="absolute top-0 bottom-0 z-30 cursor-ew-resize opacity-0"
                  style={{ left: '10rem', width: 'calc(100% - 10rem)' }}
                />

                {/* Render Session Rows */}
                <div className="space-y-4">
                  {formattedCities.map((city) => {
                    return (
                      <div key={city.name} className="flex items-center relative z-10">
                        {/* Left Column: City Info & Times */}
                        <div className="w-40 shrink-0 flex items-center space-x-3 pr-2 select-none">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100 shrink-0">
                            {city.flag}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-800 leading-none">{city.name}</div>
                            <div className="text-[10px] font-extrabold text-indigo-600 mt-0.5 leading-none">{city.timeStr}</div>
                            <div className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-tight truncate">{city.dateStr}</div>
                          </div>
                        </div>

                        {/* Right Column: 24h Bar representation */}
                        <div className="flex-1 select-none h-10 bg-slate-100/50 rounded-lg border border-slate-200/40 relative overflow-hidden">
                          {/* Open status badge text above session bar */}
                          <div className="absolute top-1 left-2 text-[8px] font-black tracking-wider flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${city.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                            <span className={city.isOpen ? 'text-indigo-600' : 'text-slate-400'}>
                              {city.name.toUpperCase()} SESSION {city.isOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>

                          {/* Render active cell ranges */}
                          <div className="w-full h-full grid grid-cols-24 gap-px absolute top-4 inset-x-0 h-6">
                            {Array.from({ length: 24 }).map((_, h) => {
                              const cellLocalHour = (h - selectedTzObj.offset + city.tzOffset + 24) % 24;
                              const isCellOpen = cellLocalHour >= city.startLocal && cellLocalHour < city.endLocal;
                              return (
                                <div 
                                  key={h} 
                                  className={`h-full transition-all duration-300 ${
                                    isCellOpen 
                                      ? `${city.color} ${city.isOpen ? 'opacity-90 shadow-sm' : 'opacity-50'}` 
                                      : 'bg-slate-200/20'
                                  }`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Volume Wave Chart */}
                <div className="mt-6 border border-slate-200/80 rounded-xl bg-white p-4 shadow-sm flex items-center">
                  <div className="w-40 shrink-0 pr-4 select-none">
                    <p className="text-[10px] font-black text-slate-500 leading-snug">{volumeState.text}</p>
                    <div className={`mt-2 inline-flex items-center space-x-1.5 bg-slate-50 border ${volumeState.border} rounded-full py-1 px-3 shadow-xs`}>
                      <span className={`w-2 h-2 rounded-full ${volumeState.color}`}></span>
                      <span className={`text-[10px] font-extrabold uppercase ${volumeState.textColor}`}>{volumeState.label}</span>
                    </div>
                  </div>

                  <div className="flex-1 h-14 relative overflow-hidden bg-slate-50/60 rounded-lg border border-slate-100 p-2 shadow-inner">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible opacity-95">
                      <defs>
                        <linearGradient id="volumeLineGrad" x1="0" y1="0" x2="1" y2="0">
                          {volumeChartData.gradientStops.map((stop, idx) => (
                            <stop key={idx} offset={stop.offset} stopColor={stop.color} />
                          ))}
                        </linearGradient>
                        <linearGradient id="volumeFillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(229, 231, 235)" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="rgb(229, 231, 235)" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d={volumeChartData.areaPath} fill="url(#volumeFillGrad)" />
                      <path d={volumeChartData.linePath} fill="none" stroke="url(#volumeLineGrad)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* Premium Utility Alert Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center space-x-3 select-none">
              <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 shrink-0 font-bold">
                💡
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-snug">
                Pro-Tip: Target the **London & New York Overlap** (1:00 PM - 5:00 PM UTC) for peak liquidity, tight spreads, and optimal trading setups.
              </p>
            </div>

          </div>

          {/* SECTION 1: How to use the converter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
              <Layers className="text-indigo-600" size={18} />
              <span>How to use the Forex Market Time Zone Converter</span>
            </h3>
            <div className="text-slate-600 text-xs leading-relaxed space-y-3 font-semibold">
              <p>
                The converter tools automatically translate UTC session open and close hours into your selected local timezone. Adjust the hours slider to inspect which global markets are awake at any particular hour of the day.
              </p>
              <p>
                To maximize your edge, look for periods of <strong>session overlaps</strong>. When two major financial hubs are operating simultaneously, liquidity increases dramatically, resulting in tighter bid-ask spreads, high transaction volume, and cleaner breakout movements.
              </p>
              <p>
                Our Forex Market Time Zone Converter displays active trading hours for Sydney, Tokyo, London, and New York.
              </p>
            </div>
          </div>

          {/* SECTION 2: Three Trading Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
                <Clock className="text-indigo-600" size={18} />
                <span>The Three Major Trading Sessions Explained</span>
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                While the market runs 24 hours a day, it is structurally segmented into three dominant trading blocks: the <strong>Asian (Tokyo)</strong>, <strong>European (London)</strong>, and <strong>North American (New York)</strong> sessions.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The three major sessions are Sydney/Tokyo, London, and New York. The Sydney and Tokyo sessions are often referred to as the Asian session. London is the European session. New York is the North American session.
              </p>
            </div>

            {/* Nested Mini Timeline Overlaps Preview Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6 space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">Global Session Schedule Overlap Overview</div>
              
              <div className="space-y-3 select-none">
                {[
                  { name: 'Sydney', start: 22, end: 7, color: 'bg-blue-600', flag: '🇦🇺' },
                  { name: 'Tokyo', start: 0, end: 9, color: 'bg-pink-600', flag: '🇯🇵' },
                  { name: 'London', start: 8, end: 17, color: 'bg-sky-500', flag: '🇬🇧' },
                  { name: 'New York', start: 13, end: 22, color: 'bg-green-600', flag: '🇺🇸' }
                ].map((s) => (
                  <div key={s.name} className="flex items-center">
                    <div className="w-20 shrink-0 text-xs font-black text-slate-700 flex items-center space-x-1.5">
                      <span>{s.flag}</span>
                      <span>{s.name}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-24 gap-px select-none h-4 bg-slate-200/50 rounded overflow-hidden relative">
                      {Array.from({ length: 24 }).map((_, h) => {
                        let isCellOpen = false;
                        if (s.start < s.end) {
                          isCellOpen = h >= s.start && h < s.end;
                        } else {
                          isCellOpen = h >= s.start || h < s.end;
                        }
                        return (
                          <div key={h} className={`h-full ${isCellOpen ? s.color : 'bg-transparent'}`}></div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: Forex Trading Volume */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
                <BarChart3 className="text-indigo-600" size={18} />
                <span>Forex Trading Volume & Overlap Statistics</span>
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                To see how volume changes, look at the Volume Index under the sessions converter. You'll notice that volume is not flat—it peaks strongly when session schedules collide.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The London and New York overlap (1:00 PM - 5:00 PM UTC) is the absolute peak of the forex day. Nearly 70% of all trades are transacted during this 4-hour window.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The Tokyo and London overlap (8:00 AM - 9:00 AM UTC) is a brief 1-hour window where the Asian session winds down and European traders step in. It triggers early volatility in JPY pairs. To see the real-time volume, look at the chart below.
              </p>
            </div>

            {/* Nested SVG Volume Overlaps Chart Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6 space-y-6 relative overflow-hidden select-none">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trading Volume Overlaps Graph</div>
              
              <div className="h-28 w-full bg-slate-900 rounded-xl relative p-4 border border-slate-800 shadow-inner flex items-end">
                <div className="absolute top-3 left-[28%] bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md text-[8px] font-extrabold text-slate-700 shadow-sm flex flex-col items-center">
                  <span>Tokyo & London Overlap</span>
                  <div className="w-1.5 h-1.5 bg-white border-r border-b border-slate-200 rotate-45 absolute -bottom-1"></div>
                </div>
                
                <div className="absolute top-1 right-[25%] bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md text-[8px] font-extrabold text-slate-700 shadow-sm flex flex-col items-center z-10">
                  <span>London & NY Overlap</span>
                  <div className="w-1.5 h-1.5 bg-white border-r border-b border-slate-200 rotate-45 absolute -bottom-1"></div>
                </div>

                <div className="absolute bottom-1.5 right-[4%] bg-slate-800/90 text-red-400 border border-red-950 px-2 py-0.5 rounded text-[8px] font-black">
                  Worst time to trade
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible opacity-90">
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#ef4444" />
                      <stop offset="35%" stopColor="#eab308" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="60%" stopColor="#22c55e" />
                      <stop offset="75%" stopColor="#22c55e" />
                      <stop offset="90%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,90 Q15,80 30,50 T60,20 T90,95 L100,95 L100,100 L0,100 Z" fill="url(#areaGrad)" />
                  <path d="M0,90 Q15,80 30,50 T60,20 T90,95 L100,95" fill="none" stroke="url(#curveGrad)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          </div>

          {/* SECTION 4: When is the Best Time to Trade Forex? */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
                <ShieldCheck className="text-indigo-600" size={18} />
                <span>When is the Best Time to Trade Forex?</span>
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The text sections explain how session overlaps represent premium trading periods where liquidity peaks.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The absolute best overlap is the London & New York overlap. It represents the absolute peak of the forex day.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The second best is the Tokyo & London overlap. It's a shorter window but provides good trading opportunities, especially for JPY pairs.
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                The worst time to trade is during late New York (after 7:00 PM UTC) and early Sydney sessions, when liquidity drops extremely low.
              </p>
            </div>

            {/* Nested Best Time Annotated Chart Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6 space-y-6 relative overflow-hidden select-none">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Market Liquidity & Window Quality Chart</div>
              
              <div className="h-32 w-full bg-slate-900 rounded-xl relative p-4 border border-slate-800 shadow-inner flex flex-col justify-between">
                <div className="absolute inset-y-0 left-[55%] right-[22%] bg-indigo-600/10 border-l border-r border-indigo-600/30 flex items-center justify-center">
                  <span className="text-[8px] font-black text-indigo-100 uppercase tracking-widest bg-slate-950/60 px-2 py-0.5 rounded">Best Trading Window</span>
                </div>

                <div className="absolute inset-y-0 right-[2%] w-[12%] bg-red-500/10 border-l border-red-500/20 flex items-center justify-center">
                  <span className="text-[7px] font-black text-red-400 uppercase tracking-wider bg-red-950/50 px-1 py-0.5 rounded rotate-90 whitespace-nowrap">Worst Hours</span>
                </div>

                <div className="flex-1 flex items-end relative mt-6">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible opacity-90">
                    <path d="M0,90 Q15,80 30,65 T60,15 T90,95 L100,95 L100,100 L0,100 Z" fill="url(#areaGrad)" />
                    <path d="M0,90 Q15,80 30,65 T60,15 T90,95 L100,95" fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: How to Trade with the Converter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
              <Clock className="text-slate-600" size={18} />
              <span>How to Trade with the Forex Market Time Zone Converter</span>
            </h3>
            <ol className="text-slate-600 text-xs leading-relaxed space-y-2.5 font-semibold list-decimal pl-4">
              <li>Select your local timezone from the dropdown.</li>
              <li>Drag the slider to the current time or a specific time you want to check.</li>
              <li>Look at which sessions are currently active.</li>
              <li>Identify the overlaps and plan your trades around those high-probability windows.</li>
            </ol>
          </div>

          {/* SECTION 6: FAQ Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 select-none">
              <HelpCircle className="text-slate-600" size={18} />
              <span>Frequently Asked Questions (FAQs)</span>
            </h3>
            
            <div className="divide-y divide-slate-100">
              {[
                {
                  q: "What are the exact active forex market hours?",
                  a: "The forex market is decentralized and open 24 hours a day, 5 days a week. It opens on Sunday at 10:00 PM UTC (when Sydney opens) and closes on Friday at 10:00 PM UTC (when New York closes)."
                },
                {
                  q: "Which trading session has the absolute highest volume?",
                  a: "The London session represents the highest transactional volume, driving nearly 35% of all global forex exchanges. Volume peaks even higher when London overlaps with the New York session."
                },
                {
                  q: "When is the worst time to trade forex?",
                  a: "The worst times are during late New York (after 7:00 PM UTC) and early Sydney sessions, when liquidity drops extremely low. Spreads widen heavily, and price consolidation becomes very choppy."
                },
                {
                  q: "Do forex market hours adjust for Daylight Saving Time (DST)?",
                  a: "Yes. Major global markets shift their hours by +1 or -1 hour during seasonal DST changes. Our browser-integrated timezone engine handles coordinates and daylight changes automatically."
                }
              ].map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <button 
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left flex justify-between items-center gap-4 cursor-pointer py-1"
                    >
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-snug">{faq.q}</h4>
                      <ChevronRight size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-indigo-600' : ''}`} />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-slate-500 text-[11px] md:text-xs leading-relaxed font-semibold animate-in slide-in-from-top-2 duration-200">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar Tools, Widgets, and Sponsors */}
        <div className="space-y-6 lg:sticky lg:top-8 select-none">
          
          {/* Quick Tools Explorer Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Globe2 size={14} className="text-indigo-600" /> Quick Navigator
            </h3>
            
            <div className="space-y-3">
              <Link to="/journal" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group font-bold">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600/5 border border-indigo-600/10 p-2 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform"><Layers size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-slate-800 text-xs">Trading Journal</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Track and analyze your performance.</div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0 ml-1" />
              </Link>

              <Link to="/position-size" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group font-bold">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600/5 border border-indigo-600/10 p-2 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform"><ShieldCheck size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-slate-800 text-xs">Position Sizer</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Calculate dynamic risk and lot sizing.</div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0 ml-1" />
              </Link>

              <Link to="/wiki" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group font-bold">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600/5 border border-indigo-600/10 p-2 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform"><HelpCircle size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-slate-800 text-xs">Encyclopedia</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Comprehensive glossary of forex terms.</div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0 ml-1" />
              </Link>

              <Link to="/calendar" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group font-bold">
                <div className="flex items-center space-x-3">
                  <div className="bg-brand/5 border border-brand/10 p-2 rounded-lg text-brand group-hover:scale-105 transition-transform"><Clock size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-slate-800 text-xs">Economic Calendar</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Track high-impact macroeconomic events.</div>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 shrink-0 ml-1" />
              </Link>
            </div>
          </div>

          {/* Session Guidelines Card (No Ads!) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-brand animate-pulse" /> Session Guidelines
            </h3>
            
            <ul className="text-[10px] text-slate-500 space-y-3 font-semibold leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-brand shrink-0">•</span>
                <span><strong>Never trade low liquidity</strong>: Avoid executing during timezone transitions after NY close.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand shrink-0">•</span>
                <span><strong>Mind the spreads</strong>: Spreads widen heavily at 5:00 PM EST due to bank rollovers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand shrink-0">•</span>
                <span><strong>Target overlaps</strong>: Prioritize 1:00 PM - 5:00 PM UTC for standard volatility.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* MASSIVE BRANDED QUOTE BANNER */}
      <div className="bg-gradient-to-r from-brand-dark to-brand text-white py-12 px-4 text-center rounded-2xl mt-16 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 opacity-40 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto space-y-3 relative z-10 select-none">
          <span className="text-4xl text-brand-light font-extrabold leading-none opacity-50 block">“</span>
          <blockquote className="text-xl md:text-2xl font-bold italic leading-normal tracking-tight max-w-2xl mx-auto text-slate-100">
            All I ask is the chance to prove that money can't make me happy.
          </blockquote>
          <cite className="block text-[10px] font-bold uppercase tracking-widest text-brand-light not-italic mt-2">
            — Spike Milligan / A. E. Newman
          </cite>
        </div>
      </div>

    </div>
  );
}
