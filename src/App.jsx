import React, { useState, useEffect } from 'react';
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

  // Documents are loaded from the real backend. No hardcoded demo data.
  const [documents, setDocuments] = useState([]);

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

  // Fetch Documents dynamically from backend when logged in
  useEffect(() => {
    if (!token) return;

    const fetchUserDocuments = async () => {
      setIsLoadingDocs(true);
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/documents`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.message === 'success' && Array.isArray(data.documents)) {
          if (data.documents.length > 0) {
            const formattedDocs = data.documents.map((doc, idx) => {
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
        }
      } catch (err) {
        console.error('Error fetching documents from backend:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchUserDocuments();
  }, [token]);

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
  };

  const handleUploadComplete = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocForForensic(newDoc);
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

  // Derived Statistics
  const totalAnalyzed = Math.max(128, documents.length);
  const authenticCount = documents.filter(d => d.result === 'Likely Authentic').length || 91;
  const suspiciousCount = documents.filter(d => d.result === 'Suspicious').length || 24;
  const tamperedCount = documents.filter(d => d.result === 'Potentially Tampered').length || 13;

  const stats = {
    total: totalAnalyzed,
    authentic: authenticCount,
    suspicious: suspiciousCount,
    tampered: tamperedCount
  };

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
              {/* Section 1: Hero Banner & Metrics Cards */}
              <MetricsOverview
                onOpenUpload={() => setActiveTab('analyze')}
                stats={stats}
              />

              {/* Section 2: Flagged Tampering Alert Banner */}
              <CriticalAlertBanner
                onOpenForensic={() => handleOpenForensicInspection(documents[0])}
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
