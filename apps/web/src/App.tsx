import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookOpen, Calculator, Calendar as CalendarIcon, Globe2, CheckSquare, BarChart3, TrendingUp, Bot, HelpCircle, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';

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
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-medium">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-indigo-600 text-white shadow-2xl relative overflow-hidden select-none shrink-0 border-r border-indigo-500/30">
        {/* Modern glow bubble */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-5 border-b border-white/10 flex items-center space-x-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-sm">
            <Globe2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">ForexOS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10">
          <div className="text-indigo-200/60 text-[10px] font-extrabold uppercase tracking-widest mb-2 mt-2 px-2">Trading</div>
          <NavLink to="/journal" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <BookOpen size={16} /> <span>Journal</span>
          </NavLink>
          <NavLink to="/position-size" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <Calculator size={16} /> <span>Position Sizer</span>
          </NavLink>
          
          <div className="text-indigo-200/60 text-[10px] font-extrabold uppercase tracking-widest mb-2 mt-6 px-2">Tools</div>
          <NavLink to="/calendar" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <CalendarIcon size={16} /> <span>Calendar</span>
          </NavLink>
          <NavLink to="/sessions" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <Globe2 size={16} /> <span>Sessions</span>
          </NavLink>
          <NavLink to="/checklists" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <CheckSquare size={16} /> <span>Checklists</span>
          </NavLink>
          <NavLink to="/wiki" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <HelpCircle size={16} /> <span>Wiki</span>
          </NavLink>

          <div className="text-indigo-200/60 text-[10px] font-extrabold uppercase tracking-widest mb-2 mt-6 px-2">Analytics & AI</div>
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <BarChart3 size={16} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/simulator" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <TrendingUp size={16} /> <span>Simulator</span>
          </NavLink>
          <NavLink to="/coach" className={({isActive}) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all mt-4 border ${isActive ? 'bg-white/20 border-white/30 text-white shadow-md' : 'bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
            <Bot size={16} /> <span>AI Coach</span>
          </NavLink>
        </nav>

        {/* User profile details at the bottom of the sidebar */}
        {currentUser && (
          <div className="p-4 border-t border-white/10 bg-indigo-950/40 flex flex-col space-y-3 relative z-10 select-none">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-indigo-400 shrink-0 text-white shadow-sm">
                <UserIcon size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white leading-none truncate">{currentUser.email.split('@')[0]}</div>
                <div className="text-[10px] font-bold text-indigo-300 mt-0.5 truncate">{currentUser.email}</div>
              </div>
            </div>
            
            <NavLink to="/settings" className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-100 font-bold py-2 px-3 rounded-xl transition-all text-xs mb-2">
              <SettingsIcon size={13} />
              <span>Settings</span>
            </NavLink>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-rose-500 hover:text-white border border-white/10 hover:border-rose-500 text-indigo-100 font-bold py-2 px-3 rounded-xl transition-all text-xs"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative font-inter bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-20 shadow-sm">
          <h1 className="text-xl font-black text-indigo-600 flex items-center gap-1.5">
            <Globe2 size={20} className="text-indigo-500" />
            <span>ForexOS</span>
          </h1>
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </header>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around p-2 pb-safe z-30 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] select-none">
        <NavLink to="/journal" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
          <BookOpen size={20} />
          <span className="text-[9px] mt-1 font-bold">Journal</span>
        </NavLink>
        <NavLink to="/dashboard" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
          <BarChart3 size={20} />
          <span className="text-[9px] mt-1 font-bold">Stats</span>
        </NavLink>
        <NavLink to="/coach" className={({isActive}) => `flex flex-col items-center p-2 transition-colors relative ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
          <div className="absolute top-1 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
          <Bot size={20} />
          <span className="text-[9px] mt-1 font-bold">Coach</span>
        </NavLink>
        <NavLink to="/calendar" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
          <CalendarIcon size={20} />
          <span className="text-[9px] mt-1 font-bold">News</span>
        </NavLink>
        <NavLink to="/checklists" className={({isActive}) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>
          <CheckSquare size={20} />
          <span className="text-[9px] mt-1 font-bold">Rules</span>
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
          <Route path="/position-size" element={<ProtectedRoute><AppLayout><PositionSizer /></AppLayout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout><Calendar /></AppLayout></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><AppLayout><Sessions /></AppLayout></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute><AppLayout><Checklists /></AppLayout></ProtectedRoute>} />
          <Route path="/wiki" element={<ProtectedRoute><AppLayout><Wiki /></AppLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
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
