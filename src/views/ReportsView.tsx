import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Boxes,
  CalendarDays,
  Truck,
  PackageCheck,
  AlertTriangle,
  Wrench,
  Handshake,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import { ReportPrintPreviewModal } from '../components/ReportPrintPreviewModal';

export const ReportsView: React.FC = () => {
  const {
    products,
    events,
    checkouts,
    checkins,
    damageReports,
    maintenanceRecords,
    borrowings,
    warehouses
  } = useApp();

  const [reportType, setReportType] = useState<
    'inventory' | 'events' | 'checkout' | 'checkin' | 'damage' | 'maintenance' | 'borrowing'
  >('inventory');

  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Generate dataset for current report type
  const getReportData = () => {
    switch (reportType) {
      case 'inventory':
        return {
          title: 'Laporan Master Inventaris & Ketersediaan Peralatan',
          headers: ['Kode', 'Nama Barang', 'Kategori', 'Gudang', 'Tersedia', 'Total', 'Kondisi', 'Status'],
          rows: products.map(p => [
            p.code,
            p.name,
            p.category,
            warehouses.find(w => w.id === p.warehouseId)?.name || 'Gudang Utama',
            p.availableQty,
            p.totalQty,
            p.condition,
            p.status
          ]),
          rawObjects: products.map(p => ({
            'Kode Barang': p.code,
            'Nama Barang': p.name,
            'Kategori': p.category,
            'Merek': p.brand,
            'Model': p.model,
            'Gudang': warehouses.find(w => w.id === p.warehouseId)?.name || 'Gudang Utama',
            'Rak & Shelf': `${p.rack} - ${p.shelf}`,
            'Stok Tersedia': p.availableQty,
            'Total Fisik': p.totalQty,
            'Sedang Di Event': p.inUseQty,
            'Dipesan (Reserved)': p.reservedQty,
            'Kondisi': p.condition,
            'Status': p.status,
            'Tahun Pengadaan': p.procurementYear
          }))
        };

      case 'events':
        return {
          title: 'Laporan Operasional & Produksi Event',
          headers: ['Kode Event', 'Nama Event', 'Client', 'Venue', 'Mulai', 'Selesai', 'Status', 'PIC'],
          rows: events.map(e => [
            e.eventCode,
            e.name,
            e.clientName,
            e.venueName,
            e.startDate,
            e.endDate,
            e.status,
            e.picEventName
          ]),
          rawObjects: events.map(e => ({
            'Kode Event': e.eventCode,
            'Nama Event': e.name,
            'Klien': e.clientName,
            'Lokasi Venue': e.venueName,
            'Alamat Venue': e.venueAddress,
            'Tanggal Mulai': e.startDate,
            'Tanggal Selesai': e.endDate,
            'Loading Time': e.loadingTime || '-',
            'PIC Event': e.picEventName,
            'Project Manager': e.projectManagerName,
            'Status': e.status,
            'Total Kebutuhan Alat': e.equipmentList.reduce((a, b) => a + b.requestedQty, 0)
          }))
        };

      case 'checkout':
        return {
          title: 'Laporan Pengeluaran Barang & Surat Jalan (Check-Out)',
          headers: ['No Surat Jalan', 'Event', 'Gudang Asal', 'Driver', 'Kendaraan', 'Kru Bertugas', 'Tanggal', 'Total Unit'],
          rows: checkouts.map(c => {
            const relEv = events.find(e => e.id === c.eventId || e.name === c.eventName);
            const crewList = c.crewAssignments || relEv?.crewAssignments || [];
            const crewStr = crewList.length > 0 
              ? crewList.map(cr => `${cr.crewName} (${cr.eventRole})`).join(', ') 
              : (c.picName || '-');
            return [
              c.suratJalanNumber,
              c.eventName,
              c.warehouseName,
              c.driverName,
              c.vehiclePlate,
              crewStr,
              c.checkoutDate,
              c.items.reduce((a, b) => a + b.qty, 0)
            ];
          }),
          rawObjects: checkouts.map(c => {
            const relEv = events.find(e => e.id === c.eventId || e.name === c.eventName);
            const crewList = c.crewAssignments || relEv?.crewAssignments || [];
            const crewStr = crewList.length > 0 
              ? crewList.map(cr => `${cr.crewName} (${cr.eventRole})`).join(', ') 
              : (c.picName || '-');
            return {
              'No Surat Jalan': c.suratJalanNumber,
              'Nama Event': c.eventName,
              'Gudang Asal': c.warehouseName,
              'Driver': c.driverName,
              'Kendaraan': `${c.vehicleType} (${c.vehiclePlate})`,
              'PIC Lapangan': c.picName,
              'Tim Kru Bertugas': crewStr,
              'Tanggal Check-Out': c.checkoutDate,
              'Jam Keluar': c.checkoutTime,
              'Total Unit Keluar': c.items.reduce((a, b) => a + b.qty, 0)
            };
          })
        };

      case 'checkin':
        return {
          title: 'Laporan Pengembalian & Rekonsiliasi (Check-In)',
          headers: ['Kode Check-In', 'Event', 'Pemeriksa', 'Kru di Lokasi', 'Tanggal', 'Keluar', 'Kembali', 'Selisih'],
          rows: checkins.map(ci => {
            const relEv = events.find(e => e.id === ci.eventId || e.name === ci.eventName);
            const crewList = ci.crewAssignments || relEv?.crewAssignments || [];
            const crewStr = crewList.length > 0 
              ? crewList.map(cr => `${cr.crewName} (${cr.eventRole})`).join(', ') 
              : (relEv?.picEventName || '-');
            return [
              ci.checkinCode,
              ci.eventName,
              ci.inspectorName,
              crewStr,
              ci.checkinDate,
              ci.items.reduce((a, b) => a + b.outQty, 0),
              ci.items.reduce((a, b) => a + b.returnedQty, 0),
              ci.items.reduce((a, b) => a + b.differenceQty, 0)
            ];
          }),
          rawObjects: checkins.map(ci => {
            const relEv = events.find(e => e.id === ci.eventId || e.name === ci.eventName);
            const crewList = ci.crewAssignments || relEv?.crewAssignments || [];
            const crewStr = crewList.length > 0 
              ? crewList.map(cr => `${cr.crewName} (${cr.eventRole})`).join(', ') 
              : (relEv?.picEventName || '-');
            return {
              'Kode Check-In': ci.checkinCode,
              'Nama Event': ci.eventName,
              'Pemeriksa': ci.inspectorName,
              'Tim Kru di Lokasi': crewStr,
              'Tanggal Kembali': ci.checkinDate,
              'Total Keluar': ci.items.reduce((a, b) => a + b.outQty, 0),
              'Total Kembali': ci.items.reduce((a, b) => a + b.returnedQty, 0),
              'Total Selisih': ci.items.reduce((a, b) => a + b.differenceQty, 0),
              'Status Selisih': ci.hasDiscrepancy ? 'ADA SELISIH' : 'LENGKAP'
            };
          })
        };

      case 'damage':
        return {
          title: 'Laporan Kerusakan & Inspeksi Fisik',
          headers: ['Kode', 'Barang', 'Event', 'Gejala Kerusakan', 'Severity', 'Pelapor', 'Status'],
          rows: damageReports.map(d => [
            d.damageCode,
            d.productName,
            d.eventName || '-',
            d.damageType,
            d.severity,
            d.picName,
            d.status
          ]),
          rawObjects: damageReports.map(d => ({
            'Kode Damage': d.damageCode,
            'Kode Barang': d.productCode,
            'Nama Barang': d.productName,
            'Event Terkait': d.eventName || '-',
            'Gejala Kerusakan': d.damageType,
            'Tingkat Keparahan': d.severity,
            'Deskripsi': d.description,
            'Pelapor': d.picName,
            'Tanggal Lapor': d.reportDate,
            'Status': d.status,
            'Catatan Teknisi': d.technicianNotes || '-'
          }))
        };

      case 'maintenance':
        return {
          title: 'Laporan Maintenance & Servis Berkala',
          headers: ['Kode', 'Barang', 'Jenis Maintenance', 'Teknisi', 'Jadwal', 'Kondisi', 'Status'],
          rows: maintenanceRecords.map(m => [
            m.maintenanceCode,
            m.productName,
            m.maintenanceType,
            m.technicianName,
            m.scheduleDate,
            m.conditionBefore,
            m.status
          ]),
          rawObjects: maintenanceRecords.map(m => ({
            'Kode Maintenance': m.maintenanceCode,
            'Nama Barang': m.productName,
            'Jenis': m.maintenanceType,
            'Teknisi': m.technicianName,
            'Jadwal': m.scheduleDate,
            'Selesai': m.completionDate || '-',
            'Status': m.status,
            'Catatan': m.notes
          }))
        };

      case 'borrowing':
        return {
          title: 'Laporan Peminjaman Alat Internal',
          headers: ['Kode', 'Peminjam', 'Divisi', 'Barang', 'Jumlah', 'Batas Kembali', 'Status'],
          rows: borrowings.map(b => [
            b.borrowCode,
            b.borrowerName,
            b.division,
            b.productName,
            `${b.qty} ${b.unit}`,
            b.expectedReturnDate,
            b.status
          ]),
          rawObjects: borrowings.map(b => ({
            'Kode Pinjam': b.borrowCode,
            'Peminjam': b.borrowerName,
            'Divisi': b.division,
            'Barang': b.productName,
            'Jumlah': `${b.qty} ${b.unit}`,
            'Tanggal Pinjam': b.borrowDate,
            'Batas Kembali': b.expectedReturnDate,
            'Tujuan': b.purpose,
            'Status': b.status
          }))
        };
    }
  };

  const report = getReportData();

  const handleExportExcel = () => {
    exportToExcel(report.rawObjects, `Laporan_${reportType}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    exportToCSV(report.rawObjects, `Laporan_${reportType}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleOpenPrintPreview = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-400" />
            <span>Pusat Laporan & Ekspor Data Operasional</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ekspor data komprehensif ke format Microsoft Excel (.xlsx), CSV, atau cetak dokumen PDF resmi GL PRO dengan tabel rapi.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleOpenPrintPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md shadow-orange-600/30 transition active:scale-95"
            title="Pratinjau Cetak Laporan PDF dengan Tabel Orange & Kop Dapat Diedit"
          >
            <Printer className="w-4 h-4" />
            <span>Pratinjau & Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap gap-1.5 bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setReportType('inventory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'inventory' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Inventaris & Stok</span>
        </button>

        <button
          onClick={() => setReportType('events')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'events' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Event & Acara</span>
        </button>

        <button
          onClick={() => setReportType('checkout')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'checkout' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Barang Keluar (Surat Jalan)</span>
        </button>

        <button
          onClick={() => setReportType('checkin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'checkin' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Barang Kembali (Rekonsiliasi)</span>
        </button>

        <button
          onClick={() => setReportType('damage')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'damage' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Kerusakan Peralatan</span>
        </button>

        <button
          onClick={() => setReportType('maintenance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'maintenance' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance & Servis</span>
        </button>

        <button
          onClick={() => setReportType('borrowing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            reportType === 'borrowing' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Peminjaman Internal</span>
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-white">{report.title}</h2>
            <p className="text-[11px] text-zinc-400">Total data tercatat: {report.rows.length} baris</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider sticky top-0">
                {report.headers.map((h, i) => (
                  <th key={i} className="py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {report.rows.length === 0 ? (
                <tr>
                  <td colSpan={report.headers.length} className="py-12 text-center text-zinc-400 text-xs">
                    Tidak ada data pada laporan ini.
                  </td>
                </tr>
              ) : (
                report.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-4 text-zinc-200">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive PDF & Print Preview Modal with Editable Kop & Orange Table */}
      <ReportPrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={report.title}
        headers={report.headers}
        rows={report.rows}
        reportType={reportType}
        rawObjects={report.rawObjects}
      />

    </div>
  );
};
