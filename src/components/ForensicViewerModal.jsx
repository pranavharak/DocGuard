import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, Download, AlertTriangle, Cpu, Layers } from 'lucide-react';

export default function ForensicViewerModal({ documentData, isOpen, onClose }) {
  if (!isOpen || !documentData) return null;

  const [activeTab, setActiveTab] = useState('tamperMap');
  const [isDownloading, setIsDownloading] = useState(false);

  const docName = documentData.name || documentData.filename || 'Document';
  const docType = documentData.type || documentData.fileType || 'Educational Marksheet';
  const riskPercent = documentData.riskPercent ?? documentData.riskScore ?? 0;
  const confidence = documentData.confidence ?? 0;
  const result = documentData.result || 'pending';
  const suspiciousRegions = documentData.suspiciousRegions || documentData.raw?.suspiciousRegions || [];
  const metadata = documentData.metadata || documentData.raw?.metadata || {};
  const explanation = documentData.explanation || documentData.raw?.explanation || 'No forensic anomalies recorded.';
  const docId = documentData.id || documentData.raw?._id || documentData._id;

  const isHighRisk = riskPercent >= 60 || result.toLowerCase().includes('tampered');
  const isMediumRisk = riskPercent >= 35 && riskPercent < 60;

  const handleDownload = async () => {
    if (!docId) {
      alert('Document ID is not available.');
      return;
    }
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('docguard_token');
      const res = await fetch(`http://localhost:5000/dashboard/document/${docId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Report generation failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocuGuard_Forensic_Report_${docName.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading report: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

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
                  {result} ({riskPercent}%)
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{docName}</span>
                <span className="text-xs text-slate-400 font-normal">({docType})</span>
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
            <span>Forensic Findings & Regions ({suspiciousRegions.length})</span>
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
            <span>Structural & EXIF Metadata</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'tamperMap' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Findings List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
                  <span>DETECTED SUSPICIOUS REGIONS</span>
                  <span className={suspiciousRegions.length > 0 ? "text-rose-600 font-bold dark:text-rose-400" : "text-emerald-600 font-bold"}>
                    {suspiciousRegions.length} FLAGGED
                  </span>
                </div>

                {suspiciousRegions.length > 0 ? (
                  suspiciousRegions.map((reg, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Finding 0{idx + 1}: {reg.label || `Region ${idx + 1}`}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded">
                          {reg.confidence}% intensity
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {reg.detail || reg.issue}
                      </p>
                      {reg.whyItMatters && (
                        <p className="text-amber-800 dark:text-amber-300/90 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg leading-relaxed font-sans text-[11px]">
                          <strong>Why it matters:</strong> {reg.whyItMatters}
                        </p>
                      )}
                      <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        📍 Bounding Box: [x: {reg.x}, y: {reg.y}, w: {reg.width}, h: {reg.height}]
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">No Irregularities Detected</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                      All visual patterns and pixel edge distributions conform to baseline authenticity standards.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side Summary & Confidence */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                  ASSESSMENT METRICS
                </h4>

                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Visual Anomaly Risk</span>
                      <span className={isHighRisk ? 'text-rose-600 font-mono' : isMediumRisk ? 'text-amber-600 font-mono' : 'text-emerald-600 font-mono'}>
                        {riskPercent}% / 100
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${isHighRisk ? 'bg-rose-600' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, riskPercent)}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">Model Reliability Confidence</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                        {confidence}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, confidence)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">Forensic Note:</p>
                  <p className="leading-relaxed font-sans">
                    {explanation}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2.5">
                <p><span className="text-indigo-400 font-bold">PDF Producer:</span> {metadata.pdfProducer || 'Not present in the file'}</p>
                <p><span className="text-indigo-400 font-bold">Creation Date:</span> {metadata.creationDate || 'Not present in the file'}</p>
                <p><span className="text-indigo-400 font-bold">Modification Date:</span> {metadata.modificationDate || 'Not present in the file'}</p>
                <p><span className="text-indigo-400 font-bold">PDF Version:</span> {metadata.pdfVersion || 'N/A'}</p>
                <p><span className="text-indigo-400 font-bold">Dimensions:</span> {metadata.dimensions || 'N/A'}</p>
                <p><span className="text-indigo-400 font-bold">SHA-256 Hash:</span> <span className="break-all text-[11px] text-slate-300">{metadata.sha256 || 'N/A'}</span></p>
                <p><span className="text-indigo-400 font-bold">Analysis Verdict:</span> {result} (Score: {riskPercent}/100)</p>
              </div>

              {metadata.observations && metadata.observations.length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl space-y-1 font-sans">
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px] uppercase block mb-1">
                    Observations:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-xs">
                    {metadata.observations.map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Log ID: #{docId ? `FRNS-${docId.toString().slice(-8).toUpperCase()}` : 'FRNS-ACTIVE'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generating Report...' : 'Export Verdict Report (.PDF)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
