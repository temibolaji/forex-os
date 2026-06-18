import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen, Calculator, Calendar as CalendarIcon, Globe2, CheckSquare,
  BarChart3, TrendingUp, Bot, HelpCircle, LogOut, Settings as SettingsIcon,
  Trophy, Camera, Zap, ChevronRight
} from 'lucide-react';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(124,58,237,0.2)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return currentUser ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

type NavGroup = { section: string; items: { to: string; icon: React.ReactNode; label: string }[] };

const navGroups: NavGroup[] = [
  {
    section: 'Trading',
    items: [
      { to: '/journal',        icon: <BookOpen size={14} />,     label: 'Journal' },
      { to: '/position-size',  icon: <Calculator size={14} />,   label: 'Position Sizer' },
    ],
  },
  {
    section: 'Tools',
    items: [
      { to: '/charts',         icon: <BarChart3 size={14} />,    label: 'Charts' },
      { to: '/playbook',       icon: <Camera size={14} />,       label: 'Playbook' },
      { to: '/calendar',       icon: <CalendarIcon size={14} />, label: 'Calendar' },
      { to: '/sessions',       icon: <Globe2 size={14} />,       label: 'Sessions' },
      { to: '/checklists',     icon: <CheckSquare size={14} />,  label: 'Checklists' },
      { to: '/wiki',           icon: <HelpCircle size={14} />,   label: 'Wiki' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { to: '/dashboard',      icon: <BarChart3 size={14} />,    label: 'Dashboard' },
      { to: '/routine',        icon: <CheckSquare size={14} />,  label: 'Daily Routine' },
      { to: '/prop-firm',      icon: <Trophy size={14} />,       label: 'Prop Firm' },
      { to: '/risk-simulator', icon: <TrendingUp size={14} />,   label: 'Risk Simulator' },
      { to: '/macro',          icon: <Globe2 size={14} />,       label: 'Macro Edge' },
      { to: '/simulator',      icon: <TrendingUp size={14} />,   label: 'Paper Trading' },
    ],
  },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/auth/login'); };

  const initial = currentUser?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="app-shell">

      {/* ══ Desktop Sidebar ══ */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={14} color="#fff" />
          </div>
          <span className="sidebar-logo-name">ForexOS</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div key={group.section} style={{ marginBottom: 4 }}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {/* AI Coach — special accent button */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <NavLink to="/coach" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Bot size={14} style={{ color: '#c4b5fd' }} />
              <span style={{ color: '#c4b5fd' }}>AI Coach</span>
              <ChevronRight size={11} style={{ marginLeft: 'auto', color: 'rgba(196,181,253,0.4)' }} />
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        {currentUser && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                  {currentUser.email.split('@')[0]}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <NavLink to="/settings" className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 10px', gap: 5 }}>
                <SettingsIcon size={12} /> Settings
              </NavLink>
              <button onClick={handleLogout} className="btn btn-ghost" title="Sign out" style={{ padding: '6px 9px', color: 'var(--t3)' }}>
                <LogOut size={12} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ══ Main ══ */}
      <main className="main-content">
        {/* Mobile header */}
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="sidebar-logo-icon" style={{ width: 24, height: 24 }}>
              <Zap size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--t1)' }}>ForexOS</span>
          </div>
          {currentUser && (
            <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '5px 8px', fontSize: 12 }}>
              <LogOut size={13} />
            </button>
          )}
        </header>

        {children}
      </main>

      {/* ══ Mobile bottom nav ══ */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {[
            { to: '/journal',   icon: <BookOpen size={20} />,    label: 'Journal' },
            { to: '/dashboard', icon: <BarChart3 size={20} />,   label: 'Stats' },
            { to: '/coach',     icon: <Bot size={20} />,         label: 'Coach' },
            { to: '/calendar',  icon: <CalendarIcon size={20} />,label: 'News' },
            { to: '/checklists',icon: <CheckSquare size={20} />, label: 'Rules' },
          ].map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </div>
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
          <Route path="/auth/login"    element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/journal" replace />} />

          {([
            ['/journal',        <Journal />],
            ['/charts',         <Charts />],
            ['/position-size',  <PositionSizer />],
            ['/calendar',       <Calendar />],
            ['/sessions',       <Sessions />],
            ['/checklists',     <Checklists />],
            ['/wiki',           <Wiki />],
            ['/playbook',       <Playbook />],
            ['/dashboard',      <Dashboard />],
            ['/prop-firm',      <PropFirmTracker />],
            ['/risk-simulator', <RiskSimulator />],
            ['/routine',        <Routine />],
            ['/simulator',      <Simulator />],
            ['/macro',          <MacroEdge />],
            ['/coach',          <Coach />],
            ['/settings',       <Settings />],
          ] as [string, React.ReactNode][]).map(([path, el]) => (
            <Route key={path} path={path} element={
              <ProtectedRoute><AppLayout>{el}</AppLayout></ProtectedRoute>
            } />
          ))}

          <Route path="*" element={<Navigate to="/journal" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
