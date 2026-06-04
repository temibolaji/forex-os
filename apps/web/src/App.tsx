import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookOpen, Calculator, Calendar as CalendarIcon, Globe2, CheckSquare, BarChart3, TrendingUp, Bot, HelpCircle, LogOut, User as UserIcon, Settings as SettingsIcon, Trophy, Camera } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import Journal from './pages/Journal';
import PositionSizer from './pages/PositionSizer';
import Calendar from './pages/Calendar';
import Sessions from './pages/Sessions';
import Checklists from './pages/Checklists';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Coach from './pages/Coach';
import Wiki from './pages/Wiki';
import Settings from './pages/Settings';
import Charts from './pages/Charts';
import PropFirmTracker from './pages/PropFirmTracker';
import Playbook from './pages/Playbook';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

// Route Guard Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

// Layout with Sidebar for Desktop and Bottom Nav for Mobile
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-inter selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col glass-panel shadow-2xl relative select-none shrink-0 border-r border-white/5 z-20">
        {/* Modern glow bubble */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none"></div>

        <div className="p-6 border-b border-white/5 flex items-center space-x-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-sm">
            <Globe2 size={20} className="text-indigo-400" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide text-white">ForexOS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 mt-4 px-3">Trading</div>
          <NavLink to="/journal" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <BookOpen size={18} /> <span>Journal</span>
          </NavLink>
          <NavLink to="/position-size" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <Calculator size={18} /> <span>Position Sizer</span>
          </NavLink>
          
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 mt-8 px-3">Tools</div>
          <NavLink to="/charts" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <BarChart3 size={18} /> <span>Charts</span>
          </NavLink>
          <NavLink to="/playbook" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <Camera size={18} /> <span>Playbook</span>
          </NavLink>
          <NavLink to="/calendar" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <CalendarIcon size={18} /> <span>Calendar</span>
          </NavLink>
          <NavLink to="/sessions" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <Globe2 size={18} /> <span>Sessions</span>
          </NavLink>
          <NavLink to="/checklists" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <CheckSquare size={18} /> <span>Checklists</span>
          </NavLink>
          <NavLink to="/wiki" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <HelpCircle size={18} /> <span>Wiki</span>
          </NavLink>

          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 mt-8 px-3">Analytics & AI</div>
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <BarChart3 size={18} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/prop-firm" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <Trophy size={18} /> <span>Prop Firm</span>
          </NavLink>
          <NavLink to="/simulator" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
            <TrendingUp size={18} /> <span>Simulator</span>
          </NavLink>
          <NavLink to="/coach" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 mt-4 border ${isActive ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-md' : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'}`}>
            <Bot size={18} /> <span>AI Coach</span>
          </NavLink>
        </nav>

        {/* User profile details at the bottom of the sidebar */}
        {currentUser && (
          <div className="p-4 border-t border-white/5 bg-slate-900/50 flex flex-col space-y-3 relative z-10 select-none">
            <div className="flex items-center space-x-3 px-2 py-1">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 text-slate-300 shadow-sm">
                <UserIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-display font-bold text-slate-200 leading-none truncate">{currentUser.email.split('@')[0]}</div>
                <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">{currentUser.email}</div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <NavLink to="/settings" className="flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-2.5 px-3 rounded-xl transition-all text-xs">
                <SettingsIcon size={14} />
                <span>Settings</span>
              </NavLink>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 font-semibold p-2.5 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative bg-slate-950">
        <header className="glass-panel border-b border-white/5 p-4 flex justify-between items-center md:hidden sticky top-0 z-30 shadow-sm">
          <h1 className="text-xl font-display font-bold text-slate-200 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Globe2 size={16} className="text-indigo-400" />
            </div>
            <span>ForexOS</span>
          </h1>
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </header>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full glass-panel border-t border-white/5 flex justify-around p-2 pb-safe z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.5)] select-none">
        <NavLink to="/journal" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <BookOpen size={22} />
          <span className="text-[10px] mt-1 font-semibold">Journal</span>
        </NavLink>
        <NavLink to="/dashboard" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <BarChart3 size={22} />
          <span className="text-[10px] mt-1 font-semibold">Stats</span>
        </NavLink>
        <NavLink to="/coach" className={({isActive}) => `flex flex-col items-center p-2 transition-colors relative ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <div className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></div>
          <Bot size={22} />
          <span className="text-[10px] mt-1 font-semibold">Coach</span>
        </NavLink>
        <NavLink to="/calendar" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <CalendarIcon size={22} />
          <span className="text-[10px] mt-1 font-semibold">News</span>
        </NavLink>
        <NavLink to="/checklists" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <CheckSquare size={22} />
          <span className="text-[10px] mt-1 font-semibold">Rules</span>
        </NavLink>
      </nav>
    </div>
  );
};

function App() {
  const checkSession = useAuthStore(state => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Secure Private Routes */}
          <Route path="/" element={<Navigate to="/journal" replace />} />
          <Route path="/journal" element={<ProtectedRoute><AppLayout><Journal /></AppLayout></ProtectedRoute>} />
          <Route path="/charts" element={<ProtectedRoute><AppLayout><Charts /></AppLayout></ProtectedRoute>} />
          <Route path="/position-size" element={<ProtectedRoute><AppLayout><PositionSizer /></AppLayout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout><Calendar /></AppLayout></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><AppLayout><Sessions /></AppLayout></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute><AppLayout><Checklists /></AppLayout></ProtectedRoute>} />
          <Route path="/wiki" element={<ProtectedRoute><AppLayout><Wiki /></AppLayout></ProtectedRoute>} />
          <Route path="/playbook" element={<ProtectedRoute><AppLayout><Playbook /></AppLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/prop-firm" element={<ProtectedRoute><AppLayout><PropFirmTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><AppLayout><Simulator /></AppLayout></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><AppLayout><Coach /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/journal" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
