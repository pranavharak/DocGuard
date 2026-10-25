import React from 'react';
import { PieChart } from 'lucide-react';

export default function DetectionBreakdown({ stats }) {
  const total = stats?.totalAnalyzed ?? stats?.total ?? 0;
  const authentic = stats?.likelyAuthentic ?? stats?.authentic ?? 0;
  const suspicious = stats?.suspicious ?? 0;
  const tampered = stats?.potentiallyTampered ?? stats?.tampered ?? 0;

  // Dynamic percentages (matching the 4 statistic cards exactly)
  const pAuth = stats?.percentages?.likelyAuthentic ?? (total > 0 ? Number(((authentic / total) * 100).toFixed(1)) : 0);
  const pSusp = stats?.percentages?.suspicious ?? (total > 0 ? Number(((suspicious / total) * 100).toFixed(1)) : 0);
  const pTamp = stats?.percentages?.potentiallyTampered ?? (total > 0 ? Number(((tampered / total) * 100).toFixed(1)) : 0);

  // SVG Donut calculations
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const authStroke = total > 0 ? (pAuth / 100) * circumference : 0;
  const suspStroke = total > 0 ? (pSusp / 100) * circumference : 0;
  const tampStroke = total > 0 ? (pTamp / 100) * circumference : 0;

  // Offsets for cumulative segments (clockwise start from top -90deg)
  const authOffset = 0;
  const suspOffset = -authStroke;
  const tampOffset = -(authStroke + suspStroke);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-200">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Detection Breakdown
        </h2>
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <PieChart className="w-4 h-4" />
        </div>
      </div>

      {/* Donut Chart Visualizer */}
      <div className="relative flex items-center justify-center my-4">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Authentic (Green) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#059669"
            strokeWidth={strokeWidth}
            strokeDasharray={`${authStroke} ${circumference - authStroke}`}
            strokeDashoffset={authOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 hover:opacity-85 cursor-pointer"
          />

          {/* Suspicious (Orange) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#d97706"
            strokeWidth={strokeWidth}
            strokeDasharray={`${suspStroke} ${circumference - suspStroke}`}
            strokeDashoffset={suspOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 hover:opacity-85 cursor-pointer"
          />

          {/* Tampered (Red) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeDasharray={`${tampStroke} ${circumference - tampStroke}`}
            strokeDashoffset={tampOffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 hover:opacity-85 cursor-pointer"
          />
        </svg>

        {/* Center Label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            {total}
          </span>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1">
            DOCUMENTS
          </span>
        </div>
      </div>

      {/* Legend Breakdown List */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-slate-700 dark:text-slate-300">Likely Authentic</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {pAuth}% <span className="text-slate-400 dark:text-slate-500 font-normal">({authentic} docs)</span>
          </span>
        </div>

        <div className="flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-700 dark:text-slate-300">Suspicious</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {pSusp}% <span className="text-slate-400 dark:text-slate-500 font-normal">({suspicious} docs)</span>
          </span>
        </div>

        <div className="flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span className="text-slate-700 dark:text-slate-300">Potentially Tampered</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {pTamp}% <span className="text-slate-400 dark:text-slate-500 font-normal">({tampered} docs)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
