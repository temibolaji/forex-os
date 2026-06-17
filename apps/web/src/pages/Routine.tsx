import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRoutineStore } from '../store/routineStore';
import { CheckCircle2, Circle, Flame, CalendarDays, Award } from 'lucide-react';

export default function Routine() {
  const currentUser = useAuthStore(state => state.currentUser);
  const { logs, loadUserLogs, saveLog } = useRoutineStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    if (currentUser) {
      loadUserLogs(currentUser.email);
    }
  }, [currentUser, loadUserLogs]);

  const currentLog = logs.find(l => l.date === selectedDate) || {
    date: selectedDate,
    habits: {
      sleep: false,
      backtest: false,
      noOvertrade: false,
      journal: false
    },
    notes: ''
  };

  const handleToggleHabit = (habitKey: keyof typeof currentLog.habits) => {
    if (!currentUser) return;
    saveLog(currentUser.email, {
      ...currentLog,
      habits: {
        ...currentLog.habits,
        [habitKey]: !currentLog.habits[habitKey]
      }
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentUser) return;
    saveLog(currentUser.email, {
      ...currentLog,
      notes: e.target.value
    });
  };

  // Calculate Streak
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Find if today or yesterday is the start of the streak
  let checkDate = new Date();
  
  // Check if today exists and is perfect
  const isPerfect = (log: any) => Object.values(log.habits).every(v => v === true);
  
  for (let i = 0; i < 365; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    const logForDay = logs.find(l => l.date === dStr);
    
    if (i === 0 && (!logForDay || !isPerfect(logForDay))) {
      // If today is not perfect, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }
    
    if (logForDay && isPerfect(logForDay)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const score = Object.values(currentLog.habits).filter(Boolean).length;
  const maxScore = Object.keys(currentLog.habits).length;
  const progressPct = (score / maxScore) * 100;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarDays className="text-emerald-400" size={28} />
            Daily Routine
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">
            Top traders are built on consistent habits. Track your daily non-negotiables.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-900 border border-white/10 px-4 py-2 rounded-xl">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-slate-200 text-sm font-semibold focus:outline-none"
            max={today}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 glass-panel bg-slate-900/40 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
              Habits Checklist
            </h2>
            <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {score} / {maxScore} Completed
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Habit 1 */}
            <div 
              onClick={() => handleToggleHabit('sleep')}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentLog.habits.sleep ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'}`}
            >
              <div>
                <h3 className={`font-bold ${currentLog.habits.sleep ? 'text-emerald-400' : 'text-white'}`}>8+ Hours of Sleep</h3>
                <p className="text-xs text-slate-400 mt-1">Cognitive edge requires rest.</p>
              </div>
              {currentLog.habits.sleep ? <CheckCircle2 className="text-emerald-400" size={24} /> : <Circle className="text-slate-500" size={24} />}
            </div>

            {/* Habit 2 */}
            <div 
              onClick={() => handleToggleHabit('backtest')}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentLog.habits.backtest ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'}`}
            >
              <div>
                <h3 className={`font-bold ${currentLog.habits.backtest ? 'text-emerald-400' : 'text-white'}`}>30 Mins Backtesting/Review</h3>
                <p className="text-xs text-slate-400 mt-1">Review past trades or backtest setups.</p>
              </div>
              {currentLog.habits.backtest ? <CheckCircle2 className="text-emerald-400" size={24} /> : <Circle className="text-slate-500" size={24} />}
            </div>

            {/* Habit 3 */}
            <div 
              onClick={() => handleToggleHabit('noOvertrade')}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentLog.habits.noOvertrade ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'}`}
            >
              <div>
                <h3 className={`font-bold ${currentLog.habits.noOvertrade ? 'text-emerald-400' : 'text-white'}`}>No Overtrading</h3>
                <p className="text-xs text-slate-400 mt-1">Stuck to the max daily limit & setup rules.</p>
              </div>
              {currentLog.habits.noOvertrade ? <CheckCircle2 className="text-emerald-400" size={24} /> : <Circle className="text-slate-500" size={24} />}
            </div>

            {/* Habit 4 */}
            <div 
              onClick={() => handleToggleHabit('journal')}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${currentLog.habits.journal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'}`}
            >
              <div>
                <h3 className={`font-bold ${currentLog.habits.journal ? 'text-emerald-400' : 'text-white'}`}>Journaled Trades</h3>
                <p className="text-xs text-slate-400 mt-1">Logged every trade taken today with emotions.</p>
              </div>
              {currentLog.habits.journal ? <CheckCircle2 className="text-emerald-400" size={24} /> : <Circle className="text-slate-500" size={24} />}
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">
              <span>Daily Progress</span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-sm text-center flex flex-col items-center justify-center py-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full transition-transform duration-300 group-hover:scale-110"></div>
            <Flame size={48} className={`mb-4 ${streak > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
            <h3 className="text-4xl font-display font-black text-white">{streak}</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Perfect Day Streak</p>
          </div>
          
          <div className="glass-panel bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Award size={16} className="text-indigo-400" /> End of Day Notes
            </h3>
            <textarea 
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-y min-h-[120px]"
              placeholder="How did you feel today? What went right? What went wrong?"
              value={currentLog.notes || ''}
              onChange={handleNotesChange}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
