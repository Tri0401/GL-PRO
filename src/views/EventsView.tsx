import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Users,
  Boxes,
  Clock,
  MapPin,
  Truck,
  ArrowRight,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  ChevronDown,
  Package,
  RotateCcw,
  UserPlus,
  Phone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EventData, EventStatus, EventEquipmentItem, EventChecklistItem, EventCrewAssignment } from '../types';

interface EventsViewProps {
  onNavigateToCheckout: (eventId: string) => void;
  onNavigateToPicking: (eventId: string) => void;
  selectedEventId?: string | null;
}

export const EventsView: React.FC<EventsViewProps> = ({
  onNavigateToCheckout,
  onNavigateToPicking,
  selectedEventId
}) => {
  const {
    events,
    addEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    reserveEquipmentForEvent,
    removeEquipmentFromEvent,
    products,
    clients,
    crew
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Event ID & Derived Detail Event
  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    if (selectedEventId) {
      return selectedEventId;
    }
    return events[0]?.id || null;
  });

  React.useEffect(() => {
    if (selectedEventId) {
      setActiveEventId(selectedEventId);
    }
  }, [selectedEventId]);

  const detailEvent = React.useMemo(() => {
    if (activeEventId) {
      const found = events.find(e => e.id === activeEventId);
      if (found) return found;
    }
    return events.length > 0 ? events[0] : null;
  }, [events, activeEventId]);

  // Modal confirmations for delete
  const [equipmentToDelete, setEquipmentToDelete] = useState<{
    eventId: string;
    item: EventEquipmentItem;
  } | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventData | null>(null);

  // Modal create event
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventData, setNewEventData] = useState<Partial<EventData>>({
    name: '',
    clientName: '',
    clientId: '',
    venueName: '',
    venueAddress: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    loadingTime: '',
    setupTime: '',
    showTime: '',
    teardownTime: '',
    picEventName: 'Andi Saputra',
    projectManagerName: 'Andi Saputra',
    status: 'Persiapan',
    notes: ''
  });

  // Modal edit event
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventData, setEditEventData] = useState<Partial<EventData>>({});

  // Equipment Reservation Sub-modal
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearchReserve, setProductSearchReserve] = useState<string>('');
  const [showProductDropdownReserve, setShowProductDropdownReserve] = useState<boolean>(false);
  const [reserveQty, setReserveQty] = useState<number>(1);
  const [reserveNotes, setReserveNotes] = useState<string>('');
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Detail sub-tabs inside Event drawer
  const [detailSubTab, setDetailSubTab] = useState<'equipment' | 'crew'>('equipment');

  // Penugasan Crew State & Modals
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [selectedCrewMemberId, setSelectedCrewMemberId] = useState<string>('');
  const [selectedEventRole, setSelectedEventRole] = useState<EventCrewAssignment['eventRole']>('PIC Event');
  const [customCrewContact, setCustomCrewContact] = useState<string>('');
  const [crewToDelete, setCrewToDelete] = useState<{ eventId: string; assignment: EventCrewAssignment } | null>(null);

  // Calendar State & Calculations
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (events.length > 0 && events[0].startDate) {
      const parts = events[0].startDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    if (events.length > 0 && events[0].startDate) {
      return events[0].startDate;
    }
    return new Date().toISOString().split('T')[0];
  });

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const prevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(today.toISOString().split('T')[0]);
  };

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // Monday as first day: Monday = 0, Sunday = 6
    const startOffset = (firstDay + 6) % 7;

    const daysInCurrMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isToday: boolean;
      events: EventData[];
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = events.filter(e => {
        const s = e.startDate;
        const en = e.endDate || e.startDate;
        return dateStr >= s && dateStr <= en;
      });
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateStr,
        isToday: dateStr === todayStr,
        events: evs
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = events.filter(e => {
        const s = e.startDate;
        const en = e.endDate || e.startDate;
        return dateStr >= s && dateStr <= en;
      });
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        isToday: dateStr === todayStr,
        events: evs
      });
    }

    // Next month padding to fill grid (35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = events.filter(e => {
        const s = e.startDate;
        const en = e.endDate || e.startDate;
        return dateStr >= s && dateStr <= en;
      });
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateStr,
        isToday: dateStr === todayStr,
        events: evs
      });
    }

    return days;
  }, [currentYear, currentMonth, events]);

  const selectedDateEvents = React.useMemo(() => {
    return events.filter(e => {
      const s = e.startDate;
      const en = e.endDate || e.startDate;
      return selectedCalendarDate >= s && selectedCalendarDate <= en;
    });
  }, [selectedCalendarDate, events]);

  const currentMonthEventsCount = React.useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return events.filter(e => {
      const s = e.startDate.slice(0, 7);
      const en = (e.endDate || e.startDate).slice(0, 7);
      return prefix >= s && prefix <= en;
    }).length;
  }, [currentYear, currentMonth, events]);

  const getEventChipStyle = (st: EventStatus) => {
    switch (st) {
      case 'Berlangsung':
        return 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/35';
      case 'Loading':
        return 'bg-orange-500/25 text-orange-300 border border-orange-500/40 hover:bg-orange-500/35';
      case 'Siap Berangkat':
        return 'bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:bg-amber-500/35';
      case 'Persiapan':
        return 'bg-sky-500/25 text-sky-300 border border-sky-500/40 hover:bg-sky-500/35';
      case 'Selesai':
        return 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:bg-zinc-700/80';
      default:
        return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    }
  };

  // Filter events
  const filteredEvents = events.filter(e => {
    const matchSearch =
      searchTerm === '' ||
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venueName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.name) return;

    const cName = newEventData.clientName?.trim() || 'Klien Umum';
    const created = addEvent({
      ...newEventData,
      clientId: `cli-${Date.now()}`,
      clientName: cName
    });
    setActiveEventId(created.id);
    setShowAddModal(false);
    setNewEventData({
      name: '',
      clientName: '',
      clientId: '',
      venueName: '',
      venueAddress: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      loadingTime: '',
      setupTime: '',
      showTime: '',
      teardownTime: '',
      picEventName: 'Andi Saputra',
      projectManagerName: 'Andi Saputra',
      status: 'Persiapan',
      notes: ''
    });
  };

  const handleOpenEditEvent = (evt: EventData) => {
    setEditEventData({
      id: evt.id,
      eventCode: evt.eventCode,
      name: evt.name,
      clientName: evt.clientName,
      venueName: evt.venueName,
      venueAddress: evt.venueAddress,
      startDate: evt.startDate,
      endDate: evt.endDate,
      loadingTime: evt.loadingTime || '',
      setupTime: evt.setupTime || '',
      showTime: evt.showTime || '',
      teardownTime: evt.teardownTime || '',
      picEventName: evt.picEventName,
      projectManagerName: evt.projectManagerName,
      status: evt.status,
      notes: evt.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEventData || !editEventData.id || !editEventData.name) return;

    const cName = editEventData.clientName?.trim() || 'Klien Umum';
    updateEvent(editEventData.id, {
      name: editEventData.name,
      clientName: cName,
      venueName: editEventData.venueName,
      venueAddress: editEventData.venueAddress,
      startDate: editEventData.startDate,
      endDate: editEventData.endDate,
      loadingTime: editEventData.loadingTime,
      setupTime: editEventData.setupTime,
      showTime: editEventData.showTime,
      teardownTime: editEventData.teardownTime,
      picEventName: editEventData.picEventName,
      projectManagerName: editEventData.projectManagerName,
      status: editEventData.status,
      notes: editEventData.notes
    });

    setShowEditModal(false);
  };

  const handleDeleteEvent = (evt: EventData) => {
    setEventToDelete(evt);
  };

  // Filtered equipment suggestions with auto-matching for reservation modal
  const filteredProductsReserve = React.useMemo(() => {
    if (!productSearchReserve.trim()) return products;
    const query = productSearchReserve.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.model && p.model.toLowerCase().includes(query))
    );
  }, [products, productSearchReserve]);

  const matchedProductReserve = React.useMemo(() => {
    if (!selectedProductId) return null;
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleProductSearchChange = (val: string) => {
    setProductSearchReserve(val);
    setShowProductDropdownReserve(true);

    const query = val.trim().toLowerCase();
    if (!query) return;

    // Automatic match check:
    const exactMatch = products.find(
      p =>
        p.name.toLowerCase() === query ||
        p.code.toLowerCase() === query ||
        `${p.name} (${p.code})`.toLowerCase() === query
    );
    if (exactMatch) {
      setSelectedProductId(exactMatch.id);
    } else {
      // If single candidate matches, auto-link it
      const matches = products.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query)
      );
      if (matches.length === 1) {
        setSelectedProductId(matches[0].id);
      }
    }
  };

  const handleSelectProduct = (p: typeof products[0]) => {
    setSelectedProductId(p.id);
    setProductSearchReserve(`${p.name} (${p.code})`);
    setShowProductDropdownReserve(false);
  };

  const handleDoReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailEvent) return;
    if (!selectedProductId) {
      setReserveError('Silakan ketik atau pilih peralatan yang valid dari daftar.');
      return;
    }

    const res = reserveEquipmentForEvent(detailEvent.id, selectedProductId, reserveQty, reserveNotes);
    if (!res.success) {
      setReserveError(res.message);
    } else {
      setReserveError(null);
      setShowReserveModal(false);
    }
  };

  // Penugasan Crew Handlers
  const handleOpenAddCrewModal = () => {
    if (!detailEvent) return;
    const firstCrew = crew[0];
    if (firstCrew) {
      setSelectedCrewMemberId(firstCrew.id);
      setCustomCrewContact(firstCrew.phone);
      if (firstCrew.division === 'Audio') setSelectedEventRole('PIC Audio');
      else if (firstCrew.division === 'Lighting') setSelectedEventRole('PIC Lighting');
      else if (firstCrew.division === 'LED') setSelectedEventRole('PIC LED');
      else if (firstCrew.division === 'Multimedia') setSelectedEventRole('PIC Multimedia');
      else if (firstCrew.division === 'Dokumentasi') setSelectedEventRole('PIC Dokumentasi');
      else if (firstCrew.division === 'Driver') setSelectedEventRole('Driver');
      else if (firstCrew.division === 'Warehouse') setSelectedEventRole('Warehouse Crew');
      else if (firstCrew.division === 'Production') setSelectedEventRole('Production Manager');
      else setSelectedEventRole('PIC Event');
    } else {
      setSelectedCrewMemberId('');
      setCustomCrewContact('');
      setSelectedEventRole('PIC Event');
    }
    setShowAddCrewModal(true);
  };

  const handleSelectCrewChange = (crewId: string) => {
    setSelectedCrewMemberId(crewId);
    const c = crew.find(item => item.id === crewId);
    if (c) {
      setCustomCrewContact(c.phone);
      if (c.division === 'Audio') setSelectedEventRole('PIC Audio');
      else if (c.division === 'Lighting') setSelectedEventRole('PIC Lighting');
      else if (c.division === 'LED') setSelectedEventRole('PIC LED');
      else if (c.division === 'Multimedia') setSelectedEventRole('PIC Multimedia');
      else if (c.division === 'Dokumentasi') setSelectedEventRole('PIC Dokumentasi');
      else if (c.division === 'Driver') setSelectedEventRole('Driver');
      else if (c.division === 'Warehouse') setSelectedEventRole('Warehouse Crew');
      else if (c.division === 'Production') setSelectedEventRole('Production Manager');
      else setSelectedEventRole('PIC Event');
    }
  };

  const handleSaveCrewAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailEvent || !selectedCrewMemberId) return;
    const c = crew.find(item => item.id === selectedCrewMemberId);
    if (!c) return;

    const newAssignment: EventCrewAssignment = {
      id: `ca-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      crewId: c.id,
      crewName: c.name,
      division: c.division,
      eventRole: selectedEventRole,
      contact: customCrewContact.trim() || c.phone
    };

    const nextAssignments = [...(detailEvent.crewAssignments || []), newAssignment];
    updateEvent(detailEvent.id, { crewAssignments: nextAssignments });
    setShowAddCrewModal(false);
  };

  const handleConfirmDeleteCrew = () => {
    if (!crewToDelete) return;
    const targetEvt = events.find(e => e.id === crewToDelete.eventId);
    if (targetEvt) {
      const nextAssignments = targetEvt.crewAssignments.filter(a => a.id !== crewToDelete.assignment.id);
      updateEvent(crewToDelete.eventId, { crewAssignments: nextAssignments });
    }
    setCrewToDelete(null);
  };

  // Status badge styling
  const getEventBadge = (st: EventStatus) => {
    switch (st) {
      case 'Berlangsung':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs leading-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>BERLANGSUNG</span>
          </span>
        );
      case 'Loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs leading-none">
            <Truck className="w-3 h-3 text-amber-400 shrink-0" />
            <span>LOADING</span>
          </span>
        );
      case 'Persiapan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs leading-none">
            <Clock className="w-3 h-3 text-sky-400 shrink-0" />
            <span>PERSIAPAN</span>
          </span>
        );
      case 'Siap Berangkat':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs leading-none">
            <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
            <span>SIAP BERANGKAT</span>
          </span>
        );
      case 'Teardown':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs leading-none">
            <RotateCcw className="w-3 h-3 text-orange-400 shrink-0" />
            <span>TEARDOWN</span>
          </span>
        );
      case 'Pengembalian':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs leading-none">
            <RotateCcw className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>PENGEMBALIAN</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs leading-none">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>SELESAI</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700 leading-none">
            <span>{st}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-400" />
            <span>Manajemen Operasional Event</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola tech rider, equipment list, anti-overbooking reservasi alat, timeline produksi & crew assignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar vs List Toggle */}
          <div className="bg-zinc-800 p-0.5 rounded-xl border border-zinc-700 flex text-xs">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'list' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Daftar Event
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'calendar' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Kalender Acara
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Event Baru</span>
          </button>
        </div>
      </div>

      {/* Main layout: Switchable between List View & Calendar View */}
      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Event Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Filter Bar */}
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari event, client, venue..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Loading">Loading</option>
              <option value="Persiapan">Persiapan</option>
              <option value="Siap Berangkat">Siap Berangkat</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-400">
                Tidak ada event yang sesuai.
              </div>
            ) : (
              filteredEvents.map(evt => {
                const isSelected = detailEvent?.id === evt.id;
                const totalReq = evt.equipmentList.reduce((a, b) => a + b.requestedQty, 0);
                const totalOut = evt.equipmentList.reduce((a, b) => a + (b.checkedOutQty || 0), 0);
                const prepPct = totalReq > 0 ? Math.round((totalOut / totalReq) * 100) : 0;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setActiveEventId(evt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                      isSelected
                        ? 'bg-zinc-900 bg-zinc-800/90 border-orange-500 shadow-lg shadow-orange-500/10'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-orange-400 font-bold">
                            {evt.eventCode}
                          </span>
                          <span className="text-[10px] text-zinc-500">•</span>
                          <span className="text-[11px] text-zinc-400 font-medium">{evt.clientName}</span>
                        </div>
                        <h3 className="font-bold text-sm text-white mt-0.5 leading-snug">
                          {evt.name}
                        </h3>
                      </div>
                      {getEventBadge(evt.status)}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{evt.venueName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/80">
                      <div className="text-zinc-400">
                        {evt.startDate} s/d {evt.endDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-medium">Alat: {totalOut}/{totalReq} Unit ({prepPct}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Event Studio & Operations (7 Cols) */}
        <div className="lg:col-span-7">
          {detailEvent ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Event Header Banner */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 bg-black/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {detailEvent.eventCode}
                    </span>
                    {getEventBadge(detailEvent.status)}
                  </div>

                  {/* Status Dropdown and Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={detailEvent.status}
                      onChange={e => {
                        updateEventStatus(detailEvent.id, e.target.value as EventStatus);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Persiapan">Persiapan</option>
                      <option value="Siap Berangkat">Siap Berangkat</option>
                      <option value="Loading">Loading</option>
                      <option value="Berlangsung">Berlangsung</option>
                      <option value="Teardown">Teardown</option>
                      <option value="Pengembalian">Pengembalian</option>
                      <option value="Selesai">Selesai</option>
                    </select>

                    <button
                      onClick={() => handleOpenEditEvent(detailEvent)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 flex items-center gap-1 transition"
                      title="Edit Data Event & Nama Klien"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-orange-400" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(detailEvent)}
                      className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-xs font-semibold text-zinc-300 hover:text-rose-400 border border-zinc-700 hover:border-rose-900 flex items-center gap-1 transition"
                      title="Hapus / Cut Event"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline">Cut / Hapus</span>
                    </button>

                    <button
                      onClick={() => onNavigateToPicking(detailEvent.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-orange-400 border border-zinc-700"
                      title="Lihat Picking List Gudang"
                    >
                      Picking
                    </button>

                    <button
                      onClick={() => onNavigateToCheckout(detailEvent.id)}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm"
                      title="Check-Out Barang & Terbitkan Surat Jalan"
                    >
                      Check-Out
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">{detailEvent.name}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Klien: <strong className="text-zinc-200">{detailEvent.clientName}</strong> • PIC Event: <strong className="text-zinc-200">{detailEvent.picEventName}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-zinc-400 block">Jadwal Acara:</span>
                    <span className="text-white font-medium">{detailEvent.startDate} s/d {detailEvent.endDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Loading Time:</span>
                    <span className="text-white font-medium">{detailEvent.loadingTime || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Venue:</span>
                    <span className="text-white font-medium truncate block">{detailEvent.venueName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Show Time:</span>
                    <span className="text-white font-medium">{detailEvent.showTime || '-'}</span>
                  </div>
                </div>

                {/* Sub tabs */}
                <div className="flex border-b border-zinc-800 pt-2 gap-4 text-xs font-semibold">
                  <button
                    onClick={() => setDetailSubTab('equipment')}
                    className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                      detailSubTab === 'equipment' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Equipment List ({detailEvent.equipmentList.length})</span>
                  </button>

                  <button
                    onClick={() => setDetailSubTab('crew')}
                    className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                      detailSubTab === 'crew' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Penugasan Crew ({detailEvent.crewAssignments.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub Tab Content */}
              <div className="p-4 overflow-y-auto max-h-[500px]">
                
                {/* 1. EQUIPMENT LIST & RESERVATION */}
                {detailSubTab === 'equipment' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white">Daftar Kebutuhan Peralatan</h4>
                        <p className="text-[11px] text-zinc-400">Barang yang di-reserve akan otomatis terkunci untuk event ini.</p>
                      </div>

                      <button
                        onClick={() => {
                          const initialProduct = products[0];
                          setSelectedProductId(initialProduct?.id || '');
                          setProductSearchReserve(initialProduct ? `${initialProduct.name} (${initialProduct.code})` : '');
                          setShowProductDropdownReserve(false);
                          setReserveQty(1);
                          setReserveNotes('');
                          setReserveError(null);
                          setShowReserveModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Reserve Barang</span>
                      </button>
                    </div>

                    {detailEvent.equipmentList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
                        Belum ada peralatan yang di-reserve untuk event ini. Klik "Reserve Barang" untuk menambahkan.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detailEvent.equipmentList.map(item => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-orange-400 font-bold">{item.productCode}</span>
                                  <span className="text-[10px] text-zinc-400">{item.category}</span>
                                </div>
                                <h5 className="font-bold text-white text-xs">{item.productName}</h5>
                                {item.notes && <p className="text-[10px] text-zinc-400">{item.notes}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="font-extrabold text-white text-sm">
                                  {item.requestedQty} {item.unit}
                                </span>
                                <div className="text-[10px] text-zinc-400">
                                  Keluar: {item.checkedOutQty || 0} • Kembali: {item.returnedQty || 0}
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'Di Event'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : item.status === 'Lengkap'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {item.status}
                              </span>

                              <button
                                onClick={() => {
                                  setEquipmentToDelete({
                                    eventId: detailEvent.id,
                                    item
                                  });
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Hapus reservasi alat dari event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CREW ASSIGNMENTS */}
                {detailSubTab === 'crew' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white">Struktur Penugasan Personel Lapangan</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-bold border border-orange-500/25">
                            {detailEvent.crewAssignments.length} Personil Ditugaskan
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Tugaskan engineer audio, lighting, LED, multimedia, operator, dan driver dari data master crew.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenAddCrewModal}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition shrink-0 active:scale-95"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Tugaskan Anggota Crew</span>
                      </button>
                    </div>

                    {detailEvent.crewAssignments.length === 0 ? (
                      <div className="p-8 text-center bg-black/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                        <div className="text-xs font-semibold text-zinc-300">Belum ada crew yang ditugaskan</div>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Tambahkan personel teknisi, operator sound/lighting/LED, atau driver dari master crew untuk event ini.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddCrewModal}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Tugaskan Anggota Sekarang</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {detailEvent.crewAssignments.map(ca => {
                          const roleColor =
                            ca.eventRole.includes('Manager') || ca.eventRole.includes('PIC Event')
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : ca.eventRole.includes('Audio')
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : ca.eventRole.includes('Lighting')
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : ca.eventRole.includes('LED') || ca.eventRole.includes('Multimedia')
                              ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                              : ca.eventRole.includes('Driver')
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                          return (
                            <div
                              key={ca.id}
                              className="p-3 rounded-xl bg-black/50 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
                                    {ca.eventRole}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-medium">
                                    Divisi {ca.division}
                                  </span>
                                </div>
                                <h5 className="font-bold text-white text-xs truncate">{ca.crewName}</h5>
                                <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                                  <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                                  <span>{ca.contact || '-'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCrewToDelete({ eventId: detailEvent.id, assignment: ca })}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30"
                                  title={`Hapus ${ca.crewName} dari penugasan event`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs">
              Pilih event dari daftar sebelah kiri untuk melihat rincian operasional.
            </div>
          )}
        </div>

      </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="space-y-4 animate-in fade-in">
          {/* Calendar Toolbar */}
          <div className="bg-zinc-900 border border-zinc-800 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  <span>Bulan Ini</span>
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{monthNames[currentMonth]} {currentYear}</span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {currentMonthEventsCount} Event Terjadwal pada Bulan Ini
                </p>
              </div>
            </div>

            {/* Quick Status Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Berlangsung
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Loading
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Persiapan
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Selesai
              </span>
            </div>
          </div>

          {/* Grid Layout: Calendar (Left 8 cols) + Selected Date Agenda (Right 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Calendar Grid (8 cols) */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl overflow-hidden flex flex-col">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-2">
                {daysOfWeek.map((day, idx) => (
                  <div key={day} className={idx >= 5 ? 'text-orange-400/80' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
                {calendarDays.map((cell, idx) => {
                  const isSelectedDate = cell.dateStr === selectedCalendarDate;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedCalendarDate(cell.dateStr);
                        if (cell.events.length > 0) {
                          setActiveEventId(cell.events[0].id);
                        }
                      }}
                      className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        isSelectedDate
                          ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/50'
                          : cell.isCurrentMonth
                          ? 'bg-zinc-800/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/70'
                          : 'bg-zinc-950/40 border-zinc-850/40 text-zinc-600 hover:bg-zinc-900/40'
                      }`}
                    >
                      {/* Day number header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold flex items-center justify-center rounded-md ${
                            cell.isToday
                              ? 'w-6 h-6 bg-orange-600 text-white shadow-xs font-extrabold'
                              : cell.isCurrentMonth
                              ? 'text-zinc-200'
                              : 'text-zinc-600'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {cell.events.length > 0 && (
                          <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1 rounded">
                            {cell.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips List */}
                      <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                        {cell.events.slice(0, 2).map(evt => (
                          <div
                            key={evt.id}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedCalendarDate(cell.dateStr);
                              setActiveEventId(evt.id);
                            }}
                            className={`p-1 rounded-md text-[10px] leading-tight truncate transition cursor-pointer ${getEventChipStyle(evt.status)}`}
                            title={`${evt.eventCode} - ${evt.name} (${evt.clientName} @ ${evt.venueName})`}
                          >
                            <span className="font-bold mr-1">{evt.eventCode}:</span>
                            <span>{evt.name}</span>
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <div className="text-[9px] text-zinc-400 font-medium pl-1">
                            +{cell.events.length - 2} event lagi
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Date & Event Summary Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Selected Date Header */}
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                      Agenda Tanggal
                    </span>
                    <h3 className="font-bold text-sm text-white">
                      {new Date(selectedCalendarDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-700">
                    {selectedDateEvents.length} Event
                  </span>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
                    <Calendar className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p>Tidak ada event yang terjadwal pada tanggal ini.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEventData(prev => ({
                          ...prev,
                          startDate: selectedCalendarDate,
                          endDate: selectedCalendarDate
                        }));
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-orange-600 hover:text-white text-orange-400 text-xs font-semibold transition border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Event di Tanggal Ini</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateEvents.map(evt => {
                      const isSelected = detailEvent?.id === evt.id;
                      const totalReq = evt.equipmentList.reduce((a, b) => a + b.requestedQty, 0);
                      const totalOut = evt.equipmentList.reduce((a, b) => a + (b.checkedOutQty || 0), 0);
                      const prepPct = totalReq > 0 ? Math.round((totalOut / totalReq) * 100) : 0;
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setActiveEventId(evt.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-2.5 ${
                            isSelected
                              ? 'bg-zinc-800/90 border-orange-500 shadow-md shadow-orange-500/10'
                              : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-orange-400 font-bold">
                                  {evt.eventCode}
                                </span>
                                <span className="text-[10px] text-zinc-500">•</span>
                                <span className="text-[11px] text-zinc-400">{evt.clientName}</span>
                              </div>
                              <h4 className="font-bold text-sm text-white mt-0.5">{evt.name}</h4>
                            </div>
                            {getEventBadge(evt.status)}
                          </div>

                          <div className="space-y-1 text-[11px] text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate">{evt.venueName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span>Loading: <strong className="text-zinc-300">{evt.loadingTime || '-'}</strong> | Show: <strong className="text-zinc-300">{evt.showTime || '-'}</strong></span>
                            </div>
                          </div>

                          {/* Progress indicators */}
                          <div className="pt-2 border-t border-zinc-800 text-[10px]">
                            <div className="flex justify-between text-zinc-400 mb-0.5">
                              <span>Alat Keluar (Check-Out)</span>
                              <span className="font-bold text-orange-400">{prepPct}% ({totalOut}/{totalReq} Unit)</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${prepPct}%` }}></div>
                            </div>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEventId(evt.id);
                                setActiveTab('list');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                              title="Buka rincian rider & alat di tampilan daftar"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Rincian & Alat</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToCheckout(evt.id);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                                title="Proses Surat Jalan / Check-Out"
                              >
                                <Truck className="w-3.5 h-3.5 text-orange-400" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditEventData(evt);
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                                title="Edit Event"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">Daftarkan Event Produksi Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Event / Acara *</label>
                <input
                  type="text"
                  required
                  value={newEventData.name || ''}
                  onChange={e => setNewEventData({ ...newEventData, name: e.target.value })}
                  placeholder="Contoh: Konser Rock Nusantara 2026"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-200 font-semibold">Nama Client / Penyelenggara Acara *</label>
                  <span className="text-[10px] text-orange-400 font-medium">Bebas ketik langsung tanpa daftar</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ketik langsung nama client (misal: PT ABC, EO Nusantara, Panitia Reuni, dll.)..."
                  value={newEventData.clientName || ''}
                  onChange={e => setNewEventData({ ...newEventData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Tidak perlu mendaftarkan client ke master data terlebih dahulu. Cukup langsung ketik nama di sini.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Venue / Gedung</label>
                  <input
                    type="text"
                    required
                    value={newEventData.venueName || ''}
                    onChange={e => setNewEventData({ ...newEventData, venueName: e.target.value })}
                    placeholder="Contoh: Grand Ballroom Ritz Carlton"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Alamat Venue</label>
                  <input
                    type="text"
                    value={newEventData.venueAddress || ''}
                    onChange={e => setNewEventData({ ...newEventData, venueAddress: e.target.value })}
                    placeholder="Contoh: SCBD Senayan Jakarta"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={newEventData.startDate || ''}
                    onChange={e => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={newEventData.endDate || ''}
                    onChange={e => setNewEventData({ ...newEventData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Project Manager</label>
                  <select
                    value={newEventData.projectManagerName || 'Andi Saputra'}
                    onChange={e => setNewEventData({ ...newEventData, projectManagerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {crew.map(cr => (
                      <option key={cr.id} value={cr.name}>{cr.name} ({cr.division})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">PIC Event Lapangan</label>
                  <select
                    value={newEventData.picEventName || 'Andi Saputra'}
                    onChange={e => setNewEventData({ ...newEventData, picEventName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {crew.map(cr => (
                      <option key={cr.id} value={cr.name}>{cr.name} ({cr.division})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Operasional / Tech Rider</label>
                <textarea
                  rows={2}
                  value={newEventData.notes || ''}
                  onChange={e => setNewEventData({ ...newEventData, notes: e.target.value })}
                  placeholder="Kebutuhan listrik khusus, izin loading dock, dll."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  Daftarkan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {showEditModal && editEventData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div>
                <h3 className="font-bold text-sm text-white">Edit Data Operasional Event</h3>
                <span className="text-[10px] text-orange-400 font-mono">{editEventData.eventCode}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Event / Acara *</label>
                <input
                  type="text"
                  required
                  value={editEventData.name || ''}
                  onChange={e => setEditEventData({ ...editEventData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-200 font-semibold">Nama Client / Penyelenggara Acara *</label>
                  <span className="text-[10px] text-orange-400 font-medium">Bebas ketik langsung tanpa daftar</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ketik langsung nama client (bebas ketik apa saja)..."
                  value={editEventData.clientName || ''}
                  onChange={e => setEditEventData({ ...editEventData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Langsung ketik nama client / instansi tanpa perlu mendaftarkan ke master data.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Venue / Gedung</label>
                  <input
                    type="text"
                    required
                    value={editEventData.venueName || ''}
                    onChange={e => setEditEventData({ ...editEventData, venueName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Alamat Venue</label>
                  <input
                    type="text"
                    value={editEventData.venueAddress || ''}
                    onChange={e => setEditEventData({ ...editEventData, venueAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={editEventData.startDate || ''}
                    onChange={e => setEditEventData({ ...editEventData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={editEventData.endDate || ''}
                    onChange={e => setEditEventData({ ...editEventData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Status Acara</label>
                  <select
                    value={editEventData.status || 'Persiapan'}
                    onChange={e => setEditEventData({ ...editEventData, status: e.target.value as EventStatus })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Persiapan">Persiapan</option>
                    <option value="Siap Berangkat">Siap Berangkat</option>
                    <option value="Loading">Loading</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Teardown">Teardown</option>
                    <option value="Pengembalian">Pengembalian</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">PIC Event Lapangan</label>
                  <select
                    value={editEventData.picEventName || 'Andi Saputra'}
                    onChange={e => setEditEventData({ ...editEventData, picEventName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                  >
                    {crew.map(cr => (
                      <option key={cr.id} value={cr.name}>{cr.name} ({cr.division})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Operasional / Tech Rider</label>
                <textarea
                  rows={2}
                  value={editEventData.notes || ''}
                  onChange={e => setEditEventData({ ...editEventData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVE EQUIPMENT MODAL (Strict Anti-Overbooking) */}
      {showReserveModal && detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white">Reservasi Kebutuhan Alat Event</h3>
              <button onClick={() => setShowReserveModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDoReserve} className="p-4 space-y-3 text-xs">
              {reserveError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reserveError}</span>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-300 font-semibold block">Pilih Peralatan *</label>
                  {matchedProductReserve && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{matchedProductReserve.category} • Tersedia: {matchedProductReserve.availableQty} {matchedProductReserve.unit}</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={productSearchReserve}
                    onChange={e => handleProductSearchChange(e.target.value)}
                    onFocus={() => setShowProductDropdownReserve(true)}
                    placeholder="Ketik manual nama alat, kode (misal: MIC, PAR), merk..."
                    className="w-full pl-3 pr-16 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-orange-500 focus:outline-none placeholder:text-zinc-500 text-xs"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {productSearchReserve && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchReserve('');
                          setShowProductDropdownReserve(true);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-white rounded"
                        title="Hapus ketikan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowProductDropdownReserve(!showProductDropdownReserve)}
                      className="p-0.5 text-zinc-400 hover:text-white rounded"
                      title="Lihat semua peralatan"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showProductDropdownReserve ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Suggestions Dropdown with auto matching */}
                {showProductDropdownReserve && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProductDropdownReserve(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 divide-y divide-zinc-800 animate-in fade-in">
                      <div className="p-2 bg-zinc-950 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-zinc-800">
                        <span>Pilih dari Hasil Pencarian:</span>
                        <span className="text-orange-400 font-bold">{filteredProductsReserve.length} barang</span>
                      </div>
                      {filteredProductsReserve.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 text-xs">
                          <p className="font-semibold text-white">Tidak ada peralatan yang cocok</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Coba ketik kata kunci lain seperti nama atau kode produk.
                          </p>
                        </div>
                      ) : (
                        filteredProductsReserve.map(p => {
                          const isSelected = p.id === selectedProductId;
                          const isAvailable = p.availableQty > 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-800 transition ${
                                isSelected ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-zinc-200'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                                  <span className="truncate">{p.name}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                                </div>
                                <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-orange-400/90">{p.code}</span>
                                  <span>•</span>
                                  <span>{p.category}</span>
                                  {p.brand && <span>• {p.brand}</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                                  isAvailable
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  Tersedia: {p.availableQty} {p.unit}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Show availability stats of selected item */}
              {(() => {
                const prod = products.find(p => p.id === selectedProductId);
                if (!prod) return null;
                return (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-[11px] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-zinc-400 block">Total Fisik:</span>
                      <span className="text-white font-bold">{prod.totalQty} {prod.unit}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Dipesan:</span>
                      <span className="text-amber-400 font-bold">{prod.reservedQty} {prod.unit}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Tersedia:</span>
                      <span className="text-emerald-400 font-bold">{prod.availableQty} {prod.unit}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Jumlah Kebutuhan</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reserveQty}
                  onChange={e => setReserveQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Khusus (Posisi Panggung / Kanal)</label>
                <input
                  type="text"
                  value={reserveNotes}
                  onChange={e => setReserveNotes(e.target.value)}
                  placeholder="Contoh: FOH center delay / Panggung kiri"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                />
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold"
                >
                  Kunci Reservasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS RESERVASI ALAT (Satu Kali Klik Langsung Bersih) */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Hapus Reservasi Alat</span>
              </div>
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus peralatan berikut dari daftar alokasi event?
              </p>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-orange-400 font-bold text-[11px]">
                    {equipmentToDelete.item.productCode}
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400 text-[11px]">{equipmentToDelete.item.category}</span>
                </div>
                <h4 className="font-bold text-white text-sm">
                  {equipmentToDelete.item.productName}
                </h4>
                <div className="text-xs font-semibold text-zinc-300 pt-0.5">
                  Jumlah: <span className="text-orange-400 font-mono font-bold">{equipmentToDelete.item.requestedQty} {equipmentToDelete.item.unit}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Stok sebanyak {equipmentToDelete.item.requestedQty} {equipmentToDelete.item.unit} akan langsung dikembalikan ke stok gudang yang tersedia.</span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEquipmentToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeEquipmentFromEvent(equipmentToDelete.eventId, equipmentToDelete.item.id);
                    setEquipmentToDelete(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Alat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS / CUT EVENT */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Hapus / Batalkan Event</span>
              </div>
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Apakah Anda yakin ingin membatalkan/menghapus event berikut?
              </p>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                <span className="font-mono text-orange-400 font-bold text-[11px]">
                  {eventToDelete.eventCode}
                </span>
                <h4 className="font-bold text-white text-sm">{eventToDelete.name}</h4>
                <p className="text-zinc-400 text-xs">{eventToDelete.clientName} @ {eventToDelete.venueName}</p>
              </div>

              <p className="text-[11px] text-zinc-400">
                * Seluruh reservasi alat yang belum di-checkout akan langsung dikembalikan ke stok fisik gudang.
              </p>

              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEventToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = deleteEvent(eventToDelete.id);
                    if (res.success) {
                      if (activeEventId === eventToDelete.id) {
                        const remaining = events.filter(e => e.id !== eventToDelete.id);
                        setActiveEventId(remaining[0]?.id || null);
                      }
                    }
                    setEventToDelete(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / TUGASKAN CREW */}
      {showAddCrewModal && detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Tugaskan Personel Crew</h3>
                  <p className="text-[11px] text-zinc-400">
                    Event: <span className="text-zinc-200 font-semibold">{detailEvent.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCrewModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCrewAssignment} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">
                  Pilih Anggota Crew dari Master Data *
                </label>
                <select
                  value={selectedCrewMemberId}
                  onChange={e => handleSelectCrewChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Anggota Crew --</option>
                  {crew.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.roleTitle} (Divisi {c.division}) [{c.status}]
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Menampilkan seluruh data staf & kru lapangan yang terdaftar di master data.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">
                    Peran Penugasan di Event *
                  </label>
                  <select
                    value={selectedEventRole}
                    onChange={e => setSelectedEventRole(e.target.value as EventCrewAssignment['eventRole'])}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="PIC Event">PIC Event</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Production Manager">Production Manager</option>
                    <option value="PIC Audio">PIC Audio / Sound Engineer</option>
                    <option value="PIC Lighting">PIC Lighting / LD</option>
                    <option value="PIC LED">PIC LED Screen Engineer</option>
                    <option value="PIC Multimedia">PIC Multimedia & Visual</option>
                    <option value="PIC Dokumentasi">PIC Dokumentasi & Kamera</option>
                    <option value="Warehouse Crew">Warehouse Crew / Loading</option>
                    <option value="Driver">Driver Logistik Armada</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">
                    Nomor Kontak / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={customCrewContact}
                    onChange={e => setCustomCrewContact(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {selectedCrewMemberId && (
                <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
                  {(() => {
                    const c = crew.find(item => item.id === selectedCrewMemberId);
                    if (!c) return null;
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Detail Personel:</span>
                          <span className="font-bold text-white text-xs">{c.name}</span>
                          <span className="text-zinc-400 text-[11px] block">{c.roleTitle} • Divisi {c.division}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          c.status === 'Aktif'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrewModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md shadow-orange-600/30 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Simpan Penugasan Crew</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PENUGASAN CREW */}
      {crewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Hapus Penugasan Crew</span>
              </div>
              <button
                type="button"
                onClick={() => setCrewToDelete(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed">
                Apakah Anda yakin ingin membatalkan penugasan personel ini dari event?
              </p>

              <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {crewToDelete.assignment.eventRole}
                  </span>
                  <span className="text-[10px] text-zinc-500">Divisi {crewToDelete.assignment.division}</span>
                </div>
                <h4 className="font-bold text-white text-sm">{crewToDelete.assignment.crewName}</h4>
                <p className="text-[11px] text-zinc-400 font-mono">Kontak: {crewToDelete.assignment.contact || '-'}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCrewToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCrew}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Penugasan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
