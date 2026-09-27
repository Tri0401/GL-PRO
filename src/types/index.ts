export type ItemCondition = 
  | 'Sangat Baik'
  | 'Baik'
  | 'Cukup'
  | 'Rusak Ringan'
  | 'Rusak Berat'
  | 'Tidak Dapat Digunakan';

export type ItemStatus =
  | 'AVAILABLE'       // 🟢 Tersedia di gudang
  | 'RESERVED'        // 🔵 Dipesan untuk event
  | 'IN_PREPARATION'  // 🟡 Sedang disiapkan/picking
  | 'IN_TRANSIT'      // 🟠 Dalam perjalanan (Surat Jalan aktif)
  | 'IN_USE'          // 🔴 Sedang digunakan di event
  | 'MAINTENANCE'     // ⚫ Sedang perbaikan/servis berkala
  | 'DAMAGED'         // ⚠️ Rusak
  | 'LOST';           // ❌ Hilang

export type EventStatus =
  | 'Draft'
  | 'Persiapan'
  | 'Siap Berangkat'
  | 'Loading'
  | 'Berlangsung'
  | 'Teardown'
  | 'Pengembalian'
  | 'Selesai'
  | 'Dibatalkan';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'WAREHOUSE'
  | 'PROJECT_MANAGER'
  | 'CREW'
  | 'TEKNISI'
  | 'VIEWER';

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole;
  division: string;
  avatar?: string;
  phone: string;
}

export interface UserAccount extends UserProfile {
  username: string;
  password: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  lastLogin?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  iconName: string;
  subcategories: string[];
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  area: string; // e.g., 'Area Audio', 'Lantai 2'
  rack: string; // e.g., 'Rak A', 'Rak 03'
  shelf: string; // e.g., 'Shelf 02'
  box?: string; // e.g., 'Flight Case 05', 'Box 12'
  positionNotes?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  picName: string;
  picPhone: string;
  capacityDescription: string;
  areas: string[];
}

export interface ProductUnit {
  id: string;
  productId: string;
  unitCode: string; // e.g., 'CAM-001', 'MH-005'
  serialNumber: string;
  barcode: string;
  qrCode: string;
  condition: ItemCondition;
  status: ItemStatus;
  warehouseId: string;
  locationDetails: string;
  currentEventId?: string;
  currentPicId?: string;
  lastInspectionDate?: string;
  notes?: string;
}

export interface Product {
  id: string;
  code: string; // e.g. 'INV-AUD-0001'
  name: string;
  alias?: string;
  category: string; // e.g., 'AUDIO'
  subcategory: string; // e.g., 'Wireless Microphone'
  brand: string;
  model: string;
  isIndividual: boolean; // true = tracking per serial number, false = bulk quantity
  serialNumber?: string; // default or primary if individual
  unit: string; // 'unit', 'pcs', 'set', 'roll', 'meter', 'box'
  
  // Quantities
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  inUseQty: number;
  inTransitQty: number;
  inMaintenanceQty: number;
  damagedQty: number;
  lostQty: number;
  minQty: number; // for low stock alert
  
  // Storage
  warehouseId: string;
  area: string;
  rack: string;
  shelf: string;
  box?: string;
  
  // Details
  status: ItemStatus;
  condition: ItemCondition;
  procurementYear: number;
  imageUrl: string;
  barcode: string;
  qrCode: string;
  notes?: string;
  
  // Child units if individual tracking
  units?: ProductUnit[];
}

export interface Client {
  id: string;
  companyName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  totalEventsCount?: number;
}

export interface CrewMember {
  id: string;
  name: string;
  division: 'Audio' | 'Lighting' | 'LED' | 'Multimedia' | 'Dokumentasi' | 'Production' | 'Warehouse' | 'Driver' | 'Teknisi';
  roleTitle: string; // e.g. 'Senior Sound Engineer', 'Lighting Designer', 'Chief Driver'
  phone: string;
  skills: string[];
  status: 'Aktif' | 'Izin' | 'Nonaktif';
  avatarUrl?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string; // e.g., 'B 9281 KGA'
  vehicleType: 'Truk Box CDD' | 'Truk Box CDE' | 'Blind Van' | 'Pickup Box' | 'Grand Max' | 'Passenger Van';
  brand: string; // e.g., 'Isuzu Giga', 'Daihatsu'
  driverName: string;
  driverPhone: string;
  capacityTons?: number;
  status: 'Tersedia' | 'Digunakan' | 'Maintenance';
}

