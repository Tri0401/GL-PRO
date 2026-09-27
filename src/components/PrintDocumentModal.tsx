import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Edit3,
  Check,
  RotateCcw,
  Building,
  Calendar,
  User,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/qrUtils';
import {
  DocumentKopData,
  DEFAULT_DOC_KOP,
  generateStyledDocumentPDF
} from '../utils/exportUtils';

export interface DocumentData {
  type: 'SURAT_JALAN' | 'CHECKOUT_FORM' | 'CHECKIN_RECONCILIATION' | 'BARCODE_LABEL' | 'DAMAGE_REPORT';
  title: string;
  documentNumber: string;
  date: string;
  time?: string;
  
  // Parties
  companyName?: string;
  clientName?: string;
  eventName?: string;
  venueName?: string;
  venueAddress?: string;
  driverName?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  warehouseName?: string;
  picName?: string;
  inspectorName?: string;
  
  // Crew Assignments
  crewAssignments?: {
    id?: string;
    crewName: string;
    eventRole: string;
    division?: string;
    contact?: string;
  }[];
  
  // Items
  items?: {
    no: number;
    code: string;
    name: string;
    qty: number;
    unit: string;
    condition?: string;
    serialOrCase?: string;
    notes?: string;
    diff?: number;
  }[];

  // Specifics for Label
  product?: {
    code: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    warehouse: string;
    location: string;
    serialNumber?: string;
  };

  // Specifics for Damage
  damageDetail?: {
    productName: string;
    productCode: string;
    damageType: string;
    severity: string;
    description: string;
    technicianNotes?: string;
  };
}

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: DocumentData | null;
}

