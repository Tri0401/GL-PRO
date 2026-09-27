import React, { useState } from 'react';
import {
  Building2,
  Users,
  Truck,
  Tags,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Layers,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Warehouse, Client, CrewMember, Vehicle, Category } from '../types';

export const MasterDataView: React.FC = () => {
  const {
    warehouses,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    clients,
    addClient,
    updateClient,
    deleteClient,
    crew,
    addCrew,
    updateCrew,
    deleteCrew,
    vehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useApp();

  const [activeTab, setActiveTab] = useState<'warehouses' | 'clients' | 'crew' | 'vehicles' | 'categories'>('warehouses');

  // Feedback Notification Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // ----------------------------------------------------
  // 1. WAREHOUSE (GUDANG) STATE & HANDLERS
  // ----------------------------------------------------
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [whForm, setWhForm] = useState({
    code: '',
    name: '',
    address: '',
    picName: '',
    picPhone: '',
    capacityDescription: '',
    areas: ['Area Utama']
  });
  const [newAreaInput, setNewAreaInput] = useState('');

  const openAddWarehouse = () => {
    setEditingWarehouse(null);
    setWhForm({
      code: `WH-0${warehouses.length + 1}`,
      name: '',
      address: '',
      picName: '',
      picPhone: '',
      capacityDescription: '',
      areas: ['Area Rigging', 'Area Flight Case', 'Zona Loading Dock']
    });
    setNewAreaInput('');
    setShowWarehouseModal(true);
  };

  const openEditWarehouse = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setWhForm({
      code: wh.code,
      name: wh.name,
      address: wh.address,
      picName: wh.picName,
      picPhone: wh.picPhone,
      capacityDescription: wh.capacityDescription,
      areas: [...wh.areas]
    });
    setNewAreaInput('');
    setShowWarehouseModal(true);
  };

  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name) return;

    if (editingWarehouse) {
      updateWarehouse(editingWarehouse.id, whForm);
      showFeedback('success', `Gudang "${whForm.name}" berhasil diperbarui.`);
    } else {
      addWarehouse(whForm);
      showFeedback('success', `Gudang baru "${whForm.name}" berhasil ditambahkan.`);
    }
    setShowWarehouseModal(false);
  };

  const handleDeleteWarehouse = (wh: Warehouse) => {
    if (confirm(`Apakah Anda yakin ingin menghapus / cut gudang "${wh.name}" (${wh.code})?`)) {
      const res = deleteWarehouse(wh.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  // ----------------------------------------------------
  // 2. CLIENT STATE & HANDLERS
  // ----------------------------------------------------
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    companyName: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const openAddClient = () => {
    setEditingClient(null);
    setClientForm({
      companyName: '',
      picName: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowClientModal(true);
  };

  const openEditClient = (cli: Client) => {
    setEditingClient(cli);
    setClientForm({
      companyName: cli.companyName,
      picName: cli.picName,
      phone: cli.phone,
      email: cli.email,
      address: cli.address,
      notes: cli.notes || ''
    });
    setShowClientModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.companyName) return;

    if (editingClient) {
      updateClient(editingClient.id, clientForm);
      showFeedback('success', `Data client "${clientForm.companyName}" berhasil diperbarui.`);
    } else {
      addClient(clientForm);
      showFeedback('success', `Client baru "${clientForm.companyName}" berhasil ditambahkan.`);
    }
    setShowClientModal(false);
  };

  const handleDeleteClient = (cli: Client) => {
    if (confirm(`Hapus / cut data client "${cli.companyName}"?`)) {
      const res = deleteClient(cli.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  // ----------------------------------------------------
  // 3. ARMADA / VEHICLES STATE & HANDLERS
  // ----------------------------------------------------
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehForm, setVehForm] = useState<Omit<Vehicle, 'id'>>({
    plateNumber: '',
    vehicleType: 'Truk Box CDD',
    brand: '',
    driverName: '',
    driverPhone: '',
    capacityTons: 5,
    status: 'Tersedia'
  });

  const openAddVehicle = () => {
    setEditingVehicle(null);
    setVehForm({
      plateNumber: '',
      vehicleType: 'Truk Box CDD',
      brand: '',
      driverName: '',
      driverPhone: '',
      capacityTons: 5,
      status: 'Tersedia'
    });
    setShowVehicleModal(true);
  };

  const openEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehForm({
      plateNumber: veh.plateNumber,
      vehicleType: veh.vehicleType,
      brand: veh.brand,
      driverName: veh.driverName,
      driverPhone: veh.driverPhone,
      capacityTons: veh.capacityTons,
      status: veh.status
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehForm.plateNumber) return;

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehForm);
      showFeedback('success', `Armada "${vehForm.plateNumber}" berhasil diperbarui.`);
    } else {
      addVehicle(vehForm);
      showFeedback('success', `Armada baru "${vehForm.plateNumber}" berhasil ditambahkan.`);
    }
    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (veh: Vehicle) => {
    if (confirm(`Hapus / cut armada kendaraan "${veh.plateNumber}" (${veh.brand})?`)) {
      const res = deleteVehicle(veh.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  // ----------------------------------------------------
  // 4. CATEGORIES STATE & HANDLERS
  // ----------------------------------------------------
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    code: '',
    iconName: 'Boxes',
    subcategories: ['Umum']
  });
  const [newSubInput, setNewSubInput] = useState('');

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatForm({
      name: '',
      code: '',
      iconName: 'Boxes',
      subcategories: ['Umum']
    });
    setNewSubInput('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      code: cat.code,
      iconName: cat.iconName || 'Boxes',
      subcategories: [...cat.subcategories]
    });
    setNewSubInput('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, catForm);
      showFeedback('success', `Kategori "${catForm.name}" berhasil diperbarui.`);
    } else {
      addCategory(catForm);
      showFeedback('success', `Kategori baru "${catForm.name}" berhasil dibuat.`);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    if (confirm(`Hapus / cut kategori "${cat.name}"?`)) {
      const res = deleteCategory(cat.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  // ----------------------------------------------------
  // 5. CREW STATE & HANDLERS
  // ----------------------------------------------------
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [crewForm, setCrewForm] = useState<Omit<CrewMember, 'id'>>({
    name: '',
    division: 'Audio',
    roleTitle: '',
    phone: '',
    skills: [],
    status: 'Aktif'
  });
  const [crewSkillsInput, setCrewSkillsInput] = useState('');

  const openAddCrew = () => {
    setEditingCrew(null);
    setCrewForm({
      name: '',
      division: 'Audio',
      roleTitle: '',
      phone: '',
      skills: [],
      status: 'Aktif'
    });
    setCrewSkillsInput('');
    setShowCrewModal(true);
  };

  const openEditCrew = (crw: CrewMember) => {
    setEditingCrew(crw);
    setCrewForm({
      name: crw.name,
      division: crw.division,
      roleTitle: crw.roleTitle,
      phone: crw.phone,
      skills: [...crw.skills],
      status: crw.status
    });
    setCrewSkillsInput(crw.skills.join(', '));
    setShowCrewModal(true);
  };

  const handleSaveCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewForm.name) return;

    const parsedSkills = crewSkillsInput
      ? crewSkillsInput.split(',').map(s => s.trim()).filter(Boolean)
      : ['Umum'];

    if (editingCrew) {
      updateCrew(editingCrew.id, { ...crewForm, skills: parsedSkills });
      showFeedback('success', `Data kru "${crewForm.name}" berhasil diperbarui.`);
    } else {
      addCrew({ ...crewForm, skills: parsedSkills });
      showFeedback('success', `Kru baru "${crewForm.name}" berhasil ditambahkan.`);
    }
    setShowCrewModal(false);
  };

  const handleDeleteCrew = (crw: CrewMember) => {
    if (confirm(`Hapus / cut anggota kru "${crw.name}"?`)) {
      const res = deleteCrew(crw.id);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            <span>Master Data Entitas Perusahaan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola data Gudang, Client, Armada Kendaraan, Kategori Peralatan, dan Kru Lapangan (Create, Edit & Hapus/Cut).
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'warehouses' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Multi-Gudang ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'clients' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Client ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'vehicles' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Armada ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'categories' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Kategori ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('crew')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'crew' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Crew Roster ({crew.length})
          </button>
        </div>
      </div>

      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          1. WAREHOUSES TAB (GUDANG)
         ======================================================== */}
      {activeTab === 'warehouses' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-white">Daftar Gudang & Pusat Logistik</h2>
              <p className="text-[11px] text-zinc-400">Penyimpanan fisik peralatan, rak, shelf, dan area staging loading dock.</p>
            </div>
            <button
              onClick={openAddWarehouse}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gudang Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(wh => (
              <div
                key={wh.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 shadow-lg flex flex-col justify-between transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {wh.code}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">{wh.capacityDescription}</span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{wh.name}</h3>

                  <div className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                    <span>{wh.address}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800 text-[11px] space-y-1.5">
                    <div className="text-zinc-400">
                      PIC Gudang: <strong className="text-zinc-200">{wh.picName}</strong> ({wh.picPhone})
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] font-semibold">Area Penyimpanan ({wh.areas.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wh.areas.map((ar, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                            {ar}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete/Cut Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditWarehouse(wh)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 border border-zinc-700 transition"
                  >
                    <Edit2 className="w-3 h-3 text-orange-400" />
                    <span>Edit Gudang</span>
                  </button>
                  <button
                    onClick={() => handleDeleteWarehouse(wh)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 text-xs font-medium flex items-center gap-1 border border-zinc-700 hover:border-rose-900 transition"
                    title="Hapus / Cut Gudang"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Hapus / Cut</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          2. CLIENTS TAB (KLIEN)
         ======================================================== */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-white">Database Klien & Rekanan Perusahaan</h2>
              <p className="text-[11px] text-zinc-400">Pemberi kerja event, korporat, EO partner, dan instansi.</p>
            </div>
            <button
              onClick={openAddClient}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Klien Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(cli => (
              <div
                key={cli.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  <h3 className="font-bold text-sm text-white">{cli.companyName}</h3>
                  <p className="text-[11px] text-orange-400 font-semibold mt-0.5">PIC: {cli.picName}</p>

                  <div className="space-y-1.5 mt-2.5 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{cli.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{cli.email}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cli.address}</span>
                    </div>
                  </div>

                  {cli.notes && (
                    <p className="text-[10px] text-zinc-400 italic mt-2.5 bg-black/40 p-2 rounded-lg border border-zinc-800">
                      "{cli.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Total Event: {cli.totalEventsCount || 0} Project
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditClient(cli)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 border border-zinc-700"
                    >
                      <Edit2 className="w-3 h-3 text-orange-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClient(cli)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 text-xs font-medium border border-zinc-700"
                      title="Hapus / Cut Client"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          3. ARMADA / VEHICLES TAB
         ======================================================== */}
      {activeTab === 'vehicles' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-white">Armada Kendaraan & Logistik Ekspedisi</h2>
              <p className="text-[11px] text-zinc-400">Truk box CDD/CDE, blind van, dan pickup pengangkut flight case.</p>
            </div>
            <button
              onClick={openAddVehicle}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Armada Kendaraan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <div
                key={v.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                        {v.plateNumber}
                      </span>
                      <h3 className="font-bold text-sm text-zinc-200 mt-1">{v.brand}</h3>
                      <p className="text-[11px] text-zinc-400">{v.vehicleType}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'Tersedia'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : v.status === 'Digunakan'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800 text-[11px] space-y-1 mt-3">
                    <div className="text-zinc-400">
                      Driver Tetap: <strong className="text-white">{v.driverName}</strong> ({v.driverPhone})
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditVehicle(v)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 border border-zinc-700"
                  >
                    <Edit2 className="w-3 h-3 text-orange-400" />
                    <span>Edit Armada</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 text-xs font-medium border border-zinc-700"
                    title="Hapus / Cut Armada"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          4. CATEGORIES TAB (KATEGORI & SUBKATEGORI)
         ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-white">Struktur Kategori & Subkategori Event</h2>
              <p className="text-[11px] text-zinc-400">Kategori spesifik multimedia (Audio, Lighting, LED, Kamera, Kabel, Truss, dll.).</p>
            </div>
            <button
              onClick={openAddCategory}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        {cat.code}
                      </span>
                      <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{cat.subcategories.length} Sub</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cat.subcategories.map((sub, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/60">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 border border-zinc-700"
                  >
                    <Edit2 className="w-3 h-3 text-orange-400" />
                    <span>Edit Kategori</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 text-xs font-medium border border-zinc-700"
                    title="Hapus / Cut Kategori"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          5. CREW ROSTER TAB (KRU)
         ======================================================== */}
      {activeTab === 'crew' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-white">Roster Personel & Keahlian Kru Produksi</h2>
              <p className="text-[11px] text-zinc-400">Tim sound engineer, lighting operator, LED tech, videographer, driver, dan gudang.</p>
            </div>
            <button
              onClick={openAddCrew}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kru Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crew.map(cr => (
              <div
                key={cr.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl text-xs space-y-3 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-zinc-850 border border-orange-500/30 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 tracking-wider font-mono shadow">
                      {cr.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{cr.name}</h3>
                      <p className="text-[11px] text-orange-400 font-semibold">{cr.roleTitle}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                        Divisi {cr.division}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-zinc-800 text-[11px] space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>No. Handphone:</span>
                      <strong className="text-white">{cr.phone}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block mb-1">Keahlian Teknis:</span>
                      <div className="flex flex-wrap gap-1">
                        {cr.skills.map((sk, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditCrew(cr)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 border border-zinc-700"
                  >
                    <Edit2 className="w-3 h-3 text-orange-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCrew(cr)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 text-xs font-medium border border-zinc-700"
                    title="Hapus / Cut Kru"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: WAREHOUSE (CREATE / EDIT)
         ======================================================== */}
      {showWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingWarehouse ? 'Edit Data Gudang' : 'Tambah Gudang Baru'}
              </h3>
              <button onClick={() => setShowWarehouseModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kode Gudang *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-01"
                    value={whForm.code}
                    onChange={e => setWhForm({ ...whForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Gudang *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gudang Audio & Sound"
                    value={whForm.name}
                    onChange={e => setWhForm({ ...whForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Alamat Gudang Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Industri Raya No. 42..."
                  value={whForm.address}
                  onChange={e => setWhForm({ ...whForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    placeholder="Nama PIC"
                    value={whForm.picName}
                    onChange={e => setWhForm({ ...whForm, picName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor Telepon PIC</label>
                  <input
                    type="text"
                    placeholder="0812-..."
                    value={whForm.picPhone}
                    onChange={e => setWhForm({ ...whForm, picPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Keterangan Kapasitas & Fasilitas</label>
                <input
                  type="text"
                  placeholder="e.g. 800 m² - Khusus Sound, Line Array, Mic Lab"
                  value={whForm.capacityDescription}
                  onChange={e => setWhForm({ ...whForm, capacityDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              {/* Dynamic Storage Areas */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Area / Zona Penyimpanan</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tambah area (e.g. Rak A, Meja Testing)..."
                    value={newAreaInput}
                    onChange={e => setNewAreaInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAreaInput.trim()) {
                          setWhForm({ ...whForm, areas: [...whForm.areas, newAreaInput.trim()] });
                          setNewAreaInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAreaInput.trim()) {
                        setWhForm({ ...whForm, areas: [...whForm.areas, newAreaInput.trim()] });
                        setNewAreaInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-semibold border border-zinc-700"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-black/40 rounded-lg border border-zinc-800">
                  {whForm.areas.map((ar, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] flex items-center gap-1 border border-zinc-700"
                    >
                      <span>{ar}</span>
                      <button
                        type="button"
                        onClick={() => setWhForm({ ...whForm, areas: whForm.areas.filter((_, i) => i !== idx) })}
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {editingWarehouse ? 'Simpan Perubahan' : 'Buat Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CLIENT (CREATE / EDIT)
         ======================================================== */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingClient ? 'Edit Data Klien' : 'Tambah Klien Baru'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Perusahaan / Organisasi *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Mahakarya Media"
                  value={clientForm.companyName}
                  onChange={e => setClientForm({ ...clientForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama PIC Klien *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Amanda"
                  value={clientForm.picName}
                  onChange={e => setClientForm({ ...clientForm, picName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="0812-..."
                    value={clientForm.phone}
                    onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="corporate@client.co.id"
                    value={clientForm.email}
                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Alamat Kantor Klien</label>
                <textarea
                  rows={2}
                  placeholder="Alamat kantor..."
                  value={clientForm.address}
                  onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Khusus Klien</label>
                <input
                  type="text"
                  placeholder="e.g. Klien rutin konser outdoor skala besar..."
                  value={clientForm.notes}
                  onChange={e => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {editingClient ? 'Simpan Perubahan' : 'Tambah Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VEHICLE / ARMADA (CREATE / EDIT)
         ======================================================== */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingVehicle ? 'Edit Data Armada Kendaraan' : 'Tambah Armada Baru'}
              </h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor Polisi (Plat) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B 9821 KGA"
                    value={vehForm.plateNumber}
                    onChange={e => setVehForm({ ...vehForm, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jenis Kendaraan *</label>
                  <select
                    value={vehForm.vehicleType}
                    onChange={e => setVehForm({ ...vehForm, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Truk Box CDD">Truk Box CDD (Double)</option>
                    <option value="Truk Box CDE">Truk Box CDE (Engkel)</option>
                    <option value="Blind Van">Blind Van</option>
                    <option value="Pickup Box">Pickup Box</option>
                    <option value="Grand Max">Grand Max</option>
                    <option value="Passenger Van">Passenger Van</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Merek & Tipe</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Isuzu Giga FRR 190"
                  value={vehForm.brand}
                  onChange={e => setVehForm({ ...vehForm, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Driver Tetap</label>
                  <input
                    type="text"
                    placeholder="e.g. Joko Susilo"
                    value={vehForm.driverName}
                    onChange={e => setVehForm({ ...vehForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nomor HP Driver</label>
                  <input
                    type="text"
                    placeholder="0813-..."
                    value={vehForm.driverPhone}
                    onChange={e => setVehForm({ ...vehForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Status Kesiapan Armada</label>
                <select
                  value={vehForm.status}
                  onChange={e => setVehForm({ ...vehForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                >
                  <option value="Tersedia">Tersedia (Ready di Pool)</option>
                  <option value="Digunakan">Digunakan (Jalan di Event)</option>
                  <option value="Maintenance">Maintenance (Bengkel/Servis)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {editingVehicle ? 'Simpan Perubahan' : 'Tambah Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CATEGORIES (CREATE / EDIT)
         ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingCategory ? 'Edit Data Kategori & Subkategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPECIAL EFFECTS"
                    value={catForm.name}
                    onChange={e => setCatForm({ ...catForm, name: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Kode Kategori *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SFX"
                    value={catForm.code}
                    onChange={e => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono uppercase"
                  />
                </div>
              </div>

              {/* Dynamic Subcategories */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Daftar Subkategori</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tambah subkategori (e.g. Co2 Jet, Confetti Gun)..."
                    value={newSubInput}
                    onChange={e => setNewSubInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubInput.trim()) {
                          setCatForm({ ...catForm, subcategories: [...catForm.subcategories, newSubInput.trim()] });
                          setNewSubInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubInput.trim()) {
                        setCatForm({ ...catForm, subcategories: [...catForm.subcategories, newSubInput.trim()] });
                        setNewSubInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-semibold border border-zinc-700"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-black/40 rounded-lg border border-zinc-800">
                  {catForm.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] flex items-center gap-1 border border-zinc-700"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCatForm({
                            ...catForm,
                            subcategories: catForm.subcategories.filter((_, i) => i !== idx)
                          })
                        }
                        className="text-zinc-400 hover:text-rose-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREW (CREATE / EDIT)
         ======================================================== */}
      {showCrewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">
                {editingCrew ? 'Edit Data Kru Produksi' : 'Tambah Anggota Kru Baru'}
              </h3>
              <button onClick={() => setShowCrewModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCrew} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gilang Ramadhan"
                  value={crewForm.name}
                  onChange={e => setCrewForm({ ...crewForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Divisi Keahlian *</label>
                  <select
                    value={crewForm.division}
                    onChange={e => setCrewForm({ ...crewForm, division: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Audio">Audio</option>
                    <option value="Lighting">Lighting</option>
                    <option value="LED">LED</option>
                    <option value="Multimedia">Multimedia</option>
                    <option value="Dokumentasi">Dokumentasi</option>
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Driver">Driver</option>
                    <option value="Teknisi">Teknisi</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Jabatan / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lighting Designer"
                    value={crewForm.roleTitle}
                    onChange={e => setCrewForm({ ...crewForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nomor Handphone (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  placeholder="0812-..."
                  value={crewForm.phone}
                  onChange={e => setCrewForm({ ...crewForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Keahlian Teknis (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="e.g. Avolites Titan, GrandMA2, DMX Protocol, Rigging Safety"
                  value={crewSkillsInput}
                  onChange={e => setCrewSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCrewModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  {editingCrew ? 'Simpan Perubahan' : 'Tambah Kru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
