import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  ClipboardList,
  Truck,
  PackageCheck,
  AlertTriangle,
  Wrench,
  ScanLine,
  Handshake,
  Building2,
  FileSpreadsheet,
  History,
  Settings,
  ChevronRight,
  QrCode,
  Tv,
  KeyRound,
  UserCheck,
  LogOut,
  Shield,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { AccountSettingsModal } from './AccountSettingsModal';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenScanner: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onOpenScanner
}) => {
  const {
    events,
    damageReports,
    maintenanceRecords,
    borrowings,
    currentUser,
    setCurrentUserRole,
    logout
  } = useApp();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const activeEventsCount = events.filter(
    e => e.status === 'Berlangsung' || e.status === 'Loading' || e.status === 'Persiapan'
  ).length;
  const activeDamageCount = damageReports.filter(d => d.status !== 'Selesai').length;
  const pendingMntCount = maintenanceRecords.filter(m => m.status === 'Segera Dilakukan').length;
  const activeBorrowCount = borrowings.filter(
    b => b.status === 'Dipinjam' || b.status === 'Terlambat'
  ).length;

  const roleOptions: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Akses Penuh Semua Modul' },
    { role: 'ADMIN', label: 'Admin Operasional', desc: 'Pengelolaan Data & Laporan' },
    { role: 'WAREHOUSE', label: 'Staff Gudang', desc: 'Check-out, Check-in, Stock Opname' },
    { role: 'PROJECT_MANAGER', label: 'Project Manager', desc: 'Event, Equipment List, Crew' },
    { role: 'CREW', label: 'Crew Lapangan', desc: 'Lihat Tugas & Penugasan Event' },
    { role: 'TEKNISI', label: 'Teknisi & Servis', desc: 'Maintenance & Laporan Kerusakan' },
    { role: 'VIEWER', label: 'Viewer Tamu', desc: 'Akses Baca Informasi' }
  ];

  const currentRoleLabel = roleOptions.find(r => r.role === currentUser.role)?.label || currentUser.role;

  const navGroups: NavGroup[] = [
    {
      group: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Master Data Barang', icon: Boxes },
        { id: 'events', label: 'Operasional Event', icon: CalendarDays, badge: activeEventsCount },
        { id: 'led_target', label: 'Target Meter LED', icon: Tv }
      ]
    },
    {
      group: 'LOGISTIK & GUDANG',
      items: [
        { id: 'picking', label: 'Picking List Gudang', icon: ClipboardList },
        { id: 'checkout', label: 'Check-out & Surat Jalan', icon: Truck },
        { id: 'checkin', label: 'Check-in & Rekonsiliasi', icon: PackageCheck },
        { id: 'opname', label: 'Stock Opname Fisik', icon: ScanLine }
      ]
    },
    {
      group: 'KONDISI & TEKNIS',
      items: [
        { id: 'inspection', label: 'Inspeksi & Kerusakan', icon: AlertTriangle, badge: activeDamageCount, badgeColor: 'bg-rose-500' },
        { id: 'maintenance', label: 'Maintenance & Servis', icon: Wrench, badge: pendingMntCount, badgeColor: 'bg-amber-500' },
        { id: 'borrowing', label: 'Peminjaman Internal', icon: Handshake, badge: activeBorrowCount }
      ]
    },
    {
      group: 'DATA & SISTEM',
      items: [
        { id: 'master', label: 'Gudang, Crew & Fleet', icon: Building2 },
        { id: 'reports', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit Log Perubahan', icon: History },
        { id: 'settings', label: 'Pengaturan Akun & Sistem', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 text-zinc-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP: User Account & Profile Header in Menu */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/80">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-xs text-white truncate">{currentUser.name}</h4>
                  <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/15 px-1.5 py-0.2 rounded border border-orange-500/25 shrink-0">
                    @{currentUser.username || 'user'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate">{currentUser.division}</p>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-0.5">
                  <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{currentRoleLabel}</span>
                </div>
              </div>
            </div>

            {/* Quick Account Settings & Menu Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowAccountModal(true);
                  onCloseMobile();
                }}
                className="px-2 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 font-semibold text-[10px] flex items-center justify-center gap-1 border border-orange-500/30 transition"
                title="Buka Pengaturan Akun & Ganti Password"
              >
                <KeyRound className="w-3 h-3 shrink-0" />
                <span className="truncate">Pengaturan Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('settings');
                  onCloseMobile();
                }}
                className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white font-medium text-[10px] flex items-center justify-center gap-1 border border-zinc-700 transition"
                title="Buka Halaman Pengaturan Sistem"
              >
                <Settings className="w-3 h-3 shrink-0" />
                <span className="truncate">Menu Sistem</span>
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE: Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-semibold'
                        : 'hover:bg-zinc-900/90 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                          item.badgeColor || (isActive ? 'bg-orange-800' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30')
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}

          {/* DEDICATED MENU GROUP: AKUN & KEAMANAN */}
          <div className="space-y-1 pt-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              AKUN & SESI
            </div>
            
            {/* Direct Account Settings Action */}
            <button
              type="button"
              onClick={() => {
                setShowAccountModal(true);
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-orange-500/20 transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <KeyRound className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate font-semibold">Pengaturan Akun & Password</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-orange-400/70" />
            </button>

            {/* Toggle Role Selector in Menu */}
            <button
              type="button"
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-zinc-900 text-zinc-300 hover:text-white transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <UserCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="truncate">Ganti Role Pengguna</span>
              </div>
              {showRoleSelector ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>

            {/* Role options dropdown list */}
            {showRoleSelector && (
              <div className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1 animate-in fade-in">
                {roleOptions.map(opt => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => {
                      setCurrentUserRole(opt.role);
                      setShowRoleSelector(false);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] flex items-center justify-between transition ${
                      currentUser.role === opt.role
                        ? 'bg-orange-600 text-white font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div>{opt.label}</div>
                      <div className={`text-[9px] ${currentUser.role === opt.role ? 'text-orange-100' : 'text-zinc-500'}`}>
                        {opt.desc}
                      </div>
                    </div>
                    {currentUser.role === opt.role && <Shield className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}

            {/* Logout button in Menu */}
            <button
              type="button"
              onClick={() => {
                logout();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition mt-1"
            >
              <div className="flex items-center gap-2.5 truncate">
                <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">Keluar / Logout Akun</span>
              </div>
              <span className="text-[10px] text-rose-400 font-mono">Exit</span>
            </button>
          </div>
        </div>

        {/* BOTTOM: Quick Mobile Barcode Shortcut in Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950">
          <button
            onClick={() => {
              onOpenScanner();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/40 text-zinc-200 text-xs font-medium border border-zinc-800 transition"
          >
            <QrCode className="w-4 h-4 text-orange-400" />
            <span>Pemindai Cepat Lapangan</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-zinc-800 text-zinc-300 px-2 py-1.5 grid grid-cols-5 items-center justify-items-center text-center">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded text-[10px] text-center ${
            activeTab === 'dashboard' ? 'text-orange-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-full">Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('inventory')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded text-[10px] text-center ${
            activeTab === 'inventory' ? 'text-orange-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Boxes className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-full">Barang</span>
        </button>

        {/* Central Scan Button */}
        <div className="w-full flex items-center justify-center">
          <button
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center -mt-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full p-2.5 shadow-lg shadow-orange-600/40 active:scale-95 transition"
          >
            <QrCode className="w-5 h-5" />
            <span className="sr-only">Scan</span>
          </button>
        </div>

        <button
          onClick={() => onSelectTab('checkout')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded text-[10px] text-center ${
            activeTab === 'checkout' ? 'text-orange-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-full">Check-Out</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded text-[10px] text-center ${
            activeTab === 'settings' ? 'text-orange-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-full">Akun & Sistem</span>
        </button>
      </nav>

      {/* Standalone Account Settings Modal triggered directly from Sidebar Menu */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </>
  );
};
