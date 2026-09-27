import React, { useState } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Printer,
  Camera,
  X,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CheckinItem, ItemCondition } from '../types';
import { DocumentData } from '../components/PrintDocumentModal';

interface CheckinViewProps {
  onOpenDocumentPrint: (docData: DocumentData) => void;
  onOpenScanner: () => void;
  initialEventId?: string | null;
}

export const CheckinView: React.FC<CheckinViewProps> = ({
  onOpenDocumentPrint,
  onOpenScanner,
  initialEventId
}) => {
  const {
    events,
    warehouses,
    currentUser,
    processCheckin,
    checkins
  } = useApp();

  // Events that have items checked-out or are in loading/berlangsung/teardown/pengembalian
  const returnableEvents = events.filter(
    e => e.status !== 'Draft' && e.equipmentList.some(eq => (eq.checkedOutQty || 0) > 0)
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialEventId && returnableEvents.some(e => e.id === initialEventId)) {
      return initialEventId;
    }
    return returnableEvents[0]?.id || events[0]?.id || '';
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Inspector & Warehouse
  const [warehouseId, setWarehouseId] = useState<string>('wh-utama');
  const [inspectorName, setInspectorName] = useState<string>(currentUser.name);
  const [checkinDate, setCheckinDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkinTime, setCheckinTime] = useState<string>('14:30');
  const [notes, setNotes] = useState<string>('');

  // Items return list initialized with checkedOutQty
  const [returnItems, setReturnItems] = useState<CheckinItem[]>(() => {
    if (selectedEvent) {
      return selectedEvent.equipmentList.map(eq => {
        const out = eq.checkedOutQty || eq.requestedQty;
        return {
          productId: eq.productId,
          productCode: eq.productCode,
          productName: eq.productName,
          unit: eq.unit,
          outQty: out,
          returnedQty: out, // default expect all
          differenceQty: 0,
          conditionAfter: 'Baik' as ItemCondition,
          isDamaged: false,
          damageNotes: ''
        };
      });
    }
    return [];
  });

  const handleEventChange = (evId: string) => {
    setSelectedEventId(evId);
    const ev = events.find(e => e.id === evId);
    if (ev) {
      setReturnItems(
        ev.equipmentList.map(eq => {
          const out = eq.checkedOutQty || eq.requestedQty;
          return {
            productId: eq.productId,
            productCode: eq.productCode,
            productName: eq.productName,
            unit: eq.unit,
            outQty: out,
            returnedQty: out,
            differenceQty: 0,
            conditionAfter: 'Baik' as ItemCondition,
            isDamaged: false,
            damageNotes: ''
          };
        })
      );
    }
  };

  const handleUpdateReturnedQty = (index: number, qty: number) => {
    setReturnItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const newReturned = Math.max(0, qty);
          const diff = item.outQty - newReturned;
          return {
            ...item,
            returnedQty: newReturned,
            differenceQty: diff
          };
        }
        return item;
      })
    );
  };

  const handleUpdateCondition = (index: number, condition: ItemCondition) => {
    setReturnItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const isDmg = condition === 'Rusak Ringan' || condition === 'Rusak Berat';
          return {
            ...item,
            conditionAfter: condition,
            isDamaged: isDmg
          };
        }
        return item;
      })
    );
  };

  const totalOut = returnItems.reduce((a, b) => a + b.outQty, 0);
  const totalReturned = returnItems.reduce((a, b) => a + b.returnedQty, 0);
  const totalDiff = totalOut - totalReturned;
  const hasDiscrepancy = totalDiff > 0;
  const hasDamaged = returnItems.some(i => i.isDamaged);

  const handleSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || returnItems.length === 0) return;

    const wh = warehouses.find(w => w.id === warehouseId);
    const record = processCheckin({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      warehouseId,
      warehouseName: wh ? wh.name : 'Gudang Utama',
      inspectorName,
      checkinDate,
      checkinTime,
      items: returnItems,
      crewAssignments: selectedEvent.crewAssignments,
      hasDiscrepancy,
      notes
    });

    // Auto open printable Berita Acara Rekonsiliasi
    const docData: DocumentData = {
      type: 'CHECKIN_RECONCILIATION',
      title: 'Berita Acara Check-In & Rekonsiliasi Pengembalian',
      documentNumber: record.checkinCode,
      date: checkinDate,
      time: checkinTime,
      eventName: selectedEvent.name,
      inspectorName,
      warehouseName: wh ? wh.name : 'Gudang Utama',
      picName: selectedEvent.picEventName,
      crewAssignments: selectedEvent.crewAssignments,
      items: returnItems.map((it, idx) => ({
        no: idx + 1,
        code: it.productCode,
        name: it.productName,
        qty: it.outQty,
        unit: it.unit,
        condition: it.conditionAfter,
        notes: it.damageNotes,
        diff: it.differenceQty
      }))
    };

    onOpenDocumentPrint(docData);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <span>Check-In & Rekonsiliasi Pengembalian Gudang</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scan barang kembali setelah event, deteksi selisih barang hilang/tertinggal, dan inspeksi kondisi fisik peralatan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Scan QR Barcode Masuk</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitCheckin} className="space-y-4">
        
        {/* Event Selection & Inspector */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
          <h2 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
            <span>Pilih Event & Pemeriksa Gudang</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Event Yang Mengembalikan *</label>
              <select
                value={selectedEventId}
                onChange={e => handleEventChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold"
                required
              >
                {events.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.eventCode} - {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Gudang Penerima</label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Nama Petugas Pemeriksa (Inspector)</label>
              <input
                type="text"
                required
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium"
              />
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Tanggal & Jam Penerimaan</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={checkinDate}
                  onChange={e => setCheckinDate(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
                <input
                  type="time"
                  value={checkinTime}
                  onChange={e => setCheckinTime(e.target.value)}
                  className="w-24 px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Assigned Crew on Location */}
            {selectedEvent?.crewAssignments && selectedEvent.crewAssignments.length > 0 ? (
              <div className="sm:col-span-2 lg:col-span-4 bg-zinc-950/80 border border-orange-500/30 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-orange-400">
                    <Users className="w-4 h-4" />
                    <span>Tim Kru Penanggung Jawab di Lokasi ({selectedEvent.crewAssignments.length} Personel)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Otomatis terdata & dicetak pada Berita Acara</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.crewAssignments.map((cr, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
                      <span className="font-semibold text-white">{cr.crewName}</span>
                      <span className="text-[10px] font-bold text-orange-400 px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/20">
                        {cr.eventRole}
                      </span>
                      {cr.contact && <span className="text-zinc-500 text-[10px] font-mono">{cr.contact}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 lg:col-span-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-2.5 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Belum ada kru yang ditugaskan khusus pada event ini di modul Event.</span>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner if Discrepancy */}
        {hasDiscrepancy && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500 text-rose-300 text-xs flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  PERINGATAN: TERDAPAT {totalDiff} UNIT BARANG BELUM DIKEMBALIKAN!
                </h4>
                <p className="text-rose-300 text-[11px] mt-0.5">
                  Jumlah keluar: <strong>{totalOut} unit</strong> vs Jumlah kembali fisik:{' '}
                  <strong>{totalReturned} unit</strong>. Segera konfirmasi kepada Project Manager / Crew yang bertugas di lokasi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table: OUT vs RETURNED */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-black/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Rekonsiliasi: Jumlah Keluar vs Jumlah Kembali</span>
            </h2>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">
                Keluar: <strong className="text-white">{totalOut}</strong>
              </span>
              <span className="text-zinc-400">
                Kembali: <strong className="text-emerald-400">{totalReturned}</strong>
              </span>
              <span className={`font-bold ${hasDiscrepancy ? 'text-rose-400' : 'text-zinc-400'}`}>
                Selisih: {totalDiff > 0 ? `-${totalDiff}` : '0 (Lengkap)'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">NO</th>
                  <th className="py-3 px-3">Peralatan</th>
                  <th className="py-3 px-3 text-center w-24">Jumlah Keluar</th>
                  <th className="py-3 px-3 text-center w-28">Jumlah Kembali</th>
                  <th className="py-3 px-3 text-center w-20">Selisih</th>
                  <th className="py-3 px-3 text-center w-36">Kondisi Fisik Kembali</th>
                  <th className="py-3 px-4">Catatan Kerusakan / Pemeriksaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returnItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">
                      Tidak ada daftar barang dari event ini.
                    </td>
                  </tr>
                ) : (
                  returnItems.map((item, idx) => {
                    const isDiff = item.differenceQty > 0;
                    const isBroken = item.conditionAfter === 'Rusak Berat' || item.conditionAfter === 'Rusak Ringan';

                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          isDiff ? 'bg-rose-950/20' : isBroken ? 'bg-amber-950/20' : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-zinc-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-[10px] text-orange-400 font-bold">{item.productCode}</div>
                          <div className="font-bold text-white text-xs">{item.productName}</div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-zinc-300">
                          {item.outQty} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.outQty}
                            value={item.returnedQty}
                            onChange={e => handleUpdateReturnedQty(idx, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-center text-white font-black text-xs"
                          />
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-black text-xs">
                          {item.differenceQty > 0 ? (
                            <span className="text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                              -{item.differenceQty}
                            </span>
                          ) : (
                            <span className="text-emerald-400">0</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <select
                            value={item.conditionAfter}
                            onChange={e => handleUpdateCondition(idx, e.target.value as ItemCondition)}
                            className={`px-2 py-1 rounded border text-xs font-semibold ${
                              isBroken
                                ? 'bg-rose-950 text-rose-300 border-rose-700'
                                : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                            }`}
                          >
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup (Kotor/Wajar)</option>
                            <option value="Rusak Ringan">Rusak Ringan</option>
                            <option value="Rusak Berat">Rusak Berat</option>
                            <option value="Tidak Dapat Digunakan">Mati Total / Afkir</option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.damageNotes || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setReturnItems(prev =>
                                prev.map((it, i) => (i === idx ? { ...it, damageNotes: val } : it))
                              );
                            }}
                            placeholder={isBroken ? 'Deskripsikan gejala kerusakan / port putus...' : 'Catatan opsional...'}
                            className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-white"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-black/80 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              Barang yang dilaporkan rusak akan otomatis dibuatkan dokumen <strong>Laporan Kerusakan (Damage Report)</strong> dan diarahkan ke antrean teknisi.
            </div>

            <button
              type="submit"
              disabled={returnItems.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Check-In & Terbitkan Berita Acara</span>
            </button>
          </div>
        </div>

      </form>

      {/* Checkin History */}
      {checkins.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-sm text-white">Riwayat Berita Acara Check-In Pengembalian</h3>
          <div className="space-y-2">
            {checkins.map(ci => (
              <div
                key={ci.id}
                className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {ci.checkinCode}
                    </span>
                    <span className="font-bold text-white">{ci.eventName}</span>
                    {ci.hasDiscrepancy && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        SELISIH BARANG
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Pemeriksa: <strong className="text-zinc-200">{ci.inspectorName}</strong> • {ci.checkinDate} {ci.checkinTime} WIB
                  </p>
                </div>

                <button
                  onClick={() => {
                    const relatedEvent = events.find(e => e.id === ci.eventId || e.name === ci.eventName);
                    const docData: DocumentData = {
                      type: 'CHECKIN_RECONCILIATION',
                      title: 'Berita Acara Check-In & Rekonsiliasi Pengembalian',
                      documentNumber: ci.checkinCode,
                      date: ci.checkinDate,
                      time: ci.checkinTime,
                      eventName: ci.eventName,
                      inspectorName: ci.inspectorName,
                      warehouseName: ci.warehouseName,
                      picName: relatedEvent?.picEventName,
                      crewAssignments: ci.crewAssignments || relatedEvent?.crewAssignments,
                      items: ci.items.map((it, idx) => ({
                        no: idx + 1,
                        code: it.productCode,
                        name: it.productName,
                        qty: it.outQty,
                        unit: it.unit,
                        condition: it.conditionAfter,
                        notes: it.damageNotes,
                        diff: it.differenceQty
                      }))
                    };
                    onOpenDocumentPrint(docData);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-medium text-xs flex items-center gap-1 border border-zinc-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Berita Acara</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
