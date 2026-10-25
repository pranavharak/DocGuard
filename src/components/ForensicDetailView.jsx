import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  ArrowLeft, 
  Maximize2, 
  FileText, 
  Eye, 
  EyeOff,
  Info,
  Zap,
  Layers
} from 'lucide-react';
import { gsap } from 'gsap';

export default function ForensicDetailView({ documentData, onBack }) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'ocr' | 'details'
  const [activeFindingId, setActiveFindingId] = useState(1);
  const [isLaserScanning, setIsLaserScanning] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      setDownloadError('');
      const token = localStorage.getItem('docguard_token');
      const docId = documentData?.id || documentData?.raw?._id || documentData?._id;
      if (!docId) {
        throw new Error('Document ID is required to generate the report.');
      }
      const res = await fetch(`http://localhost:5000/dashboard/document/${docId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || `Failed to generate forensic report (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (docName || 'Document').replace(/[^a-zA-Z0-9._-]/g, '_');
      a.download = `DocuGuard_Forensic_Report_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message);
      alert('Could not download report: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const laserRef = useRef(null);
  const riskPathRef = useRef(null);
  const confidencePathRef = useRef(null);
  const documentSheetRef = useRef(null);
  const imgRef = useRef(null);

  // Extract document fields
  const docName = documentData?.name || documentData?.filename || documentData?.raw?.filename || 'Document.pdf';
  const docType = documentData?.type || documentData?.fileType || documentData?.raw?.fileType || 'Document Inspection';
  
  // Resolve accessible file URL
  const fileUrl = documentData?.fileUrl || documentData?.raw?.fileUrl || (
    documentData?.raw?.filePath ? `http://localhost:5000/uploads/${documentData.raw.filePath.split(/[/\\]/).pop()}` : null
  );

  const isPdf = docName.toLowerCase().endsWith('.pdf') || (documentData?.fileType || '').includes('pdf');

  // Dynamic analysis fields — all nullable for un-analyzed documents
  const result = documentData?.result || documentData?.raw?.result || 'pending';
  const riskScore = documentData?.riskPercent ?? documentData?.riskScore ?? documentData?.raw?.riskScore ?? null;
  const confidence = documentData?.confidence ?? documentData?.raw?.confidence ?? null;
  const suspiciousRegions = documentData?.suspiciousRegions || documentData?.raw?.analysis?.suspiciousRegions || documentData?.raw?.suspiciousRegions || [];
  const ocrList = documentData?.ocr || documentData?.raw?.analysis?.ocr || documentData?.raw?.ocr || [];
  const metadata = documentData?.metadata || documentData?.raw?.analysis?.metadata || documentData?.raw?.metadata || {};
  const explanation = documentData?.explanation || documentData?.raw?.analysis?.explanation || documentData?.raw?.explanation || '';
  const recommendation = documentData?.recommendation || documentData?.raw?.analysis?.recommendation || documentData?.raw?.recommendation || '';
  const pageResults = documentData?.pageResults || documentData?.raw?.pageResults || [];

  // True when AI has not been run yet or is not configured
  const isNotAnalyzed = result === 'pending' || result === 'not_configured' || result === null || result === undefined;

  // Page dimension resolution for percentage coordinate mapping
  const docWidth = pageResults[0]?.width || (metadata?.dimensions ? parseInt(metadata.dimensions.split('x')[0]) : 1000);
  const docHeight = pageResults[0]?.height || (metadata?.dimensions ? parseInt(metadata.dimensions.split('x')[1]) : 1400);

  // Dynamic result badge color & styling
  const getResultStyle = (res) => {
    const lower = (res || '').toLowerCase();
    if (lower.includes('authentic') || lower.includes('clean') || lower.includes('pass')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60',
        text: 'text-emerald-600 dark:text-emerald-400',
        title: 'LIKELY AUTHENTIC',
        badge: 'Low Risk',
        badgeBg: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
      };
    }
    if (lower.includes('suspicious')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
        text: 'text-amber-600 dark:text-amber-400',
        title: 'SUSPICIOUS DOCUMENT',
        badge: 'Medium Risk',
        badgeBg: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
      };
    }
    if (lower.includes('inconclusive')) {
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-300',
        title: 'INCONCLUSIVE ANALYSIS',
        badge: 'Review Needed',
        badgeBg: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      };
    }
    // Not yet analyzed or AI not configured
    if (lower.includes('pending') || lower.includes('not_configured') || lower === '') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60',
        text: 'text-blue-600 dark:text-blue-400',
        title: 'ANALYSIS PENDING',
        badge: 'Not Analyzed',
        badgeBg: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
      };
    }
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
      text: 'text-rose-600 dark:text-rose-400',
      title: 'POTENTIALLY TAMPERED',
      badge: 'High Risk Detected',
      badgeBg: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 border-rose-200 dark:border-rose-800'
    };
  };

  const style = getResultStyle(result);

  // GSAP Laser Scan Beam Effect
  useEffect(() => {
    if (laserRef.current && isLaserScanning) {
      const tween = gsap.to(laserRef.current, {
        top: '92%',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
      return () => tween.kill();
    }
  }, [isLaserScanning]);

  // GSAP Gauges Fill Entrance Animation
  useEffect(() => {
    if (riskPathRef.current) {
      gsap.fromTo(
        riskPathRef.current,
        { strokeDasharray: '0, 100' },
        { strokeDasharray: `${riskScore}, 100`, duration: 1.5, ease: 'power2.out' }
      );
    }
    if (confidencePathRef.current) {
      gsap.fromTo(
        confidencePathRef.current,
        { strokeDasharray: '0, 100' },
        { strokeDasharray: `${confidence}, 100`, duration: 1.5, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, [riskScore, confidence]);

  // GSAP Finding Card Pulse on Selection
  useEffect(() => {
    if (documentSheetRef.current) {
      const activeEl = documentSheetRef.current.querySelector(`.gsap-finding-${activeFindingId}`);
      if (activeEl) {
        gsap.fromTo(
          activeEl,
          { scale: 0.96, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [activeFindingId]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner: Analysis Result & Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm transition-colors space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Result Badge Card */}
          <div className={`lg:col-span-4 ${style.bg} border rounded-2xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-10 rounded-full blur-xl"></div>
            <span className={`text-[10px] uppercase font-mono font-extrabold tracking-widest ${style.text}`}>
              ANALYSIS RESULT
            </span>
            <h2 className={`text-xl sm:text-2xl font-black ${style.text} tracking-tight mt-1`}>
              {style.title}
            </h2>
          </div>

          {/* Document File Info */}
          <div className="lg:col-span-5 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight break-all">
                {docName}
              </h2>
              <span className={`text-xs font-bold ${style.badgeBg} px-2.5 py-0.5 rounded-full border`}>
                {style.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {docType} • Analyzed on {documentData?.date || 'Today'}
            </p>
          </div>

          {/* Gauges (Risk & Confidence) */}
          <div className="lg:col-span-3 flex flex-wrap items-center justify-start lg:justify-end gap-3 sm:gap-4">
            
            {/* Risk Gauge */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {riskScore !== null && (
                    <path
                      ref={riskPathRef}
                      className={riskScore > 50 ? "text-rose-500" : riskScore > 25 ? "text-amber-500" : "text-emerald-500"}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <span className={`absolute text-[10px] sm:text-[11px] font-black font-mono ${
                  riskScore === null ? 'text-slate-400' :
                  riskScore > 50 ? 'text-rose-600 dark:text-rose-400' :
                  riskScore > 25 ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {riskScore !== null ? `${riskScore}%` : '—'}
                </span>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-slate-400">RISK SCORE</p>
                <p className={`text-xs font-extrabold ${
                  riskScore === null ? 'text-slate-400' :
                  riskScore > 50 ? 'text-rose-600 dark:text-rose-400' :
                  riskScore > 25 ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {riskScore === null ? 'N/A' : riskScore > 60 ? 'High Risk' : riskScore > 25 ? 'Medium Risk' : 'Low Risk'}
                </p>
              </div>
            </div>

            {/* Confidence Gauge */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {confidence !== null && (
                    <path
                      ref={confidencePathRef}
                      className="text-indigo-600 dark:text-indigo-400"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <span className={`absolute text-[10px] sm:text-[11px] font-black font-mono ${confidence === null ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {confidence !== null ? `${confidence}%` : '—'}
                </span>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-slate-400">CONFIDENCE</p>
                <p className={`text-xs font-extrabold ${confidence === null ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {confidence !== null ? `${confidence}% Reliability` : 'N/A'}
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Explanation Callout Bar */}
        <div className={`p-4 text-xs rounded-2xl border space-y-1 ${style.bg}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-extrabold ${style.text}`}>Assessment Summary</span>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">AI FORENSIC ASSESSMENT</span>
          </div>
          {isNotAnalyzed ? (
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed font-sans">
              AI forensic analysis has not been performed on this document yet. Click <strong>Run Analysis</strong> to start, or configure the Python AI microservice and set <code>USE_MOCK_AI=false</code>.
            </p>
          ) : (
            <p className={`${style.text} leading-relaxed font-sans`}>
              {explanation}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Layout (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dynamic Uploaded Document Viewer Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Zoom, Overlay & Laser Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-medium shadow-sm transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
              >
                -
              </button>
              <span className="font-mono font-bold w-10 text-center text-slate-900 dark:text-white">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 ml-1 inline-flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Fit</span>
              </button>
            </div>

            {/* Controls: Region Overlays & Laser Beam */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOverlays(!showOverlays)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all ${
                  showOverlays 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Region Overlays: {showOverlays ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLaserScanning(!isLaserScanning)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all ${
                  isLaserScanning 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isLaserScanning ? 'animate-pulse text-amber-300' : ''}`} />
                <span>Laser FX: {isLaserScanning ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC DOCUMENT CANVAS CONTAINER */}
          <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-6 flex flex-col items-center justify-center min-h-[550px] sm:min-h-[650px] overflow-x-auto relative shadow-inner">
            
            {/* Scrollable Document Display Wrapper */}
            <div className="w-full overflow-x-auto flex justify-center py-2 relative">
              
              {/* The Actual Document Viewport Sheet */}
              <div 
                ref={documentSheetRef}
                className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl min-w-[310px] sm:min-w-[600px] max-w-3xl w-full relative transition-all duration-200 overflow-hidden min-h-[550px] flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                
                {/* CYBERNETIC LASER SCANNING BEAM SPECIAL EFFECT */}
                {isLaserScanning && (
                  <div
                    ref={laserRef}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_4px_rgba(99,102,241,0.8)] z-30 pointer-events-none"
                    style={{ top: '5%' }}
                  >
                    <div className="absolute right-4 -top-2 bg-indigo-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded shadow">
                      AI SCANNING
                    </div>
                  </div>
                )}

                {/* ACTUAL UPLOADED DOCUMENT RENDERING */}
                {fileUrl ? (
                  isPdf ? (
                    <div className="w-full h-[650px] relative">
                      <iframe
                        src={`${fileUrl}#toolbar=0&navpanes=0`}
                        title={docName}
                        className="w-full h-full border-0 rounded-2xl"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-auto flex items-center justify-center p-2">
                      <img
                        ref={imgRef}
                        src={fileUrl}
                        alt={docName}
                        className="max-w-full h-auto object-contain rounded-xl shadow-sm"
                      />
                    </div>
                  )
                ) : (
                  /* Clean Fallback Document Card when file URL is not available */
                  <div className="p-8 text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{docName}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{docType} • {metadata.dimensions || 'Standard Page'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono text-left space-y-1 text-slate-700">
                      <p>FILE: {docName}</p>
                      <p>SHA-256: {metadata.sha256?.substring(0, 24) || 'e3b0c442...'}...</p>
                      <p>PAGES: {metadata.pageCount || 1}</p>
                    </div>
                  </div>
                )}

                {/* ACCURATE PERCENTAGE-BASED BOUNDING BOX REGION OVERLAYS */}
                {showOverlays && suspiciousRegions.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {suspiciousRegions.map((region, idx) => {
                      const fId = region.id || idx + 1;
                      const isSelected = activeFindingId === fId;
                      const isHighRisk = (region.confidence || 80) >= 80 || (region.issue && region.issue.toLowerCase().includes('modification'));
                      const borderColor = isHighRisk ? 'border-rose-500 bg-rose-500/15' : 'border-amber-500 bg-amber-500/15';
                      const badgeBg = isHighRisk ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-900';
                      const ringColor = isHighRisk ? 'ring-rose-400/50' : 'ring-amber-400/50';

                      // Percentage relative positioning for resolution independence
                      const leftPct = ((region.x / docWidth) * 100).toFixed(2);
                      const topPct = ((region.y / docHeight) * 100).toFixed(2);
                      const widthPct = ((region.width / docWidth) * 100).toFixed(2);
                      const heightPct = ((region.height / docHeight) * 100).toFixed(2);

                      return (
                        <div
                          key={fId}
                          onClick={() => setActiveFindingId(fId)}
                          className={`gsap-finding-${fId} absolute border-2 ${borderColor} rounded-lg cursor-pointer pointer-events-auto transition-all ${
                            isSelected ? `ring-4 ${ringColor} shadow-xl z-30` : ''
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`
                          }}
                        >
                          <div className={`absolute -top-3.5 left-2 ${badgeBg} text-[8px] sm:text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded shadow whitespace-nowrap z-40`}>
                            Finding 0{fId}: {region.label || `Region ${fId}`} ({region.confidence}% Conf)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Color Key Legend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold shadow-sm transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
              <span className="text-slate-700 dark:text-slate-300">Red = High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
              <span className="text-slate-700 dark:text-slate-300">Yellow = Review Required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-slate-700 dark:text-slate-300">Green = Likely Authentic</span>
            </div>
          </div>

        </div>

        {/* Right Column: Inspection Findings & Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm transition-colors space-y-5">
            
            {/* Sidebar Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-[11px] sm:text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('findings')}
                className={`py-2 px-1 rounded-xl transition-all inline-flex items-center justify-center gap-1 ${
                  activeTab === 'findings'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">Findings</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-mono shrink-0">
                  {suspiciousRegions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`py-2 px-1 rounded-xl transition-all inline-flex items-center justify-center gap-1 ${
                  activeTab === 'ocr'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">OCR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 rounded-xl transition-all inline-flex items-center justify-center gap-1 ${
                  activeTab === 'details'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Details</span>
              </button>
            </div>

            {/* Tab 1: Detected Findings */}
            {activeTab === 'findings' && (
              <div className="space-y-4">
                
                <div className="flex flex-wrap items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2 gap-1">
                  <span className="font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                    IDENTIFIED IRREGULARITIES
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      {suspiciousRegions.length} Finding{suspiciousRegions.length === 1 ? '' : 's'} Flagged
                    </span>
                  </div>
                </div>

                {suspiciousRegions.length > 0 ? (
                  suspiciousRegions.map((region, idx) => {
                    const fId = region.id || idx + 1;
                    const isSelected = activeFindingId === fId;
                    const isHighRisk = (region.confidence || 80) >= 70;

                    return (
                      <div 
                        key={fId}
                        onClick={() => setActiveFindingId(fId)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                          isSelected 
                            ? isHighRisk
                              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 shadow-md' 
                              : 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl ${isHighRisk ? 'bg-rose-600' : 'bg-amber-500'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                              {isHighRisk ? '✏️' : '📋'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                                Finding 0{fId}: {region.label || `Region ${fId}`}
                              </h4>
                              <span className={`text-[11px] font-extrabold ${isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'} block truncate`}>
                                {region.issue || 'Visual anomaly detected'}
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-black ${isHighRisk ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950' : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950'} font-mono px-2 py-0.5 rounded-md shrink-0 border border-current/20`}>
                            {region.confidence}% intensity
                          </span>
                        </div>

                        {/* What was detected */}
                        <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">What we detected:</p>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            {region.detail || region.issue}
                          </p>
                        </div>

                        {/* Why it matters */}
                        {region.whyItMatters && (
                          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs space-y-1">
                            <p className="font-bold text-amber-900 dark:text-amber-300">Why it matters:</p>
                            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed font-sans">
                              {region.whyItMatters}
                            </p>
                          </div>
                        )}

                        {/* Evidence */}
                        {region.evidence && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Evidence: </span>
                            {region.evidence}
                          </div>
                        )}

                        {/* Recommended action */}
                        {region.recommendedAction && (
                          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 p-2 rounded-lg font-sans">
                            <span className="font-bold">Recommended Action: </span>
                            {region.recommendedAction}
                          </div>
                        )}

                        {/* Bounding Box Coordinates */}
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span>📍 Coordinates: [x: {region.x}, y: {region.y}, w: {region.width}, h: {region.height}]</span>
                          <span>Page {region.page || 1}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No Irregularities Detected</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      This document conformed to baseline visual texture, font alignment, and pixel edge sharpness parameters.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* Tab 2: OCR Extracted Text */}
            {activeTab === 'ocr' && (
              <div className="space-y-3 text-xs">
                {/* Engine Banner */}
                <div className="bg-slate-100 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">OCR ENGINE</span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {ocrList[0]?.engine || 'RapidOCR (PP-OCRv4 ONNX)'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                    {ocrList.length} items extracted
                  </span>
                </div>

                {/* Extracted Text List */}
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl space-y-2 font-mono max-h-[380px] overflow-y-auto">
                  {ocrList.length > 0 ? (
                    ocrList.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-lg border transition-colors ${
                          item.suspicious 
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' 
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-200 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span className="text-indigo-400 font-bold truncate">
                            {item.field || `Line ${idx + 1}`}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded ${
                            item.confidence >= 80 ? 'text-emerald-400 bg-emerald-950/60' :
                            item.confidence >= 60 ? 'text-amber-400 bg-amber-950/60' :
                            'text-rose-400 bg-rose-950/60'
                          }`}>
                            {item.confidence}% conf
                          </span>
                        </div>
                        <p className="font-sans text-xs break-words text-slate-100">
                          {item.value}
                        </p>
                        {item.suspicious && (
                          <span className="text-[9px] font-mono uppercase font-bold text-rose-400 mt-1 block">
                            ⚠️ Low OCR Confidence / Potential Alteration Area
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 leading-relaxed font-sans text-xs p-2">
                      No text elements extracted for this page. The document may contain low contrast, handwriting, or purely graphic elements.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Analysis Details & Metadata */}
            {activeTab === 'details' && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 max-h-[420px] overflow-y-auto pr-1">
                {/* Section A: Technical File Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800 font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    FILE SPECIFICATIONS
                  </span>
                  <p><span className="font-bold text-slate-900 dark:text-white">Filename:</span> {metadata.filename || docName}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Format:</span> {metadata.fileType || docType}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">File Size:</span> {metadata.fileSize || 'N/A'}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Dimensions:</span> {metadata.dimensions || `${docWidth}x${docHeight}`}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Color Mode:</span> {metadata.colorMode || 'RGB'}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">SHA-256 Hash:</span> <span className="text-[10px] break-all text-slate-500 dark:text-slate-400">{metadata.sha256 || 'N/A'}</span></p>
                </div>

                {/* Section B: Embedded Metadata */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800 font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    EMBEDDED DOCUMENT METADATA
                  </span>
                  <p><span className="font-bold text-slate-900 dark:text-white">PDF Producer:</span> {metadata.pdfProducer || 'Not present in the file'}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Creation Date:</span> {metadata.creationDate || 'Not present in the file'}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Modification Date:</span> {metadata.modificationDate || 'Not present in the file'}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">PDF Version:</span> {metadata.pdfVersion || 'N/A'}</p>
                  {metadata.title && metadata.title !== 'Not present in the file' && (
                    <p><span className="font-bold text-slate-900 dark:text-white">Title:</span> {metadata.title}</p>
                  )}
                  {metadata.author && metadata.author !== 'Not present in the file' && (
                    <p><span className="font-bold text-slate-900 dark:text-white">Author:</span> {metadata.author}</p>
                  )}
                </div>

                {/* Section C: Observations */}
                {metadata.observations && metadata.observations.length > 0 && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl space-y-2 border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono block">
                      FORENSIC OBSERVATIONS
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside font-sans text-slate-700 dark:text-slate-300">
                      {metadata.observations.map((obs, idx) => (
                        <li key={idx} className="leading-relaxed">{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section D: Recommendation */}
                {recommendation && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                      RECOMMENDATION
                    </span>
                    <p className="font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generating Forensic Report...' : 'Download Forensic Report (.PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
