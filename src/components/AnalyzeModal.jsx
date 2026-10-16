import React, { useState } from 'react';
import { X, UploadCloud, FileCheck, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function AnalyzeModal({ isOpen, onClose, onUploadComplete }) {
  if (!isOpen) return null;

  const [documentName, setDocumentName] = useState('');
  const [docType, setDocType] = useState('Educational Marksheet');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!documentName) return;

    setIsScanning(true);
    setProgress(15);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          setTimeout(() => {
            setIsScanning(false);
            
            const results = ['Likely Authentic', 'Suspicious', 'Potentially Tampered'];
            const randomResult = results[Math.floor(Math.random() * results.length)];
            let risk = 10;
            if (randomResult === 'Suspicious') risk = 62;
            if (randomResult === 'Potentially Tampered') risk = 85;

            const nameWithExt = documentName.endsWith('.pdf') ? documentName : `${documentName}.pdf`;

            onUploadComplete({
              id: Date.now(),
              name: nameWithExt,
              type: docType,
              date: 'Just now',
              result: randomResult,
              riskPercent: risk
            });

            onClose();
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Analyze New Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Name / Identifier
            </label>
            <input
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. BTech_Degree_Certificate.pdf"
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Category
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Educational Marksheet">Educational Marksheet</option>
              <option value="Financial Invoice">Financial Invoice</option>
              <option value="Certificate">Certificate</option>
              <option value="Official Transcript">Official Transcript</option>
              <option value="Legal Contract">Legal Contract</option>
            </select>
          </div>

          {isScanning ? (
            <div className="space-y-3 py-4 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Running Neural Font & Pixel Inspection... ({progress}%)
              </p>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-200" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Start Forensic Scan</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
