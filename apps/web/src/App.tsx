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
import MacroEdge from './pages/MacroEdge';
import RiskSimulator from './pages/RiskSimulator';
import Routine from './pages/Routine';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  return currentUser ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth/login'); };

  const navSection = (label: string, links: { to: string; icon: React.ReactNode; label: string }[]) => (
    <div style={{ marginBottom: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '12px 12px 5px' }}>{label}</div>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          {l.icon} {l.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--surface-0)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="glass-panel hidden md:flex" style={{ width: 224, flexDirection: 'column', flexShrink: 0, zIndex: 20, userSelect: 'none' }}>

        {/* Logo */}
        <div style={{ padding: '16px 14px 13px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe2 size={15} style={{ color: '#a5b4fc' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>ForexOS</span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }} className="custom-scrollbar">
          {navSection('Trading', [
            { to: '/journal', icon: <BookOpen size={14} />, label: 'Journal' },
            { to: '/position-size', icon: <Calculator size={14} />, label: 'Position Sizer' },
          ])}
          {navSection('Tools', [
            { to: '/charts', icon: <BarChart3 size={14} />, label: 'Charts' },
            { to: '/playbook', icon: <Camera size={14} />, label: 'Playbook' },
            { to: '/calendar', icon: <CalendarIcon size={14} />, label: 'Calendar' },
            { to: '/sessions', icon: <Globe2 size={14} />, label: 'Sessions' },
            { to: '/checklists', icon: <CheckSquare size={14} />, label: 'Checklists' },
            { to: '/wiki', icon: <HelpCircle size={14} />, label: 'Wiki' },
          ])}
          {navSection('Analytics', [
            { to: '/dashboard', icon: <BarChart3 size={14} />, label: 'Dashboard' },
            { to: '/routine', icon: <CheckSquare size={14} />, label: 'Daily Routine' },
            { to: '/prop-firm', icon: <Trophy size={14} />, label: 'Prop Firm' },
            { to: '/risk-simulator', icon: <TrendingUp size={14} />, label: 'Risk Simulator' },
            { to: '/macro', icon: <Globe2 size={14} />, label: 'Macro Edge' },
            { to: '/simulator', icon: <TrendingUp size={14} />, label: 'Paper Trading' },
          ])}
          {/* AI Coach — special highlight */}
          <div style={{ padding: '8px 0 4px' }}>
            <NavLink to="/coach" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.16)' }}>
              <Bot size={14} style={{ color: '#a5b4fc' }} /> AI Coach
            </NavLink>
          </div>
        </nav>

        {/* User footer */}
        {currentUser && (
          <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 6px', marginBottom: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserIcon size={12} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email.split('@')[0]}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <NavLink to="/settings" className="btn btn-ghost" style={{ flex: 1, fontSize: 11.5, padding: '6px 8px', gap: 5 }}>
                <SettingsIcon size={12} /> Settings
              </NavLink>
              <button onClick={handleLogout} className="btn btn-ghost" title="Sign Out" style={{ padding: '6px 9px', color: 'var(--text-tertiary)' }}>
                <LogOut size={12} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto' }} className="pb-20 md:pb-0">
        {/* Mobile header */}
        <header className="md:hidden" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,10,15,0.94)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border-subtle)', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe2 size={13} style={{ color: '#a5b4fc' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ForexOS</span>
          </div>
          {currentUser && (
            <button onClick={handleLogout} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: 7, padding: '5px 8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
              <LogOut size={14} />
            </button>
          )}
        </header>
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden" style={{ position: 'fixed', bottom: 0, width: '100%', background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-around', padding: '7px 0 14px', zIndex: 40 }}>
        {[
          { to: '/journal', icon: <BookOpen size={19} />, label: 'Journal' },
          { to: '/dashboard', icon: <BarChart3 size={19} />, label: 'Stats' },
          { to: '/coach', icon: <Bot size={19} />, label: 'Coach' },
          { to: '/calendar', icon: <CalendarIcon size={19} />, label: 'News' },
          { to: '/checklists', icon: <CheckSquare size={19} />, label: 'Rules' },
        ].map(l => (
          <NavLink key={l.to} to={l.to} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 10px',
            color: isActive ? '#a5b4fc' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s'
          })}>
            {l.icon}
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.02em' }}>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

function App() {
  const checkSession = useAuthStore(state => state.checkSession);
  useEffect(() => { checkSession(); }, [checkSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
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
          <Route path="/risk-simulator" element={<ProtectedRoute><AppLayout><RiskSimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/routine" element={<ProtectedRoute><AppLayout><Routine /></AppLayout></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><AppLayout><Simulator /></AppLayout></ProtectedRoute>} />
          <Route path="/macro" element={<ProtectedRoute><AppLayout><MacroEdge /></AppLayout></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><AppLayout><Coach /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/journal" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
