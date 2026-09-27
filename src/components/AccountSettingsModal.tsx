import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Save,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, changePassword, updateUserAccount, userAccounts } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('password');

  // Profile Form state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [division, setDivision] = useState(currentUser.division);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = updateUserAccount(currentUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      division: division.trim()
    });

    if (res.success) {
      setFeedback({ type: 'success', message: 'Profil akun Anda berhasil diperbarui!' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    if (newPassword.length < 4) {
      setFeedback({ type: 'error', message: 'Password baru minimal 4 karakter.' });
      return;
    }

    const res = changePassword(currentUser.id, currentPassword, newPassword);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Kata sandi / password akun Anda berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pengaturan Akun & Password</h3>
              <p className="text-[11px] text-zinc-400">
                Akun: <strong className="text-orange-400">@{currentUser.username || 'user'}</strong> ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Batal</span>
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ganti Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setFeedback(null);
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil Pengguna</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Password Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password lama Anda"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="Minimal 4 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Konfirmasi Password Baru *
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>Tips Keamanan Akun:</span>
              </div>
              <p>Gunakan kombinasi huruf dan angka untuk mencegah akses yang tidak diizinkan.</p>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Password Baru</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Nomor WhatsApp / HP *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Divisi / Bagian</label>
              <input
                type="text"
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
