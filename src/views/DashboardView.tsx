import React from 'react';
import {
  Boxes,
  CalendarDays,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Truck,
  PackageCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FileText,
  Tv,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DashboardViewProps {
  onNavigate: (tab: string, entityId?: string) => void;
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenScanner }) => {
  const {
    products,
    events,
    warehouses,
    damageReports,
    maintenanceRecords,
    borrowings,
    checkouts,
    ledMonthlyTargets,
    ledDeployments
  } = useApp();

  // Current Month LED stats
  const nowMonth = new Date().getMonth() + 1;
  const nowYear = new Date().getFullYear();
  const currentMonthLedTarget = ledMonthlyTargets.find(t => t.month === nowMonth && t.year === nowYear)?.targetMeters ?? 0;
  const currentMonthLedActual = ledDeployments
    .filter(d => {
      const dt = new Date(d.date);
      return dt.getMonth() + 1 === nowMonth && dt.getFullYear() === nowYear;
    })
    .reduce((sum, d) => sum + (d.totalSquareMeters || 0), 0);
  const ledAchievementPct = currentMonthLedTarget > 0 ? (currentMonthLedActual / currentMonthLedTarget) * 100 : 0;

  // Inventory stats
  const totalItemTypes = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.totalQty, 0);
  const totalAvailable = products.reduce((acc, p) => acc + p.availableQty, 0);
  const totalInUse = products.reduce((acc, p) => acc + p.inUseQty, 0);
  const totalReserved = products.reduce((acc, p) => acc + p.reservedQty, 0);
  const totalInTransit = products.reduce((acc, p) => acc + p.inTransitQty, 0);
  const totalDamaged = products.reduce((acc, p) => acc + p.damagedQty, 0);
  const totalMaintenance = products.reduce((acc, p) => acc + p.inMaintenanceQty, 0);
  const totalLost = products.reduce((acc, p) => acc + p.lostQty, 0);

  // Events stats
  const activeEvents = events.filter(e => e.status === 'Berlangsung');
  const todayEvents = events.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.startDate <= today && e.endDate >= today;
  });
  const upcomingEvents = events.filter(e => e.status === 'Persiapan' || e.status === 'Draft' || e.status === 'Siap Berangkat');
  const loadingEvents = events.filter(e => e.status === 'Loading' || e.status === 'Teardown' || e.status === 'Pengembalian');
  const completedEvents = events.filter(e => e.status === 'Selesai');

  // Condition breakdown
  const conditionStats = {
    sangatBaik: products.filter(p => p.condition === 'Sangat Baik').reduce((a, b) => a + b.totalQty, 0),
    baik: products.filter(p => p.condition === 'Baik').reduce((a, b) => a + b.totalQty, 0),
    cukup: products.filter(p => p.condition === 'Cukup').reduce((a, b) => a + b.totalQty, 0),
    rusakRingan: products.filter(p => p.condition === 'Rusak Ringan').reduce((a, b) => a + b.totalQty, 0),
    rusakBerat: products.filter(p => p.condition === 'Rusak Berat').reduce((a, b) => a + b.totalQty, 0),
    afkir: products.filter(p => p.condition === 'Tidak Dapat Digunakan').reduce((a, b) => a + b.totalQty, 0)
  };

  // Low stock warning items
  const lowStockItems = products.filter(p => p.availableQty <= p.minQty);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-orange-950/70 via-zinc-950 to-black border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Pusat Kendali Operasional
              </span>
              <span className="text-xs text-zinc-400">• Real-Time Tracking</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sistem Manajemen Inventaris & Produksi Event
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Pantau seluruh pergerakan barang, multi-gudang, kesiapan peralatan konser, check-out barcode, surat jalan, dan inspeksi kembali dalam satu sistem terintegrasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 active:scale-95 transition"
            >
              <Boxes className="w-4 h-4" />
              <span>Scan QR Cepat</span>
            </button>
            <button
              onClick={() => onNavigate('events')}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 flex items-center gap-2 transition"
            >
              <CalendarDays className="w-4 h-4 text-orange-400" />
              <span>Kelola Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Key Inventory Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Jenis Barang</span>
            <Boxes className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-2">{totalItemTypes}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{totalUnits} total unit fisik</div>
        </div>

        <div
          onClick={() => onNavigate('inventory')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Tersedia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">{totalAvailable}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Siap dialokasikan</div>
        </div>

        <div
          onClick={() => onNavigate('events')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Di Event / Acara</span>
            <Truck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-2">{totalInUse}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Sedang beroperasi</div>
        </div>

        <div
          onClick={() => onNavigate('events')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Reserved (Dipesan)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2">{totalReserved}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Terkunci untuk jadwal</div>
        </div>

        <div
          onClick={() => onNavigate('inspection')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Barang Rusak</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 mt-2">{totalDamaged}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{damageReports.length} laporan kerusakan</div>
        </div>

        <div
          onClick={() => onNavigate('maintenance')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Maintenance</span>
            <Wrench className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-2">{totalMaintenance}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Dalam perbaikan/servis</div>
        </div>
      </div>

      {/* Row 2: Event Operations Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 Cols): Active & Upcoming Events */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-orange-400" />
              <h2 className="font-bold text-sm text-white">Status Operasional Event</h2>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Lihat Semua Event <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-black/40">
                Belum ada data event operasional. Silakan tambahkan jadwal event baru.
              </div>
            ) : (
              events.slice(0, 3).map(evt => {
                const totalItems = evt.equipmentList.reduce((a, b) => a + b.requestedQty, 0);
                const checkedOut = evt.equipmentList.reduce((a, b) => a + (b.checkedOutQty || 0), 0);
                const prepPct = totalItems > 0 ? Math.round((checkedOut / totalItems) * 100) : 0;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('events', evt.id)}
                    className="p-3.5 rounded-xl bg-black border border-zinc-800 hover:border-orange-500/40 cursor-pointer transition text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-orange-400 font-bold px-1.5 py-0.2 bg-orange-500/10 rounded border border-orange-500/20">
                            {evt.eventCode}
                          </span>
                          <h3 className="font-bold text-sm text-white hover:text-orange-400 transition">
                            {evt.name}
                          </h3>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Client: <span className="text-zinc-300 font-medium">{evt.clientName}</span> • Venue: <span className="text-zinc-300">{evt.venueName}</span>
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                          evt.status === 'Berlangsung'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : evt.status === 'Loading'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : evt.status === 'Persiapan'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    {/* Progress Bar of Equipment Readiness */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Peralatan Terverifikasi Keluar (Check-Out):</span>
                        <span className="font-bold text-zinc-200">{checkedOut} / {totalItems} Unit ({prepPct}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            prepPct === 100 ? 'bg-emerald-500' : prepPct > 50 ? 'bg-orange-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${prepPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                      <div>
                        Tanggal: <span className="text-zinc-300 font-medium">{evt.startDate} s/d {evt.endDate}</span>
                      </div>
                      <div>
                        PIC: <span className="text-white font-medium">{evt.picEventName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 Col): LED Target, Warehouse Distribution & Fleet Status */}
        <div className="space-y-6">
          
          {/* LED Monthly Target Achievement Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/20 border border-orange-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Target Meter LED Keluar</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                      September 2026
                    </span>
                  </h2>
                  <span className="text-[10px] text-zinc-400">KPI Bulanan Videotron & Display</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('led_target')}
                className="p-1 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 transition"
                title="Buka Halaman Target LED Lengkap"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {currentMonthLedActual} <span className="text-sm font-normal text-zinc-400">m²</span>
                  </span>
                  <span className="text-xs text-zinc-400 ml-1.5">
                    / Target {currentMonthLedTarget} m²
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  ledAchievementPct >= 100
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                }`}>
                  {ledAchievementPct.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ledAchievementPct >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(ledAchievementPct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                <span>{currentMonthLedTarget - currentMonthLedActual > 0 ? `Sisa ${currentMonthLedTarget - currentMonthLedActual} m² lagi` : `Surplus ${currentMonthLedActual - currentMonthLedTarget} m²`}</span>
                <button
                  onClick={() => onNavigate('led_target')}
                  className="font-bold text-orange-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Buka Analisis LED</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Warehouse Breakdown Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-400" />
                <h2 className="font-bold text-sm text-white">Sebaran Multi-Gudang</h2>
              </div>
              <span className="text-[11px] text-zinc-400">{warehouses.length} Gudang</span>
            </div>

            <div className="space-y-2">
              {warehouses.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-500">
                  Belum ada gudang terdaftar.
                </div>
              ) : (
                warehouses.slice(0, 5).map(wh => {
                  const whProducts = products.filter(p => p.warehouseId === wh.id);
                  const countUnits = whProducts.reduce((a, b) => a + b.totalQty, 0);

                  return (
                    <div
                      key={wh.id}
                      onClick={() => onNavigate('master')}
                      className="flex items-center justify-between p-2 rounded-lg bg-black hover:bg-zinc-800 transition cursor-pointer text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-200">{wh.name}</div>
                        <div className="text-[10px] text-zinc-400">{wh.picName} ({wh.code})</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-orange-400 font-mono">{countUnits}</span>
                        <span className="text-[10px] text-zinc-500 ml-1">unit</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Condition Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <h2 className="font-bold text-sm text-white">Kondisi Fisik Peralatan</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-black border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Sangat Baik</span>
                <span className="text-sm font-bold text-emerald-400">{conditionStats.sangatBaik} unit</span>
              </div>
              <div className="p-2 rounded-lg bg-black border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Baik</span>
                <span className="text-sm font-bold text-orange-400">{conditionStats.baik} unit</span>
              </div>
              <div className="p-2 rounded-lg bg-black border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Cukup</span>
                <span className="text-sm font-bold text-amber-400">{conditionStats.cukup} unit</span>
              </div>
              <div className="p-2 rounded-lg bg-black border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Rusak Ringan/Berat</span>
                <span className="text-sm font-bold text-rose-400">
                  {conditionStats.rusakRingan + conditionStats.rusakBerat} unit
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Row 3: Operational Quick Actions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Low Stock Warning */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="font-bold text-sm text-white">Peringatan Stok Rendah</h2>
            </div>
            <span className="text-[11px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {lowStockItems.length} Barang
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">
              Semua peralatan mencukupi batas minimum stok aman.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('inventory', item.id)}
                  className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{item.code}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-amber-400 font-bold">{item.availableQty}</span>
                    <span className="text-zinc-500 text-[10px]"> / min {item.minQty} {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Navigation */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <h2 className="font-bold text-sm text-white mb-3 pb-2 border-b border-zinc-800">
            Alur Kerja Cepat Operasional Lapangan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNavigate('picking')}
              className="p-3 rounded-xl bg-black hover:bg-zinc-850 hover:border-orange-500/30 border border-zinc-800 text-left transition flex flex-col justify-between h-24"
            >
              <FileText className="w-5 h-5 text-orange-400" />
              <div>
                <span className="text-xs font-bold text-white block">Picking List</span>
                <span className="text-[10px] text-zinc-400">Persiapan gudang</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('checkout')}
              className="p-3 rounded-xl bg-black hover:bg-zinc-850 hover:border-orange-500/30 border border-zinc-800 text-left transition flex flex-col justify-between h-24"
            >
              <Truck className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Check-Out</span>
                <span className="text-[10px] text-zinc-400">Surat Jalan keluar</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('checkin')}
              className="p-3 rounded-xl bg-black hover:bg-zinc-850 hover:border-orange-500/30 border border-zinc-800 text-left transition flex flex-col justify-between h-24"
            >
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Check-In</span>
                <span className="text-[10px] text-zinc-400">Rekonsiliasi kembali</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('opname')}
              className="p-3 rounded-xl bg-black hover:bg-zinc-850 hover:border-orange-500/30 border border-zinc-800 text-left transition flex flex-col justify-between h-24"
            >
              <Boxes className="w-5 h-5 text-orange-400" />
              <div>
                <span className="text-xs font-bold text-white block">Stock Opname</span>
                <span className="text-[10px] text-zinc-400">Audit fisik gudang</span>
              </div>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
