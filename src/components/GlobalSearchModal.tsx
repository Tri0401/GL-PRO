import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Boxes,
  CalendarDays,
  Truck,
  User,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: 'product' | 'event' | 'checkout' | 'crew' | 'warehouse', id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const { products, events, checkouts, crew, warehouses } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.toLowerCase().trim();

  // Search matching
  const matchedProducts = query
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.alias && p.alias.toLowerCase().includes(query)) ||
          p.barcode.toLowerCase().includes(query) ||
          p.qrCode.toLowerCase().includes(query) ||
          (p.serialNumber && p.serialNumber.toLowerCase().includes(query)) ||
          (p.units && p.units.some(u => u.serialNumber.toLowerCase().includes(query) || u.unitCode.toLowerCase().includes(query)))
      ).slice(0, 5)
    : [];

  const matchedEvents = query
    ? events.filter(
        e =>
          e.name.toLowerCase().includes(query) ||
          e.eventCode.toLowerCase().includes(query) ||
          e.clientName.toLowerCase().includes(query) ||
          e.venueName.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchedCheckouts = query
    ? checkouts.filter(
        c =>
          c.suratJalanNumber.toLowerCase().includes(query) ||
          c.checkoutCode.toLowerCase().includes(query) ||
          c.eventName.toLowerCase().includes(query) ||
          c.driverName.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchedCrew = query
    ? crew.filter(
        cr =>
          cr.name.toLowerCase().includes(query) ||
          cr.roleTitle.toLowerCase().includes(query) ||
          cr.division.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasResults =
    matchedProducts.length > 0 ||
    matchedEvents.length > 0 ||
    matchedCheckouts.length > 0 ||
    matchedCrew.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
        
        {/* Search Input Bar */}
        <div className="relative border-b border-zinc-800 p-3 sm:p-4 flex items-center gap-3 bg-black">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari barang, serial number, barcode, event, surat jalan, atau crew..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="Hapus ketikan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-4">
          {!query && (
            <div className="text-center py-8 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-300">Pencarian Global Cepat GL PRO PRODUCTION</p>
              <p className="mt-1 text-zinc-500">Ketik nama peralatan (e.g. "Beam", "CL5", "FX3"), kode barang, nomor seri, atau nama event.</p>
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-300">Tidak ada hasil ditemukan untuk "{searchTerm}"</p>
              <p className="mt-1 text-zinc-500">Periksa kembali ejaan kata kunci atau nomor kode barang.</p>
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-orange-400" />
                <span>Peralatan & Inventaris ({matchedProducts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectResult('product', p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/30 border border-transparent transition text-left text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-9 h-9 rounded object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span className="text-orange-400 font-mono font-medium">{p.code}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="text-emerald-400">{p.availableQty} {p.unit} tersedia</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Events */}
          {matchedEvents.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
                <span>Event & Produksi ({matchedEvents.length})</span>
              </div>
              <div className="space-y-1">
                {matchedEvents.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onSelectResult('event', e.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/30 border border-transparent transition text-left text-xs"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-white truncate">{e.name}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                        <span className="text-orange-400 font-mono font-medium">{e.eventCode}</span>
                        <span>•</span>
                        <span>{e.clientName}</span>
                        <span>•</span>
                        <span className="text-amber-400">{e.status}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Checkouts / Surat Jalan */}
          {matchedCheckouts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-orange-400" />
                <span>Surat Jalan & Pengiriman ({matchedCheckouts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedCheckouts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectResult('checkout', c.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/30 border border-transparent transition text-left text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white font-mono">{c.suratJalanNumber}</div>
                      <div className="text-[11px] text-zinc-400">
                        Event: {c.eventName} | Driver: {c.driverName} ({c.vehiclePlate})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Crew */}
          {matchedCrew.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Crew & Personel ({matchedCrew.length})</span>
              </div>
              <div className="space-y-1">
                {matchedCrew.map(cr => (
                  <button
                    key={cr.id}
                    onClick={() => {
                      onSelectResult('crew', cr.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/30 border border-transparent transition text-left text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                        {cr.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white">{cr.name}</div>
                        <div className="text-[11px] text-zinc-400">{cr.roleTitle} ({cr.division})</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-black border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Batal</span>
          </button>
          <span className="text-orange-400 font-medium">Pencarian Real-Time Otomatis</span>
        </div>

      </div>
    </div>
  );
};
