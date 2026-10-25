import React from 'react';
import { FileText, Eye, Filter } from 'lucide-react';

export default function RecentDocumentsTable({ documents, searchQuery, onSelectDocument }) {
  const formatResultLabel = (result) => {
    const lower = (result || '').toLowerCase().trim();
    if (lower.includes('tamper')) return 'Potentially Tampered';
    if (lower.includes('authentic') || lower.includes('clean') || lower.includes('pass')) return 'Likely Authentic';
    if (lower.includes('suspicious')) return 'Suspicious';
    if (lower.includes('pending')) return 'Pending';
    if (lower.includes('failed')) return 'Failed';
    return 'Inconclusive';
  };

  const filteredDocs = (documents || []).filter(doc => {
    const name = (doc.name || '').toLowerCase();
    const type = (doc.type || '').toLowerCase();
    const result = (doc.result || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();
    return name.includes(q) || type.includes(q) || result.includes(q);
  });

  const getResultBadgeStyle = (label) => {
    switch (label) {
      case 'Potentially Tampered':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50';
      case 'Likely Authentic':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
      case 'Suspicious':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
      case 'Pending':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50';
      case 'Failed':
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
      case 'Inconclusive':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  const getRiskBarStyle = (riskPercent, label) => {
    if (riskPercent === null || riskPercent === undefined) {
      return {
        barColor: 'bg-slate-300 dark:bg-slate-700',
        width: '0%',
        text: 'N/A',
        textColor: 'text-slate-400 dark:text-slate-500 font-mono'
      };
    }

    if (label === 'Likely Authentic') {
      return {
        barColor: 'bg-emerald-500',
        width: `${Math.max(8, Math.min(100, riskPercent))}%`,
        text: `${riskPercent}%`,
        textColor: 'text-emerald-600 dark:text-emerald-400 font-mono font-bold'
      };
    }
    if (label === 'Potentially Tampered' || riskPercent >= 55) {
      return {
        barColor: 'bg-rose-600',
        width: `${Math.max(10, Math.min(100, riskPercent))}%`,
        text: `${riskPercent}%`,
        textColor: 'text-rose-600 dark:text-rose-400 font-mono font-bold'
      };
    }
    if (label === 'Suspicious' || riskPercent >= 35) {
      return {
        barColor: 'bg-amber-500',
        width: `${Math.max(10, Math.min(100, riskPercent))}%`,
        text: `${riskPercent}%`,
        textColor: 'text-amber-600 dark:text-amber-400 font-mono font-bold'
      };
    }
    return {
      barColor: 'bg-slate-400',
      width: `${Math.max(5, Math.min(100, riskPercent))}%`,
      text: `${riskPercent}%`,
      textColor: 'text-slate-500 dark:text-slate-400 font-mono'
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-200">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Recent Documents
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time scan logs and verification pipelines
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            {filteredDocs.length} Latest
          </span>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              <th className="py-3 px-3">DOCUMENT NAME</th>
              <th className="py-3 px-3">DOCUMENT TYPE</th>
              <th className="py-3 px-3">DATE</th>
              <th className="py-3 px-3">RESULT</th>
              <th className="py-3 px-3 text-right sm:text-left">RISK SCORE</th>
              <th className="py-3 px-2 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No document logs matched your search.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const label = formatResultLabel(doc.result);
                const risk = getRiskBarStyle(doc.riskPercent, label);
                return (
                  <tr 
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors duration-150 group"
                  >
                    {/* Document Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {doc.name}
                        </span>
                      </div>
                    </td>

                    {/* Document Type */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {doc.type}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {doc.date}
                    </td>

                    {/* Result Pill Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getResultBadgeStyle(label)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {label}
                      </span>
                    </td>

                    {/* Risk Score Progress Bar */}
                    <td className="py-3.5 px-3 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${risk.barColor} transition-all duration-300 rounded-full`}
                            style={{ width: risk.width }}
                          ></div>
                        </div>
                        <span className={`text-xs font-mono min-w-[36px] text-right ${risk.textColor}`}>
                          {risk.text}
                        </span>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-2 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Forensic Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
