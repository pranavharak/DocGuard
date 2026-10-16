import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function CriticalAlertBanner({ onOpenForensic }) {
  return (
    <div className="bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info Group */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-700 dark:bg-rose-800 text-white flex items-center justify-center shadow-md shadow-rose-700/20 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-rose-950 dark:text-rose-200">
                Flagged Tampering Alert — High Risk (82%)
              </h3>
              <span className="bg-rose-700 text-white text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">
                CRITICAL
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Recent document <span className="font-mono font-bold text-slate-900 dark:text-white bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded">BE_Marksheet.pdf</span> detected with localized font mismatch & pixel alteration in the CGPA field.
            </p>
          </div>
        </div>

        {/* Right Action Button */}
        <button
          onClick={onOpenForensic}
          className="inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-rose-700/20 hover:shadow-lg transition-all duration-150 shrink-0 group self-start md:self-center"
        >
          <span className="tracking-wider uppercase text-[10px] bg-rose-900/60 px-1.5 py-0.5 rounded font-mono">BIOMETRICS</span>
          <span>Open Forensic Viewer</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}
