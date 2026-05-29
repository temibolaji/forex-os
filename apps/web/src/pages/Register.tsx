import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe2, ArrowLeft, Mail, Lock, DollarSign } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, error, clearError, currentUser } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (currentUser) {
      navigate('/journal');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await register(email, password, currency);
    setIsSubmitting(false);
    if (success) {
      navigate('/journal');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Globe2 size={32} className="text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-bold text-white tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-400">
          Join ForexOS and track your edge
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel bg-slate-900/40 py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-[2rem] sm:px-10 border border-white/10 backdrop-blur-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-bold">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-11 px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium text-white transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-11 px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium text-white transition-all"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Base Currency</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-slate-500" />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="appearance-none block w-full pl-11 px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium text-white transition-all cursor-pointer"
                >
                  <option value="USD" className="bg-slate-900">USD - US Dollar</option>
                  <option value="EUR" className="bg-slate-900">EUR - Euro</option>
                  <option value="GBP" className="bg-slate-900">GBP - British Pound</option>
                  <option value="JPY" className="bg-slate-900">JPY - Japanese Yen</option>
                  <option value="AUD" className="bg-slate-900">AUD - Australian Dollar</option>
                  <option value="CAD" className="bg-slate-900">CAD - Canadian Dollar</option>
                  <option value="CHF" className="bg-slate-900">CHF - Swiss Franc</option>
                  <option value="NZD" className="bg-slate-900">NZD - New Zealand Dollar</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="px-3 bg-slate-900 text-slate-500 rounded-full">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/auth/login"
                className="w-full flex items-center justify-center px-4 py-3 border border-white/10 rounded-xl shadow-sm text-sm font-bold text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} className="mr-2 text-slate-400" /> Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
