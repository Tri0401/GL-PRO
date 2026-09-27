import React, { useState } from 'react';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Save,
  Building2,
  Filter,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StockOpnameItem, StockOpnameSession, ItemCondition } from '../types';

interface StockOpnameViewProps {
  onOpenScanner: () => void;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({ onOpenScanner }) => {
  const {
    warehouses,
    categories,
    products,
    currentUser,
    saveStockOpname,
    stockOpnames
  } = useApp();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('wh-utama');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sessionActive, setSessionActive] = useState(false);

  // Active Audit Items
  const [auditItems, setAuditItems] = useState<StockOpnameItem[]>([]);
  const [notes, setNotes] = useState('');

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  const startStockOpname = () => {
    // Generate audit items matching current filter
    const matchedProducts = products.filter(p => {
      const matchWh = p.warehouseId === selectedWarehouseId;
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchWh && matchCat;
    });

    const items: StockOpnameItem[] = matchedProducts.map(p => ({
      productId: p.id,
      productCode: p.code,
      productName: p.name,
      category: p.category,
      unit: p.unit,
      systemQty: p.totalQty,
      physicalQty: p.totalQty, // starts equal, staff adjusts
      differenceQty: 0,
      status: 'Ada',
      currentLocation: `${p.rack} - ${p.shelf}`,
      condition: p.condition
    }));

    setAuditItems(items);
    setSessionActive(true);
  };

  const handleUpdatePhysicalQty = (index: number, newQty: number) => {
    setAuditItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const val = Math.max(0, newQty);
          const diff = val - item.systemQty;
          let status: StockOpnameItem['status'] = 'Ada';
          if (diff !== 0) status = 'Jumlah Berbeda';
          if (val === 0) status = 'Tidak Ditemukan';
          return {
            ...item,
            physicalQty: val,
            differenceQty: diff,
            status
          };
        }
        return item;
      })
    );
  };

  const handleFinishOpname = () => {
    if (!currentWarehouse) return;
    saveStockOpname({
      warehouseId: currentWarehouse.id,
      warehouseName: currentWarehouse.name,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      auditorName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      status: 'Selesai',
      items: auditItems,
      notes
    });

    setSessionActive(false);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-purple-400" />
            <span>Stock Opname Fisik Gudang</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit fisik berkala: bandingkan jumlah fisik di rak vs data sistem dan rekonsiliasi otomatis selisih inventaris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Scan Barcode Fisik</span>
          </button>
        </div>
      </div>

      {!sessionActive ? (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-xl mx-auto space-y-4 shadow-xl">
          <h2 className="font-bold text-sm text-white border-b border-zinc-800 pb-2">
            Mulai Sesi Audit Fisik Baru
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Pilih Gudang Target Audit *</label>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Filter Kategori (Opsional)</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option value="ALL">Semua Kategori Peralatan</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Auditor / Pemeriksa</label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.division})`}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700 text-zinc-400"
              />
            </div>
          </div>

          <button
            onClick={startStockOpname}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ScanLine className="w-4 h-4" />
            <span>Buka Lembar Hitung Stock Opname</span>
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
          <div className="p-4 bg-black/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                SESI AUDIT AKTIF
              </span>
              <h2 className="font-bold text-sm text-white mt-1">
                Gudang: {currentWarehouse?.name}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Auditor: <strong className="text-zinc-200">{currentUser.name}</strong> • {auditItems.length} jenis barang terverifikasi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSessionActive(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Batal Sesi
              </button>
              <button
                onClick={handleFinishOpname}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan & Sinkronkan Data Fisik</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">NO</th>
                  <th className="py-3 px-3">Barang & Kode</th>
                  <th className="py-3 px-3">Lokasi Rak</th>
                  <th className="py-3 px-3 text-center w-24">Data Sistem</th>
                  <th className="py-3 px-3 text-center w-28">Hitungan Fisik</th>
                  <th className="py-3 px-3 text-center w-20">Selisih</th>
                  <th className="py-3 px-4 text-center">Status Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditItems.map((item, idx) => {
                  const hasDiff = item.differenceQty !== 0;

                  return (
                    <tr
                      key={idx}
                      className={`transition ${hasDiff ? 'bg-amber-950/20' : 'hover:bg-zinc-800/30'}`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-zinc-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[10px] text-orange-400 font-bold">{item.productCode}</div>
                        <div className="font-bold text-white text-xs">{item.productName}</div>
                      </td>

                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                        {item.currentLocation}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-300">
                        {item.systemQty} {item.unit}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.physicalQty}
                          onChange={e => handleUpdatePhysicalQty(idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-center text-white font-black text-xs"
                        />
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-black text-xs">
                        {item.differenceQty > 0 ? (
                          <span className="text-emerald-400">+{item.differenceQty}</span>
                        ) : item.differenceQty < 0 ? (
                          <span className="text-rose-400">{item.differenceQty}</span>
                        ) : (
                          <span className="text-zinc-500">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.differenceQty === 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opname Sessions History */}
      {stockOpnames.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-sm text-white">Riwayat Hasil Audit Stock Opname</h3>
          <div className="space-y-2">
            {stockOpnames.map(op => (
              <div
                key={op.id}
                className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400">{op.sessionCode}</span>
                    <span className="font-bold text-white">{op.warehouseName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Auditor: {op.auditorName} • Tanggal: {op.date} • {op.items.length} Barang diaudit
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Selesai
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