export interface EventEquipmentItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  requestedQty: number;
  pickedQty: number;
  checkedOutQty: number;
  returnedQty: number;
  status: 'Belum Disiapkan' | 'Sedang Disiapkan' | 'Lengkap' | 'Kurang' | 'Di Event' | 'Dikembalikan';
  specificUnitCodes?: string[]; // for individual items
  notes?: string;
}

export interface EventChecklistItem {
  id: string;
  title: string;
  category: string;
  isCompleted: boolean;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

export interface EventTimelineMilestone {
  id: string;
  stage: 'H-30' | 'H-14' | 'H-7' | 'H-3' | 'H-1' | 'HARI H' | 'H+1';
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface EventCrewAssignment {
  id: string;
  crewId: string;
  crewName: string;
  division: string;
  eventRole: 
    | 'Project Manager'
    | 'Production Manager'
    | 'PIC Event'
    | 'PIC Audio'
    | 'PIC Lighting'
    | 'PIC LED'
    | 'PIC Multimedia'
    | 'PIC Dokumentasi'
    | 'Warehouse Crew'
    | 'Driver';
  contact: string;
}

export interface EventData {
  id: string;
  eventCode: string; // e.g. 'EVT-2026-0001'
  name: string;
  clientId: string;
  clientName: string;
  venueName: string;
  venueAddress: string;
  
  startDate: string;
  endDate: string;
  loadingTime?: string;
  setupTime?: string;
  showTime?: string;
  teardownTime?: string;
  
  picEventName: string;
  projectManagerName: string;
  
  status: EventStatus;
  notes?: string;
  
  equipmentList: EventEquipmentItem[];
  checklist: EventChecklistItem[];
  timeline: EventTimelineMilestone[];
  crewAssignments: EventCrewAssignment[];
  
  suratJalanIds?: string[];
  checkoutIds?: string[];
  checkinIds?: string[];
}

export interface CheckoutItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  qty: number;
  scannedUnitCodes?: string[];
  conditionBefore: ItemCondition;
  notes?: string;
}

export interface CheckoutRecord {
  id: string;
  checkoutCode: string; // e.g. 'OUT-20260927-0001'
  eventId: string;
  eventName: string;
  warehouseId: string;
  warehouseName: string;
  picName: string;
  driverName: string;
  vehiclePlate: string;
  vehicleType: string;
  checkoutDate: string;
  checkoutTime: string;
  suratJalanNumber: string;
  items: CheckoutItem[];
  crewAssignments?: EventCrewAssignment[];
  notes?: string;
  signedByPic?: string;
  signedByDriver?: string;
  signedByWarehouse?: string;
}

export interface CheckinItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  outQty: number;
  returnedQty: number;
  differenceQty: number; // outQty - returnedQty
  conditionAfter: ItemCondition;
  isDamaged: boolean;
  damageNotes?: string;
  inspectionPhotoUrl?: string;
}

export interface CheckinRecord {
  id: string;
  checkinCode: string; // e.g. 'IN-20260928-0001'
  eventId: string;
  eventName: string;
  warehouseId: string;
  warehouseName: string;
  inspectorName: string;
  checkinDate: string;
  checkinTime: string;
  items: CheckinItem[];
  crewAssignments?: EventCrewAssignment[];
  hasDiscrepancy: boolean;
  notes?: string;
}

