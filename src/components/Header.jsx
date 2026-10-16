import React from 'react';
import { Search, Moon, Sun, Menu, LogOut } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDarkMode, setIsDarkMode, setIsMobileMenuOpen, username, onLogout }) {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 transition-colors duration-200">
      
      {/* Left: Mobile Hamburger Menu Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl min-w-0">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input Bar */}
        <div className="flex-1 relative min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document hash, filename, or verdict report..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all duration-150 truncate"
          />
        </div>
      </div>

      {/* Right: Theme Toggle, Profile Capsule & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Info Capsule */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {username || 'Pranav Harak'}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Student Researcher
            </p>
          </div>
          
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 font-mono">
            {username ? username.substring(0, 2).toUpperCase() : 'PH'}
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
