import React, { useState } from 'react';
import {
  Search,
  QrCode,
  Bell,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenScanner: () => void;
  onToggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
  onNavigate: (tab: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenScanner,
  onToggleMobileMenu,
  mobileMenuOpen,
  onNavigate,
  canGoBack = false,
  onGoBack,
  previousLabel
}) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Left: Mobile hamburger, Back button & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 focus:outline-none transition active:scale-95 border border-zinc-800"
            aria-label="Buka Menu & Pengaturan Akun"
            title="Buka Menu & Pengaturan Akun"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5 text-zinc-300" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <svg
                viewBox="0 0 1000 1120"
                className="w-full h-full object-contain"
                aria-label="GL PRO Logo"
              >
                <defs>
                  <linearGradient id="glTopGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f58220" />
                    <stop offset="55%" stopColor="#fbaf1a" />
                    <stop offset="100%" stopColor="#ffdd00" />
                  </linearGradient>
                  <linearGradient id="glMidGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f37021" />
                    <stop offset="50%" stopColor="#fcb813" />
                    <stop offset="100%" stopColor="#fff200" />
                  </linearGradient>
                  <linearGradient id="glFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff200" />
                    <stop offset="50%" stopColor="#fdb913" />
                    <stop offset="100%" stopColor="#f37021" />
                  </linearGradient>
                  <linearGradient id="glBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff200" />
                    <stop offset="35%" stopColor="#fcb813" />
                    <stop offset="100%" stopColor="#f37021" />
                  </linearGradient>
                </defs>

                {/* G Upper Sweeping Arc */}
                <path
                  d="M 47 275 C 145 85, 390 0, 680 0 L 968 0 L 832 137 L 650 137 C 420 137, 235 215, 163 362 Z"
                  fill="url(#glTopGrad)"
                />

                {/* G Inner Diagonal Bar */}
                <path
                  d="M 122 507 L 345 284 C 405 224, 495 224, 600 242 L 210 596 Z"
                  fill="url(#glMidGrad)"
                />

                {/* G Left Fold Ribbon */}
                <path
                  d="M 47 275 L 216 412 L 122 507 L 0 384 Z"
                  fill="url(#glFoldGrad)"
                />

                {/* L Diagonal Stem */}
                <path
                  d="M 805 180 L 1000 180 L 512 668 L 385 552 Z"
                  fill="url(#glMidGrad)"
                />

                {/* L Bottom Base Ribbon */}
                <path
                  d="M 385 552 L 535 642 L 806 642 L 670 778 L 495 778 C 415 778, 345 735, 293 645 Z"
                  fill="url(#glBaseGrad)"
                />

                {/* PRO Stylized Black Wordmark */}
                <path
                  d="M 124 815 L 585 815 C 635 815, 665 845, 668 895 L 675 995 C 678 1030, 705 1052, 745 1052 L 800 1052 C 838 1052, 858 1028, 858 992 C 858 955, 835 932, 798 932 L 697 932 L 697 895 C 695 860, 682 832, 669 815 L 798 815 C 885 815, 925 890, 925 992 C 925 1072, 875 1118, 795 1118 L 685 1118 C 635 1118, 608 1075, 604 1015 L 600 915 C 598 885, 582 872, 550 872 L 73 872 Z"
                  fill="#050505"
                />
                <path
                  d="M 70 980 L 235 980 C 265 980, 282 968, 288 948 L 344 948 C 344 1018, 302 1058, 225 1058 L 132 1058 L 132 1118 L 70 1118 Z"
                  fill="#050505"
                />
                <path
                  d="M 365 980 L 552 980 L 598 1118 L 522 1118 L 494 1050 L 430 1050 L 430 1118 L 365 1118 Z"
                  fill="#050505"
                />

                {/* Play Button Accent inside O */}
                <circle cx="776" cy="992" r="34" fill="url(#glFoldGrad)" />
                <polygon points="765,971 796,992 765,1013" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  GL PRO
                  <span className="text-[10px] px-1.5 py-0.5 font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                    PRODUCTION
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-none hidden sm:block">
                Sistem Peralatan, Gudang & Operasional Acara
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 min-w-0 max-w-md mx-2 hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 text-zinc-400 text-xs transition"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate">Cari barang, barcode, event, surat jalan...</span>
            </span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded border border-zinc-700 shrink-0 ml-1">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right actions: Scan, Notif, Role, Dark mode */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
          
          {/* Quick Scanner Button */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs shadow-md shadow-orange-600/30 active:scale-95 transition shrink-0"
            title="Buka Kamera Scan QR & Barcode"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline font-semibold">Scan QR</span>
          </button>

          {/* Search icon on mobile */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-1.5 sm:p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 shrink-0"
            title="Cari"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 relative focus:outline-none shrink-0"
              title="Notifikasi Operasional"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-zinc-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-400" />
                    <span className="font-semibold text-xs text-white">Notifikasi Operasional</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-orange-400 hover:underline font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Tidak ada notifikasi saat ini
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.linkTab) onNavigate(n.linkTab);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 text-xs hover:bg-zinc-800/80 cursor-pointer transition flex items-start gap-2.5 ${
                          !n.read ? 'bg-orange-950/20' : ''
                        }`}
                      >
                        {n.type === 'ALERT' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                        {n.type === 'WARNING' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        {n.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        {n.type === 'INFO' && <Bell className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-[12px]">{n.title}</span>
                            <span className="text-[10px] text-zinc-400">{n.timestamp}</span>
                          </div>
                          <p className="text-zinc-300 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
