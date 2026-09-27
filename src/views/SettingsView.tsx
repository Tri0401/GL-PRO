import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Database,
  Shield,
  KeyRound,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  X,
  Save,
  Check,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount, UserRole } from '../types';
import * as XLSX from 'xlsx';

export const SettingsView: React.FC = () => {
  const {
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDemoData,
    products,
    events,
    warehouses,
    crew,
    addProduct,
    currentUser,
    userAccounts,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    changePassword
  } = useApp();

  const [activeTab, setActiveTab] = useState<'accounts' | 'my_password' | 'backup' | 'import'>('accounts');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Search in accounts
  const [accountSearch, setAccountSearch] = useState('');

  // 1. My Password state
  const [myOldPass, setMyOldPass] = useState('');
  const [myNewPass, setMyNewPass] = useState('');
  const [myConfirmPass, setMyConfirmPass] = useState('');
  const [showMyOldPass, setShowMyOldPass] = useState(false);
  const [showMyNewPass, setShowMyNewPass] = useState(false);

  // 2. Add User Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'WAREHOUSE' as UserRole,
    division: 'Logistik & Gudang',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });
  const [showNewUserPass, setShowNewUserPass] = useState(false);

  // 3. Edit User Modal state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // 4. Reset User Password Modal state
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Excel import state
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 6000);
  };

  // Handle My Password Change
  const handleSaveMyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (myNewPass !== myConfirmPass) {
      showFeedback('error', 'Konfirmasi password baru tidak cocok.');
      return;
    }
    if (myNewPass.length < 4) {
      showFeedback('error', 'Password baru minimal 4 karakter.');
      return;
    }

    const res = changePassword(currentUser.id, myOldPass, myNewPass);
    if (res.success) {
      showFeedback('success', 'Password akun Anda berhasil diperbarui!');
      setMyOldPass('');
      setMyNewPass('');
      setMyConfirmPass('');
    } else {
      showFeedback('error', res.message);
    }
  };

  // Handle Add New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.name.trim() || !newUserForm.password) {
      showFeedback('error', 'Harap isi semua kolom wajib (*).');
      return;
    }

    const res = addUserAccount({
      username: newUserForm.username.trim(),
      password: newUserForm.password,
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      phone: newUserForm.phone.trim(),
      role: newUserForm.role,
      division: newUserForm.division.trim(),
      status: newUserForm.status
    });

    if (res.success) {
      showFeedback('success', res.message);
      setShowAddUserModal(false);
      setNewUserForm({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'WAREHOUSE',
        division: 'Logistik & Gudang',
        status: 'Aktif'
      });
    } else {
      showFeedback('error', res.message);
    }
  };

  // Handle Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = updateUserAccount(editingUser.id, {
      name: editingUser.name,
      username: editingUser.username,
      email: editingUser.email,
      phone: editingUser.phone,
      role: editingUser.role,
      division: editingUser.division,
      status: editingUser.status
    });

    if (res.success) {
      showFeedback('success', res.message);
      setEditingUser(null);
    } else {
      showFeedback('error', res.message);
    }
  };

  // Handle Admin Reset Password for a user
  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;

    if (adminNewPass !== adminConfirmPass) {
      showFeedback('error', 'Konfirmasi password baru tidak cocok.');
      return;
    }
    if (adminNewPass.length < 4) {
      showFeedback('error', 'Password minimal 4 karakter.');
      return;
    }

    const res = changePassword(passwordTargetUser.id, '', adminNewPass, true);
    if (res.success) {
      showFeedback('success', `Password untuk akun "${passwordTargetUser.username}" berhasil diatur ulang!`);
      setPasswordTargetUser(null);
      setAdminNewPass('');
      setAdminConfirmPass('');
    } else {
      showFeedback('error', res.message);
    }
  };

  // Handle Delete User
  const handleDeleteUser = (acc: UserAccount) => {
    if (acc.id === currentUser.id) {
      showFeedback('error', 'Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${acc.username}" (${acc.name})?`)) {
      const res = deleteUserAccount(acc.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  // Handle backup download
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GL_PRO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle restore JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        showFeedback('success', 'Database berhasil dipulihkan dari file backup JSON!');
      } else {
        showFeedback('error', 'Format file backup tidak valid. Pastikan file JSON diekspor dari sistem.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Excel / CSV Import for Products
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data && data.length > 0) {
          setCsvPreviewRows(data.slice(0, 10));
          showFeedback('success', `File "${file.name}" terbaca dengan baik. Ditemukan ${data.length} baris data siap divalidasi.`);
        } else {
          showFeedback('error', 'File kosong atau format kolom tidak sesuai.');
        }
      } catch (err: any) {
        showFeedback('error', `Gagal membaca file spreadsheet: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImportRows = () => {
    if (csvPreviewRows.length === 0) return;
    let importedCount = 0;

    csvPreviewRows.forEach(row => {
      const name = row['Nama Barang'] || row['Nama'] || row['name'];
      if (name) {
        addProduct({
          name: String(name),
          category: row['Kategori'] || 'AUDIO',
          brand: row['Merek'] || 'Universal',
          model: row['Model'] || '-',
          totalQty: parseInt(row['Jumlah'] || row['Total'] || '1') || 1,
          unit: row['Satuan'] || 'unit',
          rack: row['Rak'] || 'Rak 01',
          shelf: row['Shelf'] || 'Shelf 01',
          condition: 'Sangat Baik'
        });
        importedCount++;
      }
    });

    showFeedback('success', `Berhasil mengimpor ${importedCount} master barang ke sistem.`);
    setCsvPreviewRows([]);
  };

  const filteredAccounts = userAccounts.filter(acc => {
    const q = accountSearch.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.username.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q) ||
      acc.division.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-400" />
            <span>Pengaturan Akun, Keamanan & Sistem</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola hak akses akun pengguna, ubah kata sandi, cadangkan database, dan pemulihan data.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
          <span className="text-zinc-400">Login Sebagai:</span>
          <span className="font-bold text-orange-400">@{currentUser.username || 'user'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'accounts'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Akun & Pengguna ({userAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_password')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'my_password'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan & Password Saya</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'backup'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cadangan & Database</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'import'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Impor Excel / CSV</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: USER ACCOUNTS MANAGEMENT
          ======================================================== */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-sm text-white">Daftar Akun Pengguna & Hak Akses</h2>
              <p className="text-xs text-zinc-400">
                Setiap akun memiliki username dan kata sandi tersendiri untuk masuk ke sistem operasional GL PRO.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari user / role..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 w-44 sm:w-56"
              />
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Baru</span>
              </button>
            </div>
          </div>

          {/* Accounts Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map(acc => {
              const isMe = acc.id === currentUser.id;
              return (
                <div
                  key={acc.id}
                  className={`bg-zinc-900 border rounded-2xl p-4 text-xs space-y-3 shadow-lg flex flex-col justify-between transition ${
                    isMe ? 'border-orange-500/50 bg-gradient-to-br from-zinc-900 to-orange-950/20' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500/20 to-zinc-800 border border-orange-500/30 text-orange-400 font-bold text-xs flex items-center justify-center font-mono">
                          {acc.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">{acc.name}</span>
                            {isMe && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-orange-400 font-mono font-semibold block">
                            @{acc.username}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          acc.status === 'Aktif'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-[11px] space-y-1 text-zinc-400">
                      <div className="flex items-center justify-between">
                        <span>Role:</span>
                        <strong className="text-white font-mono">{acc.role}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Divisi:</span>
                        <span className="text-zinc-200">{acc.division}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Email:</span>
                        <span className="text-zinc-300 truncate max-w-[150px]">{acc.email || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>WhatsApp:</span>
                        <span className="text-zinc-300">{acc.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[10px]">
                        <span>Terakhir Masuk:</span>
                        <span className="text-zinc-400">{acc.lastLogin || 'Belum ada data'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        setPasswordTargetUser(acc);
                        setAdminNewPass('');
                        setAdminConfirmPass('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-semibold flex items-center gap-1 transition"
                      title="Atur ulang kata sandi pengguna ini"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Ubah Password</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(acc)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                        title="Edit data profil akun"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(acc)}
                        disabled={isMe}
                        className={`p-1.5 rounded-lg border transition ${
                          isMe
                            ? 'opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700'
                            : 'bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border-zinc-700'
                        }`}
                        title={isMe ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus akun pengguna'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: MY PASSWORD SETTINGS
          ======================================================== */}
      {activeTab === 'my_password' && (
        <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Ganti Kata Sandi Akun Anda</h2>
              <p className="text-xs text-zinc-400">
                Akun aktif saat ini: <strong className="text-orange-400">@{currentUser.username || 'user'}</strong> ({currentUser.name})
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveMyPassword} className="space-y-4 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Password Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showMyOldPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password yang saat ini digunakan"
                  value={myOldPass}
                  onChange={e => setMyOldPass(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMyOldPass(!showMyOldPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showMyOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showMyNewPass ? 'text' : 'password'}
                  required
                  placeholder="Minimal 4 karakter"
                  value={myNewPass}
                  onChange={e => setMyNewPass(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMyNewPass(!showMyNewPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showMyNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Konfirmasi Password Baru *
              </label>
              <input
                type={showMyNewPass ? 'text' : 'password'}
                required
                placeholder="Ulangi password baru Anda"
                value={myConfirmPass}
                onChange={e => setMyConfirmPass(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ketentuan Keamanan:</span>
              </div>
              <p>Perubahan kata sandi akan langsung berlaku untuk sesi login berikutnya di seluruh perangkat.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 3: DATABASE BACKUP & RESTORE
          ======================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Backup Database */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Database className="w-4 h-4 text-orange-400" />
                <h2 className="font-bold text-sm text-white">Cadangkan Database (Backup JSON)</h2>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Unduh seluruh snapshot sistem: akun pengguna ({userAccounts.length} akun), inventaris ({products.length} barang), event ({events.length} acara), multi-gudang ({warehouses.length} gudang), kru ({crew.length} personel), dan audit log ke satu file terenkripsi JSON.
              </p>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan Database</span>
              </button>
            </div>

            {/* Restore Database */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-sm text-white">Pulihkan Database (Restore Backup)</h2>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Muat file cadangan JSON yang telah diekspor sebelumnya untuk mengembalikan kondisi sistem inventaris dan operasional.
              </p>

              <label className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Pilih File Backup (.json)</span>
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-zinc-900 border border-rose-900/40 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Zona Pengaturan Awal (Reset Demo Data)</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mengembalikan seluruh data master inventaris, multi-gudang, jadwal event, armada, dan audit trail ke kondisi awal demonstrasi GL PRO PRODUCTION. Tindakan ini akan menghapus perubahan lokal.
            </p>

            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin mengatur ulang data ke konfigurasi demo awal?')) {
                  resetToDemoData();
                  showFeedback('success', 'Sistem telah berhasil diatur ulang ke data demo operasional awal.');
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atur Ulang ke Data Demo Awal</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: SPREADSHEET IMPORT
          ======================================================== */}
      {activeTab === 'import' && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-white">Import Master Data dari Excel / CSV</h2>
            </div>

            <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Spreadsheet</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="hidden" />
            </label>
          </div>

          <p className="text-xs text-zinc-400">
            Dukung format kolom: <code>Nama Barang</code>, <code>Kategori</code>, <code>Merek</code>, <code>Model</code>, <code>Jumlah</code>, <code>Satuan</code>, <code>Rak</code>, <code>Shelf</code>. Sistem memvalidasi sebelum data masuk ke database.
          </p>

          {csvPreviewRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Pratinjau Data Impor ({csvFileName}):
                </span>
                <button
                  onClick={handleConfirmImportRows}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow"
                >
                  Konfirmasi Impor ke Database
                </button>
              </div>

              <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800">
                      {Object.keys(csvPreviewRows[0] || {}).map((col, idx) => (
                        <th key={idx} className="p-2 border-r border-zinc-800">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {csvPreviewRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-800/30">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-zinc-800/60 text-zinc-300">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: TAMBAH AKUN BARU
          ======================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Daftarkan Akun Pengguna Baru</span>
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Username Akun *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staf_gudang"
                    value={newUserForm.username}
                    onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Password Awal *</label>
                  <div className="relative">
                    <input
                      type={showNewUserPass ? 'text' : 'password'}
                      required
                      placeholder="Minimal 4 karakter"
                      value={newUserForm.password}
                      onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-9 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPass(!showNewUserPass)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-200"
                      tabIndex={-1}
                    >
                      {showNewUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Lengkap Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gilang Ramadhan"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Role / Hak Akses *</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full Akses)</option>
                    <option value="ADMIN">ADMIN Operasional</option>
                    <option value="WAREHOUSE">WAREHOUSE (Kepala Gudang)</option>
                    <option value="PROJECT_MANAGER">PROJECT MANAGER (Event)</option>
                    <option value="TEKNISI">TEKNISI (Servis & Maintenance)</option>
                    <option value="CREW">CREW Lapangan</option>
                    <option value="VIEWER">VIEWER (Tamu)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Divisi / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Sound Engineer / Gudang"
                    value={newUserForm.division}
                    onChange={e => setNewUserForm({ ...newUserForm, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@glpro.co.id"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-..."
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Status Akun</label>
                <select
                  value={newUserForm.status}
                  onChange={e => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Aktif">Aktif (Dapat Login)</option>
                  <option value="Nonaktif">Nonaktif (Akses Dikunci)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT AKUN PENGGUNA
          ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-400" />
                <span>Edit Data Akun: @{editingUser.username}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Status Akun</label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Role / Hak Akses *</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full Akses)</option>
                    <option value="ADMIN">ADMIN Operasional</option>
                    <option value="WAREHOUSE">WAREHOUSE (Kepala Gudang)</option>
                    <option value="PROJECT_MANAGER">PROJECT MANAGER (Event)</option>
                    <option value="TEKNISI">TEKNISI (Servis & Maintenance)</option>
                    <option value="CREW">CREW Lapangan</option>
                    <option value="VIEWER">VIEWER (Tamu)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Divisi / Bagian</label>
                  <input
                    type="text"
                    value={editingUser.division}
                    onChange={e => setEditingUser({ ...editingUser, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ATUR ULANG / UBAH PASSWORD PENGGUNA (ADMIN)
          ======================================================== */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-400" />
                <span>Atur Password Baru</span>
              </h3>
              <button onClick={() => setPasswordTargetUser(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300">
                <p className="text-[10px] text-zinc-400">Target Akun Pengguna:</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-sm text-white">{passwordTargetUser.name}</span>
                  <span className="font-mono text-orange-400 font-semibold">@{passwordTargetUser.username}</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Password Baru *</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    placeholder="Minimal 4 karakter"
                    value={adminNewPass}
                    onChange={e => setAdminNewPass(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                    tabIndex={-1}
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Konfirmasi Password Baru *</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  placeholder="Ketik ulang password baru"
                  value={adminConfirmPass}
                  onChange={e => setAdminConfirmPass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
          </div>
        </div>
      )}

    </div>
  );
};
