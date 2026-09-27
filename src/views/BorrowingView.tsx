import React, { useState } from 'react';
import {
  Handshake,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  X,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Filter,
  Package,
  Building,
  Phone,
  FileText,
  ChevronDown,
  UserCheck,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BorrowingRecord, ItemCondition } from '../types';

export const BorrowingView: React.FC = () => {
  const {
    borrowings,
    addBorrowing,
    updateBorrowing,
    deleteBorrowing,
    returnBorrowing,
    products,
    crew,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [returnModalBorrow, setReturnModalBorrow] = useState<BorrowingRecord | null>(null);
  const [returnCondition, setReturnCondition] = useState<ItemCondition>('Sangat Baik');
  const [returnNotes, setReturnNotes] = useState('');

  // Interactive Crew Combobox & Auto-match states
  const [showCrewDropdownAdd, setShowCrewDropdownAdd] = useState(false);
  const [showCrewDropdownEdit, setShowCrewDropdownEdit] = useState(false);

  // Edit Modal State
  const [editModalBorrow, setEditModalBorrow] = useState<BorrowingRecord | null>(null);
  const [editFormData, setEditFormData] = useState<{
    borrowerName: string;
    division: string;
    phone: string;
    productId: string;
    qty: number;
    borrowDate: string;
    expectedReturnDate: string;
    purpose: string;
    approvedByPic: string;
    status: BorrowingRecord['status'];
    notes: string;
  }>({
    borrowerName: '',
    division: '',
    phone: '',
    productId: '',
    qty: 1,
    borrowDate: '',
    expectedReturnDate: '',
    purpose: '',
    approvedByPic: '',
    status: 'Dipinjam',
    notes: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalBorrow, setDeleteModalBorrow] = useState<BorrowingRecord | null>(null);

  // Form State for Create
  const [newBorrow, setNewBorrow] = useState<{
    borrowerName: string;
    division: string;
    phone: string;
    productId: string;
    qty: number;
    expectedReturnDate: string;
    purpose: string;
  }>({
    borrowerName: crew[0]?.name || '',
    division: crew[0]?.division || 'Dokumentasi',
    phone: crew[0]?.phone || '',
    productId: products[0]?.id || '',
    qty: 1,
    expectedReturnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purpose: ''
  });

  // Filtered crew suggestions for Add modal
  const filteredCrewAdd = crew.filter(c => {
    if (!newBorrow.borrowerName) return true;
    const query = newBorrow.borrowerName.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.division.toLowerCase().includes(query) ||
      c.roleTitle.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  const matchedCrewAdd = crew.find(
    c => c.name.toLowerCase() === newBorrow.borrowerName.trim().toLowerCase()
  );

  const handleBorrowerNameChange = (val: string) => {
    const matched = crew.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setNewBorrow(prev => ({
        ...prev,
        borrowerName: val,
        division: matched.division,
        phone: matched.phone || prev.phone
      }));
    } else {
      setNewBorrow(prev => ({
        ...prev,
        borrowerName: val
      }));
    }
  };

  const handleSelectCrewSuggestion = (c: typeof crew[0]) => {
    setNewBorrow(prev => ({
      ...prev,
      borrowerName: c.name,
      division: c.division,
      phone: c.phone
    }));
    setShowCrewDropdownAdd(false);
  };

  // Filtered crew suggestions for Edit modal
  const filteredCrewEdit = crew.filter(c => {
    if (!editFormData.borrowerName) return true;
    const query = editFormData.borrowerName.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.division.toLowerCase().includes(query) ||
      c.roleTitle.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  const matchedCrewEdit = crew.find(
    c => c.name.toLowerCase() === editFormData.borrowerName.trim().toLowerCase()
  );

  const handleEditBorrowerNameChange = (val: string) => {
    const matched = crew.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setEditFormData(prev => ({
        ...prev,
        borrowerName: val,
        division: matched.division,
        phone: matched.phone || prev.phone
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        borrowerName: val
      }));
    }
  };

  const handleSelectEditCrewSuggestion = (c: typeof crew[0]) => {
    setEditFormData(prev => ({
      ...prev,
      borrowerName: c.name,
      division: c.division,
      phone: c.phone
    }));
    setShowCrewDropdownEdit(false);
  };

  const filtered = borrowings.filter(b => {
    const matchesSearch =
      searchTerm === '' ||
      b.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.division.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = borrowings.filter(b => b.status === 'Dipinjam' || b.status === 'Terlambat').length;
  const overdueCount = borrowings.filter(b => b.status === 'Terlambat').length;
  const returnedCount = borrowings.filter(b => b.status === 'Dikembalikan').length;

  const handleCreateBorrowing = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newBorrow.productId);
    if (!prod) return;

    if (prod.availableQty < newBorrow.qty) {
      alert(`Stok tidak mencukupi! Tersedia hanya ${prod.availableQty} ${prod.unit}.`);
      return;
    }

    addBorrowing({
      borrowerName: newBorrow.borrowerName,
      borrowerRole: 'Crew Internal',
      division: newBorrow.division,
      phone: newBorrow.phone,
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      qty: newBorrow.qty,
      unit: prod.unit,
      borrowDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: newBorrow.expectedReturnDate,
      purpose: newBorrow.purpose || 'Keperluan produksi lapangan internal',
      approvedByPic: currentUser.name,
      conditionOut: 'Sangat Baik',
      status: 'Dipinjam'
    });

    setShowAddModal(false);
  };

  const handleOpenEdit = (b: BorrowingRecord) => {
    setEditModalBorrow(b);
    setEditFormData({
      borrowerName: b.borrowerName,
      division: b.division,
      phone: b.phone,
      productId: b.productId,
      qty: b.qty,
      borrowDate: b.borrowDate,
      expectedReturnDate: b.expectedReturnDate,
      purpose: b.purpose,
      approvedByPic: b.approvedByPic,
      status: b.status,
      notes: b.notes || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBorrow) return;

    const prod = products.find(p => p.id === editFormData.productId);
    if (!prod) {
      setEditError('Peralatan yang dipilih tidak valid.');
      return;
    }

    const res = updateBorrowing(editModalBorrow.id, {
      borrowerName: editFormData.borrowerName,
      division: editFormData.division,
      phone: editFormData.phone,
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      qty: editFormData.qty,
      unit: prod.unit,
      borrowDate: editFormData.borrowDate,
      expectedReturnDate: editFormData.expectedReturnDate,
      purpose: editFormData.purpose,
      approvedByPic: editFormData.approvedByPic,
      status: editFormData.status,
      notes: editFormData.notes
    });

    if (!res.success) {
      setEditError(res.message);
      return;
    }

    setEditModalBorrow(null);
    setEditError(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalBorrow) return;
    deleteBorrowing(deleteModalBorrow.id);
    setDeleteModalBorrow(null);
  };

  const handleConfirmReturn = () => {
    if (!returnModalBorrow) return;
    returnBorrowing(returnModalBorrow.id, returnCondition, returnNotes);
    setReturnModalBorrow(null);
  };

  const getBorrowingStatusBadge = (st: BorrowingRecord['status']) => {
    switch (st) {
      case 'Dipinjam':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs leading-none">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Dipinjam</span>
          </span>
        );
      case 'Terlambat':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs leading-none animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Terlambat</span>
          </span>
        );
      case 'Dikembalikan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs leading-none">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Dikembalikan</span>
          </span>
        );
      case 'Rusak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-red-500/15 text-red-400 border border-red-500/30 shadow-xs leading-none">
            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
            <span>Rusak</span>
          </span>
        );
      case 'Hilang':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-xs leading-none">
            <X className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>Hilang</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 leading-none">
            <span>{st}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Handshake className="w-5 h-5 text-orange-400" />
            <span>Peminjaman Alat Internal Crew & Karyawan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pencatatan, edit & hapus peminjaman alat internal produksi (kamera, lensa, gimbal, mic, toolbox) untuk project mandiri.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Input Peminjaman Baru</span>
        </button>
      </div>

      {/* Quick KPI Stat Chips & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari peminjam, nama alat, kode pinjam, atau divisi..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition leading-none ${
              statusFilter === 'ALL'
                ? 'bg-orange-600 text-white font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono font-bold">
              {borrowings.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Dipinjam')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition leading-none ${
              statusFilter === 'Dipinjam'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'bg-zinc-900 text-amber-400 hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Aktif Dipinjam</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono font-bold">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Terlambat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition leading-none ${
              statusFilter === 'Terlambat'
                ? 'bg-rose-600 text-white font-bold shadow-sm'
                : 'bg-zinc-900 text-rose-400 hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Terlambat</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono font-bold">
              {overdueCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Dikembalikan')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition leading-none ${
              statusFilter === 'Dikembalikan'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-zinc-900 text-emerald-400 hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono font-bold">
              {returnedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Borrowings List Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Handshake className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-sm">Tidak ada data peminjaman</h3>
          <p className="text-zinc-500 text-xs mt-1">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Tidak ada data peminjaman yang cocok dengan filter pencarian.'
              : 'Belum ada catatan peminjaman alat internal. Klik "+ Input Peminjaman Baru" untuk membuat.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => {
            const isOverdue = b.status === 'Terlambat';
            const isReturned = b.status === 'Dikembalikan';

            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition text-xs space-y-3 flex flex-col justify-between shadow-sm ${
                  isReturned
                    ? 'bg-zinc-900/70 border-zinc-800'
                    : isOverdue
                    ? 'bg-zinc-900 border-rose-500/50 shadow-rose-950/20'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Header: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {b.borrowCode}
                    </span>
                    {getBorrowingStatusBadge(b.status)}
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">{b.productName}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                      <span>{b.productCode}</span>
                      <span>•</span>
                      <span>Jumlah: <strong className="text-orange-400 font-bold">{b.qty} {b.unit}</strong></span>
                    </div>
                  </div>

                  {/* Borrower Box */}
                  <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Peminjam:</span>
                      <strong className="text-white">{b.borrowerName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Divisi:</span>
                      <span className="text-zinc-200">{b.division}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>No. HP:</span>
                        <span className="font-mono text-zinc-300">{b.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <span>Batas Kembali:</span>
                      <strong className={isOverdue ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {b.expectedReturnDate}
                      </strong>
                    </div>
                    {b.actualReturnDate && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Dikembalikan Tgl:</span>
                        <span className="font-semibold">{b.actualReturnDate}</span>
                      </div>
                    )}
                    {b.purpose && (
                      <p className="text-zinc-400 italic text-[10px] pt-1">
                        "{b.purpose}"
                      </p>
                    )}
                    {b.notes && (
                      <p className="text-zinc-500 text-[10px] pt-0.5">
                        Catatan: {b.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Dates & Actions (Edit, Delete, Return) */}
                <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-zinc-500 text-[10px]">
                    Pinjam: {b.borrowDate}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-orange-400 border border-zinc-750 transition flex items-center gap-1"
                      title="Edit rincian data peminjaman"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold hidden sm:inline">Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteModalBorrow(b)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-750 transition flex items-center gap-1"
                      title="Hapus catatan peminjaman ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold hidden sm:inline">Hapus</span>
                    </button>

                    {/* Return Action Button (if not returned yet) */}
                    {!isReturned && (
                      <button
                        type="button"
                        onClick={() => {
                          setReturnModalBorrow(b);
                          setReturnCondition('Sangat Baik');
                          setReturnNotes('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1 transition active:scale-95"
                        title="Tandai peminjaman selesai dan kembalikan stok"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kembalikan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BORROWING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white">Input Form Peminjaman Alat Internal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </div>

            <form onSubmit={handleCreateBorrowing} className="p-5 space-y-3 text-xs">
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-300 font-semibold block">Nama Peminjam (Crew / Karyawan) *</label>
                  {matchedCrewAdd && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Cocok: {matchedCrewAdd.roleTitle} ({matchedCrewAdd.division})</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newBorrow.borrowerName}
                    onChange={e => handleBorrowerNameChange(e.target.value)}
                    onFocus={() => setShowCrewDropdownAdd(true)}
                    placeholder="Ketik manual nama peminjam atau pilih..."
                    className="w-full pl-3 pr-9 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCrewDropdownAdd(!showCrewDropdownAdd)}
                    className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white rounded"
                    title="Buka / Tutup Daftar Crew"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCrewDropdownAdd ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Suggestions Dropdown with auto matching */}
                {showCrewDropdownAdd && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCrewDropdownAdd(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 divide-y divide-zinc-800 animate-in fade-in">
                      <div className="p-1.5 bg-zinc-950 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                        <span>Daftar Crew & Pencocokan Otomatis:</span>
                        <span className="text-orange-400">{filteredCrewAdd.length} data</span>
                      </div>
                      {filteredCrewAdd.length === 0 ? (
                        <div className="p-3 text-center text-zinc-400 text-xs">
                          <div>Nama "{newBorrow.borrowerName}" belum ada di database Crew.</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Anda dapat mengetik manual dan mengisi divisi / kontak di bawah.</div>
                        </div>
                      ) : (
                        filteredCrewAdd.map(c => {
                          const isExact = c.name.toLowerCase() === newBorrow.borrowerName.trim().toLowerCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCrewSuggestion(c)}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-800 transition ${
                                isExact ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-zinc-200'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {isExact && <Check className="w-3.5 h-3.5 text-orange-400" />}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {c.roleTitle} • Divisi <strong className="text-zinc-300">{c.division}</strong> {c.phone ? `• ${c.phone}` : ''}
                                </div>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Pilih
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Divisi Peminjam</label>
                  <input
                    type="text"
                    value={newBorrow.division}
                    onChange={e => setNewBorrow({ ...newBorrow, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">No. Telepon / WA</label>
                  <input
                    type="text"
                    value={newBorrow.phone}
                    onChange={e => setNewBorrow({ ...newBorrow, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Peralatan yang Dipinjam *</label>
                <select
                  value={newBorrow.productId}
                  onChange={e => setNewBorrow({ ...newBorrow, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — Tersedia: {p.availableQty} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jumlah Unit *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBorrow.qty}
                    onChange={e => setNewBorrow({ ...newBorrow, qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Wajib Kembali *</label>
                  <input
                    type="date"
                    required
                    value={newBorrow.expectedReturnDate}
                    onChange={e => setNewBorrow({ ...newBorrow, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tujuan Penggunaan Alat</label>
                <textarea
                  rows={2}
                  required
                  value={newBorrow.purpose}
                  onChange={e => setNewBorrow({ ...newBorrow, purpose: e.target.value })}
                  placeholder="Contoh: Dokumentasi company profile, tes kamera, maintenance studio..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Setujui Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BORROWING MODAL */}
      {editModalBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white">
                  Edit Data Peminjaman ({editModalBorrow.borrowCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalBorrow(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 text-xs">
              {editError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-300 font-semibold block">Nama Peminjam *</label>
                  {matchedCrewEdit && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Cocok: {matchedCrewEdit.roleTitle} ({matchedCrewEdit.division})</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editFormData.borrowerName}
                    onChange={e => handleEditBorrowerNameChange(e.target.value)}
                    onFocus={() => setShowCrewDropdownEdit(true)}
                    placeholder="Ketik manual nama peminjam atau pilih..."
                    className="w-full pl-3 pr-9 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCrewDropdownEdit(!showCrewDropdownEdit)}
                    className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white rounded"
                    title="Buka / Tutup Daftar Crew"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCrewDropdownEdit ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Suggestions Dropdown with auto matching */}
                {showCrewDropdownEdit && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCrewDropdownEdit(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 divide-y divide-zinc-800 animate-in fade-in">
                      <div className="p-1.5 bg-zinc-950 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                        <span>Daftar Crew & Pencocokan Otomatis:</span>
                        <span className="text-orange-400">{filteredCrewEdit.length} data</span>
                      </div>
                      {filteredCrewEdit.length === 0 ? (
                        <div className="p-3 text-center text-zinc-400 text-xs">
                          <div>Nama "{editFormData.borrowerName}" belum ada di database Crew.</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Anda dapat mengetik manual dan mengisi divisi / kontak di bawah.</div>
                        </div>
                      ) : (
                        filteredCrewEdit.map(c => {
                          const isExact = c.name.toLowerCase() === editFormData.borrowerName.trim().toLowerCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectEditCrewSuggestion(c)}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-800 transition ${
                                isExact ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-zinc-200'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {isExact && <Check className="w-3.5 h-3.5 text-orange-400" />}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {c.roleTitle} • Divisi <strong className="text-zinc-300">{c.division}</strong> {c.phone ? `• ${c.phone}` : ''}
                                </div>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Pilih
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Divisi Peminjam</label>
                  <input
                    type="text"
                    value={editFormData.division}
                    onChange={e => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">No. HP / Kontak</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Peralatan yang Dipinjam *</label>
                <select
                  value={editFormData.productId}
                  onChange={e => setEditFormData({ ...editFormData, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — Stok Tersedia: {p.availableQty} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jumlah Unit *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editFormData.qty}
                    onChange={e => setEditFormData({ ...editFormData, qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tgl Pinjam</label>
                  <input
                    type="date"
                    required
                    value={editFormData.borrowDate}
                    onChange={e => setEditFormData({ ...editFormData, borrowDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Batas Kembali</label>
                  <input
                    type="date"
                    required
                    value={editFormData.expectedReturnDate}
                    onChange={e => setEditFormData({ ...editFormData, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Status Peminjaman</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as BorrowingRecord['status'] })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none font-semibold"
                  >
                    <option value="Dipinjam">Dipinjam (Aktif)</option>
                    <option value="Terlambat">Terlambat (Overdue)</option>
                    <option value="Dikembalikan">Dikembalikan (Selesai)</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">PIC Penyetuju</label>
                  <input
                    type="text"
                    value={editFormData.approvedByPic}
                    onChange={e => setEditFormData({ ...editFormData, approvedByPic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tujuan Penggunaan</label>
                <textarea
                  rows={2}
                  value={editFormData.purpose}
                  onChange={e => setEditFormData({ ...editFormData, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Catatan kondisi atau instruksi khusus..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalBorrow(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BORROWING CONFIRMATION MODAL */}
      {deleteModalBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Hapus Data Peminjaman</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalBorrow(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan peminjaman alat internal ini?
              </p>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-orange-400 font-bold text-[11px]">
                    {deleteModalBorrow.borrowCode}
                  </span>
                  {getBorrowingStatusBadge(deleteModalBorrow.status)}
                </div>
                <h4 className="font-bold text-white text-sm">
                  {deleteModalBorrow.productName}
                </h4>
                <div className="text-zinc-400 text-xs">
                  Jumlah: <strong className="text-white font-mono">{deleteModalBorrow.qty} {deleteModalBorrow.unit}</strong> • Peminjam: <strong className="text-zinc-200">{deleteModalBorrow.borrowerName}</strong> ({deleteModalBorrow.division})
                </div>
              </div>

              {(deleteModalBorrow.status === 'Dipinjam' || deleteModalBorrow.status === 'Terlambat') && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Stok sebanyak <strong>{deleteModalBorrow.qty} {deleteModalBorrow.unit}</strong> akan langsung dikembalikan ke stok fisik gudang yang tersedia.</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalBorrow(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModalBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="p-4 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Konfirmasi Pengembalian Alat</span>
              </h3>
              <button
                type="button"
                onClick={() => setReturnModalBorrow(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <p className="text-zinc-300">
                  Pengembalian: <strong className="text-white">{returnModalBorrow.productName}</strong> ({returnModalBorrow.qty} {returnModalBorrow.unit})
                </p>
                <p className="text-zinc-400 mt-0.5">Peminjam: {returnModalBorrow.borrowerName} ({returnModalBorrow.division})</p>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Kondisi Fisik Saat Kembali *</label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value as ItemCondition)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="Sangat Baik">Sangat Baik (Lengkap & Bersih)</option>
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Cukup">Cukup (Kotor/Wajar)</option>
                  <option value="Rusak Ringan">Rusak Ringan (Perlu Servis)</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Pengembalian</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="Kondisi kelengkapan aksesoris, kabel, box..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalBorrow(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
                >
                  Simpan Pengembalian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
