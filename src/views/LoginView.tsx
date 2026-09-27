import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Wrench,
  Truck,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Harap masukkan username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Simulate realistic instantaneous authentication
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    }, 250);
  };

  const handleQuickLogin = (quickUser: string, quickPass: string) => {
    setUsername(quickUser);
    setPassword(quickPass);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      login(quickUser, quickPass);
      setIsLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Branding */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 py-5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-900/30 text-white font-black text-xl tracking-tighter">
            GL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">GL PRO PRODUCTION</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                PRO-OPS
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Warehouse & Event Technical Operations System</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sistem Terenkripsi & Keamanan Berlapis</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Top orange gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600" />

            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white tracking-tight">Masuk ke Portal Operasional</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Silakan autentikasi akun Anda untuk mengelola inventaris, reservasi, & event
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Username atau Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. admin atau gudang"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black border border-zinc-750 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Kata Sandi / Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password akun Anda"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-black border border-zinc-750 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                  />
                  <span>Ingat sesi masuk</span>
                </label>
                <span className="text-zinc-500">Default: password123</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition transform active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  Akses Cepat Demo Akun
                </span>
                <span className="text-[10px] text-zinc-500">Klik untuk langsung coba</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'password123')}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-orange-950/30 border border-zinc-800 hover:border-orange-500/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-orange-400">admin</span>
                    <span className="text-[9px] px-1 rounded bg-orange-500/20 text-orange-400 font-mono">Super</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">Direksi & Full Akses</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('gudang', 'password123')}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-orange-950/30 border border-zinc-800 hover:border-orange-500/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-orange-400">gudang</span>
                    <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">Logistik</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">Kepala Gudang</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('pm_event', 'password123')}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-orange-950/30 border border-zinc-800 hover:border-orange-500/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-orange-400">pm_event</span>
                    <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">Event</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">Project Manager</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('teknisi', 'password123')}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-orange-950/30 border border-zinc-800 hover:border-orange-500/40 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-orange-400">teknisi</span>
                    <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-300 font-mono">Teknisi</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">Inspeksi & Servis</div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick info note */}
          <div className="mt-4 text-center text-[11px] text-zinc-500">
            Semua akun terintegrasi dengan pengaturan profil dan penggantian password di menu Pengaturan Akun.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900 gap-2">
        <div>
          © 2026 <strong className="text-zinc-400">GL PRO PRODUCTION</strong>. Hak cipta dilindungi undang-undang.
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Siap Operasional
          </span>
          <span>v2.4 Production Engine</span>
        </div>
      </footer>
    </div>
  );
};