const STORAGE_KEY = 'GLPRO_DOCUMENT_KOP_CONFIG';

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  docData
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showKopEditor, setShowKopEditor] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Customizable KOP state
  const [kop, setKop] = useState<DocumentKopData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_DOC_KOP,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('Failed to load custom Document KOP', e);
    }
    return { ...DEFAULT_DOC_KOP };
  });

  // Sync with current docData whenever docData changes
  useEffect(() => {
    if (!docData) return;

    // Generate QR
    if (docData.documentNumber) {
      generateQRCodeDataUrl(docData.documentNumber).then(url => setQrDataUrl(url));
    } else if (docData.product?.code) {
      generateQRCodeDataUrl(docData.product.code).then(url => setQrDataUrl(url));
    }

    // Try reading saved base KOP preferences
    let savedBase: Partial<DocumentKopData> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        savedBase = JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }

    const isCheckin = docData.type === 'CHECKIN_RECONCILIATION';
    const defaultDocTitle = isCheckin
      ? 'BERITA ACARA CHECK-IN & REKONSILIASI GUDANG'
      : (docData.type === 'SURAT_JALAN' ? 'SURAT JALAN PENGIRIMAN BARANG' : docData.title);

    setKop(prev => ({
      ...DEFAULT_DOC_KOP,
      ...savedBase,
      documentNumber: docData.documentNumber || prev.documentNumber,
      documentTitle: defaultDocTitle,
      documentDate: docData.date || prev.documentDate,
      documentTime: docData.time || prev.documentTime || '10:00 WIB',
      warehouseSignerName: isCheckin
        ? (docData.inspectorName || savedBase.warehouseSignerName || prev.warehouseSignerName)
        : (savedBase.warehouseSignerName || docData.warehouseName || prev.warehouseSignerName),
      warehouseSignerTitle: isCheckin
        ? 'Pemeriksa Gudang (Inspeksi Fisik)'
        : 'Diserahkan Oleh (Gudang)',
      driverSignerName: docData.driverName || savedBase.driverSignerName || prev.driverSignerName,
      driverSignerTitle: 'Dibawa Oleh (Driver)',
      venueSignerName: docData.picName || savedBase.venueSignerName || prev.venueSignerName,
      venueSignerTitle: isCheckin ? 'PIC Penyerahan Event' : 'Diterima Oleh (PIC Venue)'
    }));
  }, [docData]);

  if (!isOpen || !docData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateStyledDocumentPDF(docData, kop, orientation);
  };

  const handleSaveKopAsDefault = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kop));
      setSaveSuccessMsg('Format KOP berhasil disimpan sebagai default!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Failed to save Kop', e);
    }
  };

  const handleResetKop = () => {
    const isCheckin = docData.type === 'CHECKIN_RECONCILIATION';
    setKop({
      ...DEFAULT_DOC_KOP,
      documentNumber: docData.documentNumber,
      documentTitle: isCheckin
        ? 'BERITA ACARA CHECK-IN & REKONSILIASI GUDANG'
        : 'SURAT JALAN PENGIRIMAN BARANG',
      documentDate: docData.date,
      documentTime: docData.time || '10:00 WIB',
      warehouseSignerName: isCheckin ? (docData.inspectorName || 'Staff Inspeksi') : 'Staff Gudang',
      driverSignerName: docData.driverName || 'Driver Ekspedisi',
      venueSignerName: docData.picName || 'PIC Event'
    });
    localStorage.removeItem(STORAGE_KEY);
    setSaveSuccessMsg('Format KOP dikembalikan ke setelan awal.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const isCheckin = docData.type === 'CHECKIN_RECONCILIATION';
  const isSuratJalanOrCheckout = docData.type === 'SURAT_JALAN' || docData.type === 'CHECKOUT_FORM';

  // Calculate table aggregates
  const totalItemCount = docData.items?.length || 0;
  const totalQtyOut = docData.items?.reduce((sum, it) => sum + (it.qty || 0), 0) || 0;
  const totalQtyReturned = isCheckin
    ? docData.items?.reduce((sum, it) => sum + (it.qty - (it.diff || 0)), 0) || 0
    : totalQtyOut;
  const totalDiffCount = isCheckin
    ? docData.items?.reduce((sum, it) => sum + (it.diff || 0), 0) || 0
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        
        {/* Top Header & Actions Bar (Hidden on physical print) */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 gap-2 shrink-0 print-hide">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md border border-orange-500">
              GL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  {kop.documentTitle || docData.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30 uppercase">
                  {kop.documentNumber || docData.documentNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {docData.eventName || 'Dokumen Operasional'} • Format Orange & Putih Rapi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Toggle Kop Editor */}
            {(isSuratJalanOrCheckout || isCheckin) && (
              <button
                type="button"
                onClick={() => setShowKopEditor(!showKopEditor)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  showKopEditor
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750'
                }`}
                title="Buka panel untuk mengedit KOP Surat dan data penandatangan"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showKopEditor ? 'Tutup Edit Kop' : 'Edit Kop Surat'}</span>
                {showKopEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Orientation Toggle */}
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  orientation === 'portrait' ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  orientation === 'landscape' ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Landscape
              </button>
            </div>

            {/* Direct PDF Download button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
              title="Unduh file .pdf berdesain orange-putih langsung"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            {/* Print / Save via Browser Dialog */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition active:scale-95"
              title="Buka dialog cetak browser / Simpan ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Batal Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition flex items-center gap-1.5"
              title="Batal dan tutup modal"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
          </div>
        </div>

        {/* Collapsible KOP & Penandatangan Editor Drawer (Hidden on physical print) */}
        {showKopEditor && (
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 overflow-y-auto max-h-72 print-hide animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <Building className="w-4 h-4" />
                <span>Pengaturan Kop Surat & Penandatangan Dokumen</span>
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
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nama Perusahaan / Unit Usaha</label>
                <input
                  type="text"
                  value={kop.companyName}
                  onChange={e => setKop({ ...kop, companyName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Tagline / Bidang Operasional</label>
                <input
                  type="text"
                  value={kop.companyTagline}
                  onChange={e => setKop({ ...kop, companyTagline: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Alamat Gudang / Kantor</label>
                <input
                  type="text"
                  value={kop.companyAddress}
                  onChange={e => setKop({ ...kop, companyAddress: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Kontak / No. Telepon & Email</label>
                <input
                  type="text"
                  value={kop.companyContact}
                  onChange={e => setKop({ ...kop, companyContact: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Nomor Dokumen / Surat Jalan</label>
                <input
                  type="text"
                  value={kop.documentNumber}
                  onChange={e => setKop({ ...kop, documentNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-orange-400 text-xs font-mono font-bold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Judul Dokumen Resmi</label>
                <input
                  type="text"
                  value={kop.documentTitle}
                  onChange={e => setKop({ ...kop, documentTitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Kota & Tanggal Dokumen</label>
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
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Catatan Operasional</label>
                <input
                  type="text"
                  value={kop.notes || ''}
                  onChange={e => setKop({ ...kop, notes: e.target.value })}
                  placeholder="Ketentuan / Instruksi"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Signer 1: Gudang */}
              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">Penandatangan 1 (Gudang)</label>
                <input
                  type="text"
                  value={kop.warehouseSignerName}
                  onChange={e => setKop({ ...kop, warehouseSignerName: e.target.value })}
                  placeholder="Nama Staff Gudang"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Signer 2: Driver (for checkout) */}
              {!isCheckin && (
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Penandatangan 2 (Driver)</label>
                  <input
                    type="text"
                    value={kop.driverSignerName}
                    onChange={e => setKop({ ...kop, driverSignerName: e.target.value })}
                    placeholder="Nama Driver / Pengemudi"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Signer 3: Venue PIC */}
              <div>
                <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                  {isCheckin ? 'Penandatangan 2 (PIC Event)' : 'Penandatangan 3 (PIC Venue)'}
                </label>
                <input
                  type="text"
                  value={kop.venueSignerName}
                  onChange={e => setKop({ ...kop, venueSignerName: e.target.value })}
                  placeholder="Nama PIC Penerima"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Document Canvas (Themed in Orange & White) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-zinc-900/60 flex justify-center items-start">
          
          <div
            ref={printRef}
            id="document-printable-sheet"
            className={`bg-white text-slate-900 shadow-2xl transition-all duration-200 font-sans print:shadow-none print:w-full print:max-w-none print:p-0 ${
              orientation === 'landscape'
                ? 'w-full max-w-[1100px] p-6 sm:p-10 rounded-xl'
                : 'w-full max-w-[850px] p-6 sm:p-10 rounded-xl min-h-[1050px]'
            }`}
          >
            {/* Template: SURAT JALAN & CHECKOUT (Orange-White Themed) */}
            {isSuratJalanOrCheckout && (
              <div className="space-y-4">
                
                {/* 1. Header KOP Surat */}
                <div className="border-b-2 border-orange-600 pb-3 mb-1">
                  <div className="flex items-start justify-between gap-4">
                    {/* Brand & Company Details */}
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

                    {/* Right Metadata Box with QR Code */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-right shrink-0 min-w-[170px] flex items-center justify-end gap-2.5">
                      <div className="space-y-0.5 text-right">
                        <div className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">
                          Nomor Surat Jalan
                        </div>
                        <div className="text-xs font-mono font-extrabold text-slate-900">
                          {kop.documentNumber || docData.documentNumber}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-500">
                          Tgl: {kop.documentDate || docData.date}
                        </div>
                        {docData.time && (
                          <div className="text-[9px] font-medium text-slate-500">
                            Pukul: {docData.time} WIB
                          </div>
                        )}
                      </div>
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="QR Document"
                          className="w-12 h-12 border border-orange-300 rounded p-0.5 bg-white shadow-xs shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Accent Divider Line */}
                <div className="h-0.5 bg-orange-300 w-full mb-3" />

                {/* 2. Document Title Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-200 gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      {kop.documentTitle || 'SURAT JALAN PENGIRIMAN BARANG'}
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Dokumen resmi pengeluaran inventaris panggung & multimedia GL PRO PRODUCTION
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                      <span>CHECK-OUT RESMI GUDANG</span>
                    </span>
                  </div>
                </div>

                {/* 3. Event & Logistics Metadata Card (Orange Themed) */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] bg-orange-50/60 p-3 rounded-xl border border-orange-200/90 shadow-xs">
                  <div>
                    <span className="text-orange-900 font-semibold block text-[10px]">Nama Event / Acara:</span>
                    <span className="font-bold text-slate-900 text-xs">{docData.eventName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-orange-900 font-semibold block text-[10px]">Client / Pemberi Kerja:</span>
                    <span className="font-bold text-slate-900 text-xs">{docData.clientName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Lokasi & Alamat Venue:</span>
                    <span className="font-medium text-slate-800">{docData.venueName || '-'}, {docData.venueAddress || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Gudang Asal Pengeluaran:</span>
                    <span className="font-medium text-slate-800">{docData.warehouseName || 'Gudang Logistik Utama'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Armada & Nomor Polisi Kendaraan:</span>
                    <span className="font-bold text-slate-900 font-mono">{docData.vehicleType || 'Truk Box'} ({docData.vehiclePlate || '-'})</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Nama Driver / Pengemudi:</span>
                    <span className="font-medium text-slate-800">{kop.driverSignerName || docData.driverName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Waktu Keberangkatan Truk:</span>
                    <span className="font-medium text-slate-800">{kop.documentDate || docData.date} {docData.time ? `pukul ${docData.time} WIB` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">PIC Penanggung Jawab Event:</span>
                    <span className="font-bold text-orange-700">{kop.venueSignerName || docData.picName || '-'}</span>
                  </div>
                </div>

                {/* 3b. Crew Team Assignments on Duty */}
                {docData.crewAssignments && docData.crewAssignments.length > 0 && (
                  <div className="bg-orange-50/50 border border-orange-200/90 rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-orange-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span>Tim Kru Lapangan Bertugas ({docData.crewAssignments.length} Personel)</span>
                      </div>
                      <span className="text-[10px] text-orange-800 font-semibold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                        Penugasan Resmi Event
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {docData.crewAssignments.map((cr, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-orange-200/80 rounded-lg p-2 flex items-start justify-between shadow-2xs text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{cr.crewName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-1.5 py-0.2 rounded border border-orange-200/80">
                                {cr.eventRole}
                              </span>
                              {cr.division && <span className="text-[10px] text-slate-500">• {cr.division}</span>}
                            </div>
                          </div>
                          {cr.contact && (
                            <span className="text-[10px] font-mono text-slate-600 shrink-0 ml-1">{cr.contact}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Equipment Table (Clean Orange-White) */}
                <div className="overflow-x-auto rounded-lg border border-orange-300 shadow-xs">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-orange-600 text-white font-extrabold border-b-2 border-orange-700 text-[11px] uppercase tracking-wide">
                        <th className="py-2.5 px-2 text-center w-8 border-r border-orange-500/50">NO</th>
                        <th className="py-2.5 px-3 border-r border-orange-500/50 w-28">KODE ALAT</th>
                        <th className="py-2.5 px-3 border-r border-orange-500/50">NAMA PERALATAN</th>
                        <th className="py-2.5 px-2.5 border-r border-orange-500/50 w-16 text-center">QTY</th>
                        <th className="py-2.5 px-2.5 border-r border-orange-500/50 w-16 text-center">SATUAN</th>
                        <th className="py-2.5 px-2.5 border-r border-orange-500/50 w-20 text-center">KONDISI</th>
                        <th className="py-2.5 px-3">FLIGHT CASE / NO. SERI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-200/70 text-slate-800">
                      {docData.items && docData.items.length > 0 ? (
                        docData.items.map((it, idx) => {
                          const isEven = idx % 2 === 1;
                          return (
                            <tr
                              key={idx}
                              className={`transition-colors print-avoid-break ${
                                isEven ? 'bg-orange-50/40 hover:bg-orange-100/50' : 'bg-white hover:bg-orange-50/70'
                              }`}
                            >
                              <td className="py-2 px-2 text-center font-bold text-slate-500 text-[11px] border-r border-orange-100">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-orange-100 font-mono text-[10px]">
                                <span className="font-bold text-orange-950 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                                  {it.code}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-r border-orange-100 font-semibold text-slate-900 text-[11px]">
                                {it.name}
                              </td>
                              <td className="py-2 px-2.5 border-r border-orange-100 text-center font-bold text-slate-900 text-xs font-mono">
                                {it.qty}
                              </td>
                              <td className="py-2 px-2.5 border-r border-orange-100 text-center text-[10px] text-slate-600 font-medium">
                                {it.unit}
                              </td>
                              <td className="py-2 px-2.5 border-r border-orange-100 text-center text-[10px]">
                                <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {it.condition || 'Baik'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[10px] text-slate-600">
                                {it.serialOrCase || it.notes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            Tidak ada daftar peralatan terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Summary Total Bar */}
                    <tfoot className="bg-orange-100/70 border-t-2 border-orange-300 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-orange-900 uppercase tracking-wide">
                          Total Peralatan Keluar:
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-orange-900 text-sm">
                          {totalQtyOut}
                        </td>
                        <td colSpan={3} className="py-2 px-3 text-[10px] text-slate-600 font-normal">
                          {totalItemCount} jenis alat siap loading
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 5. Operasional Notes & Ketentuan */}
                <div className="p-3 bg-orange-50/50 border border-orange-200/90 rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-1">
                  <p>
                    <strong className="text-orange-900 font-bold">Ketentuan Operasional & Serah Terima: </strong>
                    {kop.notes || 'Seluruh peralatan di atas telah melalui verifikasi fisik, uji nyala kelistrikan, dan pemeriksaan kelengkapan di area gudang. Pihak penerima di venue wajib mencocokkan fisik barang saat penurunan muatan (loading in).'}
                  </p>
                  <p className="text-slate-500 italic text-[9px]">
                    * Surat jalan ini merupakan dokumen sah operasional GL PRO PRODUCTION yang tercatat secara digital pada sistem.
                  </p>
                </div>

                {/* 6. Signatures (3 Kolom: Gudang, Driver, Venue PIC) */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[10px] print-avoid-break">
                  <div>
                    <p className="text-slate-600 font-semibold">{kop.warehouseSignerTitle || 'Diserahkan Oleh (Gudang):'}</p>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-36 border-b-2 border-slate-400 pb-1 text-slate-900 font-extrabold text-[11px]">
                        ( {kop.warehouseSignerName || 'Bayu Nugroho'} )
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Staff Logistik & Inventaris</p>
                  </div>

                  <div>
                    <p className="text-slate-600 font-semibold">{kop.driverSignerTitle || 'Dibawa Oleh (Driver):'}</p>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-36 border-b-2 border-slate-400 pb-1 text-slate-900 font-extrabold text-[11px]">
                        ( {kop.driverSignerName || 'Driver Ekspedisi'} )
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Pengemudi / Ekspedisi</p>
                  </div>

                  <div>
                    <p className="text-slate-600 font-semibold">
                      {kop.signatureCity}, {kop.signatureDate || docData.date}
                      <br />
                      {kop.venueSignerTitle || 'Diterima Oleh (PIC Venue):'}
                    </p>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-36 border-b-2 border-slate-400 pb-1 text-slate-900 font-extrabold text-[11px]">
                        ( {kop.venueSignerName || 'PIC Event'} )
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Penanggung Jawab Acara</p>
                  </div>
                </div>

              </div>
            )}

            {/* Template: CHECKIN RECONCILIATION (Orange-White Themed) */}
            {isCheckin && (
              <div className="space-y-4">
                
                {/* 1. Header KOP Surat */}
                <div className="border-b-2 border-orange-600 pb-3 mb-1">
                  <div className="flex items-start justify-between gap-4">
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

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-right shrink-0 min-w-[170px] flex items-center justify-end gap-2.5">
                      <div className="space-y-0.5 text-right">
                        <div className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">
                          No. Berita Acara
                        </div>
                        <div className="text-xs font-mono font-extrabold text-slate-900">
                          {kop.documentNumber || docData.documentNumber}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-500">
                          Tgl: {kop.documentDate || docData.date}
                        </div>
                        {docData.time && (
                          <div className="text-[9px] font-medium text-slate-500">
                            Pukul: {docData.time} WIB
                          </div>
                        )}
                      </div>
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="QR Document"
                          className="w-12 h-12 border border-orange-300 rounded p-0.5 bg-white shadow-xs shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-0.5 bg-orange-300 w-full mb-3" />

                {/* 2. Document Title Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-200 gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      {kop.documentTitle || 'BERITA ACARA CHECK-IN & REKONSILIASI GUDANG'}
                    </h2>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Pemeriksaan fisik pengembalian barang, rekonsiliasi selisih kuantitas, dan uji fungsi peralatan
                    </p>
                  </div>
                  <div>
                    {totalDiffCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>SELISIH {totalDiffCount} UNIT</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PENGEMBALIAN LENGKAP 100%</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Event & Return Info Card (Orange Themed) */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] bg-orange-50/60 p-3 rounded-xl border border-orange-200/90 shadow-xs">
                  <div>
                    <span className="text-orange-900 font-semibold block text-[10px]">Nama Event / Acara:</span>
                    <span className="font-bold text-slate-900 text-xs">{docData.eventName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-orange-900 font-semibold block text-[10px]">Gudang Penerima Pengembalian:</span>
                    <span className="font-bold text-slate-900 text-xs">{docData.warehouseName || 'Gudang Logistik Utama'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Tanggal & Waktu Inspeksi:</span>
                    <span className="font-medium text-slate-800">{kop.documentDate || docData.date} {docData.time ? `pukul ${docData.time} WIB` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium block text-[10px]">Pemeriksa / Inspector Fisik Gudang:</span>
                    <span className="font-bold text-slate-900">{kop.warehouseSignerName || docData.inspectorName || '-'}</span>
                  </div>
                </div>

                {/* 3b. Crew Team Assignments on Duty */}
                {docData.crewAssignments && docData.crewAssignments.length > 0 && (
                  <div className="bg-orange-50/50 border border-orange-200/90 rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-orange-200/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span>Tim Kru Penanggung Jawab di Lokasi ({docData.crewAssignments.length} Personel)</span>
                      </div>
                      <span className="text-[10px] text-orange-800 font-semibold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                        Rekonsiliasi Pengembalian
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {docData.crewAssignments.map((cr, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-orange-200/80 rounded-lg p-2 flex items-start justify-between shadow-2xs text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{cr.crewName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-1.5 py-0.2 rounded border border-orange-200/80">
                                {cr.eventRole}
                              </span>
                              {cr.division && <span className="text-[10px] text-slate-500">• {cr.division}</span>}
                            </div>
                          </div>
                          {cr.contact && (
                            <span className="text-[10px] font-mono text-slate-600 shrink-0 ml-1">{cr.contact}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Equipment Reconciliation Table */}
                <div className="overflow-x-auto rounded-lg border border-orange-300 shadow-xs">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-orange-600 text-white font-extrabold border-b-2 border-orange-700 text-[11px] uppercase tracking-wide">
                        <th className="py-2.5 px-2 text-center w-8 border-r border-orange-500/50">NO</th>
                        <th className="py-2.5 px-3 border-r border-orange-500/50 w-24">KODE ALAT</th>
                        <th className="py-2.5 px-3 border-r border-orange-500/50">NAMA PERALATAN</th>
                        <th className="py-2.5 px-2 border-r border-orange-500/50 w-16 text-center">KELUAR</th>
                        <th className="py-2.5 px-2 border-r border-orange-500/50 w-16 text-center">KEMBALI</th>
                        <th className="py-2.5 px-2 border-r border-orange-500/50 w-16 text-center">SELISIH</th>
                        <th className="py-2.5 px-2.5 border-r border-orange-500/50 w-24 text-center">KONDISI</th>
                        <th className="py-2.5 px-3">CATATAN INSPEKSI FISIK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-200/70 text-slate-800">
                      {docData.items && docData.items.length > 0 ? (
                        docData.items.map((it, idx) => {
                          const hasDiff = it.diff && it.diff > 0;
                          const isDamaged = it.condition === 'Rusak Berat' || it.condition === 'Rusak Ringan';
                          const returnedQty = it.qty - (it.diff || 0);

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors print-avoid-break ${
                                hasDiff || isDamaged
                                  ? 'bg-rose-50/80 hover:bg-rose-100/70'
                                  : idx % 2 === 1
                                  ? 'bg-orange-50/40 hover:bg-orange-100/50'
                                  : 'bg-white hover:bg-orange-50/70'
                              }`}
                            >
                              <td className="py-2 px-2 text-center font-bold text-slate-500 text-[11px] border-r border-orange-100">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-orange-100 font-mono text-[10px]">
                                <span className="font-bold text-orange-950 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                                  {it.code}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-r border-orange-100 font-semibold text-slate-900 text-[11px]">
                                {it.name}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 font-mono font-medium border-r border-orange-100">
                                {it.qty}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-900 font-mono border-r border-orange-100">
                                {returnedQty}
                              </td>
                              <td className="py-2 px-2 text-center font-bold font-mono border-r border-orange-100">
                                {hasDiff ? (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-extrabold text-[10px]">
                                    -{it.diff}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-bold">0</span>
                                )}
                              </td>
                              <td className="py-2 px-2.5 text-center border-r border-orange-100 text-[10px]">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    isDamaged
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  {it.condition || 'Baik'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[10px] text-slate-600">
                                {it.notes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            Tidak ada rincian peralatan check-in.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-orange-100/70 border-t-2 border-orange-300 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-orange-900 uppercase tracking-wide">
                          Total Rekonsiliasi:
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-700">
                          {totalQtyOut}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-emerald-800 text-sm">
                          {totalQtyReturned}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-rose-800 text-sm">
                          {totalDiffCount > 0 ? `-${totalDiffCount}` : '0'}
                        </td>
                        <td colSpan={2} className="py-2 px-3 text-[10px] text-slate-600 font-normal">
                          {totalDiffCount > 0
                            ? `Terdapat selisih ${totalDiffCount} unit belum kembali`
                            : 'Semua barang telah kembali lengkap'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 5. Operasional Notes */}
                <div className="p-3 bg-orange-50/50 border border-orange-200/90 rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-1">
                  <p>
                    <strong className="text-orange-900 font-bold">Catatan Hasil Pemeriksaan Gudang: </strong>
                    {kop.notes || 'Pemeriksaan fisik mencakup kelengkapan kabel, flight case, baut rigging, serta uji fungsi elektronik. Barang yang memerlukan perbaikan telah diarahkan ke modul maintenance & service teknisi.'}
                  </p>
                </div>

                {/* 6. Signatures (2 Kolom: Pemeriksa Gudang & PIC Event) */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[10px] print-avoid-break max-w-2xl mx-auto">
                  <div>
                    <p className="text-slate-600 font-semibold">{kop.warehouseSignerTitle || 'Pemeriksa Gudang (Inspeksi Fisik):'}</p>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-44 border-b-2 border-slate-400 pb-1 text-slate-900 font-extrabold text-[11px]">
                        ( {kop.warehouseSignerName || 'Staff Inspeksi'} )
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Staff Inspeksi & Quality Control</p>
                  </div>

                  <div>
                    <p className="text-slate-600 font-semibold">
                      {kop.signatureCity}, {kop.signatureDate || docData.date}
                      <br />
                      {kop.venueSignerTitle || 'PIC Penyerahan Event:'}
                    </p>
                    <div className="h-16 flex items-end justify-center">
                      <div className="w-44 border-b-2 border-slate-400 pb-1 text-slate-900 font-extrabold text-[11px]">
                        ( {kop.venueSignerName || 'PIC Event'} )
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">Penanggung Jawab Pengembalian</p>
                  </div>
                </div>

              </div>
            )}

            {/* Template: BARCODE & QR LABEL STICKER */}
            {docData.type === 'BARCODE_LABEL' && docData.product && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-orange-300 rounded-xl max-w-sm mx-auto bg-white text-slate-900 shadow-sm">
                <div className="text-center border-b border-orange-200 pb-2 w-full mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">
                    {kop.companyName}
                  </span>
                  <div className="font-bold text-xs uppercase text-slate-900">{docData.product.category}</div>
                </div>

                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code Label" className="w-36 h-36 border border-orange-200 rounded p-1 mb-2 bg-white" />
                )}

                <div className="text-center space-y-1 w-full">
                  <div className="font-mono font-extrabold text-sm text-orange-950 bg-orange-50 py-1 rounded border border-orange-200 tracking-wider">
                    {docData.product.code}
                  </div>
                  <div className="font-bold text-xs text-slate-800 leading-tight">
                    {docData.product.name}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {docData.product.brand} - {docData.product.model}
                  </div>
                  {docData.product.serialNumber && (
                    <div className="text-[10px] font-mono text-slate-700 bg-slate-100 py-0.5 rounded border border-slate-200">
                      SN: {docData.product.serialNumber}
                    </div>
                  )}
                  <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
                    Lokasi: {docData.product.warehouse} • {docData.product.location}
                  </div>
                </div>
              </div>
            )}

            {/* Template: DAMAGE REPORT */}
            {docData.type === 'DAMAGE_REPORT' && docData.damageDetail && (
              <div className="space-y-4">
                <div className="border-b-2 border-orange-600 pb-3 flex items-start justify-between">
                  <div>
                    <h1 className="font-extrabold text-base tracking-wide text-slate-900 uppercase">
                      {kop.companyName}
                    </h1>
                    <p className="text-[10px] text-orange-700 font-semibold">{kop.companyTagline}</p>
                    <p className="text-[10px] text-slate-500">{kop.companyAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-orange-950 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                      {docData.documentNumber}
                    </span>
                  </div>
                </div>

                <div className="text-center py-1">
                  <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider underline">
                    BERITA ACARA LAPORAN KERUSAKAN PERALATAN
                  </h2>
                </div>

                <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nama Alat:</span>
                      <strong className="text-slate-900">{docData.damageDetail.productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kode Produk:</span>
                      <strong className="font-mono text-orange-700">{docData.damageDetail.productCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jenis Kerusakan:</span>
                      <strong className="text-slate-800">{docData.damageDetail.damageType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tingkat Keparahan:</span>
                      <strong className="text-rose-600">{docData.damageDetail.severity}</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-orange-200">
                    <span className="text-slate-500 block text-[11px]">Deskripsi Kerusakan:</span>
                    <p className="text-slate-800 mt-0.5">{docData.damageDetail.description}</p>
                  </div>
                  {docData.damageDetail.technicianNotes && (
                    <div className="pt-2 border-t border-orange-200">
                      <span className="text-slate-500 block text-[11px]">Diagnosa Awal Teknisi:</span>
                      <p className="text-slate-800 mt-0.5">{docData.damageDetail.technicianNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer actions with explicit Batal and Print buttons (Hidden on physical print) */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-black flex items-center justify-between print-hide">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Batal</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs border border-zinc-700 transition"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Unduh File PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
