import { useState } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore, API_URL } from '../store/authStore';
import { Settings as SettingsIcon, AlertTriangle, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const resetUserData = useTradeStore(state => state.resetUserData);
  const currentUser = useAuthStore(state => state.currentUser);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-in fade-in duration-500 font-inter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-indigo-600" size={28} />
          <span>Account Settings</span>
        </h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your security and personal data.</p>
      </div>

      <div className="space-y-8">
        {/* Change Password Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <KeyRound size={20} className="text-slate-400" />
            Change Password
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {passwordMsg && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
                passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {passwordMsg.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Password</label>
              <input 
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
              <input 
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isChangingPassword}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full pointer-events-none"></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2 text-rose-600 relative z-10">
            <ShieldAlert size={20} />
            Danger Zone
          </h2>
          <p className="text-slate-500 text-sm mb-6 relative z-10">
            Actions here are irreversible. Please proceed with caution.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4 relative z-10">
            <div>
              <h3 className="font-bold text-slate-900">Clear All Trading Data</h3>
              <p className="text-xs text-slate-500 mt-1">This will permanently delete all your logged trades, journals, and analytical data from your local browser storage. This cannot be undone.</p>
            </div>
            <button 
              onClick={() => setShowClearDataModal(true)}
              className="shrink-0 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold py-2 px-4 rounded-xl shadow-sm transition-colors"
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-5">
              <AlertTriangle size={24} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete all trading data?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Are you absolutely sure you want to clear all your data? This action will permanently remove all your recorded trades from this browser. This action <strong>cannot</strong> be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setShowClearDataModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearData}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors"
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
