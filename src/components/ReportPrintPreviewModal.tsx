import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Edit3,
  Check,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Building,
  Calendar,
  User,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { ReportKopData, DEFAULT_REPORT_KOP, generateStyledReportPDF, exportToExcel } from '../utils/exportUtils';

interface ReportPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  reportType: string;
  rawObjects?: Record<string, any>[];
}

const STORAGE_KEY = 'GLPRO_REPORT_KOP_CONFIG';

export const ReportPrintPreviewModal: React.FC<ReportPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  headers,
  rows,
  reportType,
  rawObjects = []
}) => {
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Load custom KOP from localStorage or default
  const [kop, setKop] = useState<ReportKopData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_REPORT_KOP,
          ...parsed,
          reportTitle: title || parsed.reportTitle || DEFAULT_REPORT_KOP.reportTitle,
          documentNumber: `GLP/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${reportType.toUpperCase().slice(0, 4)}`
        };
      }
    } catch (e) {
      console.warn('Failed to load custom KOP from localStorage', e);
    }
    return {
      ...DEFAULT_REPORT_KOP,
      reportTitle: title || DEFAULT_REPORT_KOP.reportTitle,
      documentNumber: `GLP/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${reportType.toUpperCase().slice(0, 4)}`
    };
  });

  // State to toggle the Kop editing drawer
  const [showKopEditor, setShowKopEditor] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    headers.length > 7 ? 'landscape' : 'portrait'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Synchronize title when report changes
  useEffect(() => {
    if (title) {
      setKop(prev => ({
        ...prev,
        reportTitle: title,
        documentNumber: `GLP/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${reportType.toUpperCase().slice(0, 4)}`
      }));
    }
  }, [title, reportType]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const filename = `Laporan_${reportType}_${new Date().toISOString().split('T')[0]}`;
    generateStyledReportPDF(kop.reportTitle || title, headers, rows, filename, kop, orientation);
  };

  const handleSaveKopAsDefault = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kop));
      setSaveSuccessMsg('Kop surat berhasil disimpan sebagai default!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Failed to save Kop', e);
    }
  };

  const handleResetKop = () => {
    setKop({
      ...DEFAULT_REPORT_KOP,
      reportTitle: title,
      documentNumber: `GLP/REP/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${reportType.toUpperCase().slice(0, 4)}`
    });
    localStorage.removeItem(STORAGE_KEY);
    setSaveSuccessMsg('Kop surat dikembalikan ke format awal.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        
        {/* Top Action Bar (Hidden during Print) */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 gap-2 shrink-0 print-hide">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs">
              GL PRO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">Pratinjau Cetak Laporan PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30 uppercase">
                  Tabel Orange-Putih
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {kop.reportTitle} • {rows.length} Data Terdaftar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Toggle Kop Editor Button */}
            <button
              onClick={() => setShowKopEditor(!showKopEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                showKopEditor
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
              }`}
              title="Buka panel edit KOP Surat & data penandatangan"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showKopEditor ? 'Tutup Edit Kop' : 'Edit Kop Surat'}</span>
              {showKopEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Orientation Toggle */}
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl p-0.5 text-[11px]">
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded-lg transition font-medium ${
                  orientation === 'portrait' ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded-lg transition font-medium ${
                  orientation === 'landscape' ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Landscape
              </button>
            </div>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
              title="Unduh file .pdf langsung"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            {/* Print / Save via Browser Dialog */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition active:scale-95"
              title="Buka dialog cetak browser / Simpan ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Close / Batal Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition flex items-center gap-1.5"
              title="Batal dan tutup pratinjau"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
          </div>
        </div>

        {/* Collapsible KOP & Meta Editor Drawer */}
        {showKopEditor && (
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 overflow-y-auto max-h-64 sm:max-h-72 print-hide animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <Building className="w-4 h-4" />
                <span>Pengaturan Kop Surat & Informasi Laporan</span>
              </div>
              <div className="flex items-center gap-2">
                {saveSuccessMsg && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveKopAsDefault}
                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold transition"
                >
                  Simpan Kop Default
                </button>
                <button
                  type="button"
                  onClick={handleResetKop}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nama Perusahaan / Instansi</label>
                <input
                  type="text"
                  value={kop.companyName}
                  onChange={e => setKop({ ...kop, companyName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Sub-judul / Bidang Usaha</label>
                <input
                  type="text"
                  value={kop.companyTagline}
                  onChange={e => setKop({ ...kop, companyTagline: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Alamat Kantor / Gudang</label>
                <input
                  type="text"
                  value={kop.companyAddress}
                  onChange={e => setKop({ ...kop, companyAddress: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Kontak / No Telp & Email</label>
                <input
                  type="text"
                  value={kop.companyContact}
                  onChange={e => setKop({ ...kop, companyContact: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nomor Dokumen / Surat</label>
                <input
                  type="text"
                  value={kop.documentNumber}
                  onChange={e => setKop({ ...kop, documentNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-orange-400 text-xs font-mono font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Judul Laporan</label>
                <input
                  type="text"
                  value={kop.reportTitle}
                  onChange={e => setKop({ ...kop, reportTitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Periode Laporan</label>
                <input
                  type="text"
                  value={kop.reportPeriod}
                  onChange={e => setKop({ ...kop, reportPeriod: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Kota & Tanggal Tanda Tangan</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={kop.signatureCity}
                    onChange={e => setKop({ ...kop, signatureCity: e.target.value })}
                    placeholder="Kota"
                    className="w-1/2 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={kop.signatureDate}
                    onChange={e => setKop({ ...kop, signatureDate: e.target.value })}
                    placeholder="Tanggal"
                    className="w-1/2 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nama Pembuat (Kiri)</label>
                <input
                  type="text"
                  value={kop.preparedBy}
                  onChange={e => setKop({ ...kop, preparedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Jabatan Pembuat</label>
                <input
                  type="text"
                  value={kop.preparedByRole}
                  onChange={e => setKop({ ...kop, preparedByRole: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nama Penyetuju (Kanan)</label>
                <input
                  type="text"
                  value={kop.approvedBy}
                  onChange={e => setKop({ ...kop, approvedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Jabatan Penyetuju</label>
                <input
                  type="text"
                  value={kop.approvedByRole}
                  onChange={e => setKop({ ...kop, approvedByRole: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Paper Canvas Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-900/60 flex justify-center items-start">
          
          {/* Printable White Sheet with Authentic Paper Mockup & Orange Table */}
          <div
            ref={printAreaRef}
            id="report-printable-area"
            className={`bg-white text-slate-900 shadow-2xl transition-all duration-200 font-sans print:shadow-none print:w-full print:max-w-none print:p-0 ${
              orientation === 'landscape'
                ? 'w-full max-w-[1100px] p-6 sm:p-10 rounded-xl'
                : 'w-full max-w-[850px] p-6 sm:p-10 rounded-xl min-h-[1050px]'
            }`}
          >
            {/* 1. KOP SURAT (Letterhead) */}
            <div className="border-b-2 border-orange-600 pb-3 mb-1">
              <div className="flex items-start justify-between gap-4">
                
                {/* Logo & Company Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex flex-col items-center justify-center font-black shadow-md border-2 border-orange-700 shrink-0">
                    <span className="text-base tracking-tighter leading-none">GL</span>
                    <span className="text-[9px] tracking-widest leading-none mt-0.5">PRO</span>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                      {kop.companyName}
                    </h1>
                    <p className="text-[11px] font-semibold text-orange-700 leading-snug">
                      {kop.companyTagline}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                      {kop.companyAddress}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      {kop.companyContact}
                    </p>
                  </div>
                </div>

                {/* Document Metadata Badge Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-right shrink-0 min-w-[170px]">
                  <div className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">
                    Nomor Dokumen
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {kop.documentNumber}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500 mt-1">
                    Tanggal: {kop.signatureDate}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500">
                    Halaman: 1 / 1
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Thin Orange Accent Line */}
            <div className="h-0.5 bg-orange-300 w-full mb-4" />

            {/* 2. Document Title & Period Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {kop.reportTitle}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 font-medium">
                  <span className="font-semibold text-orange-700">Periode:</span>
                  <span>{kop.reportPeriod}</span>
                  <span>•</span>
                  <span>Total {rows.length} Baris Data</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>DOKUMEN RESMI GL PRO</span>
                </span>
              </div>
            </div>

            {/* 3. Orange & White Themed Table (Tertata Rapi & Presisi) */}
            <div className="overflow-x-auto rounded-lg border border-orange-300 mb-6 shadow-xs">
              <table className="w-full border-collapse text-left text-xs font-sans">
                {/* Table Header: Orange Background with Bold White Text */}
                <thead>
                  <tr className="bg-orange-600 text-white font-extrabold border-b-2 border-orange-700 text-[11px] uppercase tracking-wide">
                    <th className="py-2.5 px-2.5 text-center w-10 border-r border-orange-500/50">
                      No.
                    </th>
                    {headers.map((h, idx) => (
                      <th
                        key={idx}
                        className={`py-2.5 px-3 border-r border-orange-500/50 last:border-r-0 ${
                          h.toLowerCase().includes('qty') ||
                          h.toLowerCase().includes('total') ||
                          h.toLowerCase().includes('selisih') ||
                          h.toLowerCase().includes('tersedia')
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body: Alternating White and Warm Tinted Orange Rows */}
                <tbody className="divide-y divide-orange-200/70 text-slate-800">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length + 1} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data yang tersedia untuk laporan ini.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => {
                      const isEven = rIdx % 2 === 1;
                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors print-avoid-break ${
                            isEven ? 'bg-orange-50/40 hover:bg-orange-100/50' : 'bg-white hover:bg-orange-50/70'
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-2 px-2.5 text-center font-bold text-slate-500 text-[11px] border-r border-orange-100">
                            {rIdx + 1}
                          </td>

                          {/* Data Cells */}
                          {row.map((cell, cIdx) => {
                            const headerName = headers[cIdx]?.toLowerCase() || '';
                            const cellStr = String(cell ?? '-');

                            // Detect special columns for styled presentation
                            const isCode =
                              headerName.includes('kode') ||
                              headerName.includes('surat jalan') ||
                              headerName.includes('no');

                            const isNumeric =
                              headerName.includes('qty') ||
                              headerName.includes('total') ||
                              headerName.includes('selisih') ||
                              headerName.includes('tersedia') ||
                              headerName.includes('kembali') ||
                              headerName.includes('keluar');

                            const isStatus = headerName.includes('status') || headerName.includes('kondisi') || headerName.includes('severity');

                            return (
                              <td
                                key={cIdx}
                                className={`py-2 px-3 text-[11px] border-r border-orange-100/80 last:border-r-0 leading-snug ${
                                  isNumeric ? 'text-center font-semibold text-slate-900 font-mono' : ''
                                }`}
                              >
                                {isCode ? (
                                  <span className="font-mono font-bold text-orange-950 bg-orange-100/80 px-1.5 py-0.5 rounded text-[10px] border border-orange-200">
                                    {cellStr}
                                  </span>
                                ) : isStatus ? (
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      cellStr.toUpperCase().includes('TERSEDIA') ||
                                      cellStr.toUpperCase().includes('BAIK') ||
                                      cellStr.toUpperCase().includes('LENGKAP') ||
                                      cellStr.toUpperCase().includes('SELESAI') ||
                                      cellStr.toUpperCase().includes('CONFIRMED')
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : cellStr.toUpperCase().includes('RUSAK') ||
                                          cellStr.toUpperCase().includes('CRITICAL') ||
                                          cellStr.toUpperCase().includes('SELISIH') ||
                                          cellStr.toUpperCase().includes('HILANG')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    {cellStr}
                                  </span>
                                ) : (
                                  <span>{cellStr}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer: Summary */}
                <tfoot>
                  <tr className="bg-orange-100/80 text-slate-900 font-bold border-t-2 border-orange-500 text-[11px]">
                    <td colSpan={2} className="py-2.5 px-3">
                      Total Data: {rows.length} Baris
                    </td>
                    <td colSpan={headers.length - 1} className="py-2.5 px-3 text-right text-orange-950">
                      Sistem Inventaris & Operasional GL PRO PRODUCTION
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Notes / Disclaimers */}
            {kop.notes && (
              <div className="mb-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                <span className="font-bold text-slate-700">Catatan: </span>
                <span>{kop.notes}</span>
              </div>
            )}

            {/* 5. Signature Section (Dibuat & Disetujui) */}
            <div className="mt-8 pt-4 border-t border-slate-200 print-avoid-break">
              <div className="flex items-start justify-between gap-6 px-4">
                
                {/* Left Signature: Pembuat Laporan */}
                <div className="text-center w-56">
                  <p className="text-[11px] font-medium text-slate-600">Dibuat & Diverifikasi Oleh,</p>
                  <p className="text-[10px] text-slate-500 mb-14">{kop.preparedByRole}</p>
                  
                  <div className="border-b-2 border-slate-400 w-44 mx-auto mb-1" />
                  <p className="font-bold text-xs text-slate-900 uppercase">
                    ( {kop.preparedBy} )
                  </p>
                  <p className="text-[9px] text-slate-400">Staff Operasional Logistik</p>
                </div>

                {/* Middle: Verification Seal / Stamp */}
                <div className="hidden sm:flex flex-col items-center justify-center pt-2">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-orange-400 flex flex-col items-center justify-center p-1 text-center rotate-[-12deg] bg-orange-50/50">
                    <span className="text-[7px] font-black text-orange-700 uppercase tracking-tighter">GL PRO</span>
                    <span className="text-[6px] font-bold text-orange-600">OPERATIONAL</span>
                    <span className="text-[6px] text-slate-500 font-mono">VERIFIED</span>
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1 font-mono">Sistem Terverifikasi</span>
                </div>

                {/* Right Signature: Menyetujui */}
                <div className="text-center w-56">
                  <p className="text-[11px] font-medium text-slate-600">
                    {kop.signatureCity}, {kop.signatureDate}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600">Disetujui Oleh,</p>
                  <p className="text-[10px] text-slate-500 mb-14">{kop.approvedByRole}</p>
                  
                  <div className="border-b-2 border-slate-400 w-44 mx-auto mb-1" />
                  <p className="font-bold text-xs text-slate-900 uppercase">
                    ( {kop.approvedBy} )
                  </p>
                  <p className="text-[9px] text-slate-400">Head of Operations & Logistics</p>
                </div>

              </div>
            </div>

            {/* Document Bottom Bar */}
            <div className="mt-8 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>Sistem Manajemen Inventaris & Operasional GL PRO</span>
              <span>Dokumen ini sah dan dicetak secara elektronik tanpa stempel basah.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
