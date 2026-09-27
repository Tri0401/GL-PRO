import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Boxes,
  Truck,
  PackageCheck,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLogItem } from '../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchSearch =
      searchTerm === '' ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCat = categoryFilter === 'ALL' || log.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getCategoryBadge = (cat: AuditLogItem['category']) => {
    switch (cat) {
      case 'CHECKOUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">CHECK-OUT</span>;
      case 'CHECKIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CHECK-IN</span>;
      case 'DAMAGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">DAMAGE</span>;
      case 'INVENTORY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">INVENTORY</span>;
      case 'EVENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">EVENT</span>;
      case 'TRANSFER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">TRANSFER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">{cat}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-orange-400" />
            <span>Audit Trail & Log Aktivitas Sistem</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Catatan kronologis immutable (tidak dapat dimanipulasi) dari setiap perubahan stok, check-out, mutasi barang, dan keputusan operasional.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sistem Proteksi Integritas Data Aktif</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari aksi audit, user, atau rincian deskripsi..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="ALL">Semua Kategori Aktivitas</option>
          <option value="CHECKOUT">Check-Out Peralatan</option>
          <option value="CHECKIN">Check-In Pengembalian</option>
          <option value="DAMAGE">Laporan Kerusakan</option>
          <option value="INVENTORY">Master Data Inventaris</option>
          <option value="EVENT">Operasional Event</option>
          <option value="SYSTEM">Sistem & Keamanan</option>
        </select>
      </div>

      {/* Timeline Audit Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="relative pl-6 border-l-2 border-zinc-800 space-y-4 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              Tidak ada catatan audit yang sesuai.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="relative group">
                {/* Dot marker */}
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-zinc-800 border-2 border-orange-400 group-hover:scale-125 transition" />

                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(log.category)}
                    <span className="font-mono text-zinc-400">{log.action}</span>
                  </div>
                  <span className="text-zinc-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 group-hover:border-zinc-700 transition">
                  <p className="text-zinc-200 text-xs leading-relaxed">{log.description}</p>
                  <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-zinc-400" />
                      Oleh: <strong className="text-zinc-300">{log.userName}</strong> ({log.userRole.replace('_', ' ')})
                    </span>
                    {log.entityType && (
                      <span className="font-mono text-zinc-400">
                        Entitas: {log.entityType} ({log.entityId || '-'})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
