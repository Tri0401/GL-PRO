import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  X,
  UserCheck,
  Edit3,
  Trash2,
  Eye,
  AlertOctagon,
  RefreshCw,
  Grid,
  List,
  DollarSign,
  Tag,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MaintenanceRecord, ItemCondition } from '../types';

export const MaintenanceView: React.FC = () => {
  const {
    maintenanceRecords,
    addMaintenance,
    updateMaintenanceStatus,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    products,
    crew
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

  // New Maintenance Form State
  const [newMnt, setNewMnt] = useState<Partial<MaintenanceRecord>>({
    productId: products[0]?.id || '',
    unitCode: '',
    maintenanceType: 'Pembersihan & Kalibrasi',
    technicianName: 'Feri Irawan',
    scheduleDate: new Date().toISOString().split('T')[0],
    conditionBefore: 'Baik',
    notes: '',
    status: 'Segera Dilakukan',
    cost: 0
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<{
    productId: string;
    unitCode: string;
    maintenanceType: MaintenanceRecord['maintenanceType'];
    technicianName: string;
    scheduleDate: string;
    completionDate: string;
    conditionBefore: ItemCondition;
    conditionAfter: ItemCondition;
    notes: string;
    status: MaintenanceRecord['status'];
    nextMaintenanceDate: string;
    cost: number;
  }>({
    productId: '',
    unitCode: '',
    maintenanceType: 'Pembersihan & Kalibrasi',
    technicianName: '',
    scheduleDate: '',
    completionDate: '',
    conditionBefore: 'Baik',
    conditionAfter: 'Sangat Baik',
    notes: '',
    status: 'Segera Dilakukan',
    nextMaintenanceDate: '',
    cost: 0
  });

  // Calculate summary counts
  const totalCount = maintenanceRecords.length;
  const pendingCount = maintenanceRecords.filter(m => m.status === 'Segera Dilakukan').length;
  const inProgressCount = maintenanceRecords.filter(m => m.status === 'Dalam Proses').length;
  const completedCount = maintenanceRecords.filter(m => m.status === 'Selesai').length;
  const cancelledCount = maintenanceRecords.filter(m => m.status === 'Dibatalkan').length;

  // Filtered maintenance list
  const filtered = maintenanceRecords.filter(m => {
    const matchSearch =
      searchTerm === '' ||
      m.maintenanceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.unitCode && m.unitCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchType = typeFilter === 'ALL' || m.maintenanceType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Handle open Edit Modal
  const handleOpenEdit = (record: MaintenanceRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRecord(record);
    setEditFormData({
      productId: record.productId,
      unitCode: record.unitCode || '',
      maintenanceType: record.maintenanceType,
      technicianName: record.technicianName,
      scheduleDate: record.scheduleDate,
      completionDate: record.completionDate || '',
      conditionBefore: record.conditionBefore,
      conditionAfter: record.conditionAfter || 'Sangat Baik',
      notes: record.notes,
      status: record.status,
      nextMaintenanceDate: record.nextMaintenanceDate || '',
      cost: record.cost || 0
    });
  };

  // Handle save edited record
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const prod = products.find(p => p.id === editFormData.productId);

    updateMaintenanceRecord(editingRecord.id, {
      productId: editFormData.productId,
      productCode: prod?.code || editingRecord.productCode,
      productName: prod?.name || editingRecord.productName,
      unitCode: editFormData.unitCode || undefined,
      maintenanceType: editFormData.maintenanceType,
      technicianName: editFormData.technicianName,
      scheduleDate: editFormData.scheduleDate,
      completionDate: editFormData.status === 'Selesai' 
        ? (editFormData.completionDate || new Date().toISOString().split('T')[0]) 
        : undefined,
      conditionBefore: editFormData.conditionBefore,
      conditionAfter: editFormData.status === 'Selesai' ? editFormData.conditionAfter : undefined,
      notes: editFormData.notes,
      status: editFormData.status,
      nextMaintenanceDate: editFormData.nextMaintenanceDate || undefined,
      cost: Number(editFormData.cost) || 0
    });

    // If active selected view modal was this record, update it too
    if (selectedRecord && selectedRecord.id === editingRecord.id) {
      setSelectedRecord({
        ...selectedRecord,
        productId: editFormData.productId,
        productCode: prod?.code || editingRecord.productCode,
        productName: prod?.name || editingRecord.productName,
        unitCode: editFormData.unitCode || undefined,
        maintenanceType: editFormData.maintenanceType,
        technicianName: editFormData.technicianName,
        scheduleDate: editFormData.scheduleDate,
        completionDate: editFormData.status === 'Selesai' ? (editFormData.completionDate || new Date().toISOString().split('T')[0]) : undefined,
        conditionBefore: editFormData.conditionBefore,
        conditionAfter: editFormData.status === 'Selesai' ? editFormData.conditionAfter : undefined,
        notes: editFormData.notes,
        status: editFormData.status,
        nextMaintenanceDate: editFormData.nextMaintenanceDate || undefined,
        cost: Number(editFormData.cost) || 0
      });
    }

    setEditingRecord(null);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    deleteMaintenanceRecord(recordToDelete.id);
    if (selectedRecord?.id === recordToDelete.id) {
      setSelectedRecord(null);
    }
    setRecordToDelete(null);
  };

  // Handle create new maintenance
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newMnt.productId);
    if (!prod) return;

    addMaintenance({
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      unitCode: newMnt.unitCode || undefined,
      maintenanceType: newMnt.maintenanceType as any,
      technicianName: newMnt.technicianName || 'Feri Irawan',
      scheduleDate: newMnt.scheduleDate || new Date().toISOString().split('T')[0],
      conditionBefore: newMnt.conditionBefore as any || 'Baik',
      notes: newMnt.notes || '',
      status: 'Segera Dilakukan',
      nextMaintenanceDate: newMnt.nextMaintenanceDate || undefined,
      cost: Number(newMnt.cost) || 0
    });

    setShowAddModal(false);
  };

  const getStatusBadge = (status: MaintenanceRecord['status']) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Dalam Proses</span>
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-600/40">
            Dibatalkan
          </span>
        );
      case 'Segera Dilakukan':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Segera Dilakukan</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-400" />
            <span>Jadwal Maintenance & Servis Berkala</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pembersihan fader konsol audio, kalibrasi moving head, pengecekan cabinet LED, tracking perbaikan teknisi, edit dan hapus data.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Jadwalkan Maintenance</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Total Jadwal</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-amber-400 font-medium">Segera Dilakukan</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-orange-400 font-medium">Dalam Proses</p>
            <p className="text-xl font-bold text-orange-300 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-400 font-medium">Selesai Normal</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari kode MNT, nama barang, kode unit, atau teknisi..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Semua Status ({totalCount})</option>
            <option value="Segera Dilakukan">Segera Dilakukan ({pendingCount})</option>
            <option value="Dalam Proses">Dalam Proses ({inProgressCount})</option>
            <option value="Selesai">Selesai ({completedCount})</option>
            <option value="Dibatalkan">Dibatalkan ({cancelledCount})</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Servis</option>
            <option value="Pembersihan & Kalibrasi">Pembersihan & Kalibrasi</option>
            <option value="Ganti Komponen / Sparepart">Ganti Sparepart</option>
            <option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option>
            <option value="Update Firmware">Update Firmware</option>
            <option value="Perbaikan Mekanikal">Perbaikan Mekanikal</option>
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition ${
                viewMode === 'grid' ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tampilan Kartu"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition ${
                viewMode === 'table' ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs space-y-2">
          <Wrench className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="font-semibold text-zinc-300">Tidak ada jadwal maintenance yang sesuai filter.</p>
          <p className="text-zinc-500">Coba ubah kata kunci pencarian atau reset filter status.</p>
          {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-xs font-medium"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const isPending = m.status === 'Segera Dilakukan';
            const isInProgress = m.status === 'Dalam Proses';

            return (
              <div
                key={m.id}
                onClick={() => setSelectedRecord(m)}
                className={`p-4 rounded-2xl border transition text-xs space-y-3 flex flex-col justify-between cursor-pointer hover:border-zinc-700 ${
                  isPending
                    ? 'bg-zinc-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isInProgress
                    ? 'bg-zinc-900 border-orange-500/40 shadow-lg shadow-orange-500/5'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {m.maintenanceCode}
                    </span>
                    {getStatusBadge(m.status)}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{m.productName}</h3>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-orange-400 font-semibold">{m.productCode}</span>
                      {m.unitCode && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                          Unit: {m.unitCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Jenis:</span>
                      <strong className="text-zinc-200">{m.maintenanceType}</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Teknisi:</span>
                      <strong className="text-orange-300">{m.technicianName}</strong>
                    </div>
                    {m.cost && m.cost > 0 ? (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Biaya/Part:</span>
                        <strong className="text-emerald-400">Rp {m.cost.toLocaleString('id-ID')}</strong>
                      </div>
                    ) : null}
                    <p className="text-zinc-300 italic pt-1 border-t border-zinc-800/60 line-clamp-2">
                      "{m.notes}"
                    </p>
                  </div>

                  {m.nextMaintenanceDate && (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Jatuh Tempo: {m.nextMaintenanceDate}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Card Footer */}
                <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                  <div className="text-[10px] text-zinc-500">
                    <span>Jadwal: {m.scheduleDate}</span>
                    {m.completionDate && m.status === 'Selesai' && (
                      <span className="block text-emerald-400">Selesai: {m.completionDate}</span>
                    )}
                  </div>

                  {/* Action Buttons: Quick Status + Edit + Delete */}
                  <div className="flex items-center gap-1.5">
                    {m.status === 'Segera Dilakukan' && (
                      <button
                        onClick={() => updateMaintenanceStatus(m.id, 'Dalam Proses')}
                        className="px-2 py-1 rounded-lg bg-orange-600/30 hover:bg-orange-600 text-orange-300 hover:text-white font-medium text-[11px] transition flex items-center gap-1 border border-orange-500/40"
                        title="Mulai Pengerjaan Teknisi"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Kerjakan</span>
                      </button>
                    )}

                    {m.status === 'Dalam Proses' && (
                      <button
                        onClick={() => updateMaintenanceStatus(m.id, 'Selesai', 'Sangat Baik')}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 transition"
                        title="Tandai Selesai & Kondisi Normal"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selesai</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedRecord(m)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      title="Lihat Rincian Maintenance"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleOpenEdit(m, e)}
                      className="p-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition"
                      title="Edit Data Maintenance"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecordToDelete(m);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition"
                      title="Hapus Data Maintenance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode & Jadwal</th>
                  <th className="py-3 px-4">Peralatan / Unit</th>
                  <th className="py-3 px-4">Jenis Maintenance</th>
                  <th className="py-3 px-4">Teknisi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedRecord(m)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-orange-400 block">
                        {m.maintenanceCode}
                      </span>
                      <span className="text-[10px] text-zinc-500">{m.scheduleDate}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{m.productName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {m.productCode} {m.unitCode ? `(${m.unitCode})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-300">
                      {m.maintenanceType}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-200">
                      <span className="font-medium text-orange-300">{m.technicianName}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(m.status)}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-400">
                      {m.notes}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(m)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(m, e)}
                          className="p-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecordToDelete(m);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {selectedRecord.maintenanceCode}
                </span>
                <span className="text-xs text-zinc-400 font-medium">Rincian Perawatan</span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white">{selectedRecord.productName}</h3>
                  <p className="text-zinc-400 font-mono mt-0.5">
                    {selectedRecord.productCode} {selectedRecord.unitCode ? `• Unit ID: ${selectedRecord.unitCode}` : ''}
                  </p>
                </div>
                <div>{getStatusBadge(selectedRecord.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-black/50 border border-zinc-800 rounded-xl">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Jenis Maintenance</span>
                  <span className="font-semibold text-white">{selectedRecord.maintenanceType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Teknisi Bertugas</span>
                  <span className="font-semibold text-orange-300">{selectedRecord.technicianName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Tanggal Jadwal</span>
                  <span className="font-semibold text-zinc-200">{selectedRecord.scheduleDate}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Tanggal Selesai</span>
                  <span className="font-semibold text-zinc-200">{selectedRecord.completionDate || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Kondisi Awal</span>
                  <span className="font-semibold text-zinc-200">{selectedRecord.conditionBefore}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Kondisi Setelahnya</span>
                  <span className="font-semibold text-emerald-400">{selectedRecord.conditionAfter || '-'}</span>
                </div>
                {selectedRecord.cost ? (
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Biaya Servis/Part</span>
                    <span className="font-semibold text-emerald-400">Rp {selectedRecord.cost.toLocaleString('id-ID')}</span>
                  </div>
                ) : null}
                {selectedRecord.nextMaintenanceDate && (
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Servis Berkala Berikutnya</span>
                    <span className="font-semibold text-amber-400">{selectedRecord.nextMaintenanceDate}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-zinc-400 block font-semibold mb-1">Catatan & Poin Pengerjaan:</span>
                <div className="p-3 bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {selectedRecord.notes || 'Tidak ada catatan tambahan.'}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rec = selectedRecord;
                      setSelectedRecord(null);
                      setRecordToDelete(rec);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-medium flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Data</span>
                  </button>
                  <button
                    onClick={() => {
                      const rec = selectedRecord;
                      setSelectedRecord(null);
                      handleOpenEdit(rec);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 font-medium flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRecord.status !== 'Selesai' && (
                    <button
                      onClick={() => {
                        updateMaintenanceStatus(selectedRecord.id, 'Selesai', 'Sangat Baik');
                        setSelectedRecord(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MAINTENANCE MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white">
                  Edit Data Maintenance ({editingRecord.maintenanceCode})
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Pilih Peralatan / Unit *
                </label>
                <select
                  value={editFormData.productId}
                  onChange={e => setEditFormData({ ...editFormData, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kode Unit Spesifik (Opsional)</label>
                  <input
                    type="text"
                    value={editFormData.unitCode}
                    onChange={e => setEditFormData({ ...editFormData, unitCode: e.target.value })}
                    placeholder="Contoh: MH-012, CL5-01"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jenis Maintenance *</label>
                  <select
                    value={editFormData.maintenanceType}
                    onChange={e => setEditFormData({ ...editFormData, maintenanceType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Pembersihan & Kalibrasi">Pembersihan & Kalibrasi</option>
                    <option value="Ganti Komponen / Sparepart">Ganti Komponen / Sparepart</option>
                    <option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option>
                    <option value="Update Firmware">Update Firmware</option>
                    <option value="Perbaikan Mekanikal">Perbaikan Mekanikal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Teknisi Penanggung Jawab *</label>
                  <select
                    value={editFormData.technicianName}
                    onChange={e => setEditFormData({ ...editFormData, technicianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {crew.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.division})
                      </option>
                    ))}
                    {!crew.some(c => c.name === editFormData.technicianName) && editFormData.technicianName && (
                      <option value={editFormData.technicianName}>{editFormData.technicianName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Status Pengerjaan *</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium"
                  >
                    <option value="Segera Dilakukan">Segera Dilakukan</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Jadwal *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.scheduleDate}
                    onChange={e => setEditFormData({ ...editFormData, scheduleDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Selesai (Jika Selesai)</label>
                  <input
                    type="date"
                    value={editFormData.completionDate}
                    onChange={e => setEditFormData({ ...editFormData, completionDate: e.target.value })}
                    disabled={editFormData.status !== 'Selesai'}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kondisi Sebelum Servis</label>
                  <select
                    value={editFormData.conditionBefore}
                    onChange={e => setEditFormData({ ...editFormData, conditionBefore: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kondisi Setelah Servis</label>
                  <select
                    value={editFormData.conditionAfter}
                    onChange={e => setEditFormData({ ...editFormData, conditionAfter: e.target.value as any })}
                    disabled={editFormData.status !== 'Selesai'}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white disabled:opacity-40"
                  >
                    <option value="Sangat Baik">Sangat Baik (Normal 100%)</option>
                    <option value="Baik">Baik (Layak Event)</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Rusak Ringan">Rusak Ringan (Terbatas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Biaya Servis / Sparepart (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.cost}
                    onChange={e => setEditFormData({ ...editFormData, cost: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jadwal Servis Berkala Berikutnya</label>
                  <input
                    type="date"
                    value={editFormData.nextMaintenanceDate}
                    onChange={e => setEditFormData({ ...editFormData, nextMaintenanceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Catatan Instruksi Perbaikan / Poin Cek *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Instruksi, diagnosa teknisi, penggantian komponen..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-rose-950/30">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Konfirmasi Hapus Maintenance</h3>
              </div>
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus data jadwal maintenance{' '}
                <strong className="text-orange-400 font-mono">{recordToDelete.maintenanceCode}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1.5 text-zinc-300">
                <div>
                  Peralatan: <strong className="text-white">{recordToDelete.productName}</strong>
                </div>
                <div>
                  Teknisi: <strong className="text-zinc-200">{recordToDelete.technicianName}</strong>
                </div>
                <div>
                  Jadwal: <span className="text-zinc-400">{recordToDelete.scheduleDate}</span>
                </div>
                <div>
                  Status Saat Ini: <span className="font-semibold text-amber-400">{recordToDelete.status}</span>
                </div>
              </div>

              {(recordToDelete.status === 'Segera Dilakukan' || recordToDelete.status === 'Dalam Proses') && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Stok barang yang saat ini tercatat dalam pemeliharaan (in maintenance) akan otomatis dikembalikan ke kuantitas siap pakai (available stock).
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MAINTENANCE MODAL (ADD) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Jadwalkan Maintenance Peralatan Baru</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Pilih Barang yang Dimaintenance *</label>
                <select
                  value={newMnt.productId}
                  onChange={e => setNewMnt({ ...newMnt, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - Tersedia: {p.availableQty} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kode Unit Spesifik (Opsional)</label>
                  <input
                    type="text"
                    value={newMnt.unitCode}
                    onChange={e => setNewMnt({ ...newMnt, unitCode: e.target.value })}
                    placeholder="Contoh: MH-005, CAM-002"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jenis Maintenance *</label>
                  <select
                    value={newMnt.maintenanceType}
                    onChange={e => setNewMnt({ ...newMnt, maintenanceType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Pembersihan & Kalibrasi">Pembersihan & Kalibrasi</option>
                    <option value="Ganti Komponen / Sparepart">Ganti Komponen / Sparepart</option>
                    <option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option>
                    <option value="Update Firmware">Update Firmware</option>
                    <option value="Perbaikan Mekanikal">Perbaikan Mekanikal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Teknisi Penanggung Jawab *</label>
                  <select
                    value={newMnt.technicianName}
                    onChange={e => setNewMnt({ ...newMnt, technicianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {crew.filter(c => c.division === 'Teknisi' || c.division === 'Warehouse').map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.division})
                      </option>
                    ))}
                    {crew.filter(c => c.division !== 'Teknisi' && c.division !== 'Warehouse').map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.division})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Jadwal Pelaksanaan *</label>
                  <input
                    type="date"
                    required
                    value={newMnt.scheduleDate}
                    onChange={e => setNewMnt({ ...newMnt, scheduleDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kondisi Awal Saat Masuk</label>
                  <select
                    value={newMnt.conditionBefore}
                    onChange={e => setNewMnt({ ...newMnt, conditionBefore: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Estimasi Biaya / Part (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={newMnt.cost || ''}
                    onChange={e => setNewMnt({ ...newMnt, cost: Number(e.target.value) })}
                    placeholder="Contoh: 150000"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Jadwal Servis Berkala Berikutnya (Opsional)</label>
                <input
                  type="date"
                  value={newMnt.nextMaintenanceDate || ''}
                  onChange={e => setNewMnt({ ...newMnt, nextMaintenanceDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Instruksi Perbaikan / Poin Cek *</label>
                <textarea
                  rows={3}
                  required
                  value={newMnt.notes}
                  onChange={e => setNewMnt({ ...newMnt, notes: e.target.value })}
                  placeholder="Ganti belt pan/tilt, bersihkan cermin optik, lubrikasi fan, kalibrasi fader..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
