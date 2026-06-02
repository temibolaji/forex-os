import { useState } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore, API_URL } from '../store/authStore';
import { Settings as SettingsIcon, AlertTriangle, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const resetUserData = useTradeStore(state => state.resetUserData);
  const currentUser = useAuthStore(state => state.currentUser);
  const dailyLossLimit = useAuthStore(state => state.dailyLossLimit);
  const setDailyLossLimit = useAuthStore(state => state.setDailyLossLimit);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [lossLimitInput, setLossLimitInput] = useState(dailyLossLimit?.toString() || '');
  const [lossLimitMsg, setLossLimitMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearData = () => {
    if (currentUser) {
      resetUserData(currentUser.email);
    }
    setShowClearDataModal(false);
  };

  const handleLossLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLossLimitMsg(null);
    if (!lossLimitInput) {
      setDailyLossLimit(null);
      setLossLimitMsg({ type: 'success', text: 'Daily loss limit disabled.' });
      return;
    }
    const val = parseFloat(lossLimitInput);
    if (isNaN(val) || val < 0) {
      setLossLimitMsg({ type: 'error', text: 'Please enter a valid positive number.' });
      return;
    }
    setDailyLossLimit(val);
    setLossLimitMsg({ type: 'success', text: 'Daily loss limit updated.' });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-indigo-400" size={28} />
          <span>Account Settings</span>
        </h1>
        <p className="text-slate-400 mt-1 font-medium">Manage your security and personal data.</p>
      </div>

      <div className="space-y-8">
        {/* Risk Management Section */}
        <div className="glass-panel bg-slate-900/40 rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert size={20} className="text-indigo-400" />
            Risk Management
          </h2>
          
          <form onSubmit={handleLossLimitSubmit} className="space-y-4 max-w-md">
            {lossLimitMsg && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                lossLimitMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {lossLimitMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {lossLimitMsg.text}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Daily Loss Limit (USD)</label>
              <div className="flex gap-3">
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={lossLimitInput}
                  onChange={e => setLossLimitInput(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium shadow-inner"
                />
                <button 
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Leave blank to disable. If your daily loss exceeds this amount, the dashboard will warn you to stop trading.</p>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="glass-panel bg-slate-900/40 rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <KeyRound size={20} className="text-slate-400" />
            Change Password
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {passwordMsg && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {passwordMsg.text}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Password</label>
              <input 
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium shadow-inner"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Password</label>
              <input 
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium shadow-inner"
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel bg-slate-900/40 rounded-3xl p-6 md:p-8 border border-rose-500/20 shadow-xl shadow-black/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 relative z-10">
            <ShieldAlert size={20} className="text-rose-500" />
            <span className="text-rose-400">Danger Zone</span>
          </h2>
          <p className="text-slate-400 text-sm mb-6 relative z-10">
            Actions here are irreversible. Please proceed with caution.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-950/50 border border-rose-500/10 rounded-2xl gap-4 relative z-10">
            <div>
              <h3 className="font-bold text-slate-200">Clear All Trading Data</h3>
              <p className="text-xs text-slate-400 mt-1">This will permanently delete all your logged trades, journals, and analytical data. This cannot be undone.</p>
            </div>
            <button 
              onClick={() => setShowClearDataModal(true)}
              className="shrink-0 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all"
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-5 border border-rose-500/20">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete all trading data?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Are you absolutely sure you want to clear all your data? This action will permanently remove all your recorded trades from this browser. This action <strong>cannot</strong> be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setShowClearDataModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearData}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-colors"
              >
                Yes, delete my data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
