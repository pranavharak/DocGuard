import React from 'react';
import { 
  LayoutDashboard, 
  FileSearch, 
  FolderKanban, 
  Settings, 
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, documentCount, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'analyze', 
      label: 'Analyze Document', 
      icon: FileSearch,
      badge: { text: 'UPLOAD', style: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold' }
    },
    { 
      id: 'documents', 
      label: 'My Documents', 
      icon: FolderKanban,
      badge: { text: documentCount || '14', style: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold' }
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-5">
        {/* Logo & Mobile Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">DocuGuard</span>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">AI</span>
              </div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-slate-400 dark:text-slate-500">
                FORENSIC ENGINE
              </p>
            </div>
          </div>

          {setIsMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Project Tag Badge */}
        <div className="mb-6 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Final Year Eng Project
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-md shadow-slate-900/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md ${item.badge.style}`}>
                    {item.badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 m-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Model: Forensic v4.2</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Pixel alteration & font anomaly scan active
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg screens and above) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between shrink-0 min-h-screen transition-colors duration-200 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (below lg screens) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-10 shadow-2xl animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