export interface DamageReport {
  id: string;
  damageCode: string; // e.g. 'DMG-20260927-0001'
  productId: string;
  productCode: string;
  productName: string;
  unitCode?: string;
  eventId?: string;
  eventName?: string;
  picName: string;
  inspectorName: string;
  damageType: 'Kabel Putus' | 'Lampu Mati / Burn' | 'Layar Pecah/Garis' | 'Body Penyok' | 'Port / Connector Rusak' | 'Mati Total' | 'Komponen Hilang';
  severity: 'Rusak Ringan' | 'Rusak Berat' | 'Tidak Dapat Digunakan';
  description: string;
  photoUrl?: string;
  reportDate: string;
  status: 'Dilaporkan' | 'Diperiksa' | 'Menunggu Perbaikan' | 'Dalam Perbaikan' | 'Selesai' | 'Tidak Dapat Digunakan';
  technicianNotes?: string;
}

export interface MaintenanceRecord {
  id: string;
  maintenanceCode: string; // e.g. 'MNT-20260927-0001'
  productId: string;
  productCode: string;
  productName: string;
  unitCode?: string;
  maintenanceType: 'Pembersihan & Kalibrasi' | 'Ganti Komponen / Sparepart' | 'Pemeriksaan Berkala' | 'Update Firmware' | 'Perbaikan Mekanikal';
  technicianName: string;
  scheduleDate: string;
  completionDate?: string;
  conditionBefore: ItemCondition;
  conditionAfter?: ItemCondition;
  notes: string;
  status: 'Segera Dilakukan' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan';
  nextMaintenanceDate?: string;
  cost?: number;
}

export interface TransferRecord {
  id: string;
  transferCode: string; // e.g. 'TRF-20260927-0001'
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  date: string;
  picName: string;
  driverName?: string;
  vehiclePlate?: string;
  status: 'Draft' | 'Disetujui' | 'Diproses' | 'Dalam Perjalanan' | 'Diterima' | 'Selesai';
  items: {
    productId: string;
    productCode: string;
    productName: string;
    qty: number;
    unit: string;
  }[];
  notes?: string;
}

export interface BorrowingRecord {
  id: string;
  borrowCode: string; // e.g. 'BRW-20260927-0001'
  borrowerName: string;
  borrowerRole: string;
  division: string;
  phone: string;
  productId: string;
  productCode: string;
  productName: string;
  qty: number;
  unit: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  purpose: string;
  approvedByPic: string;
  conditionOut: ItemCondition;
  conditionReturn?: ItemCondition;
  status: 'Dipinjam' | 'Terlambat' | 'Dikembalikan' | 'Rusak' | 'Hilang';
  notes?: string;
}

export interface StockOpnameItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  systemQty: number;
  physicalQty: number;
  differenceQty: number;
  status: 'Ada' | 'Tidak Ditemukan' | 'Lokasi Salah' | 'Kondisi Berbeda' | 'Jumlah Berbeda';
  currentLocation: string;
  scannedLocation?: string;
  condition: ItemCondition;
  notes?: string;
}

export interface StockOpnameSession {
  id: string;
  sessionCode: string; // e.g. 'OPN-20260927-0001'
  warehouseId: string;
  warehouseName: string;
  category?: string;
  area?: string;
  auditorName: string;
  date: string;
  status: 'Berjalan' | 'Selesai';
  items: StockOpnameItem[];
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: 'INVENTORY' | 'EVENT' | 'CHECKOUT' | 'CHECKIN' | 'DAMAGE' | 'MAINTENANCE' | 'TRANSFER' | 'BORROW' | 'OPNAME' | 'SYSTEM';
  description: string;
  entityId?: string;
  entityType?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'SUCCESS';
  timestamp: string;
  read: boolean;
  linkTab?: string;
  linkId?: string;
}

export interface MonthlyLedTarget {
  month: number; // 1 - 12
  year: number;
  targetMeters: number; // in square meters (m²)
}

export interface LedDeploymentRecord {
  id: string;
  eventId?: string;
  eventName: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  ledType?: string; // Opsional / Dihapus dari form & tampilan sesuai permintaan user
  screenDimension?: string; // e.g. '12m x 4m (Main Screen)'
  totalSquareMeters: number; // in m²
  cabinetCount?: number;
  venue: string;
  picName: string;
  notes?: string;
  screensDetail?: {
    id: string;
    name: string;
    width: number;
    height: number;
    qty: number;
    squareMeters: number;
  }[];
}
