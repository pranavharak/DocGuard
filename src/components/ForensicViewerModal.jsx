import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, Download, AlertTriangle, Cpu, Layers } from 'lucide-react';

export default function ForensicViewerModal({ documentData, isOpen, onClose }) {
  if (!isOpen || !documentData) return null;

  const [activeTab, setActiveTab] = useState('tamperMap');

  const isHighRisk = documentData.riskPercent >= 70 || documentData.result === 'Potentially Tampered';
  const isMediumRisk = documentData.riskPercent >= 40 && documentData.riskPercent < 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isHighRisk ? 'bg-rose-600 shadow-rose-600/20' : isMediumRisk ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-600/20'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  FORENSIC INSPECTION
                </span>
                <span className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  isHighRisk 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                    : isMediumRisk 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {documentData.result} ({documentData.riskPercent}%)
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{documentData.name}</span>
                <span className="text-xs text-slate-400 font-normal">({documentData.type})</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('tamperMap')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'tamperMap'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Biometric Heatmap & Font Map</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>EXIF & Layer Metadata</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'tamperMap' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Document Preview Box with Visual Highlight */}
              <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">
                  <span>DOCUMENT SCAN PREVIEW (Page 1/1)</span>
                  <span className="text-rose-600 font-bold dark:text-rose-400">1 ANOMALY DETECTED</span>
                </div>

                {/* Mock Marksheet Content Visualizer */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-inner font-serif text-slate-800 dark:text-slate-200 space-y-4 relative">
                  <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-extrabold text-sm tracking-wider uppercase">BACHELOR OF ENGINEERING MARKSHEET</h4>
                    <p className="text-[10px] font-sans text-slate-500">AUTONOMOUS UNIVERSITY OF TECHNOLOGY</p>
                  </div>

                  <div className="grid grid-cols-2 text-xs font-sans gap-2 text-slate-600 dark:text-slate-400">
                    <div>Student Name: <span className="font-semibold text-slate-900 dark:text-white">Pranav Harak</span></div>
                    <div>Roll No: <span className="font-semibold text-slate-900 dark:text-white">BE2026-9041</span></div>
                    <div>Branch: <span className="font-semibold text-slate-900 dark:text-white">Computer Science</span></div>
                    <div>Year of Passing: <span className="font-semibold text-slate-900 dark:text-white">2026</span></div>
                  </div>

                  {/* Table mockup inside document */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded text-[11px] font-sans overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 font-bold grid grid-cols-3">
                      <span>Subject</span>
                      <span>Credits</span>
                      <span>Grade</span>
                    </div>
                    <div className="p-1.5 grid grid-cols-3 border-t border-slate-100 dark:border-slate-800">
                      <span>Deep Learning</span>
                      <span>4</span>
                      <span>O (Outstanding)</span>
                    </div>
                    <div className="p-1.5 grid grid-cols-3 border-t border-slate-100 dark:border-slate-800">
                      <span>Software Architecture</span>
                      <span>4</span>
                      <span>A+</span>
                    </div>
                  </div>

                  {/* TAMPERED HIGHLIGHT AREA */}
                  <div className={`p-2.5 rounded-lg border-2 relative transition-all duration-200 ${
                    isHighRisk 
                      ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/20' 
                      : 'border-emerald-500 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-sans font-bold">
                      <span>CUMULATIVE CGPA:</span>
                      <span className="font-mono text-base font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
                        9.85 / 10.0
                      </span>
                    </div>

                    {isHighRisk && (
                      <div className="absolute -top-3 -right-2 bg-rose-600 text-white text-[9px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                        FONT MISMATCH DETECTED
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-900 p-2 rounded-lg">
                  📍 Bounding Box: [x: 214, y: 480, w: 180, h: 42] · Font Delta: +14.2% kerning anomaly
                </div>
              </div>

              {/* Right Side Forensic Analysis Metrics */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                  FORENSIC VERDICT BREAKDOWN
                </h4>

                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Font Consistency Index</span>
                      <span className={isHighRisk ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                        {isHighRisk ? 'FAILED (34%)' : 'PASSED (98%)'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${isHighRisk ? 'bg-rose-600' : 'bg-emerald-500'}`} style={{ width: isHighRisk ? '34%' : '98%' }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Error Level Analysis (ELA)</span>
                      <span className={isHighRisk ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                        {isHighRisk ? 'HIGH DELTA (92%)' : 'NORMAL (12%)'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${isHighRisk ? 'bg-rose-600' : 'bg-emerald-500'}`} style={{ width: isHighRisk ? '92%' : '12%' }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Pixel Artifact Compression</span>
                      <span className={isHighRisk ? 'text-amber-600 font-mono' : 'text-emerald-600 font-mono'}>
                        {isHighRisk ? 'MODERATE (68%)' : 'CLEAN (05%)'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${isHighRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: isHighRisk ? '68%' : '5%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">Forensic Note:</p>
                  <p className="leading-relaxed">
                    Document exhibits localized font mismatch (Helvetica vs Arial Neue) in the CGPA numeric string and noticeable pixel noise around the boundary box indicating potential PDF text editing.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2">
                <p><span className="text-indigo-400">PDF Producer:</span> Adobe PDF Library 15.0</p>
                <p><span className="text-indigo-400">Creation Date:</span> 2026-09-12 14:22:01 UTC</p>
                <p><span className="text-indigo-400">Modification Date:</span> 2026-09-12 14:28:44 UTC (Modified after initial export)</p>
                <p><span className="text-indigo-400">SHA-256 Hash:</span> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                <p><span className="text-indigo-400">Tamper Confidence Score:</span> 0.824 (Threshold 0.45)</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Log ID: #FRNS-2026-90412
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => alert(`Exporting full forensic PDF verdict report for ${documentData.name}...`)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Verdict Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
