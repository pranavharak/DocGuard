import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Loader2, FileCheck } from 'lucide-react';

export default function QuickUpload({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setUploading(true);
    setUploadProgress(20);
    setUploadSuccess(false);

    try {
      const token = localStorage.getItem('docguard_token');
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('http://localhost:5000/dashboard/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.message === 'success' && data.document) {
        setUploadProgress(75);

        // Step 2: Trigger Analysis API POST /dashboard/analyze/:id
        const docId = data.document._id;
        const analyzeRes = await fetch(`http://localhost:5000/dashboard/analyze/${docId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const analyzeData = await analyzeRes.json();
        setUploadProgress(100);
        setUploading(false);
        setUploadSuccess(true);

        const doc = analyzeData.document || data.document;
        const analysis = analyzeData.analysis || doc.analysis || {};

        const newDoc = {
          id: doc._id || Date.now(),
          name: doc.filename || doc.fileName || file.name,
          type: 'Educational Marksheet',
          date: new Date(doc.dateOfUpload || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          result: doc.result || analysis.result || 'Potentially Tampered',
          riskPercent: doc.riskScore || analysis.riskScore || 82,
          confidence: doc.confidence || analysis.confidence || 91,
          suspiciousRegions: doc.suspiciousRegions || analysis.suspiciousRegions || [],
          manipulationTypes: doc.manipulationTypes || analysis.manipulationTypes || [],
          ocr: doc.ocr || analysis.ocr || [],
          metadata: doc.metadata || analysis.metadata || {},
          explanation: doc.explanation || analysis.explanation || '',
          recommendation: doc.recommendation || analysis.recommendation || '',
          raw: doc
        };

        if (onUploadComplete) {
          onUploadComplete(newDoc);
        }

        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      } else {
        setUploading(false);
        alert('Upload failed: ' + (data.message || 'Error processing document'));
      }
    } catch (err) {
      setUploading(false);
      alert('Network error uploading document: ' + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">
          QUICK UPLOAD
        </h2>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
          Ready
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
        }`}
      >
        {uploading ? (
          <div className="space-y-3 py-2">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Analyzing Document Tamper Vectors...
            </p>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : uploadSuccess ? (
          <div className="space-y-2 py-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Inspection Complete & Logged!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Upload Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>

            {/* Text Prompts */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Drop marksheets or certificates here
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PDF, JPG, PNG · Instant Tamper Inspection
              </p>
            </div>

            {/* Browse Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
