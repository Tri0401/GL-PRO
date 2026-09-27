import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QRScannerModal } from './components/QRScannerModal';
import { PrintDocumentModal, DocumentData } from './components/PrintDocumentModal';

import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { EventsView } from './views/EventsView';
import { PickingListView } from './views/PickingListView';
import { CheckoutView } from './views/CheckoutView';
import { CheckinView } from './views/CheckinView';
import { InspectionDamageView } from './views/InspectionDamageView';
import { MaintenanceView } from './views/MaintenanceView';
import { StockOpnameView } from './views/StockOpnameView';
import { BorrowingView } from './views/BorrowingView';
import { MasterDataView } from './views/MasterDataView';
import { ReportsView } from './views/ReportsView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { LedTargetTrackerView } from './views/LedTargetTrackerView';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Master Data Barang',
  events: 'Operasional Event',
  led_target: 'Target Meter LED',
  picking: 'Picking List Gudang',
  checkout: 'Check-out & Surat Jalan',
  checkin: 'Check-in & Rekonsiliasi',
  opname: 'Stock Opname Fisik',
  inspection: 'Inspeksi & Kerusakan',
  maintenance: 'Maintenance & Servis',
  borrowing: 'Peminjaman Internal',
  master: 'Gudang, Crew & Fleet',
  reports: 'Laporan & Ekspor',
  audit: 'Audit Log Perubahan',
  settings: 'Pengaturan Akun & Sistem'
};

interface NavEntry {
  tab: string;
  entityId: string | null;
}

function AppContent() {
  const { darkMode, isAuthenticated } = useApp();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetEntityId, setTargetEntityId] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<NavEntry[]>([]);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Print Document Modal
  const [printDoc, setPrintDoc] = useState<DocumentData | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const handleNavigate = useCallback((tab: string, entityId?: string) => {
    const nextEntityId = entityId || null;
    if (tab === activeTab && nextEntityId === targetEntityId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setNavHistory(prev => [...prev.slice(-29), { tab: activeTab, entityId: targetEntityId }]);
    setActiveTab(tab);
    setTargetEntityId(nextEntityId);
    try {
      window.history.pushState({ tab, entityId: nextEntityId }, '');
    } catch {
      // Ignore history push errors in restricted iframe environments
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, targetEntityId]);

  const handleGoBack = useCallback(() => {
    if (navHistory.length > 0) {
      const previous = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setActiveTab(previous.tab);
      setTargetEntityId(previous.entityId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      setTargetEntityId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [navHistory, activeTab]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.tab === 'string') {
        setNavHistory(prev => prev.slice(0, -1));
        setActiveTab(e.state.tab);
        setTargetEntityId(e.state.entityId || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (navHistory.length > 0) {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navHistory, handleGoBack]);

  // If user is not authenticated, display modern LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const canGoBack = navHistory.length > 0 || activeTab !== 'dashboard';
  const previousTabKey = navHistory.length > 0 ? navHistory[navHistory.length - 1].tab : 'dashboard';
  const previousLabel = TAB_LABELS[previousTabKey] || 'Dashboard';
  const currentLabel = TAB_LABELS[activeTab] || activeTab;

  const handleOpenPrint = (data: DocumentData) => {
    setPrintDoc(data);
    setPrintModalOpen(true);
  };

  const handleSelectSearchResult = (
    type: 'product' | 'event' | 'checkout' | 'crew' | 'warehouse',
    id: string
  ) => {
    if (type === 'product') {
      handleNavigate('inventory', id);
    } else if (type === 'event') {
      handleNavigate('events', id);
    } else if (type === 'checkout') {
      handleNavigate('checkout', id);
    } else if (type === 'crew' || type === 'warehouse') {
      handleNavigate('master', id);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-black text-zinc-100' : 'bg-zinc-950 text-zinc-100'} flex flex-col font-sans transition-colors duration-150`}>
      
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenScanner={() => setScannerOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={handleNavigate}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        previousLabel={previousLabel}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        
        {/* Sidebar (Desktop fixed & Mobile drawer + bottom nav) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenScanner={() => setScannerOpen(true)}
        />

        {/* Content Main View Area */}
        <main className="flex-1 lg:pl-64 px-3 sm:px-6 py-5 w-full min-w-0 pb-20 lg:pb-12">
          {canGoBack && (
            <div className="mb-4 flex items-center justify-between gap-2 bg-zinc-900/80 border border-zinc-800/90 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-orange-600 text-zinc-100 hover:text-white border border-zinc-700 hover:border-orange-500 text-xs font-semibold transition active:scale-95 shadow-sm shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 truncate ml-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('dashboard')}
                    className="hover:text-orange-400 transition flex items-center gap-1"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                  {activeTab !== 'dashboard' && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">{currentLabel}</span>
                    </>
                  )}
                </div>
              </div>

              {activeTab !== 'dashboard' && previousTabKey !== 'dashboard' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 border border-zinc-800 text-[11px] font-medium transition shrink-0"
                >
                  <Home className="w-3 h-3" />
                  <span>Ke Dashboard</span>
                </button>
              )}
            </div>
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenScanner={() => setScannerOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onOpenLabelPrint={handleOpenPrint}
              selectedProductId={targetEntityId}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              onNavigateToCheckout={evId => handleNavigate('checkout', evId)}
              onNavigateToPicking={evId => handleNavigate('picking', evId)}
              selectedEventId={targetEntityId}
            />
          )}

          {activeTab === 'picking' && (
            <PickingListView
              onNavigateToCheckout={evId => handleNavigate('checkout', evId)}
              onOpenScanner={() => setScannerOpen(true)}
              initialEventId={targetEntityId}
            />
          )}

          {activeTab === 'checkout' && (
            <CheckoutView
              onOpenDocumentPrint={handleOpenPrint}
              initialEventId={targetEntityId}
              onOpenScanner={() => setScannerOpen(true)}
            />
          )}

          {activeTab === 'checkin' && (
            <CheckinView
              onOpenDocumentPrint={handleOpenPrint}
              onOpenScanner={() => setScannerOpen(true)}
              initialEventId={targetEntityId}
            />
          )}

          {activeTab === 'inspection' && (
            <InspectionDamageView initialProductId={targetEntityId} />
          )}

          {activeTab === 'maintenance' && <MaintenanceView />}

          {activeTab === 'opname' && (
            <StockOpnameView onOpenScanner={() => setScannerOpen(true)} />
          )}

          {activeTab === 'borrowing' && <BorrowingView />}

          {activeTab === 'master' && <MasterDataView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'led_target' && <LedTargetTrackerView />}

          {activeTab === 'audit' && <AuditLogView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* QR & Barcode Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        targetMode={
          activeTab === 'checkout'
            ? 'checkout'
            : activeTab === 'checkin'
            ? 'checkin'
            : activeTab === 'opname'
            ? 'opname'
            : activeTab === 'inspection'
            ? 'damage'
            : 'lookup'
        }
        onNavigateTab={handleNavigate}
      />

      {/* Official Print Document Modal */}
      <PrintDocumentModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        docData={printDoc}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
