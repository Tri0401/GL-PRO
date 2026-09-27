import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Eye,
  X,
  Layers,
  Building2,
  Barcode,
  Sparkles,
  ExternalLink,
  Wrench,
  AlertCircle,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductUnit, ItemCondition, ItemStatus } from '../types';
import { DocumentData } from '../components/PrintDocumentModal';

interface InventoryViewProps {
  onOpenLabelPrint: (docData: DocumentData) => void;
  selectedProductId?: string | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenLabelPrint,
  selectedProductId
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    warehouses,
    events
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');

  // Detail Modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(() => {
    if (selectedProductId) {
      return products.find(p => p.id === selectedProductId) || null;
    }
    return null;
  });

  // Form Modal (Add / Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    alias: '',
    category: 'AUDIO',
    subcategory: 'Mixer Digital',
    brand: '',
    model: '',
    isIndividual: false,
    serialNumber: '',
    unit: 'unit',
    totalQty: 1,
    minQty: 1,
    warehouseId: 'wh-utama',
    area: 'Area Penyimpanan Utama',
    rack: 'Rak 01',
    shelf: 'Shelf 01',
    box: '',
    condition: 'Sangat Baik',
    procurementYear: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    notes: ''
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.alias && p.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchWarehouse = selectedWarehouse === 'ALL' || p.warehouseId === selectedWarehouse;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchCondition = selectedCondition === 'ALL' || p.condition === selectedCondition;

    return matchSearch && matchCategory && matchWarehouse && matchStatus && matchCondition;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      alias: '',
      category: 'AUDIO',
      subcategory: 'Mixer Digital',
      brand: '',
      model: '',
      isIndividual: false,
      serialNumber: '',
      unit: 'unit',
      totalQty: 1,
      minQty: 1,
      warehouseId: 'wh-utama',
      area: 'Area Penyimpanan Utama',
      rack: 'Rak 01',
      shelf: 'Shelf 01',
      box: '',
      condition: 'Sangat Baik',
      procurementYear: 2024,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      notes: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setShowFormModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setShowFormModal(false);
  };

  const handleTriggerPrintLabel = (prod: Product) => {
    const wh = warehouses.find(w => w.id === prod.warehouseId);
    const doc: DocumentData = {
      type: 'BARCODE_LABEL',
      title: 'Label Barcode & QR Code Peralatan',
      documentNumber: prod.code,
      date: new Date().toISOString().split('T')[0],
      product: {
        code: prod.code,
        name: prod.name,
        category: prod.category,
        brand: prod.brand,
        model: prod.model,
        warehouse: wh ? wh.name : 'Gudang Utama',
        location: `${prod.rack} - ${prod.shelf} ${prod.box ? `(${prod.box})` : ''}`,
        serialNumber: prod.serialNumber
      }
    };
    onOpenLabelPrint(doc);
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs leading-none">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>AVAILABLE</span>
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs leading-none">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>RESERVED</span>
          </span>
        );
      case 'IN_PREPARATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-xs leading-none">
            <Package className="w-3 h-3 text-sky-400 shrink-0" />
            <span>PREPARATION</span>
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-xs leading-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>IN USE</span>
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-xs leading-none">
            <Truck className="w-3 h-3 text-orange-400 shrink-0" />
            <span>IN TRANSIT</span>
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-xs leading-none">
            <Wrench className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>MAINTENANCE</span>
          </span>
        );
      case 'DAMAGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs leading-none">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>DAMAGED</span>
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-950/60 text-rose-300 border border-rose-800/80 shadow-xs leading-none">
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>LOST</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 leading-none">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-orange-400" />
            <span>Master Data Inventaris & Peralatan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola data spesifikasi teknis, barcode, nomor seri, lokasi detail rak, dan ketersediaan unit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Master Barang</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama, kode, barcode, atau serial number..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Kategori ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Gudang ({warehouses.length})</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Status Operasional</option>
              <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
              <option value="RESERVED">RESERVED (Dipesan)</option>
              <option value="IN_USE">IN USE (Di Event)</option>
              <option value="MAINTENANCE">MAINTENANCE (Servis)</option>
              <option value="DAMAGED">DAMAGED (Rusak)</option>
            </select>
          </div>

        </div>

        {/* Quick category badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">Filter Cepat:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.category === c.name).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.name)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition shrink-0 ${
                  selectedCategory === c.name
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black/70 border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Barang & Spesifikasi</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Gudang & Lokasi Rak</th>
                <th className="py-3 px-3 text-center">Tipe Stok</th>
                <th className="py-3 px-3 text-center">Tersedia / Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Kondisi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    Tidak ada peralatan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const wh = warehouses.find(w => w.id === p.warehouseId);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover border border-zinc-700 shrink-0 cursor-pointer"
                            onClick={() => setDetailProduct(p)}
                          />
                          <div className="max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-orange-400 font-bold">
                                {p.code}
                              </span>
                              {p.isIndividual && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  SN TRACKING
                                </span>
                              )}
                            </div>
                            <h3
                              onClick={() => setDetailProduct(p)}
                              className="font-bold text-white text-xs hover:text-orange-400 transition cursor-pointer truncate"
                            >
                              {p.name}
                            </h3>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {p.brand} {p.model} {p.alias ? `• ${p.alias}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-zinc-200">{p.category}</span>
                        <div className="text-[10px] text-zinc-400">{p.subcategory}</div>
                      </td>

                      {/* Warehouse & Location */}
                      <td className="py-3 px-3">
                        <div className="text-zinc-200 font-medium">{wh ? wh.name : 'Gudang Utama'}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {p.rack} • {p.shelf} {p.box ? `(${p.box})` : ''}
                        </div>
                      </td>

                      {/* Type: Individual vs Bulk */}
                      <td className="py-3 px-3 text-center">
                        {p.isIndividual ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Serial Number
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
                            Bulk Quantity
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div>
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {p.availableQty}
                          </span>
                          <span className="text-zinc-400 text-[11px]"> / {p.totalQty} {p.unit}</span>
                        </div>
                        {p.inUseQty > 0 && (
                          <div className="text-[10px] text-rose-400">({p.inUseQty} di event)</div>
                        )}
                        {p.reservedQty > 0 && (
                          <div className="text-[10px] text-amber-400">({p.reservedQty} dipesan)</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] font-medium ${
                            p.condition === 'Sangat Baik'
                              ? 'text-emerald-400'
                              : p.condition === 'Baik'
                              ? 'text-orange-400'
                              : p.condition === 'Cukup'
                              ? 'text-amber-400'
                              : 'text-rose-400 font-bold'
                          }`}
                        >
                          {p.condition}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailProduct(p)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                            title="Detail Lengkap & Riwayat"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTriggerPrintLabel(p)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400"
                            title="Cetak Label QR & Barcode"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                            title="Edit Data Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus barang "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* DETAIL PRODUCT MODAL */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-sm text-white">Detail Inventaris: {detailProduct.name}</span>
                <span className="font-mono text-xs text-orange-400">({detailProduct.code})</span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Product Top Info */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <img
                  src={detailProduct.imageUrl}
                  alt={detailProduct.name}
                  className="w-full sm:w-44 h-44 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(detailProduct.status)}
                    <span className="text-[11px] font-semibold text-zinc-300">
                      Kondisi: <strong className="text-white">{detailProduct.condition}</strong>
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">{detailProduct.name}</h2>
                  {detailProduct.alias && (
                    <p className="text-zinc-400 text-xs">Alias: {detailProduct.alias}</p>
                  )}
                  <p className="text-zinc-300 text-xs">
                    Merek: <strong className="text-white">{detailProduct.brand}</strong> • Model: <strong className="text-white">{detailProduct.model}</strong>
                  </p>
                  {detailProduct.notes && (
                    <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 text-zinc-300 text-[11px]">
                      {detailProduct.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantities breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 bg-black/40 border border-zinc-800 text-center">
                  <span className="text-zinc-400 text-[10px] block">Total Fisik</span>
                  <span className="text-base font-bold text-white">{detailProduct.totalQty} {detailProduct.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 bg-black/40 border border-zinc-800 text-center">
                  <span className="text-zinc-400 text-[10px] block">Tersedia</span>
                  <span className="text-base font-bold text-emerald-400">{detailProduct.availableQty} {detailProduct.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 bg-black/40 border border-zinc-800 text-center">
                  <span className="text-zinc-400 text-[10px] block">Sedang di Event</span>
                  <span className="text-base font-bold text-rose-400">{detailProduct.inUseQty} {detailProduct.unit}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 bg-black/40 border border-zinc-800 text-center">
                  <span className="text-zinc-400 text-[10px] block">Dipesan (Reserved)</span>
                  <span className="text-base font-bold text-amber-400">{detailProduct.reservedQty} {detailProduct.unit}</span>
                </div>
              </div>

              {/* Detail Location Info */}
              <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs mb-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Lokasi Penyimpanan Gudang</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block">Gudang:</span>
                    <span className="text-zinc-200 font-medium">
                      {warehouses.find(w => w.id === detailProduct.warehouseId)?.name || 'Gudang Utama'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Area Gudang:</span>
                    <span className="text-zinc-200 font-medium">{detailProduct.area}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Rak & Shelf:</span>
                    <span className="text-zinc-200 font-medium">{detailProduct.rack} - {detailProduct.shelf}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Flight Case / Box:</span>
                    <span className="text-zinc-200 font-medium">{detailProduct.box || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Individual Units List (if tracking per serial number) */}
              {detailProduct.isIndividual && detailProduct.units && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center justify-between">
                    <span>Unit Individual (Nomor Seri & Status Masing-Masing):</span>
                    <span className="text-[11px] text-indigo-400 font-mono">{detailProduct.units.length} Unit Terdaftar</span>
                  </h4>
                  <div className="space-y-1.5">
                    {detailProduct.units.map(unit => (
                      <div
                        key={unit.id}
                        className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            {unit.unitCode}
                          </span>
                          <div>
                            <span className="font-mono text-zinc-300">{unit.serialNumber}</span>
                            <div className="text-[10px] text-zinc-400">{unit.locationDetails}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400">Kondisi: {unit.condition}</span>
                          {getStatusBadge(unit.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-black/80 border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => handleTriggerPrintLabel(detailProduct)}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-2 shadow"
              >
                <QrCode className="w-4 h-4" />
                <span>Cetak Label Barcode & QR</span>
              </button>

              <button
                onClick={() => setDetailProduct(null)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingProduct ? 'Edit Master Data Barang' : 'Tambah Master Data Barang Baru'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Barang Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Sony FX3 Cinema Line Camera"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-zinc-300 font-semibold block mb-1">Kategori *</label>
                  <select
                    value={formData.category || 'AUDIO'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {categories.length > 0 ? (
                      categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="AUDIO">AUDIO</option>
                        <option value="LIGHTING">LIGHTING</option>
                        <option value="LED / DISPLAY">LED / DISPLAY</option>
                        <option value="CAMERA / DOKUMENTASI">CAMERA / DOKUMENTASI</option>
                        <option value="KOMPUTER / MULTIMEDIA">KOMPUTER / MULTIMEDIA</option>
                        <option value="RIGGING & STAGE">RIGGING & STAGE</option>
                        <option value="POWER & GENSET">POWER & GENSET</option>
                        <option value="KABEL & DISTRIBUSI">KABEL & DISTRIBUSI</option>
                        <option value="LAINNYA">LAINNYA</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Individual tracking checkbox */}
                <div className="sm:col-span-2 p-3 rounded-lg bg-zinc-900 bg-black/40 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Tipe Pencatatan: Nomor Seri Individual (SN)</span>
                    <span className="text-[11px] text-zinc-400">
                      Aktifkan untuk kamera, mixer, wireless mic yang dilacak per unit kode/serial number.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isIndividual || false}
                    onChange={e => setFormData({ ...formData, isIndividual: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jumlah Unit Fisik *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalQty || 1}
                    onChange={e => setFormData({ ...formData, totalQty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Satuan</label>
                  <select
                    value={formData.unit || 'unit'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="unit">unit</option>
                    <option value="pcs">pcs</option>
                    <option value="set">set</option>
                    <option value="cabinet">cabinet</option>
                    <option value="roll">roll</option>
                    <option value="batang">batang</option>
                    <option value="box">box</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Gudang Penyimpanan</label>
                  <select
                    value={formData.warehouseId || 'wh-utama'}
                    onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {warehouses.length > 0 ? (
                      warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))
                    ) : (
                      <option value="wh-utama">Gudang Utama</option>
                    )}
                  </select>
                </div>



                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kondisi Awal</label>
                  <select
                    value={formData.condition || 'Sangat Baik'}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-zinc-300 font-semibold block mb-1">URL Foto Peralatan</label>
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-zinc-300 font-semibold block mb-1">Catatan Kelengkapan / Aksesoris</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Include kabel power, hard case, bracket, dll."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  Simpan Master Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
