import React, { useState, useMemo } from 'react';
import {
  Tv,
  Target,
  TrendingUp,
  Calendar,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  User,
  X,
  Save,
  BarChart3,
  Award,
  Maximize2,
  Sliders,
  FileSpreadsheet,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckSquare,
  Calculator,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LedDeploymentRecord, MonthlyLedTarget } from '../types';
import * as XLSX from 'xlsx';

export interface LedScreenItem {
  id: string;
  name: string; // e.g. "Layar Utama", "Sayap Kiri", "Delay FOH"
  width: number; // Lebar (meter)
  height: number; // Tinggi (meter)
  qty: number; // Jumlah unit layar
  squareMeters: number; // width * height * qty
  cabinets: number; // Total kabinet (cabinets100 + cabinets50)
  cabinets100?: number; // Kabinet utama 50x100cm (Lebar 0.5m x Tinggi 1m)
  cabinets50?: number; // Kabinet setengah meter 50x50cm (Lebar 0.5m x Tinggi 0.5m)
}

export function calculateLedScreenMetrics(width: number, height: number, qty: number) {
  const safeW = Math.max(0, Number(width) || 0);
  const safeH = Math.max(0, Number(height) || 0);
  const safeQty = Math.max(1, parseInt(String(qty), 10) || 1);

  // Setiap 0.5 meter (50cm) pada lebar membutuhkan 1 kolom kabinet (baik ukuran 50x100cm maupun 50x50cm)
  const cols = Math.round(safeW / 0.5);

  // Tinggi utuh per 1 meter menggunakan kabinet 50x100cm (0.5m x 1m)
  const fullRows = Math.floor(safeH + 1e-9);

  // Sisa setengah meter (0.5m / 50cm) pada tinggi menggunakan kabinet 50x50cm (0.5m x 0.5m)
  const remainderH = Math.max(0, safeH - fullRows);
  const halfRows = Math.round(remainderH / 0.5);

  const cabinets100 = cols * fullRows * safeQty;
  const cabinets50 = cols * halfRows * safeQty;
  const totalCabinets = cabinets100 + cabinets50;
  const squareMeters = Number((safeW * safeH * safeQty).toFixed(2));

  return {
    cols,
    fullRows,
    halfRows,
    cabinets100,
    cabinets50,
    totalCabinets,
    squareMeters
  };
}

export function buildLedScreenItem(
  id: string,
  name: string,
  width: number,
  height: number,
  qty: number
): LedScreenItem {
  const m = calculateLedScreenMetrics(width, height, qty);
  return {
    id,
    name,
    width,
    height,
    qty,
    squareMeters: m.squareMeters,
    cabinets: m.totalCabinets,
    cabinets100: m.cabinets100,
    cabinets50: m.cabinets50
  };
}

export function getDeploymentCabinetSummary(dep: LedDeploymentRecord) {
  if (dep.screensDetail && dep.screensDetail.length > 0) {
    let totalCabinets = 0;
    let cabinets100 = 0;
    let cabinets50 = 0;
    dep.screensDetail.forEach(s => {
      const m = calculateLedScreenMetrics(s.width, s.height, s.qty);
      totalCabinets += m.totalCabinets;
      cabinets100 += m.cabinets100;
      cabinets50 += m.cabinets50;
    });
    return { totalCabinets, cabinets100, cabinets50 };
  }

  if (dep.screenDimension && dep.screenDimension.includes('x')) {
    const parts = dep.screenDimension.split('x');
    const parsedW = parseFloat(parts[0]);
    const parsedH = parseFloat(parts[1]);
    if (!isNaN(parsedW) && !isNaN(parsedH)) {
      const m = calculateLedScreenMetrics(parsedW, parsedH, 1);
      if (Math.abs(m.squareMeters - dep.totalSquareMeters) < 0.1) {
        return {
          totalCabinets: m.totalCabinets,
          cabinets100: m.cabinets100,
          cabinets50: m.cabinets50
        };
      }
    }
  }

  const fallbackTotal = Math.round(dep.totalSquareMeters * 2);
  return {
    totalCabinets: fallbackTotal,
    cabinets100: fallbackTotal,
    cabinets50: 0
  };
}

