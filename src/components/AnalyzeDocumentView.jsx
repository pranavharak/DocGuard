import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  FileText, 
  UploadCloud, 
  File, 
  CheckCircle2, 
  RotateCw, 
  Circle, 
  Trash2, 
  Lock, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { gsap } from 'gsap';

export default function AnalyzeDocumentView({ onStartAnalysis }) {
  const [selectedCategory, setSelectedCategory] = useState('educational'); // 'educational' | 'other'
  const [selectedType, setSelectedType] = useState('BE/Degree Marksheet');
  const [attachedFile, setAttachedFile] = useState({
    name: 'BE_Marksheet.pdf',
    size: '2.4 MB',
    type: 'Educational Marksheet',
    status: 'Ready for Analysis'
  });
  const [analysisProgress, setAnalysisProgress] = useState(78);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.gsap-step-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }
      );
    }
  }, []);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'educational') {
      setSelectedType('BE/Degree Marksheet');
    } else {
      setSelectedType('Invoice');
    }
  };

  const [rawFile, setRawFile] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setRawFile(file);
      setAttachedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: selectedCategory === 'educational' ? selectedType : 'Other Document',
        status: 'Ready for Analysis'
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawFile(file);
      setAttachedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: selectedCategory === 'educational' ? selectedType : 'Other Document',
        status: 'Ready for Analysis'
      });
    }
  };

  const handleStartScan = async () => {
    setIsAnalyzing(true);
    let p = 0;

    const interval = setInterval(() => {
      p += 10;
      if (p < 75) {
        setAnalysisProgress(p);
      }
    }, 150);

    try {
      const token = localStorage.getItem('docguard_token');
      const formData = new FormData();
      
      if (rawFile) {
        formData.append('document', rawFile);
      } else {
        const blob = new Blob(["DocuGuard Test Content"], { type: "application/pdf" });
        formData.append('document', blob, attachedFile ? attachedFile.name : 'BE_Marksheet.pdf');
      }

      // Step 1: Upload document
      const uploadRes = await fetch('http://localhost:5000/dashboard/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.document) {
        clearInterval(interval);
        setIsAnalyzing(false);
        alert('Upload Error: ' + (uploadData.message || 'Failed to upload document'));
        return;
      }

      setAnalysisProgress(80);

      // Step 2: Trigger Analysis API POST /dashboard/analyze/:id
      const docId = uploadData.document._id;
      const analyzeRes = await fetch(`http://localhost:5000/dashboard/analyze/${docId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const analyzeData = await analyzeRes.json();
      clearInterval(interval);
      setAnalysisProgress(100);

      setTimeout(() => {
        setIsAnalyzing(false);
        if (analyzeRes.ok && analyzeData.document) {
          const doc = analyzeData.document;
          const analysis = analyzeData.analysis || doc.analysis || {};
          
          if (onStartAnalysis) {
            onStartAnalysis({
              id: doc._id || Date.now(),
              name: doc.filename || doc.fileName || 'Document.pdf',
              type: selectedType,
              date: new Date(doc.dateOfUpload || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              result: doc.result || analysis.result || 'Potentially tampered',
              riskPercent: doc.riskScore || analysis.riskScore || 82,
              confidence: doc.confidence || analysis.confidence || 91,
              suspiciousRegions: doc.suspiciousRegions || analysis.suspiciousRegions || [],
              manipulationTypes: doc.manipulationTypes || analysis.manipulationTypes || [],
              ocr: doc.ocr || analysis.ocr || [],
              metadata: doc.metadata || analysis.metadata || {},
              explanation: doc.explanation || analysis.explanation || '',
              recommendation: doc.recommendation || analysis.recommendation || '',
              raw: doc
            });
          }
        } else {
          alert('Analysis Error: ' + (analyzeData.message || 'Failed to process document analysis'));
        }
      }, 400);

    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      alert('Network Error uploading/analyzing document: ' + err.message);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 animate-fadeIn pb-12">
      {/* Top Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
            AI DOCUMENT VERIFICATION
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Analyze Document
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Upload an educational or official document to automatically detect alterations, suspicious font changes, and tampering via AI-assisted assessment.
        </p>
      </div>

      {/* Main Grid: Left 8 cols for selection & upload, Right 4 cols for Analysis Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Steps 1, 2, 3) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: SELECT DOCUMENT CATEGORY */}
          <div className="gsap-step-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm flex items-center justify-center">
                  1
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-wide uppercase font-mono">
                  SELECT DOCUMENT CATEGORY
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Select category to optimize verification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category 1: Educational Document */}
              <button
                type="button"
                onClick={() => handleSelectCategory('educational')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  selectedCategory === 'educational'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md shadow-indigo-600/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedCategory === 'educational'
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    selectedCategory === 'educational'
                      ? 'bg-indigo-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedCategory === 'educational' && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Educational Document
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Transcripts, marksheet tables, certificates, and academic seals.
                  </p>
                </div>
              </button>

              {/* Category 2: Other Document */}
              <button
                type="button"
                onClick={() => handleSelectCategory('other')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  selectedCategory === 'other'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md shadow-indigo-600/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedCategory === 'other'
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    selectedCategory === 'other'
                      ? 'bg-indigo-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedCategory === 'other' && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Other Document
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Commercial invoices, receipts, legal contracts, and official notices.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT DOCUMENT TYPE */}
          <div className="gsap-step-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm flex items-center justify-center">
                  2
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-wide uppercase font-mono">
                  SELECT DOCUMENT TYPE
                </h3>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                Educational Presets
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Educational Options:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '10th Marksheet',
                    'Diploma Marksheet',
                    'BE/Degree Marksheet',
                    'Academic Certificate',
                    'Transcript'
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        selectedType === type
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type === 'BE/Degree Marksheet' ? `• ${type}` : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Other Options:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Invoice', 'Receipt', 'Contract', 'Certificate', 'Other'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        selectedType === type
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: UPLOAD DOCUMENT */}
          <div className="gsap-step-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm flex items-center justify-center">
                  3
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-wide uppercase font-mono">
                  UPLOAD DOCUMENT
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Lock className="w-3 h-3" />
                Secure & Confidential
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 transition-colors relative"
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                Upload your document
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop or <span className="text-indigo-600 dark:text-indigo-400 font-bold underline">browse your files</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                PDF, JPG and PNG supported (Max 20MB)
              </p>
            </div>

            {/* Attached File Preview Bar */}
            {attachedFile && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* File Icon */}
                  <div className="w-10 h-12 bg-rose-500 rounded-lg flex flex-col items-center justify-center text-white shrink-0 shadow-sm relative overflow-hidden">
                    <File className="w-5 h-5" />
                    <span className="text-[9px] font-extrabold font-mono uppercase mt-0.5">PDF</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                        {attachedFile.name}
                      </h5>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {attachedFile.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {attachedFile.size} • {attachedFile.type}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Analysis Steps & Progress Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="gsap-step-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-colors space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Analysis Steps
                </h3>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                In Progress
              </span>
            </div>

            {/* Analysis Progress Box */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Analysis Progress
                </span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {analysisProgress}%
                </span>
              </div>
              
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Scanning document sections and comparing formatting patterns...
              </p>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-4 pt-2">
              
              {/* Step 1 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Document uploaded</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Completed</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Document uploaded successfully</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Document validated</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Completed</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Structure and format checked</p>
                </div>
              </div>

              {/* Step 3 (In progress) */}
              <div className="flex items-start gap-3 text-xs bg-indigo-50/50 dark:bg-indigo-950/30 -mx-2 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-spin">
                  <RotateCw className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">Detecting possible tampering</span>
                    <span className="text-[10px] font-black text-white bg-indigo-600 px-1.5 py-0.2 rounded font-mono">78%</span>
                  </div>
                  <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80">Checking for digital alterations and modified image areas</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 text-xs opacity-70">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Circle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Checking document text</span>
                    <span className="text-[10px] font-medium text-slate-400">Queued</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Verifying font consistency and spacing</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3 text-xs opacity-70">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Circle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Checking document properties</span>
                    <span className="text-[10px] font-medium text-slate-400">Queued</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Examining file history and creation dates</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start gap-3 text-xs opacity-70">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Circle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Calculating risk</span>
                    <span className="text-[10px] font-medium text-slate-400">Queued</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Evaluating anomaly score and confidence rating</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex items-start gap-3 text-xs opacity-70">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Circle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Preparing report</span>
                    <span className="text-[10px] font-medium text-slate-400">Queued</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Compiling final authenticity audit breakdown</p>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={handleStartScan}
                disabled={isAnalyzing}
                className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                <span>{isAnalyzing ? 'Analyzing Document...' : 'Analyze Document'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <File className="w-3.5 h-3.5" />
                <span>Upload Another</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
