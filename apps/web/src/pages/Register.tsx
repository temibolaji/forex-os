import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Globe2, ShieldAlert } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');

  const currentUser = useAuthStore(state => state.currentUser);
  const error = useAuthStore(state => state.error);
  const register = useAuthStore(state => state.register);
  const clearError = useAuthStore(state => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/journal');
    }
    clearError();
  }, [currentUser, navigate, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = register(email, password, currency);
    if (success) {
      navigate('/journal');
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
        {/* Modern Icon Header */}
        <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg border border-white/20 hover:scale-105 transition-transform">
          <Globe2 size={24} className="text-emerald-400 animate-pulse" />
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
          Create an Account
        </h2>
        <p className="mt-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Join the premium trading workstation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-white/60">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Limit and Validation error warnings */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-rose-600 font-semibold leading-relaxed animate-in slide-in-from-top-2 duration-300">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Email address</label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-200/80 rounded-xl bg-white/50 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="appearance-none block w-full px-4 py-3 border border-slate-200/80 rounded-xl bg-white/50 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Base Currency</label>
              <div className="relative">
                <select
                  className="appearance-none block w-full px-4 py-3 border border-slate-200/80 rounded-xl bg-white/50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent cursor-pointer transition-all"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[8px]">▼</div>
              </div>
            </div>

            {/* Sub-label alerting user to the free tier cap */}
            <div className="text-[10px] text-slate-400 font-bold text-center leading-normal pt-1 px-1">
              🔒 Safety Guarantee: Accounts are stored locally. Capped at exactly 10 users max.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-brand to-brand-light hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] transition-all transform duration-300 cursor-pointer shadow-brand/10 hover:shadow-lg"
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100/60 text-center">
            <p className="text-xs font-bold text-slate-500">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-brand hover:text-brand-light transition-colors font-extrabold underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
