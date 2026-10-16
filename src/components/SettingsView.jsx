import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  Palette, 
  LogOut, 
  Camera, 
  Check, 
  Sun, 
  Moon, 
  ShieldCheck,
  Save,
  KeyRound
} from 'lucide-react';
import { gsap } from 'gsap';

export default function SettingsView({ isDarkMode, setIsDarkMode, username, onLogout }) {
  const [fullName, setFullName] = useState(username || 'Pranav Harak');
  const [email, setEmail] = useState('pranav.harak@institution.edu');
  const [role, setRole] = useState('Final Year Engineering Student • ABC Institute of Technology');
  
  const [currentPass, setCurrentPass] = useState('••••••••••••');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.gsap-settings-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!newPass) return;
    alert('Password updated successfully!');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your researcher profile, account credentials, theme preference, and active sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save All Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Settings and researcher profile preferences saved successfully!</span>
        </div>
      )}

      {/* 2x2 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: PROFILE INFORMATION */}
        <div className="gsap-settings-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Profile Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personal identification details associated with your forensic verification sign-offs.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar + Change Photo */}
              <div className="flex items-center gap-4 pt-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xl overflow-hidden shadow-md ring-2 ring-slate-200 dark:ring-slate-700">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80" 
                      alt="Pranav Harak"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="font-mono text-sm font-bold text-slate-200">PH</span>
                  </div>

                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Researcher Avatar</p>
                  <p className="text-[11px] text-slate-400">JPG, GIF or PNG. Max size 2MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role & Affiliation
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* CARD 2: SECURITY & PASSWORD */}
        <div className="gsap-settings-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Security & Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage account access credentials and master password.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* CARD 3: APPEARANCE & THEME */}
        <div className="gsap-settings-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Appearance & Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose your preferred visual theme for DocuGuard AI.
                </p>
              </div>
            </div>

            {/* Light Mode vs Dark Mode Theme Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setIsDarkMode(false)}
                className={`p-4 rounded-2xl border-2 text-left transition-all space-y-3 cursor-pointer ${
                  !isDarkMode
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    !isDarkMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {!isDarkMode ? 'Selected' : 'Preview'}
                  </span>
                </div>

                {/* Light Mode Diagram Illustration */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                  <div className="flex gap-1.5">
                    <div className="w-1/4 h-2 bg-slate-900 rounded"></div>
                    <div className="w-2/4 h-2 bg-indigo-500 rounded"></div>
                    <div className="w-1/4 h-2 bg-slate-400 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-white border border-slate-200 rounded-lg p-1 space-y-1">
                    <div className="w-full h-2 bg-slate-100 rounded"></div>
                    <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Crisp, clean layout tuned for well-lit workspaces and verification review.
                </p>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setIsDarkMode(true)}
                className={`p-4 rounded-2xl border-2 text-left transition-all space-y-3 cursor-pointer ${
                  isDarkMode
                    ? 'border-indigo-600 bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Dark Mode</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    isDarkMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isDarkMode ? 'Selected' : 'Preview'}
                  </span>
                </div>

                {/* Dark Mode Diagram Illustration */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                  <div className="flex gap-1.5">
                    <div className="w-1/4 h-2 bg-slate-700 rounded"></div>
                    <div className="w-2/4 h-2 bg-indigo-400 rounded"></div>
                    <div className="w-1/4 h-2 bg-slate-600 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-slate-800 border border-slate-700 rounded-lg p-1 space-y-1">
                    <div className="w-full h-2 bg-slate-700 rounded"></div>
                    <div className="w-3/4 h-2 bg-slate-700 rounded"></div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Deep navy slate contrast for low-glare document inspection sessions.
                </p>
              </button>

            </div>

          </div>
        </div>

        {/* CARD 4: ACCOUNT & SESSION */}
        <div className="gsap-settings-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Account & Session
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your active login session.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sign out of your active document verification session. All unsaved drafts or uncommitted notes will be securely closed.
            </p>

          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Session secured via TLS 1.3</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
