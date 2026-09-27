import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Truck,
  ArrowRight,
  Boxes,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PickingListViewProps {
  onNavigateToCheckout: (eventId: string) => void;
  onOpenScanner: () => void;
  initialEventId?: string | null;
}

export const PickingListView: React.FC<PickingListViewProps> = ({
  onNavigateToCheckout,
  onOpenScanner,
  initialEventId
}) => {
  const { events, setEvents, products } = useApp();

  const activeOrUpcomingEvents = events.filter(e => e.status !== 'Selesai' && e.status !== 'Dibatalkan');
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialEventId && events.some(e => e.id === initialEventId)) {
      return initialEventId;
    }
    return activeOrUpcomingEvents[0]?.id || '';
  });

  const currentEvent = events.find(e => e.id === selectedEventId);

  // Staff mark item picked
  const handleIncrementPicked = (itemId: string, increment: number) => {
    if (!currentEvent) return;
    setEvents(prev => prev.map(ev => {
      if (ev.id === currentEvent.id) {
        return {
          ...ev,
          equipmentList: ev.equipmentList.map(item => {
            if (item.id === itemId) {
              const newPicked = Math.max(0, Math.min(item.requestedQty, item.pickedQty + increment));
              const newStatus = newPicked >= item.requestedQty ? 'Lengkap' : newPicked > 0 ? 'Sedang Disiapkan' : 'Belum Disiapkan';
              return {
                ...item,
                pickedQty: newPicked,
                status: newStatus
              };
            }
            return item;
          })
        };
      }
      return ev;
    }));
  };

  const handlePickAll = () => {
    if (!currentEvent) return;
    setEvents(prev => prev.map(ev => {
      if (ev.id === currentEvent.id) {
        return {
          ...ev,
          equipmentList: ev.equipmentList.map(item => ({
            ...item,
            pickedQty: item.requestedQty,
            status: 'Lengkap'
          }))
        };
      }
      return ev;
    }));
  };

  const totalRequired = currentEvent?.equipmentList.reduce((a, b) => a + b.requestedQty, 0) || 0;
  const totalPicked = currentEvent?.equipmentList.reduce((a, b) => a + (b.pickedQty || 0), 0) || 0;
  const allPicked = totalRequired > 0 && totalPicked >= totalRequired;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-400" />
            <span>Picking List Gudang (Persiapan Peralatan)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar tugas staf gudang untuk mengambil, menguji, dan menyiapkan flight case peralatan ke staging area.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700"
          >
            <QrCode className="w-4 h-4 text-orange-400" />
            <span>Scan QR Barcode Pengambilan</span>
          </button>

          {currentEvent && (
            <button
              onClick={() => onNavigateToCheckout(currentEvent.id)}
              disabled={totalPicked === 0}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition ${
                totalPicked > 0
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Lanjut ke Check-Out ({totalPicked} Unit)</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Event */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-300">Pilih Jadwal Event:</span>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
          >
            {activeOrUpcomingEvents.map(e => (
              <option key={e.id} value={e.id}>
                {e.eventCode} - {e.name} ({e.venueName})
              </option>
            ))}
          </select>
        </div>

        {currentEvent && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400">
              Progres Picking:{' '}
              <strong className={allPicked ? 'text-emerald-400' : 'text-orange-400'}>
                {totalPicked} / {totalRequired} Unit
              </strong>
            </span>

            <button
              onClick={handlePickAll}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-xs font-semibold border border-zinc-700"
            >
              Tandai Semua Lengkap
            </button>
          </div>
        )}
      </div>

      {/* Picking Table */}
      {currentEvent ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                {currentEvent.eventCode}
              </span>
              <h3 className="font-bold text-sm text-white">{currentEvent.name}</h3>
            </div>
            <span className="text-xs text-zinc-400">
              Venue: <strong className="text-zinc-200">{currentEvent.venueName}</strong> • PIC:{' '}
              <strong className="text-zinc-200">{currentEvent.picEventName}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Kode & Peralatan</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Lokasi Rak & Case</th>
                  <th className="py-3 px-3 text-center">Kebutuhan</th>
                  <th className="py-3 px-3 text-center">Tersedia di Gudang</th>
                  <th className="py-3 px-3 text-center">Sudah Diambil (Picked)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Ambil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentEvent.equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400 text-xs">
                      Tidak ada daftar kebutuhan alat untuk event ini. Silakan tambahkan pada menu Operasional Event.
                    </td>
                  </tr>
                ) : (
                  currentEvent.equipmentList.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    const isComplete = (item.pickedQty || 0) >= item.requestedQty;

                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-zinc-800/30 ${
                          isComplete ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono text-[10px] text-orange-400 font-bold">{item.productCode}</div>
                          <div className="font-bold text-white text-xs">{item.productName}</div>
                          {item.notes && <div className="text-[10px] text-zinc-400">{item.notes}</div>}
                        </td>

                        <td className="py-3 px-3 text-zinc-300 font-medium">
                          {item.category}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-zinc-300">
                          {prod ? `${prod.rack} • ${prod.shelf} ${prod.box ? `(${prod.box})` : ''}` : '-'}
                        </td>

                        <td className="py-3 px-3 text-center font-extrabold text-white text-sm">
                          {item.requestedQty} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-emerald-400">{prod ? prod.availableQty : '-'}</span> {item.unit}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono text-sm font-black ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.pickedQty || 0}
                          </span>
                          <span className="text-zinc-400 text-[11px]"> / {item.requestedQty}</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isComplete
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : (item.pickedQty || 0) > 0
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleIncrementPicked(item.id, -1)}
                              disabled={(item.pickedQty || 0) <= 0}
                              className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-xs"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleIncrementPicked(item.id, 1)}
                              disabled={isComplete}
                              className="w-7 h-7 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

    </div>
  );
};
