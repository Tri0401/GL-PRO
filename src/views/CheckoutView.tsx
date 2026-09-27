import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Printer,
  QrCode,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Users,
  Building2,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CheckoutItem, CheckoutRecord, ItemCondition } from '../types';
import { DocumentData } from '../components/PrintDocumentModal';

interface CheckoutViewProps {
  onOpenDocumentPrint: (docData: DocumentData) => void;
  initialEventId?: string | null;
  onOpenScanner: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  onOpenDocumentPrint,
  initialEventId,
  onOpenScanner
}) => {
  const {
    events,
    warehouses,
    crew,
    vehicles,
    products,
    processCheckout,
    checkouts
  } = useApp();

  const activeEvents = events.filter(e => e.status !== 'Selesai' && e.status !== 'Dibatalkan');
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialEventId && events.some(e => e.id === initialEventId)) {
      return initialEventId;
    }
    return activeEvents[0]?.id || '';
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Form State
  const [warehouseId, setWarehouseId] = useState<string>('wh-utama');
  const [picName, setPicName] = useState<string>('Andi Saputra');
  const [driverName, setDriverName] = useState<string>('Joko Susilo');
  const [vehiclePlate, setVehiclePlate] = useState<string>('B 9821 KGA');
  const [vehicleType, setVehicleType] = useState<string>('Truk Box CDD');
  const [checkoutDate, setCheckoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkoutTime, setCheckoutTime] = useState<string>('08:00');
  const [notes, setNotes] = useState<string>('');

  // Items to check-out (initialized from event equipment list)
  const [itemsToCheckout, setItemsToCheckout] = useState<CheckoutItem[]>(() => {
    if (selectedEvent) {
      return selectedEvent.equipmentList.map(eq => ({
        productId: eq.productId,
        productCode: eq.productCode,
        productName: eq.productName,
        unit: eq.unit,
        qty: eq.requestedQty,
        conditionBefore: 'Sangat Baik' as ItemCondition,
        notes: eq.notes || ''
      }));
    }
    return [];
  });

  // When event changes, auto-populate equipment list items
  const handleEventChange = (evId: string) => {
    setSelectedEventId(evId);
    const ev = events.find(e => e.id === evId);
    if (ev) {
      setItemsToCheckout(
        ev.equipmentList.map(eq => ({
          productId: eq.productId,
          productCode: eq.productCode,
          productName: eq.productName,
          unit: eq.unit,
          qty: eq.requestedQty,
          conditionBefore: 'Sangat Baik' as ItemCondition,
          notes: eq.notes || ''
        }))
      );
    }
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    setItemsToCheckout(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, qty: Math.max(1, newQty) } : item))
    );
  };

  const handleUpdateItemCondition = (index: number, condition: ItemCondition) => {
    setItemsToCheckout(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, conditionBefore: condition } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setItemsToCheckout(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit check-out and generate Surat Jalan
  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || itemsToCheckout.length === 0) return;

    const wh = warehouses.find(w => w.id === warehouseId);
    const todayStr = checkoutDate.replace(/-/g, '');
    const sjNumber = `SJ-${todayStr}-${String(checkouts.length + 1).padStart(4, '0')}`;

    const createdRecord = processCheckout({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      warehouseId,
      warehouseName: wh ? wh.name : 'Gudang Utama',
      picName,
      driverName,
      vehiclePlate,
      vehicleType,
      checkoutDate,
      checkoutTime,
      suratJalanNumber: sjNumber,
      items: itemsToCheckout,
      crewAssignments: selectedEvent.crewAssignments,
      notes
    });

    // Automatically prepare and trigger Surat Jalan Printable modal
    const docData: DocumentData = {
      type: 'SURAT_JALAN',
      title: 'Surat Jalan Pengiriman Barang',
      documentNumber: sjNumber,
      date: checkoutDate,
      time: checkoutTime,
      eventName: selectedEvent.name,
      clientName: selectedEvent.clientName,
      venueName: selectedEvent.venueName,
      venueAddress: selectedEvent.venueAddress,
      driverName,
      vehiclePlate,
      vehicleType,
      warehouseName: wh ? wh.name : 'Gudang Utama',
      picName,
      crewAssignments: selectedEvent.crewAssignments,
      items: itemsToCheckout.map((it, idx) => ({
        no: idx + 1,
        code: it.productCode,
        name: it.productName,
        qty: it.qty,
        unit: it.unit,
        condition: it.conditionBefore,
        notes: it.notes
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
            <Truck className="w-5 h-5 text-orange-400" />
            <span>Check-Out Barang & Penerbitan Surat Jalan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verifikasi fisik barang keluar gudang, penetapan driver dan armada truk, serta pembuatan dokumen resmi pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700"
          >
            <QrCode className="w-4 h-4 text-orange-400" />
            <span>Scan Barcode Keluar</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitCheckout} className="space-y-4">
        
        {/* Step 1: Destination & Dispatch Info */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
          <h2 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-zinc-800">
            <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">1</span>
            <span>Informasi Tujuan Event & Logistik Armada</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Pilih Event Tujuan *</label>
              <select
                value={selectedEventId}
                onChange={e => handleEventChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-semibold"
                required
              >
                {activeEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.eventCode} - {e.name} ({e.venueName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Gudang Asal Barang *</label>
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
              <label className="text-zinc-300 font-semibold block mb-1">PIC Penanggung Jawab Event</label>
              <select
                value={picName}
                onChange={e => setPicName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                {crew.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.division})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Driver / Pengemudi *</label>
              <select
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                {crew.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.division}) {c.phone ? `- ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Armada & Nomor Kendaraan *</label>
              <select
                value={vehiclePlate}
                onChange={e => {
                  setVehiclePlate(e.target.value);
                  const veh = vehicles.find(v => v.plateNumber === e.target.value);
                  if (veh) setVehicleType(veh.vehicleType);
                }}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.plateNumber}>
                    {v.plateNumber} ({v.brand} - {v.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tanggal Berangkat</label>
                <input
                  type="date"
                  value={checkoutDate}
                  onChange={e => setCheckoutDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Jam Berangkat</label>
                <input
                  type="time"
                  value={checkoutTime}
                  onChange={e => setCheckoutTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>
            </div>

            {/* Assigned Crew for Selected Event */}
            {selectedEvent?.crewAssignments && selectedEvent.crewAssignments.length > 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 bg-zinc-950/80 border border-orange-500/30 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-orange-400">
                    <Users className="w-4 h-4" />
                    <span>Daftar Kru Event Ditugaskan ({selectedEvent.crewAssignments.length} Personel)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Otomatis terdata & dicetak pada Surat Jalan</span>
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
              <div className="sm:col-span-2 lg:col-span-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-2.5 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Belum ada kru khusus yang ditugaskan pada event ini. (Dapat ditambahkan melalui menu Event &gt; Penugasan Crew).</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Verification of Outgoing Items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-black/60 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">2</span>
              <span>Daftar Verifikasi Peralatan Keluar ({itemsToCheckout.length} Barang)</span>
            </h2>

            <span className="text-xs text-zinc-400">
              Total Unit Keluar:{' '}
              <strong className="text-emerald-400 text-sm">
                {itemsToCheckout.reduce((a, b) => a + b.qty, 0)} Unit
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">NO</th>
                  <th className="py-3 px-3">Kode & Nama Peralatan</th>
                  <th className="py-3 px-3 text-center w-28">Jumlah Keluar</th>
                  <th className="py-3 px-3 text-center w-36">Kondisi Sebelum Keluar</th>
                  <th className="py-3 px-3">Catatan Khusus / Case</th>
                  <th className="py-3 px-4 text-right w-16">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {itemsToCheckout.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                      Tidak ada barang untuk check-out. Pilih event yang memiliki kebutuhan peralatan.
                    </td>
                  </tr>
                ) : (
                  itemsToCheckout.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 text-center font-mono text-zinc-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-[10px] text-orange-400 font-bold">{item.productCode}</div>
                        <div className="font-bold text-white text-xs">{item.productName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={e => handleUpdateItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-center text-white font-bold text-xs"
                          />
                          <span className="text-zinc-400">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={item.conditionBefore}
                          onChange={e => handleUpdateItemCondition(idx, e.target.value as ItemCondition)}
                          className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                        >
                          <option value="Sangat Baik">Sangat Baik</option>
                          <option value="Baik">Baik</option>
                          <option value="Cukup">Cukup</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setItemsToCheckout(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, notes: val } : it))
                            );
                          }}
                          placeholder="Nomor case / catatan..."
                          className="w-full px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-white"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-400"
                          title="Hapus baris"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-black/80 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              Setelah tombol diklik, sistem akan otomatis menerbitkan <strong>Nomor Surat Jalan resmi</strong> dan mengalihkan status peralatan ke <em>IN USE / DI EVENT</em>.
            </div>

            <button
              type="submit"
              disabled={itemsToCheckout.length === 0}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 flex items-center gap-2 active:scale-95 transition disabled:opacity-40"
            >
              <FileText className="w-4 h-4" />
              <span>Konfirmasi Check-Out & Cetak Surat Jalan</span>
            </button>
          </div>
        </div>

      </form>

      {/* Checkouts History List */}
      {checkouts.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-sm text-white">Riwayat Surat Jalan & Check-Out Terbit</h3>
          <div className="space-y-2">
            {checkouts.map(co => (
              <div
                key={co.id}
                className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {co.suratJalanNumber}
                    </span>
                    <span className="font-bold text-white">{co.eventName}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Driver: <strong className="text-zinc-200">{co.driverName}</strong> ({co.vehiclePlate}) • Tanggal: {co.checkoutDate} jam {co.checkoutTime} WIB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {co.items.reduce((a, b) => a + b.qty, 0)} Unit
                  </span>
                  <button
                    onClick={() => {
                      const relatedEvent = events.find(e => e.id === co.eventId || e.name === co.eventName);
                      const docData: DocumentData = {
                        type: 'SURAT_JALAN',
                        title: 'Surat Jalan Pengiriman Barang',
                        documentNumber: co.suratJalanNumber,
                        date: co.checkoutDate,
                        time: co.checkoutTime,
                        eventName: co.eventName,
                        clientName: relatedEvent?.clientName,
                        venueName: relatedEvent?.venueName,
                        venueAddress: relatedEvent?.venueAddress,
                        driverName: co.driverName,
                        vehiclePlate: co.vehiclePlate,
                        vehicleType: co.vehicleType,
                        warehouseName: co.warehouseName,
                        picName: co.picName,
                        crewAssignments: co.crewAssignments || relatedEvent?.crewAssignments,
                        items: co.items.map((it, idx) => ({
                          no: idx + 1,
                          code: it.productCode,
                          name: it.productName,
                          qty: it.qty,
                          unit: it.unit,
                          condition: it.conditionBefore,
                          notes: it.notes
                        }))
                      };
                      onOpenDocumentPrint(docData);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-medium text-xs flex items-center gap-1 border border-zinc-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Ulang</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
