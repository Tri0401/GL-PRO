import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Wrench,
  Camera,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  X,
  FileText,
  Edit3,
  Trash2,
  Eye,
  AlertOctagon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DamageReport } from '../types';

interface InspectionDamageViewProps {
  initialProductId?: string | null;
}

export const InspectionDamageView: React.FC<InspectionDamageViewProps> = ({
  initialProductId
}) => {
  const {
    damageReports,
    reportDamage,
    updateDamageStatus,
    updateDamageReport,
    deleteDamageReport,
    products,
    events,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);

  // Edit and Delete state
  const [editingReport, setEditingReport] = useState<DamageReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<DamageReport | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    productId: string;
    unitCode: string;
    eventId: string;
    picName: string;
    damageType: DamageReport['damageType'];
    severity: DamageReport['severity'];
    status: DamageReport['status'];
    description: string;
    technicianNotes: string;
    photoUrl: string;
  }>({
    productId: '',
    unitCode: '',
    eventId: '',
    picName: '',
    damageType: 'Lampu Mati / Burn',
    severity: 'Rusak Ringan',
    status: 'Dilaporkan',
    description: '',
    technicianNotes: '',
    photoUrl: ''
  });

  // New report form state
  const [newReport, setNewReport] = useState<{
    productId: string;
    unitCode: string;
    eventId: string;
    picName: string;
    damageType: DamageReport['damageType'];
    severity: DamageReport['severity'];
    description: string;
    photoUrl?: string;
  }>({
    productId: initialProductId || products[0]?.id || '',
    unitCode: '',
    eventId: events[0]?.id || '',
    picName: currentUser.name,
    damageType: 'Lampu Mati / Burn',
    severity: 'Rusak Ringan',
    description: '',
    photoUrl: undefined
  });

  const [techNotesInput, setTechNotesInput] = useState('');

  const filteredReports = damageReports.filter(d => {
    const matchSearch =
      searchTerm === '' ||
      d.damageCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateDamage = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newReport.productId);
    const evt = events.find(e => e.id === newReport.eventId);
    if (!prod) return;

    reportDamage({
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      unitCode: newReport.unitCode || undefined,
      eventId: evt?.id,
      eventName: evt?.name,
      picName: newReport.picName,
      inspectorName: currentUser.name,
      damageType: newReport.damageType,
      severity: newReport.severity,
      description: newReport.description,
      photoUrl: newReport.photoUrl,
      reportDate: new Date().toISOString().split('T')[0],
      status: 'Dilaporkan'
    });

    setShowAddModal(false);
  };

  const handleOpenEdit = (report: DamageReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingReport(report);
    setEditFormData({
      productId: report.productId,
      unitCode: report.unitCode || '',
      eventId: report.eventId || '',
      picName: report.picName,
      damageType: report.damageType,
      severity: report.severity,
      status: report.status,
      description: report.description,
      technicianNotes: report.technicianNotes || '',
      photoUrl: report.photoUrl || ''
    });
  };

  const handleUpdateDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    const prod = products.find(p => p.id === editFormData.productId);
    const evt = events.find(ev => ev.id === editFormData.eventId);

    updateDamageReport(editingReport.id, {
      productId: prod?.id || editingReport.productId,
      productCode: prod?.code || editingReport.productCode,
      productName: prod?.name || editingReport.productName,
      unitCode: editFormData.unitCode || undefined,
      eventId: evt?.id || undefined,
      eventName: evt?.name || undefined,
      picName: editFormData.picName,
      damageType: editFormData.damageType,
      severity: editFormData.severity,
      status: editFormData.status,
      description: editFormData.description,
      technicianNotes: editFormData.technicianNotes,
      photoUrl: editFormData.photoUrl
    });

    // If currently opened in detail modal, update it
    if (selectedReport?.id === editingReport.id) {
      setSelectedReport({
        ...selectedReport,
        productId: prod?.id || editingReport.productId,
        productCode: prod?.code || editingReport.productCode,
        productName: prod?.name || editingReport.productName,
        unitCode: editFormData.unitCode || undefined,
        eventId: evt?.id || undefined,
        eventName: evt?.name || undefined,
        picName: editFormData.picName,
        damageType: editFormData.damageType,
        severity: editFormData.severity,
        status: editFormData.status,
        description: editFormData.description,
        technicianNotes: editFormData.technicianNotes,
        photoUrl: editFormData.photoUrl
      });
    }

    setEditingReport(null);
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    deleteDamageReport(reportToDelete.id);
    if (selectedReport?.id === reportToDelete.id) {
      setSelectedReport(null);
    }
    setReportToDelete(null);
  };

  const getStatusBadge = (st: DamageReport['status']) => {
    switch (st) {
      case 'Dilaporkan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">DILAPORKAN</span>;
      case 'Diperiksa':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">DIPERIKSA</span>;
      case 'Dalam Perbaikan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">DALAM PERBAIKAN</span>;
      case 'Selesai':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SELESAI (BAIK)</span>;
      case 'Tidak Dapat Digunakan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">AFKIR TOTAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">{st}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Laporan Kerusakan & Inspeksi Peralatan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dokumentasi kerusakan pasca event, foto fisik, severity level, diagnosa spare part, dan tracking penanganan teknisi.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Kerusakan</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari kode damage, nama barang, atau deskripsi..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="ALL">Semua Status Kerusakan</option>
          <option value="Dilaporkan">Dilaporkan</option>
          <option value="Diperiksa">Diperiksa</option>
          <option value="Menunggu Perbaikan">Menunggu Perbaikan</option>
          <option value="Dalam Perbaikan">Dalam Perbaikan</option>
          <option value="Selesai">Selesai</option>
          <option value="Tidak Dapat Digunakan">Tidak Dapat Digunakan</option>
        </select>
      </div>

      {/* Damage Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.length === 0 ? (
          <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs">
            Tidak ada laporan kerusakan yang tercatat.
          </div>
        ) : (
          filteredReports.map(d => (
            <div
              key={d.id}
              onClick={() => {
                setSelectedReport(d);
                setTechNotesInput(d.technicianNotes || '');
              }}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl cursor-pointer transition text-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {d.damageCode}
                  </span>
                  {getStatusBadge(d.status)}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{d.productName}</h3>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <span className="font-mono text-orange-400">{d.productCode}</span>
                    {d.unitCode && <span>({d.unitCode})</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800 text-[11px] space-y-1">
                  <div className="text-zinc-400">
                    Gejala: <strong className="text-rose-400">{d.damageType}</strong>
                  </div>
                  <div className="text-zinc-400">
                    Tingkat: <strong className="text-amber-400">{d.severity}</strong>
                  </div>
                  <p className="text-zinc-300 italic line-clamp-2">"{d.description}"</p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between gap-1">
                <span className="truncate max-w-[130px]" title={`Pelapor: ${d.picName}`}>
                  Pelapor: <strong className="text-zinc-400 font-medium">{d.picName}</strong>
                </span>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(d);
                      setTechNotesInput(d.technicianNotes || '');
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                    title="Lihat Detail & Tindak Lanjut"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEdit(d, e)}
                    className="p-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition"
                    title="Edit Data Laporan Kerusakan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportToDelete(d);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition"
                    title="Hapus Laporan Kerusakan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL & RESOLUTION MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm text-white">
                  Tindak Lanjut Kerusakan: {selectedReport.damageCode}
                </span>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-white">{selectedReport.productName}</h4>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-orange-400 font-mono font-semibold">{selectedReport.productCode}</span>
                  {selectedReport.unitCode && (
                    <span className="text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                      Unit: {selectedReport.unitCode}
                    </span>
                  )}
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">Event: {selectedReport.eventName || 'Internal Gudang'}</span>
                </div>
                <p className="text-zinc-400 text-[11px] pt-0.5">
                  Gejala: <strong className="text-rose-400">{selectedReport.damageType}</strong> ({selectedReport.severity})
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/50 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block mb-0.5">Kronologi Kerusakan:</span>
                <p className="text-zinc-200">{selectedReport.description}</p>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Diagnosa & Perbaikan Teknisi</label>
                <textarea
                  rows={2}
                  value={techNotesInput}
                  onChange={e => setTechNotesInput(e.target.value)}
                  placeholder="Spare part yang diganti, hasil tes kelistrikan, dll."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Perbarui Status Penanganan</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Diperiksa', 'Dalam Perbaikan', 'Selesai', 'Tidak Dapat Digunakan'] as DamageReport['status'][]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        updateDamageStatus(selectedReport.id, st, techNotesInput);
                        setSelectedReport({ ...selectedReport, status: st, technicianNotes: techNotesInput });
                      }}
                      className={`p-2 rounded-lg border text-xs font-semibold transition ${
                        selectedReport.status === st
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/80 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedReport;
                    setSelectedReport(null);
                    setReportToDelete(r);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                  title="Hapus data laporan kerusakan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedReport;
                    setSelectedReport(null);
                    handleOpenEdit(r);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs font-semibold transition"
                  title="Ubah data laporan kerusakan ini"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DAMAGE REPORT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">Input Laporan Kerusakan Barang Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDamage} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Pilih Peralatan Rusak *</label>
                <select
                  value={newReport.productId}
                  onChange={e => setNewReport({ ...newReport, productId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Event Terkait (Jika dari Lapangan)</label>
                <select
                  value={newReport.eventId}
                  onChange={e => setNewReport({ ...newReport, eventId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                >
                  <option value="">- Tidak terkait event spesifik (Gudang) -</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.eventCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Gejala Kerusakan</label>
                  <select
                    value={newReport.damageType}
                    onChange={e => setNewReport({ ...newReport, damageType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Lampu Mati / Burn">Lampu Mati / Burn</option>
                    <option value="Kabel Putus">Kabel Putus</option>
                    <option value="Layar Pecah/Garis">Layar Pecah/Garis</option>
                    <option value="Body Penyok">Body Penyok / Terbentur</option>
                    <option value="Port / Connector Rusak">Port / Connector Rusak</option>
                    <option value="Mati Total">Mati Total</option>
                    <option value="Komponen Hilang">Komponen / Knob Hilang</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tingkat Keparahan</label>
                  <select
                    value={newReport.severity}
                    onChange={e => setNewReport({ ...newReport, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Tidak Dapat Digunakan">Tidak Dapat Digunakan (Afkir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Deskripsi & Kronologi Kerusakan</label>
                <textarea
                  rows={3}
                  required
                  value={newReport.description}
                  onChange={e => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Jelaskan saat apa kerusakan terjadi, indikator error pada layar, bau terbakar, dll."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Kirim Laporan Kerusakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DAMAGE REPORT MODAL */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white">
                  Edit Laporan Kerusakan: <span className="font-mono text-orange-400">{editingReport.damageCode}</span>
                </h3>
              </div>
              <button onClick={() => setEditingReport(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDamage} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Peralatan Rusak *</label>
                  <select
                    value={editFormData.productId}
                    onChange={e => setEditFormData({ ...editFormData, productId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Unit Code / Serial Number</label>
                  <input
                    type="text"
                    value={editFormData.unitCode}
                    onChange={e => setEditFormData({ ...editFormData, unitCode: e.target.value })}
                    placeholder="Contoh: SN-49201 / Unit-B"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Event Terkait</label>
                  <select
                    value={editFormData.eventId}
                    onChange={e => setEditFormData({ ...editFormData, eventId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">- Tidak Terkait Event Spesifik (Gudang) -</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.eventCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Pelapor *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.picName}
                    onChange={e => setEditFormData({ ...editFormData, picName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Gejala Kerusakan</label>
                  <select
                    value={editFormData.damageType}
                    onChange={e => setEditFormData({ ...editFormData, damageType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Lampu Mati / Burn">Lampu Mati / Burn</option>
                    <option value="Kabel Putus">Kabel Putus</option>
                    <option value="Layar Pecah/Garis">Layar Pecah/Garis</option>
                    <option value="Body Penyok">Body Penyok / Terbentur</option>
                    <option value="Port / Connector Rusak">Port / Connector Rusak</option>
                    <option value="Mati Total">Mati Total</option>
                    <option value="Komponen Hilang">Komponen / Knob Hilang</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tingkat Keparahan</label>
                  <select
                    value={editFormData.severity}
                    onChange={e => setEditFormData({ ...editFormData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Tidak Dapat Digunakan">Tidak Dapat Digunakan (Afkir)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Status Penanganan</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="Dilaporkan">Dilaporkan</option>
                    <option value="Diperiksa">Diperiksa</option>
                    <option value="Menunggu Perbaikan">Menunggu Perbaikan</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                    <option value="Selesai">Selesai (Diperbaiki)</option>
                    <option value="Tidak Dapat Digunakan">Tidak Dapat Digunakan (Afkir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Deskripsi & Kronologi Kerusakan *</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Detail kronologi kerusakan saat terjadi..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Diagnosa & Perbaikan Teknisi</label>
                <textarea
                  rows={2}
                  value={editFormData.technicianNotes}
                  onChange={e => setEditFormData({ ...editFormData, technicianNotes: e.target.value })}
                  placeholder="Spare part yang diganti, catatan uji kelistrikan, teknisi yang menangani..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-md transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hapus Laporan Kerusakan?</h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{reportToDelete.damageCode}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Peralatan:</span>
                  <span className="font-semibold text-white">{reportToDelete.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gejala & Tingkat:</span>
                  <span className="text-rose-400 font-medium">{reportToDelete.damageType} ({reportToDelete.severity})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Status Saat Ini:</span>
                  <span>{getStatusBadge(reportToDelete.status)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                <p>
                  <strong>Perhatian:</strong> Data laporan ini akan dihapus secara permanen. Jika status kerusakan masih aktif, sistem akan secara otomatis mengembalikan stok unit ke status <strong>Tersedia (Available)</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportToDelete(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Laporan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
