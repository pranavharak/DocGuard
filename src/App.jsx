import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricsOverview from './components/MetricsOverview';
import CriticalAlertBanner from './components/CriticalAlertBanner';
import RecentDocumentsTable from './components/RecentDocumentsTable';
import DetectionBreakdown from './components/DetectionBreakdown';
import QuickUpload from './components/QuickUpload';
import ForensicViewerModal from './components/ForensicViewerModal';
import AnalyzeModal from './components/AnalyzeModal';
import AnalyzeDocumentView from './components/AnalyzeDocumentView';
import ForensicDetailView from './components/ForensicDetailView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';

const API_BASE_URL = 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('docguard_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('docguard_user') || 'Researcher');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('docguard_theme') === 'dark');
  const [selectedDocForForensic, setSelectedDocForForensic] = useState(null);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Documents and dynamically calculated statistics from backend
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalAnalyzed: 0,
    likelyAuthentic: 0,
    suspicious: 0,
    potentiallyTampered: 0,
    unclassified: 0,
    percentages: {
      likelyAuthentic: 0,
      suspicious: 0,
      potentiallyTampered: 0
    }
  });
  const [criticalAlert, setCriticalAlert] = useState(null);

  // Sync dark mode class on <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docguard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docguard_theme', 'light');
    }
  }, [isDarkMode]);

  // Fetch Documents and Statistics dynamically from backend
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoadingDocs(true);
    setIsLoadingStats(true);
    setDashboardError(null);

    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (docsData.message === 'success' && Array.isArray(docsData.documents)) {
          const formattedDocs = docsData.documents.map((doc, idx) => {
            const analysis = doc.analysis || {};
            const rawResult = doc.result || analysis.result || 'pending';
            const rawRisk = doc.riskScore ?? analysis.riskScore ?? null;
            const rawConf = doc.confidence ?? analysis.confidence ?? null;
            return {
              id: doc._id || idx + 1,
              name: doc.filename || doc.fileName || `Document_${idx + 1}.pdf`,
              type: doc.fileType || 'Document',
              date: new Date(doc.dateOfUpload || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              result: rawResult,
              riskPercent: rawRisk,
              confidence: rawConf,
              fileUrl: doc.fileUrl || null,
              suspiciousRegions: doc.suspiciousRegions || analysis.suspiciousRegions || [],
              manipulationTypes: doc.manipulationTypes || analysis.manipulationTypes || [],
              ocr: doc.ocr || analysis.ocr || [],
              metadata: doc.metadata || analysis.metadata || {},
              explanation: doc.explanation || analysis.explanation || '',
              recommendation: doc.recommendation || analysis.recommendation || '',
              raw: doc
            };
          });
          setDocuments(formattedDocs);
        }
      } else {
        const errJson = await docsRes.json().catch(() => null);
        setDashboardError(errJson?.message || 'Error fetching documents');
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.message === 'success' && statsData.stats) {
          setStats(statsData.stats);
          setCriticalAlert(statsData.criticalAlert || null);
        }
      } else {
        const errJson = await statsRes.json().catch(() => null);
        setDashboardError(errJson?.message || 'Error fetching dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardError('Failed to communicate with the DocuGuard backend server.');
    } finally {
      setIsLoadingDocs(false);
      setIsLoadingStats(false);
    }
  }, [token]);

  // Trigger initial fetch when token is present, and refresh when dashboard tab is active
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, activeTab, fetchDashboardData]);

  const handleLoginSuccess = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('docguard_token');
    localStorage.removeItem('docguard_user');
    setToken(null);
    setUsername('');
    setSelectedDocForForensic(null);
    setDocuments([]);
    setStats({
      totalAnalyzed: 0,
      likelyAuthentic: 0,
      suspicious: 0,
      potentiallyTampered: 0,
      unclassified: 0,
      percentages: {
        likelyAuthentic: 0,
        suspicious: 0,
        potentiallyTampered: 0
      }
    });
    setCriticalAlert(null);
  };

  const handleUploadComplete = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocForForensic(newDoc);
    fetchDashboardData();
  };

  const handleOpenForensicInspection = async (doc) => {
    if (!doc) return;
    setSelectedDocForForensic(doc);
    setActiveTab('documents');

    const docId = doc.raw?._id || doc._id || (typeof doc.id === 'string' ? doc.id : null);
    if (docId) {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/analysis/${docId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.message === 'success' && data.document) {
          const detailedDoc = data.document;
          const analysis = detailedDoc.analysis || {};
          setSelectedDocForForensic({
            id: detailedDoc._id,
            name: detailedDoc.filename || detailedDoc.fileName || doc.name,
            type: detailedDoc.fileType || doc.type,
            date: new Date(detailedDoc.dateOfUpload || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            result: detailedDoc.result || analysis.result || 'pending',
            riskPercent: detailedDoc.riskScore ?? analysis.riskScore ?? null,
            confidence: detailedDoc.confidence ?? analysis.confidence ?? null,
            fileUrl: detailedDoc.fileUrl || null,
            suspiciousRegions: detailedDoc.suspiciousRegions || analysis.suspiciousRegions || [],
            manipulationTypes: detailedDoc.manipulationTypes || analysis.manipulationTypes || [],
            ocr: detailedDoc.ocr || analysis.ocr || [],
            metadata: detailedDoc.metadata || analysis.metadata || {},
            explanation: detailedDoc.explanation || analysis.explanation || '',
            recommendation: detailedDoc.recommendation || analysis.recommendation || '',
            raw: detailedDoc
          });
        }
      } catch (err) {
        console.error('Error fetching detailed analysis:', err);
      }
    }
  };

  // Protected Route Check: If not logged in, render AuthView (Login/Register)
  if (!token) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documentCount={documents.length}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          username={username}
          onLogout={handleLogout}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          
          {activeTab === 'dashboard' && (
            <>
              {dashboardError && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 rounded-2xl text-xs flex items-center justify-between">
                  <span>⚠️ {dashboardError}</span>
                  <button onClick={fetchDashboardData} className="font-bold underline cursor-pointer ml-3">
                    Retry
                  </button>
                </div>
              )}

              {/* Section 1: Hero Banner & Metrics Cards */}
              <MetricsOverview
                onOpenUpload={() => setActiveTab('analyze')}
                stats={stats}
                username={username}
                isLoading={isLoadingStats}
              />

              {/* Section 2: Flagged Tampering Alert Banner */}
              <CriticalAlertBanner
                alertData={criticalAlert}
                onOpenForensic={(targetDoc) => handleOpenForensicInspection(targetDoc || documents[0])}
              />

              {/* Section 3: Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left 7 Columns (Recent Documents Table) */}
                <div className="lg:col-span-8">
                  <RecentDocumentsTable
                    documents={documents}
                    searchQuery={searchQuery}
                    onSelectDocument={(doc) => handleOpenForensicInspection(doc)}
                  />
                </div>

                {/* Right 4 Columns (Detection Breakdown & Quick Upload) */}
                <div className="lg:col-span-4 space-y-6">
                  <DetectionBreakdown stats={stats} />
                  <QuickUpload onUploadComplete={handleUploadComplete} />
                </div>

              </div>
            </>
          )}

          {activeTab === 'analyze' && (
            <AnalyzeDocumentView
              onStartAnalysis={(newDoc) => {
                handleUploadComplete(newDoc);
                setActiveTab('documents');
              }}
            />
          )}

          {activeTab === 'documents' && (
            <ForensicDetailView
              documentData={selectedDocForForensic || documents[0]}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              username={username}
              onLogout={handleLogout}
            />
          )}

        </main>
      </div>

      {/* Quick Analyze Modal */}
      <AnalyzeModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

    </div>
  );
}