export const LedTargetTrackerView: React.FC = () => {
  const {
    ledMonthlyTargets,
    updateLedMonthlyTarget,
    ledDeployments,
    addLedDeployment,
    updateLedDeployment,
    deleteLedDeployment,
    events
  } = useApp();

  // Real calendar year and month (Changes automatically when year rolls over!)
  const realCurrentYear = new Date().getFullYear();
  const realCurrentMonth = new Date().getMonth() + 1;
  const todayDateString = new Date().toISOString().split('T')[0];

  // Active selected year & month (Defaults automatically to current year & month)
  const [selectedYear, setSelectedYear] = useState<number>(() => realCurrentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => realCurrentMonth);

  // Dynamically compute list of selectable years from data and current year
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([realCurrentYear - 1, realCurrentYear, realCurrentYear + 1]);
    ledMonthlyTargets.forEach(t => yearSet.add(t.year));
    ledDeployments.forEach(d => {
      const yr = new Date(d.date).getFullYear();
      if (!isNaN(yr)) yearSet.add(yr);
    });
    return Array.from(yearSet).sort((a, b) => b - a); // descending
  }, [ledMonthlyTargets, ledDeployments, realCurrentYear]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showStandaloneCalc, setShowStandaloneCalc] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<LedDeploymentRecord | null>(null);

  // Search & Filter (Size Category)
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'ALL' | 'LARGE' | 'MEDIUM' | 'COMPACT'>('ALL');

  // Form State for Adding/Editing Deployment
  const [formData, setFormData] = useState({
    eventId: '',
    eventName: '',
    clientName: '',
    date: todayDateString,
    useDimensionCalc: true,
    screens: [
      buildLedScreenItem('scr-1', 'Layar Utama', 12, 4, 1)
    ] as LedScreenItem[],
    customSquareMeters: 48,
    cabinetCount: 96,
    venue: '',
    picName: 'Bayu Nugroho',
    notes: ''
  });

  // Standalone Simulator Calculator State
  const [calcMonth, setCalcMonth] = useState<number>(() => realCurrentMonth);
  const [calcScreens, setCalcScreens] = useState<LedScreenItem[]>([
    buildLedScreenItem('calc-1', 'Layar Utama Panggung', 12, 4, 1),
    buildLedScreenItem('calc-2', 'Layar Sayap (Kiri & Kanan)', 4, 3, 2)
  ]);

  // Target Edit Form State
  const [tempTargets, setTempTargets] = useState<Record<number, number>>({});
  const [bulkTargetValue, setBulkTargetValue] = useState<number>(0);

  // Month names in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Month short names
  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  // Calculate monthly stats for the entire year (12 months)
  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const targetObj = ledMonthlyTargets.find(t => t.month === monthNum && t.year === selectedYear);
      const targetMeters = targetObj ? targetObj.targetMeters : 0;

      // Filter deployments for this month and year
      const deploymentsInMonth = ledDeployments.filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() + 1 === monthNum && dDate.getFullYear() === selectedYear;
      });

      const actualMeters = deploymentsInMonth.reduce((sum, d) => sum + (d.totalSquareMeters || 0), 0);
      const eventCount = deploymentsInMonth.length;
      const percentage = targetMeters > 0 ? (actualMeters / targetMeters) * 100 : 0;
      const difference = actualMeters - targetMeters;

      let statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      let statusLabel = 'Perlu Digenjot';
      if (percentage >= 100) {
        statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        statusLabel = 'Target Tercapai';
      } else if (percentage >= 75) {
        statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        statusLabel = 'Mendekati Target';
      } else if (percentage >= 50) {
        statusColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        statusLabel = 'Sedang Berjalan';
      }

      return {
        monthNum,
        monthName: monthNames[i],
        monthShort: monthShortNames[i],
        targetMeters,
        actualMeters,
        percentage,
        difference,
        eventCount,
        statusColor,
        statusLabel,
        deployments: deploymentsInMonth
      };
    });
  }, [ledMonthlyTargets, ledDeployments, selectedYear]);

  // Selected Month Stat
  const currentMonthStat = monthlyStats[selectedMonth - 1] || monthlyStats[8];

  // Year to Date (YTD) Summary
  const ytdSummary = useMemo(() => {
    // Up to selected month (e.g. Month 1 to selectedMonth)
    const ytdStats = monthlyStats.slice(0, selectedMonth);
    const totalTarget = ytdStats.reduce((sum, m) => sum + m.targetMeters, 0);
    const totalActual = ytdStats.reduce((sum, m) => sum + m.actualMeters, 0);
    const totalEvents = ytdStats.reduce((sum, m) => sum + m.eventCount, 0);
    const percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const avgPerEvent = totalEvents > 0 ? totalActual / totalEvents : 0;

    return {
      totalTarget,
      totalActual,
      totalEvents,
      percentage,
      avgPerEvent
    };
  }, [monthlyStats, selectedMonth]);

  // Total Year Summary (Jan - Dec)
  const fullYearSummary = useMemo(() => {
    const totalTarget = monthlyStats.reduce((sum, m) => sum + m.targetMeters, 0);
    const totalActual = monthlyStats.reduce((sum, m) => sum + m.actualMeters, 0);
    const totalEvents = monthlyStats.reduce((sum, m) => sum + m.eventCount, 0);
    const percentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    return {
      totalTarget,
      totalActual,
      totalEvents,
      percentage
    };
  }, [monthlyStats]);

  // Filtered Deployments for selected month
  const filteredDeployments = useMemo(() => {
    return currentMonthStat.deployments.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        d.eventName.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.venue.toLowerCase().includes(q) ||
        d.picName.toLowerCase().includes(q) ||
        (d.screenDimension && d.screenDimension.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q));

      let matchSize = true;
      if (sizeFilter === 'LARGE') {
        matchSize = d.totalSquareMeters >= 50;
      } else if (sizeFilter === 'MEDIUM') {
        matchSize = d.totalSquareMeters >= 20 && d.totalSquareMeters < 50;
      } else if (sizeFilter === 'COMPACT') {
        matchSize = d.totalSquareMeters < 20;
      }

      return matchSearch && matchSize;
    });
  }, [currentMonthStat, searchQuery, sizeFilter]);

  // ========================================================
  // MULTI-SCREEN CALCULATOR LOGIC (FORM MODAL)
  // ========================================================
  const updateCalculatedScreens = (screens: LedScreenItem[]) => {
    const totalSq = screens.reduce((sum, s) => sum + s.squareMeters, 0);
    const totalCabs = screens.reduce((sum, s) => sum + s.cabinets, 0);
    setFormData(prev => ({
      ...prev,
      screens,
      customSquareMeters: Number(totalSq.toFixed(2)),
      cabinetCount: totalCabs
    }));
  };

  const handleAddScreenRow = () => {
    const nextNum = formData.screens.length + 1;
    const newScreen = buildLedScreenItem(`scr-${Date.now()}-${nextNum}`, `Layar ${nextNum}`, 4, 3, 1);
    const updatedScreens = [...formData.screens, newScreen];
    updateCalculatedScreens(updatedScreens);
  };

  const handleUpdateScreenRow = (id: string, field: 'name' | 'width' | 'height' | 'qty', val: any) => {
    const updatedScreens = formData.screens.map(scr => {
      if (scr.id !== id) return scr;
      const updatedName = field === 'name' ? String(val) : scr.name;
      const w = field === 'width' ? parseFloat(val) || 0 : scr.width;
      const h = field === 'height' ? parseFloat(val) || 0 : scr.height;
      const q = field === 'qty' ? parseInt(val) || 1 : scr.qty;
      return buildLedScreenItem(scr.id, updatedName, w, h, q);
    });
    updateCalculatedScreens(updatedScreens);
  };

  const handleRemoveScreenRow = (id: string) => {
    if (formData.screens.length <= 1) return;
    const updatedScreens = formData.screens.filter(s => s.id !== id);
    updateCalculatedScreens(updatedScreens);
  };

  const handleApplyPreset = (presetType: 'SINGLE' | 'MAIN_WINGS' | 'STAGE_DELAY' | 'FESTIVAL') => {
    let newScreens: LedScreenItem[] = [];
    if (presetType === 'SINGLE') {
      newScreens = [
        buildLedScreenItem('scr-1', 'Layar Utama', 12, 4, 1)
      ];
    } else if (presetType === 'MAIN_WINGS') {
      newScreens = [
        buildLedScreenItem('scr-1', 'Layar Utama Tengah', 12, 4, 1),
        buildLedScreenItem('scr-2', 'Layar Sayap (Kiri & Kanan)', 4, 3, 2)
      ];
    } else if (presetType === 'STAGE_DELAY') {
      newScreens = [
        buildLedScreenItem('scr-1', 'Backdrop Panggung', 16, 5, 1),
        buildLedScreenItem('scr-2', 'Delay Tower FOH', 3, 2, 2)
      ];
    } else if (presetType === 'FESTIVAL') {
      newScreens = [
        buildLedScreenItem('scr-1', 'Main Stage Center', 18, 6, 1),
        buildLedScreenItem('scr-2', 'IMAG Wings (Portrait)', 4, 6, 2),
        buildLedScreenItem('scr-3', 'VIP Catwalk / DJ Booth', 6, 2, 1)
      ];
    }
    updateCalculatedScreens(newScreens);
  };

  const formTotalCabinets100 = useMemo(() => {
    return formData.screens.reduce((sum, s) => {
      const m = calculateLedScreenMetrics(s.width, s.height, s.qty);
      return sum + m.cabinets100;
    }, 0);
  }, [formData.screens]);

  const formTotalCabinets50 = useMemo(() => {
    return formData.screens.reduce((sum, s) => {
      const m = calculateLedScreenMetrics(s.width, s.height, s.qty);
      return sum + m.cabinets50;
    }, 0);
  }, [formData.screens]);

  // ========================================================
  // STANDALONE SIMULATOR CALCULATOR LOGIC
  // ========================================================
  const calcTotalSquareMeters = useMemo(() => {
    return Number(calcScreens.reduce((sum, s) => sum + s.squareMeters, 0).toFixed(2));
  }, [calcScreens]);

  const calcTotalCabinets = useMemo(() => {
    return calcScreens.reduce((sum, s) => sum + s.cabinets, 0);
  }, [calcScreens]);

  const calcTotalCabinets100 = useMemo(() => {
    return calcScreens.reduce((sum, s) => {
      const m = calculateLedScreenMetrics(s.width, s.height, s.qty);
      return sum + m.cabinets100;
    }, 0);
  }, [calcScreens]);

  const calcTotalCabinets50 = useMemo(() => {
    return calcScreens.reduce((sum, s) => {
      const m = calculateLedScreenMetrics(s.width, s.height, s.qty);
      return sum + m.cabinets50;
    }, 0);
  }, [calcScreens]);

  const handleAddCalcScreenRow = () => {
    const nextNum = calcScreens.length + 1;
    const newScreen = buildLedScreenItem(`calc-${Date.now()}-${nextNum}`, `Layar ${nextNum}`, 4, 3, 1);
    setCalcScreens([...calcScreens, newScreen]);
  };

  const handleUpdateCalcScreenRow = (id: string, field: 'name' | 'width' | 'height' | 'qty', val: any) => {
    setCalcScreens(prev =>
      prev.map(scr => {
        if (scr.id !== id) return scr;
        const updatedName = field === 'name' ? String(val) : scr.name;
        const w = field === 'width' ? parseFloat(val) || 0 : scr.width;
        const h = field === 'height' ? parseFloat(val) || 0 : scr.height;
        const q = field === 'qty' ? parseInt(val) || 1 : scr.qty;
        return buildLedScreenItem(scr.id, updatedName, w, h, q);
      })
    );
  };

  const handleRemoveCalcScreenRow = (id: string) => {
    if (calcScreens.length <= 1) return;
    setCalcScreens(prev => prev.filter(s => s.id !== id));
  };

  // Transfer standalone calculation to Add Deployment Form
  const handleUseCalcInDeployment = () => {
    setShowStandaloneCalc(false);
    setEditingDeployment(null);
    setFormData({
      eventId: '',
      eventName: '',
      clientName: '',
      date: `${selectedYear}-${String(calcMonth).padStart(2, '0')}-15`,
      useDimensionCalc: true,
      screens: [...calcScreens],
      customSquareMeters: calcTotalSquareMeters,
      cabinetCount: calcTotalCabinets,
      venue: '',
      picName: 'Bayu Nugroho',
      notes: ''
    });
    setShowAddModal(true);
  };

  // Target Simulation details for standalone calculator
  const calcTargetStat = monthlyStats[calcMonth - 1] || monthlyStats[0];
  const simActualMeters = calcTargetStat.actualMeters + calcTotalSquareMeters;
  const simPercentage = calcTargetStat.targetMeters > 0 ? (simActualMeters / calcTargetStat.targetMeters) * 100 : 0;
  const simDifference = simActualMeters - calcTargetStat.targetMeters;

  // ========================================================
  // MODAL HANDLERS
  // ========================================================
  const handleOpenTargetModal = () => {
    const initialMap: Record<number, number> = {};
    monthlyStats.forEach(m => {
      initialMap[m.monthNum] = m.targetMeters;
    });
    setTempTargets(initialMap);
    setShowTargetModal(true);
  };

  const handleApplyBulkTarget = () => {
    const nextMap: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      nextMap[m] = bulkTargetValue;
    }
    setTempTargets(nextMap);
  };

  const handleCopyFromPreviousYear = () => {
    const prevYear = selectedYear - 1;
    const nextMap: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      const prevTarget = ledMonthlyTargets.find(t => t.month === m && t.year === prevYear);
      nextMap[m] = prevTarget ? prevTarget.targetMeters : 400;
    }
    setTempTargets(nextMap);
  };

  const handleSaveAllTargets = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(tempTargets).forEach(([mStr, targetVal]) => {
      const mNum = parseInt(mStr);
      updateLedMonthlyTarget(mNum, selectedYear, Number(targetVal) || 0);
    });
    setShowTargetModal(false);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingDeployment(null);
    const defaultDate =
      selectedYear === realCurrentYear && selectedMonth === realCurrentMonth
        ? todayDateString
        : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`;

    setFormData({
      eventId: '',
      eventName: '',
      clientName: '',
      date: defaultDate,
      useDimensionCalc: true,
      screens: [
        buildLedScreenItem('scr-1', 'Layar Utama', 12, 4, 1)
      ],
      customSquareMeters: 48,
      cabinetCount: 96,
      venue: '',
      picName: 'Bayu Nugroho',
      notes: ''
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (record: LedDeploymentRecord) => {
    setEditingDeployment(record);

    let loadedScreens: LedScreenItem[] = [];
    if (record.screensDetail && record.screensDetail.length > 0) {
      loadedScreens = record.screensDetail.map(s =>
        buildLedScreenItem(s.id, s.name, s.width, s.height, s.qty)
      );
    } else {
      // Try to parse from dimension string
      let w = 12;
      let h = 4;
      if (record.screenDimension && record.screenDimension.includes('x')) {
        const parts = record.screenDimension.split('x');
        const parsedW = parseFloat(parts[0]);
        const parsedH = parseFloat(parts[1]);
        if (!isNaN(parsedW) && !isNaN(parsedH)) {
          w = parsedW;
          h = parsedH;
        }
      }
      const m = calculateLedScreenMetrics(w, h, 1);
      loadedScreens = [
        {
          id: 'scr-1',
          name: 'Layar Utama',
          width: w,
          height: h,
          qty: 1,
          squareMeters: record.totalSquareMeters,
          cabinets: m.totalCabinets,
          cabinets100: m.cabinets100,
          cabinets50: m.cabinets50
        }
      ];
    }

    const totalLoadedCabs = loadedScreens.reduce((sum, s) => sum + s.cabinets, 0);

    setFormData({
      eventId: record.eventId || '',
      eventName: record.eventName,
      clientName: record.clientName,
      date: record.date,
      useDimensionCalc: true,
      screens: loadedScreens,
      customSquareMeters: record.totalSquareMeters,
      cabinetCount: totalLoadedCabs || Math.round(record.totalSquareMeters * 2),
      venue: record.venue,
      picName: record.picName,
      notes: record.notes || ''
    });
    setShowAddModal(true);
  };

  // Select Event from active schedule to auto-fill
  const handleSelectExistingEvent = (evId: string) => {
    if (!evId) return;
    const ev = events.find(e => e.id === evId);
    if (!ev) return;

    setFormData(prev => ({
      ...prev,
      eventId: ev.id,
      eventName: ev.name,
      clientName: ev.clientName || prev.clientName,
      date: ev.startDate || prev.date,
      venue: ev.venueName || ev.venueAddress || prev.venue,
      picName: ev.picEventName || ev.projectManagerName || prev.picName,
      notes: ev.notes || prev.notes
    }));
  };

  // Handle Save Deployment (Create or Edit)
  const handleSaveDeployment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) return;

    let totalSqMeters = formData.customSquareMeters;
    let dimensionStr = '';

    if (formData.useDimensionCalc && formData.screens.length > 0) {
      totalSqMeters = Number(formData.screens.reduce((sum, s) => sum + s.squareMeters, 0).toFixed(2));
      dimensionStr = formData.screens
        .map(s => `${s.name ? `${s.name}: ` : ''}${s.width}m x ${s.height}m${s.qty > 1 ? ` (${s.qty}x)` : ''}`)
        .join(' + ');
    } else {
      dimensionStr = `${totalSqMeters} m² Display`;
    }

    const payload: Omit<LedDeploymentRecord, 'id'> = {
      eventId: formData.eventId || undefined,
      eventName: formData.eventName.trim(),
      clientName: formData.clientName.trim() || 'Klien Umum',
      date: formData.date,
      screenDimension: dimensionStr,
      totalSquareMeters: totalSqMeters,
      cabinetCount: Number(formData.cabinetCount) || Math.round(totalSqMeters * 2),
      venue: formData.venue.trim() || 'Venue Lokasi Event',
      picName: formData.picName.trim() || 'Bayu Nugroho',
      notes: formData.notes.trim(),
      screensDetail: formData.useDimensionCalc
        ? formData.screens.map(s => ({
            id: s.id,
            name: s.name,
            width: s.width,
            height: s.height,
            qty: s.qty,
            squareMeters: s.squareMeters
          }))
        : undefined
    };

    if (editingDeployment) {
      updateLedDeployment({
        ...payload,
        id: editingDeployment.id
      });
    } else {
      addLedDeployment(payload);
    }

    setShowAddModal(false);
    setEditingDeployment(null);
  };

  // Export to Excel / Spreadsheet
  const handleExportData = () => {
    const recapRows = monthlyStats.map(m => ({
      'Bulan': m.monthName,
      'Tahun': selectedYear,
      'Target Meter (m²)': m.targetMeters,
      'Realisasi Keluar (m²)': m.actualMeters,
      'Capaian Target (%)': `${m.percentage.toFixed(1)}%`,
      'Selisih / Deviasi (m²)': m.difference >= 0 ? `+${m.difference}` : m.difference,
      'Jumlah Event': m.eventCount,
      'Status Capaian': m.statusLabel
    }));

    const detailRows = ledDeployments
      .filter(d => {
        const dDate = new Date(d.date);
        return dDate.getFullYear() === selectedYear;
      })
      .map(d => {
        const cabSummary = getDeploymentCabinetSummary(d);
        return {
          'Tanggal Keluar': d.date,
          'Nama Event': d.eventName,
          'Nama Klien / EO': d.clientName,
          'Dimensi Layar': d.screenDimension || '-',
          'Total Luas Keluar (m²)': d.totalSquareMeters,
          'Total Kabinet / Panel': cabSummary.totalCabinets,
          'Kabinet 50x100cm (0.5m x 1m)': cabSummary.cabinets100,
          'Kabinet 50x50cm (0.5m x 0.5m)': cabSummary.cabinets50,
          'Venue / Lokasi': d.venue,
          'PIC Teknisi': d.picName,
          'Catatan': d.notes || '-'
        };
      });

    const wb = XLSX.utils.book_new();
    const wsRecap = XLSX.utils.json_to_sheet(recapRows);
    const wsDetail = XLSX.utils.json_to_sheet(detailRows);

    XLSX.utils.book_append_sheet(wb, wsRecap, 'Rekapitulasi Target Bulanan');
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Pengeluaran LED');

    XLSX.writeFile(wb, `GL_PRO_CAPAIAN_TARGET_METER_LED_${selectedYear}.xlsx`);
  };

  // Max meter value for bar chart height scaling
  const maxChartValue = Math.max(
    ...monthlyStats.map(m => Math.max(m.targetMeters, m.actualMeters)),
    700
  );

  return (
    <div className="space-y-6 pb-14 animate-in fade-in text-zinc-100">
      
      {/* ========================================================
          HEADER & ACTIONS
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-950/40">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Capaian Target Bulanan Meter LED
                </h1>

                {/* Dynamic Interactive Year Selector with Automatic Roll-over */}
                <div className="flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-1.5 py-0.5 shadow-xs">
                  <button
                    onClick={() => setSelectedYear(prev => prev - 1)}
                    className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-95"
                    title="Lihat Tahun Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value) || realCurrentYear)}
                    className="bg-transparent text-orange-400 font-extrabold text-xs px-1 py-0.5 focus:outline-none cursor-pointer"
                    title="Pilih Tahun Monitoring"
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr} className="bg-zinc-900 text-white font-medium">
                        Tahun {yr} {yr === realCurrentYear ? '(Tahun Ini)' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setSelectedYear(prev => prev + 1)}
                    className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-95"
                    title="Lihat Tahun Berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Otomatis indicator badge */}
                {selectedYear === realCurrentYear ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Otomatis (Tahun Berjalan)</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedYear(realCurrentYear)}
                    className="text-[10px] font-bold text-orange-400 hover:underline px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20"
                    title="Kembali ke tahun berjalan saat ini"
                  >
                    Kembali ke Tahun Ini ({realCurrentYear})
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-1">
                Alat pemantauan realisasi volume meter LED ($m^2$) yang keluar setiap bulan. Sistem secara otomatis mendeteksi dan berganti ke tahun baru saat kalender berganti, serta mendukung navigasi arsip antar-tahun.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Buka Kalkulator Target LED Standalone */}
          <button
            onClick={() => setShowStandaloneCalc(true)}
            className="px-3.5 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center gap-2 transition"
            title="Buka kalkulator bentang multi-layar (Lebar & Tinggi) dan simulasi capaian target"
          >
            <Calculator className="w-4 h-4 text-orange-400" />
            <span>Kalkulator Bentang & Target LED</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950/50 flex items-center gap-2 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Meter LED Keluar</span>
          </button>

          <button
            onClick={handleOpenTargetModal}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>Atur Target Bulanan</span>
          </button>

          <button
            onClick={handleExportData}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition"
            title="Ekspor rekapitulasi data ke file Excel / Spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TOP KPI METRIC CARDS (BULAN TERPILIH & YTD)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Selected Month Target & Realization */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>Bulan {currentMonthStat.monthName}</span>
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentMonthStat.statusColor}`}>
              {currentMonthStat.statusLabel}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight font-mono">
                {currentMonthStat.actualMeters} <span className="text-sm font-normal text-zinc-400">m²</span>
              </span>
              <span className="text-xs text-zinc-400">
                / Target {currentMonthStat.targetMeters} m²
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentMonthStat.percentage >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(currentMonthStat.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px]">
                <span className={`font-bold font-mono ${currentMonthStat.percentage >= 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {currentMonthStat.percentage.toFixed(1)}% Tercapai
                </span>
                <span className="text-zinc-400 font-mono">
                  {currentMonthStat.difference >= 0 
                    ? `+${currentMonthStat.difference} m² surplus` 
                    : `${Math.abs(currentMonthStat.difference)} m² lagi`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Year-To-Date (YTD) Cumulative */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Kumulatif YTD (Jan - {currentMonthStat.monthShort})</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">1 - {selectedMonth} Bulan</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight font-mono">
                {ytdSummary.totalActual.toLocaleString('id-ID')} <span className="text-sm font-normal text-zinc-400">m²</span>
              </span>
              <span className="text-xs text-zinc-400">
                / {ytdSummary.totalTarget.toLocaleString('id-ID')} m²
              </span>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800 text-zinc-400">
              <span>Capaian Kumulatif:</span>
              <strong className={`font-mono text-sm ${ytdSummary.percentage >= 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {ytdSummary.percentage.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Event Frequency & Average Screen Size */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Rata-Rata Bentang Layar</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              {currentMonthStat.eventCount} Acara
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight font-mono">
                {currentMonthStat.eventCount > 0 ? (currentMonthStat.actualMeters / currentMonthStat.eventCount).toFixed(1) : '0'}
                <span className="text-sm font-normal text-zinc-400"> m²/event</span>
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800 text-zinc-400">
              <span>Total Luas Keluar:</span>
              <strong className="text-white font-mono">{currentMonthStat.actualMeters} m²</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Largest Single Screen in Month */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Layar Terbesar Bulan Ini</span>
            </span>
            <span className="text-[10px] text-zinc-500">Highlight Acara</span>
          </div>

          {currentMonthStat.deployments.length > 0 ? (
            (() => {
              const maxDep = [...currentMonthStat.deployments].sort((a, b) => b.totalSquareMeters - a.totalSquareMeters)[0];
              return (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-orange-400 tracking-tight font-mono">
                      {maxDep.totalSquareMeters} <span className="text-sm font-normal text-zinc-400">m²</span>
                    </span>
                  </div>
                  <p className="text-xs text-white font-bold truncate mt-1" title={maxDep.eventName}>
                    {maxDep.eventName}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {maxDep.screenDimension || `${maxDep.totalSquareMeters} m² Display`}
                  </p>
                </div>
              );
            })()
          ) : (
            <div className="text-xs text-zinc-500 py-3">Belum ada pengeluaran di bulan ini</div>
          )}
        </div>
      </div>

      {/* ========================================================
          12-MONTH QUICK SELECTOR PILLS
          ======================================================== */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>Pilih Bulan Monitoring:</span>
          </span>
          <span className="text-xs text-zinc-400">
            Total Target Tahunan: <strong className="text-white font-mono">{fullYearSummary.totalTarget.toLocaleString('id-ID')} m²</strong> | Realisasi: <strong className="text-orange-400 font-mono">{fullYearSummary.totalActual.toLocaleString('id-ID')} m²</strong> ({fullYearSummary.percentage.toFixed(1)}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {monthlyStats.map(m => {
            const isSelected = m.monthNum === selectedMonth;
            const isCompleted = m.percentage >= 100;
            return (
              <button
                key={m.monthNum}
                onClick={() => setSelectedMonth(m.monthNum)}
                className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-gradient-to-br from-orange-600 to-amber-600 border-orange-400 text-white shadow-lg shadow-orange-950/60 scale-[1.02]'
                    : 'bg-black/40 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {m.monthShort}
                  </span>
                  {isCompleted && !isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                <div className="mt-2">
                  <div className={`font-mono text-xs font-extrabold ${isSelected ? 'text-white' : 'text-orange-400'}`}>
                    {m.actualMeters} <span className="text-[10px] font-normal">m²</span>
                  </div>
                  <div className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                    Target: {m.targetMeters}m²
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          GRAFIK INTERAKTIF CAPAIAN BULANAN (BAR CHART)
          ======================================================== */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="font-bold text-sm text-white">
                Grafik Perbandingan: Target vs Realisasi Meter LED Keluar Tahun {selectedYear}
              </h2>
              <p className="text-xs text-zinc-400">
                Klik pada kolom bulan untuk melihat rincian pengeluaran layar di bulan tersebut.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-tr from-orange-600 to-amber-500" />
              <span className="text-zinc-300 font-medium">Realisasi Keluar (m²)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-700 border border-zinc-600" />
              <span className="text-zinc-400 font-medium">Target Bulanan (m²)</span>
            </div>
          </div>
        </div>

        {/* Visual Dual Bars Container */}
        <div className="pt-6 pb-2 px-2 overflow-x-auto">
          <div className="min-w-[700px] h-64 flex items-end justify-between gap-3 border-b border-zinc-800 pb-2">
            {monthlyStats.map(m => {
              const isSelected = m.monthNum === selectedMonth;
              const actualHeightPct = Math.min((m.actualMeters / maxChartValue) * 100, 100);
              const targetHeightPct = Math.min((m.targetMeters / maxChartValue) * 100, 100);

              return (
                <div
                  key={m.monthNum}
                  onClick={() => setSelectedMonth(m.monthNum)}
                  className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition p-1.5 rounded-xl ${
                    isSelected ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Label on top of bar */}
                  <div className="text-[11px] font-bold text-center mb-1 text-zinc-300 group-hover:text-orange-400 transition">
                    <span className="block font-mono text-white">{m.actualMeters}m²</span>
                    <span className={`text-[10px] font-mono ${m.percentage >= 100 ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                      {m.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Dual Bars side by side */}
                  <div className="w-full flex items-end justify-center gap-1.5 h-48">
                    {/* Target Bar (Reference) */}
                    <div
                      className="w-3.5 sm:w-4 rounded-t-md bg-zinc-700/80 border border-zinc-600 transition-all duration-300"
                      style={{ height: `${targetHeightPct}%` }}
                      title={`Target ${m.monthName}: ${m.targetMeters} m²`}
                    />

                    {/* Actual Realization Bar */}
                    <div
                      className={`w-3.5 sm:w-4 rounded-t-md transition-all duration-500 shadow-md ${
                        m.percentage >= 100
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-emerald-950/40'
                          : isSelected
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-orange-950/80'
                          : 'bg-gradient-to-t from-orange-700 to-amber-500'
                      }`}
                      style={{ height: `${actualHeightPct}%` }}
                      title={`Realisasi ${m.monthName}: ${m.actualMeters} m² (${m.percentage.toFixed(1)}%)`}
                    />
                  </div>

                  {/* Month Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-bold block ${
                        isSelected ? 'text-orange-400' : 'text-zinc-400 group-hover:text-white'
                      }`}
                    >
                      {m.monthShort}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          RINCIAN PENGELUARAN METER LED BULAN TERPILIH
          ======================================================== */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-sm text-white">
                Rincian Pengeluaran Meter LED: Bulan {currentMonthStat.monthName} {selectedYear}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {filteredDeployments.length} Acara Terdaftar
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Total volume keluar: <strong className="text-white font-mono">{currentMonthStat.actualMeters} m²</strong> dari target{' '}
              <strong className="text-white font-mono">{currentMonthStat.targetMeters} m²</strong> ({currentMonthStat.percentage.toFixed(1)}%)
            </p>
          </div>

          {/* Search & Size Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama event, klien, venue, PIC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 w-52 sm:w-64"
            />

            <select
              value={sizeFilter}
              onChange={e => setSizeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Semua Luas Layar</option>
              <option value="LARGE">Bentang Besar (≥ 50 m²)</option>
              <option value="MEDIUM">Bentang Sedang (20 - 49 m²)</option>
              <option value="COMPACT">Bentang Ringkas (&lt; 20 m²)</option>
            </select>
          </div>
        </div>

        {/* Deployments List Table */}
        {filteredDeployments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black/60 text-zinc-400 font-semibold border-b border-zinc-800">
                  <th className="p-3.5">Tanggal Keluar</th>
                  <th className="p-3.5">Nama Event & Klien</th>
                  <th className="p-3.5">Dimensi Layar (Lebar x Tinggi)</th>
                  <th className="p-3.5 text-right">Luas Meter (m²)</th>
                  <th className="p-3.5 text-center">Kabinet / Modul</th>
                  <th className="p-3.5">Venue & PIC Teknisi</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredDeployments.map(dep => (
                  <tr key={dep.id} className="hover:bg-zinc-850/60 transition group">
                    {/* Tanggal Keluar */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono text-zinc-200 font-bold">{dep.date}</div>
                      <span className="text-[10px] text-zinc-500">Tercatat Keluar</span>
                    </td>

                    {/* Event & Klien */}
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{dep.eventName}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Klien: <span className="text-zinc-300 font-medium">{dep.clientName}</span>
                      </div>
                      {dep.notes && (
                        <div className="text-[10px] text-zinc-500 italic mt-0.5">{dep.notes}</div>
                      )}
                    </td>

                    {/* Dimensi Layar (Lebar x Tinggi) */}
                    <td className="p-3.5">
                      <div className="font-semibold text-zinc-200">
                        {dep.screenDimension || `${dep.totalSquareMeters} m²`}
                      </div>
                      {dep.screensDetail && dep.screensDetail.length > 1 && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {dep.screensDetail.length} Bagian Layar
                        </span>
                      )}
                    </td>

                    {/* Luas Meter Persegi */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <span className="px-3 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 font-black text-sm font-mono inline-block">
                        {dep.totalSquareMeters} m²
                      </span>
                    </td>

                    {/* Estimasi Kabinet */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {(() => {
                        const cabSummary = getDeploymentCabinetSummary(dep);
                        return (
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-zinc-200 font-bold">
                              {cabSummary.totalCabinets} Panel
                            </span>
                            {cabSummary.cabinets50 > 0 ? (
                              <span className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                                {cabSummary.cabinets100 > 0 ? `${cabSummary.cabinets100} (50×100) + ` : ''}
                                {cabSummary.cabinets50} (50×50)
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                                {cabSummary.cabinets100} (50×100cm)
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Venue & PIC */}
                    <td className="p-3.5">
                      <div className="text-zinc-300 flex items-center gap-1.5 truncate max-w-[220px]" title={dep.venue}>
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{dep.venue}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>PIC: {dep.picName}</span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(dep)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                          title="Edit Catatan Pengeluaran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus catatan pengeluaran LED ${dep.totalSquareMeters} m² untuk acara "${dep.eventName}"?`)) {
                              deleteLedDeployment(dep.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition"
                          title="Hapus Catatan Pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-black/30">
            <Tv className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-semibold">
              Belum ada riwayat pengeluaran LED di bulan {currentMonthStat.monthName} {selectedYear}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Gunakan tombol "+ Catat Meter LED Keluar" di bagian atas untuk mencatat pementasan layar baru.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: CATAT / EDIT PENGELUARAN METER LED KELUAR
          (DENGAN KALKULATOR MULTI-KOLOM LEBAR & TINGGI OTOMATIS)
          ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-orange-400" />
                <span>{editingDeployment ? 'Edit Catatan Meter LED Keluar' : 'Catat Pengeluaran Meter LED Keluar'}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeployment} className="p-5 space-y-4 text-xs overflow-y-auto">
              
              {/* Opsi Auto-fill dari Event Terjadwal */}
              {!editingDeployment && events && events.length > 0 && (
                <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-1.5">
                  <label className="text-orange-400 font-semibold flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Pilih dari Jadwal Event Operasional (Otomatis Isi)</span>
                  </label>
                  <select
                    value={formData.eventId}
                    onChange={e => handleSelectExistingEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Input Manual atau Pilih Event Terjadwal --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.clientName}) - {ev.startDate}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nama Event / Acara *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soundrenaline Festival 2026 / Gala Dinner Mandiri"
                  value={formData.eventName}
                  onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Nama Klien / EO *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ismaya Live / Bank Mandiri"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tanggal Keluar (Check-out) *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* PIC Teknisi Bertugas */}
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">PIC Teknisi Lapangan *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bayu Nugroho / Fajar Maulana"
                  value={formData.picName}
                  onChange={e => setFormData({ ...formData, picName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* ========================================================
                  KALKULATOR TARGET LED: MULTI-KOLOM LEBAR & TINGGI
                  DENGAN HASIL TOTAL KESELURUHAN OTOMATIS
                  ======================================================== */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-orange-400" />
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Kalkulator Bentang Layar (Lebar & Tinggi)
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Bisa menambah baris/kolom baru untuk lebar & tinggi, total otomatis terhitung
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, useDimensionCalc: true })}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        formData.useDimensionCalc
                          ? 'bg-orange-600 text-white shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Kalkulator (Lebar & Tinggi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, useDimensionCalc: false })}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        !formData.useDimensionCalc
                          ? 'bg-orange-600 text-white shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Input Langsung m²
                    </button>
                  </div>
                </div>

                {formData.useDimensionCalc ? (
                  <div className="space-y-3">
                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-400">Preset Panggung:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('SINGLE')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700 transition"
                      >
                        1 Layar (12x4m)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('MAIN_WINGS')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700 transition"
                      >
                        Utama (12x4m) + 2x Sayap (4x3m)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('STAGE_DELAY')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700 transition"
                      >
                        Backdrop (16x5m) + 2x Delay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('FESTIVAL')}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700 transition"
                      >
                        Festival Multi-Stage
                      </button>
                    </div>

                    {/* Table of Screens / Dimensions */}
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60">
                      {/* Tampilan Mobile: Card Responsif Agar Semua Data Terlihat Jelas */}
                      <div className="sm:hidden divide-y divide-zinc-800/80">
                        {formData.screens.map((scr, idx) => (
                          <div key={scr.id} className="p-3 space-y-2.5 bg-zinc-900/40">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px]">
                                  Layar #{idx + 1}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {scr.width}m × {scr.height}m ({scr.qty}x)
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                                  {scr.squareMeters.toFixed(2)} m²
                                </span>
                                {formData.screens.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScreenRow(scr.id)}
                                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-zinc-700 transition"
                                    title="Hapus baris layar ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                                Posisi / Nama Layar
                              </label>
                              <input
                                type="text"
                                value={scr.name}
                                onChange={e => handleUpdateScreenRow(scr.id, 'name', e.target.value)}
                                placeholder={`Layar ${idx + 1}`}
                                className="w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium text-xs focus:outline-none focus:border-orange-500"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                                  Lebar (m)
                                </label>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={scr.width}
                                    onChange={e => handleUpdateScreenRow(scr.id, 'width', e.target.value)}
                                    className="w-full pl-2 pr-5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                                  />
                                  <span className="absolute right-1.5 text-[10px] text-zinc-400 font-mono pointer-events-none">
                                    m
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                                  Tinggi (m)
                                </label>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={scr.height}
                                    onChange={e => handleUpdateScreenRow(scr.id, 'height', e.target.value)}
                                    className="w-full pl-2 pr-5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                                  />
                                  <span className="absolute right-1.5 text-[10px] text-zinc-400 font-mono pointer-events-none">
                                    m
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                                  Qty Layar
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={scr.qty}
                                  onChange={e => handleUpdateScreenRow(scr.id, 'qty', e.target.value)}
                                  className="w-full px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-zinc-800/60 text-[11px]">
                              <div className="text-zinc-400">
                                <span>Estimasi Panel: </span>
                                <strong className="text-zinc-100 font-mono">{scr.cabinets} Panel</strong>
                                {(() => {
                                  const m = calculateLedScreenMetrics(scr.width, scr.height, scr.qty);
                                  if (m.cabinets50 > 0 && m.cabinets100 > 0) {
                                    return (
                                      <span className="text-[10px] text-amber-400 font-mono block">
                                        {m.cabinets100} (50×100cm) + {m.cabinets50} (50×50cm)
                                      </span>
                                    );
                                  }
                                  if (m.cabinets50 > 0) {
                                    return (
                                      <span className="text-[10px] text-amber-400 font-mono block">
                                        {m.cabinets50} unit (50×50cm)
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] text-zinc-500 font-mono block">
                                      {m.cabinets100} unit (50×100cm)
                                    </span>
                                  );
                                })()}
                              </div>
                              <span className="text-zinc-300">
                                Subtotal Luas: <strong className="text-orange-400 font-mono">{scr.squareMeters.toFixed(2)} m²</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tampilan Tablet & Desktop: Tabel Lengkap */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full min-w-[560px] text-left text-xs">
                          <thead>
                            <tr className="bg-black/50 text-zinc-400 border-b border-zinc-800 text-[11px]">
                              <th className="p-2.5">Posisi / Nama Layar</th>
                              <th className="p-2.5 w-24">Lebar (m)</th>
                              <th className="p-2.5 w-24">Tinggi (m)</th>
                              <th className="p-2.5 w-16 text-center">Qty</th>
                              <th className="p-2.5 w-24 text-right">Luas (m²)</th>
                              <th className="p-2.5 w-28 text-center">Estimasi Panel</th>
                              <th className="p-2.5 w-10 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/80">
                            {formData.screens.map((scr, idx) => (
                              <tr key={scr.id} className="hover:bg-zinc-800/30">
                                {/* Nama Layar */}
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={scr.name}
                                    onChange={e => handleUpdateScreenRow(scr.id, 'name', e.target.value)}
                                    placeholder={`Layar ${idx + 1}`}
                                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium text-xs focus:outline-none focus:border-orange-500"
                                  />
                                </td>

                                {/* Kolom Lebar */}
                                <td className="p-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0.5"
                                      value={scr.width}
                                      onChange={e => handleUpdateScreenRow(scr.id, 'width', e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                                    />
                                    <span className="text-[10px] text-zinc-500">m</span>
                                  </div>
                                </td>

                                {/* Kolom Tinggi */}
                                <td className="p-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0.5"
                                      value={scr.height}
                                      onChange={e => handleUpdateScreenRow(scr.id, 'height', e.target.value)}
                                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                                    />
                                    <span className="text-[10px] text-zinc-500">m</span>
                                  </div>
                                </td>

                                {/* Kolom Qty */}
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={scr.qty}
                                    onChange={e => handleUpdateScreenRow(scr.id, 'qty', e.target.value)}
                                    className="w-14 px-1.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500 mx-auto"
                                  />
                                </td>

                                {/* Hasil Luas m² per baris (Otomatis) */}
                                <td className="p-2 text-right whitespace-nowrap">
                                  <span className="font-mono font-bold text-orange-400 text-xs">
                                    {scr.squareMeters.toFixed(2)} m²
                                  </span>
                                </td>

                                {/* Estimasi Panel (50x100cm & 50x50cm) */}
                                <td className="p-2 text-center whitespace-nowrap">
                                  <span className="font-mono font-semibold text-zinc-200 text-xs block">
                                    {scr.cabinets} Panel
                                  </span>
                                  {(() => {
                                    const m = calculateLedScreenMetrics(scr.width, scr.height, scr.qty);
                                    if (m.cabinets50 > 0 && m.cabinets100 > 0) {
                                      return (
                                        <span className="text-[10px] text-amber-400 font-mono block">
                                          {m.cabinets100} (50×100) + {m.cabinets50} (50×50)
                                        </span>
                                      );
                                    }
                                    if (m.cabinets50 > 0) {
                                      return (
                                        <span className="text-[10px] text-amber-400 font-mono block">
                                          {m.cabinets50} (50×50cm)
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="text-[10px] text-zinc-500 font-mono block">
                                        {m.cabinets100} (50×100cm)
                                      </span>
                                    );
                                  })()}
                                </td>

                                {/* Tombol Hapus Baris */}
                                <td className="p-2 text-center">
                                  {formData.screens.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveScreenRow(scr.id)}
                                      className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                      title="Hapus baris layar ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Tombol Tambah Baris / Kolom Layar Baru */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleAddScreenRow}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-orange-500/30 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Tambah Layar / Dimensi Baru (Lebar & Tinggi)</span>
                      </button>

                      <span className="text-[11px] text-zinc-400">
                        Total {formData.screens.length} baris konfigurasi
                      </span>
                    </div>

                    {/* BOX HASIL TOTAL KESELURUHAN OTOMATIS */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/40 via-black to-zinc-900 border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                          HASIL TOTAL KESELURUHAN (OTOMATIS):
                        </span>
                        <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
                          {formData.screens.map(s => `${s.name}: ${s.width}x${s.height}m${s.qty > 1 ? ` (${s.qty}x)` : ''}`).join(' + ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block">Total Estimasi Kabinet:</span>
                          <span className="font-mono font-bold text-white text-sm block">
                            {formData.cabinetCount} Panel
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            {formTotalCabinets100 > 0 && `${formTotalCabinets100} (50×100cm)`}
                            {formTotalCabinets100 > 0 && formTotalCabinets50 > 0 && ' + '}
                            {formTotalCabinets50 > 0 && (
                              <span className="text-amber-400 font-semibold">{formTotalCabinets50} (50×50cm)</span>
                            )}
                          </span>
                        </div>

                        <div className="text-right pl-3 border-l border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">Total Luas Keseluruhan:</span>
                          <span className="font-mono font-black text-orange-400 text-xl">
                            {formData.customSquareMeters} m²
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Total Luas Layar Meter Persegi (m²) *</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      required
                      value={formData.customSquareMeters}
                      onChange={e => {
                        const sq = parseFloat(e.target.value) || 0;
                        const fullPanels = Math.floor((sq + 1e-9) / 0.5);
                        const remSq = Math.max(0, sq - fullPanels * 0.5);
                        const halfPanels = Math.round(remSq / 0.25);
                        setFormData({
                          ...formData,
                          customSquareMeters: sq,
                          cabinetCount: fullPanels + halfPanels
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-orange-500"
                    />
                    <div className="text-[11px] text-zinc-400 mt-1">
                      Estimasi kabinet (50×100cm & 50×50cm): <strong className="text-white font-mono">{formData.cabinetCount} Panel</strong>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Venue / Lokasi Event *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICE BSD Hall 3, Tangerang"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Catatan Konfigurasi Layar (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Main Screen 12x4m + 2x Delay Screen 4x3m, Rigging gantung"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-orange-500"
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
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingDeployment ? 'Simpan Perubahan' : 'Simpan Catatan Pengeluaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KALKULATOR TARGET LED & SIMULATOR BENTANG STANDALONE
          ======================================================== */}
      {showStandaloneCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Kalkulator Bentang Layar & Simulator Target LED
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Tambah kolom dan baris lebar & tinggi untuk menghitung total keseluruhan luas $m^2$ dan melihat pengaruhnya pada target bulanan.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowStandaloneCalc(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              
              {/* Target Month Simulation Selector */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>Simulasi Target Untuk Bulan:</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Pilih bulan untuk melihat simulasi realisasi jika konfigurasi layar ini dicatat keluar
                  </span>
                </div>

                <select
                  value={calcMonth}
                  onChange={e => setCalcMonth(parseInt(e.target.value) || 9)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-bold text-xs focus:outline-none focus:border-orange-500"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Bulan {name} {selectedYear} (Target: {monthlyStats[idx]?.targetMeters || 400} m²)
                    </option>
                  ))}
                </select>
              </div>

              {/* Table of Screens with Lebar & Tinggi */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/40">
                {/* Tampilan Mobile: Card Responsif Agar Semua Data Terlihat Jelas */}
                <div className="sm:hidden divide-y divide-zinc-800/80">
                  {calcScreens.map((scr, idx) => (
                    <div key={scr.id} className="p-3.5 space-y-2.5 bg-zinc-900/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px]">
                            Layar #{idx + 1}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {scr.width}m × {scr.height}m ({scr.qty}x)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                            {scr.squareMeters.toFixed(2)} m²
                          </span>
                          {calcScreens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCalcScreenRow(scr.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-zinc-700 transition"
                              title="Hapus baris layar ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                          Posisi / Keterangan Layar
                        </label>
                        <input
                          type="text"
                          value={scr.name}
                          onChange={e => handleUpdateCalcScreenRow(scr.id, 'name', e.target.value)}
                          placeholder={`Layar ${idx + 1}`}
                          className="w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                            Lebar (m)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={scr.width}
                              onChange={e => handleUpdateCalcScreenRow(scr.id, 'width', e.target.value)}
                              className="w-full pl-2 pr-5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                            />
                            <span className="absolute right-1.5 text-[10px] text-zinc-400 font-mono pointer-events-none">
                              m
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                            Tinggi (m)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={scr.height}
                              onChange={e => handleUpdateCalcScreenRow(scr.id, 'height', e.target.value)}
                              className="w-full pl-2 pr-5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                            />
                            <span className="absolute right-1.5 text-[10px] text-zinc-400 font-mono pointer-events-none">
                              m
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                            Qty Layar
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={scr.qty}
                            onChange={e => handleUpdateCalcScreenRow(scr.id, 'qty', e.target.value)}
                            className="w-full px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-zinc-800/60 text-[11px]">
                        <div className="text-zinc-400">
                          <span>Estimasi Panel: </span>
                          <strong className="text-zinc-100 font-mono">{scr.cabinets} Panel</strong>
                          {(() => {
                            const m = calculateLedScreenMetrics(scr.width, scr.height, scr.qty);
                            if (m.cabinets50 > 0 && m.cabinets100 > 0) {
                              return (
                                <span className="text-[10px] text-amber-400 font-mono block">
                                  {m.cabinets100} (50×100cm) + {m.cabinets50} (50×50cm)
                                </span>
                              );
                            }
                            if (m.cabinets50 > 0) {
                              return (
                                <span className="text-[10px] text-amber-400 font-mono block">
                                  {m.cabinets50} unit (50×50cm)
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] text-zinc-500 font-mono block">
                                {m.cabinets100} unit (50×100cm)
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-zinc-300">
                          Subtotal Luas: <strong className="text-orange-400 font-mono">{scr.squareMeters.toFixed(2)} m²</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tampilan Tablet & Desktop: Tabel Lengkap */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-850 text-zinc-300 border-b border-zinc-800 text-[11px]">
                        <th className="p-3">Posisi / Keterangan Layar</th>
                        <th className="p-3 w-28">Lebar (m)</th>
                        <th className="p-3 w-28">Tinggi (m)</th>
                        <th className="p-3 w-20 text-center">Qty Layar</th>
                        <th className="p-3 w-28 text-right">Luas (m²)</th>
                        <th className="p-3 w-28 text-center">Estimasi Panel</th>
                        <th className="p-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {calcScreens.map((scr, idx) => (
                        <tr key={scr.id} className="hover:bg-zinc-800/30">
                          {/* Nama Layar */}
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={scr.name}
                              onChange={e => handleUpdateCalcScreenRow(scr.id, 'name', e.target.value)}
                              placeholder={`Layar ${idx + 1}`}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-medium text-xs focus:outline-none focus:border-orange-500"
                            />
                          </td>

                          {/* Kolom Lebar */}
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={scr.width}
                                onChange={e => handleUpdateCalcScreenRow(scr.id, 'width', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-[10px] text-zinc-500 font-mono">m</span>
                            </div>
                          </td>

                          {/* Kolom Tinggi */}
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={scr.height}
                                onChange={e => handleUpdateCalcScreenRow(scr.id, 'height', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-[10px] text-zinc-500 font-mono">m</span>
                            </div>
                          </td>

                          {/* Kolom Qty */}
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={scr.qty}
                              onChange={e => handleUpdateCalcScreenRow(scr.id, 'qty', e.target.value)}
                              className="w-14 px-1.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs focus:outline-none focus:border-orange-500 mx-auto"
                            />
                          </td>

                          {/* Luas Subtotal */}
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-orange-400 text-xs">
                              {scr.squareMeters.toFixed(2)} m²
                            </span>
                          </td>

                          {/* Estimasi Panel */}
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className="font-mono text-zinc-200 font-semibold text-xs block">
                              {scr.cabinets} Panel
                            </span>
                            {(() => {
                              const m = calculateLedScreenMetrics(scr.width, scr.height, scr.qty);
                              if (m.cabinets50 > 0 && m.cabinets100 > 0) {
                                return (
                                  <span className="text-[10px] text-amber-400 font-mono block">
                                    {m.cabinets100} (50×100) + {m.cabinets50} (50×50)
                                  </span>
                                );
                              }
                              if (m.cabinets50 > 0) {
                                return (
                                  <span className="text-[10px] text-amber-400 font-mono block">
                                    {m.cabinets50} (50×50cm)
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {m.cabinets100} (50×100cm)
                                </span>
                              );
                            })()}
                          </td>

                          {/* Tombol Hapus */}
                          <td className="p-2.5 text-center">
                            {calcScreens.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCalcScreenRow(scr.id)}
                                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                title="Hapus baris layar ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons: Add Screen Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAddCalcScreenRow}
                  className="px-3.5 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Baris / Layar Baru (Lebar & Tinggi)</span>
                </button>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span>Preset:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalcScreens([
                        buildLedScreenItem('c-1', 'Layar Utama', 12, 4, 1)
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    12x4m
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalcScreens([
                        buildLedScreenItem('c-1', 'Main Screen', 14, 4.5, 1),
                        buildLedScreenItem('c-2', 'Wings L & R', 4, 3, 2)
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    Main (14x4.5m) + Wings
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalcScreens([
                        buildLedScreenItem('c-1', 'Stage Backdrop', 16, 5, 1),
                        buildLedScreenItem('c-2', 'FOH Delay 1 & 2', 3, 2, 2),
                        buildLedScreenItem('c-3', 'Floor Catwalk', 8, 2, 1)
                      ])
                    }
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    Stage + Delay + Floor
                  </button>
                </div>
              </div>

              {/* CARD RINGKASAN HASIL TOTAL KESELURUHAN */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-850 to-black border border-orange-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="font-extrabold text-orange-400 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>HASIL TOTAL KESELURUHAN (OTOMATIS)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                    {calcScreens.length} Konfigurasi Layar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Total Luas Keseluruhan:</span>
                    <span className="font-mono font-black text-2xl text-orange-400 tracking-tight">
                      {calcTotalSquareMeters} <span className="text-sm font-normal text-zinc-400">m²</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Total Estimasi Panel / Kabinet:</span>
                    <span className="font-mono font-black text-2xl text-white tracking-tight">
                      {calcTotalCabinets} <span className="text-sm font-normal text-zinc-400">Panel</span>
                    </span>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 space-y-0.5">
                      <div>• Kabinet 50×100cm: <strong className="text-zinc-200">{calcTotalCabinets100} Panel</strong></div>
                      <div>• Kabinet 50×50cm (½m): <strong className="text-amber-400">{calcTotalCabinets50} Panel</strong></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Simulasi Capaian Bulan {monthNames[calcMonth - 1]}:</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`font-mono font-black text-2xl ${simPercentage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {simPercentage.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({simActualMeters}m² / {calcTargetStat.targetMeters}m²)
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      {simDifference >= 0 ? `+${simDifference.toFixed(1)} m² surplus target` : `Sisa ${Math.abs(simDifference).toFixed(1)} m² lagi`}
                    </span>
                  </div>
                </div>

                {/* Dimension String Summary */}
                <div className="text-[11px] text-zinc-300 font-mono bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">Rincian Rumus Bentang:</span>
                  {calcScreens.map(s => `${s.name}: ${s.width}m x ${s.height}m${s.qty > 1 ? ` (${s.qty} unit)` : ''} [${s.squareMeters} m²]`).join(' + ')} = <strong className="text-orange-400">{calcTotalSquareMeters} m²</strong>
                </div>
              </div>

              {/* Action Buttons at bottom */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-400">
                  Hasil kalkulasi ini dapat langsung dipindahkan ke pencatatan event resmi.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStandaloneCalc(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCalcInDeployment}
                    className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-950/60"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Gunakan Hasil Ini Untuk Catat Keluar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ATUR TARGET METER LED BULANAN
          ======================================================== */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black/60">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <span>Pengaturan Target Meter LED Bulanan ({selectedYear})</span>
              </h3>
              <button onClick={() => setShowTargetModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllTargets} className="p-5 space-y-4 text-xs overflow-y-auto">
              <p className="text-zinc-400">
                Tentukan target kuota pengeluaran meter LED ($m^2$) untuk setiap bulan. Target ini digunakan sebagai acuan KPI dan perhitungan persentase capaian operasional gudang.
              </p>

              {/* Preset Bulk Target & Copy Target */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-zinc-300 font-bold block">Terapkan Target Seragam</span>
                    <span className="text-[10px] text-zinc-500">Set nilai yang sama untuk semua 12 bulan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={bulkTargetValue}
                      onChange={e => setBulkTargetValue(parseInt(e.target.value) || 0)}
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-center font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkTarget}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-[11px]"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <span className="text-orange-300 font-semibold text-xs block">Salin Target Tahun {selectedYear - 1}</span>
                      <span className="text-[10px] text-zinc-400">Gunakan target yang sama persis seperti tahun lalu</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyFromPreviousYear}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-orange-500/40 text-orange-400 font-semibold text-[11px] shrink-0"
                  >
                    Salin Target
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {monthNames.map((name, idx) => {
                  const mNum = idx + 1;
                  const currentVal = tempTargets[mNum] ?? 400;
                  return (
                    <div key={mNum} className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 space-y-1">
                      <label className="text-zinc-300 font-bold block">{name}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="10"
                          min="0"
                          required
                          value={currentVal}
                          onChange={e => setTempTargets({ ...tempTargets, [mNum]: parseInt(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono font-bold text-xs"
                        />
                        <span className="text-zinc-500 font-mono text-[10px]">m²</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
