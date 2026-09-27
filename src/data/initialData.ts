import {
  Category,
  Warehouse,
  Product,
  Client,
  CrewMember,
  Vehicle,
  EventData,
  DamageReport,
  MaintenanceRecord,
  TransferRecord,
  BorrowingRecord,
  AuditLogItem,
  NotificationItem,
  UserProfile,
  UserAccount,
  MonthlyLedTarget,
  LedDeploymentRecord
} from '../types';

// Seluruh data operasional & inventaris dikosongkan (0) agar diisi manual oleh pengguna di Cloud Firestore
export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_WAREHOUSES: Warehouse[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_CREW: CrewMember[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_EVENTS: EventData[] = [];

export const INITIAL_DAMAGE_REPORTS: DamageReport[] = [];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [];

export const INITIAL_TRANSFERS: TransferRecord[] = [];

export const INITIAL_BORROWINGS: BorrowingRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_LED_MONTHLY_TARGETS: MonthlyLedTarget[] = [];

export const INITIAL_LED_DEPLOYMENTS: LedDeploymentRecord[] = [];

// Akun akses login sistem tetap tersedia agar pengguna dapat masuk ke aplikasi
export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-01',
    username: 'admin',
    password: 'password123',
    name: 'Bambang Sudiro',
    email: 'bambang.ops@glpro.co.id',
    role: 'SUPER_ADMIN',
    division: 'Warehouse & Operations',
    phone: '0812-3456-7890',
    status: 'Aktif',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-02',
    username: 'gudang',
    password: 'password123',
    name: 'Hendra Wijaya',
    email: 'hendra.logistik@glpro.co.id',
    role: 'WAREHOUSE',
    division: 'Kepala Gudang & Inventaris',
    phone: '0813-8822-1100',
    status: 'Aktif',
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-03',
    username: 'pm_event',
    password: 'password123',
    name: 'Rian Pratama',
    email: 'rian.pm@glpro.co.id',
    role: 'PROJECT_MANAGER',
    division: 'Event Production Manager',
    phone: '0811-9876-5432',
    status: 'Aktif',
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-04',
    username: 'teknisi',
    password: 'password123',
    name: 'Doni Kusuma',
    email: 'doni.tech@glpro.co.id',
    role: 'TEKNISI',
    division: 'Teknisi Audio & Lighting',
    phone: '0857-1122-3344',
    status: 'Aktif',
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-05',
    username: 'crew',
    password: 'password123',
    name: 'Dimas Wahyu',
    email: 'dimas.crew@glpro.co.id',
    role: 'CREW',
    division: 'Crew Lapangan & Rigging',
    phone: '0878-9900-1122',
    status: 'Aktif',
    createdAt: '2026-02-10'
  }
];

export const DEFAULT_USER: UserProfile = {
  id: 'usr-01',
  username: 'admin',
  name: 'Bambang Sudiro',
  email: 'bambang.ops@glpro.co.id',
  role: 'SUPER_ADMIN',
  division: 'Warehouse & Operations',
  phone: '0812-3456-7890'
};
