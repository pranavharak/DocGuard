import React, { useEffect, useRef } from 'react';
import { FileText, Plus, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { gsap } from 'gsap';

export default function MetricsOverview({ onOpenUpload, stats }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.gsap-metric-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  const metrics = [
    {
      title: 'TOTAL ANALYZED',
      value: stats?.total || 128,
      subtext: 'Documents analyzed',
      footer: 'All time total',
      footerStyle: 'text-slate-400 font-mono',
      valueColor: 'text-slate-900 dark:text-white',
      badge: null,
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
    },
    {
      title: 'LIKELY AUTHENTIC',
      value: stats?.authentic || 91,
      subtext: 'Low risk documents',
      footer: 'Likely authentic',
      footerStyle: 'text-emerald-600 dark:text-emerald-400 font-mono',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
      badge: '• 71%',
      badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
    },
    {
      title: 'SUSPICIOUS',
      value: stats?.suspicious || 24,
      subtext: 'Requires review',
      footer: 'Potential anomalies',
      footerStyle: 'text-amber-600 dark:text-amber-400 font-mono',
      valueColor: 'text-amber-600 dark:text-amber-400',
      badge: '• 19%',
      badgeStyle: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
    },
    {
      title: 'POTENTIALLY TAMPERED',
      value: stats?.tampered || 13,
      subtext: 'High risk documents',
      footer: 'Flagged for inspection',
      footerStyle: 'text-rose-600 dark:text-rose-400 font-mono',
      valueColor: 'text-rose-600 dark:text-rose-400',
      badge: '• 10%',
      badgeStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40',
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
    }
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, Pranav
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            AI-Powered Document Tampering Detection System
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-150 group shrink-0"
        >
          <div className="w-5 h-5 rounded border border-white/40 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white group-hover:rotate-90 transition-transform duration-200" />
          </div>
          <span className="text-sm">+ Analyze New Document</span>
        </button>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="gsap-metric-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    {card.title}
                  </span>
                  {card.badge ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.badgeStyle}`}>
                      {card.badge}
                    </span>
                  ) : (
                    <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="mt-1">
                  <span className={`text-4xl font-extrabold tracking-tight ${card.valueColor}`}>
                    {card.value}
                  </span>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {card.subtext}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className={`text-xs ${card.footerStyle}`}>
                  {card.footer}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
