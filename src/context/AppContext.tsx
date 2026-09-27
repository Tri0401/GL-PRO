import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
  sanitizeForFirestore,
  signInWithGooglePopup
} from '../firebase';
import {
  Product,
  Warehouse,
  Category,
  EventData,
  EventStatus,
  DamageReport,
  MaintenanceRecord,
  TransferRecord,
  BorrowingRecord,
  Client,
  CrewMember,
  Vehicle,
  AuditLogItem,
  NotificationItem,
  UserProfile,
  UserAccount,
  UserRole,
  CheckoutRecord,
  CheckinRecord,
  StockOpnameSession,
  ItemCondition,
  MonthlyLedTarget,
  LedDeploymentRecord
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_WAREHOUSES,
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  INITIAL_CREW,
  INITIAL_VEHICLES,
  INITIAL_EVENTS,
  INITIAL_DAMAGE_REPORTS,
  INITIAL_MAINTENANCE,
  INITIAL_TRANSFERS,
  INITIAL_BORROWINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_USER,
  INITIAL_USER_ACCOUNTS,
  INITIAL_LED_MONTHLY_TARGETS,
  INITIAL_LED_DEPLOYMENTS
} from '../data/initialData';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

interface AppContextType {
  // Theme & User
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: UserProfile;
  setCurrentUserRole: (role: UserRole) => void;
  
  // Auth & User Accounts
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message: string; user?: UserAccount };
  loginWithGoogle?: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  userAccounts: UserAccount[];
  addUserAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateUserAccount: (id: string, updates: Partial<UserAccount>) => { success: boolean; message: string };
  deleteUserAccount: (id: string) => { success: boolean; message: string };
  changePassword: (userId: string, oldPassword: string, newPassword: string, isAdminBypass?: boolean) => { success: boolean; message: string };
  
  // Offline & Sync
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineQueue: OfflineAction[];
  syncOfflineData: () => void;

  // Data
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  events: EventData[];
  setEvents: React.Dispatch<React.SetStateAction<EventData[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  crew: CrewMember[];
  setCrew: React.Dispatch<React.SetStateAction<CrewMember[]>>;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  
  // Operations Data
  checkouts: CheckoutRecord[];
  checkins: CheckinRecord[];
  damageReports: DamageReport[];
  maintenanceRecords: MaintenanceRecord[];
  transfers: TransferRecord[];
  borrowings: BorrowingRecord[];
  stockOpnames: StockOpnameSession[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];

  // LED Target & Monthly Tracking
  ledMonthlyTargets: MonthlyLedTarget[];
  updateLedMonthlyTarget: (month: number, year: number, targetMeters: number) => void;
  ledDeployments: LedDeploymentRecord[];
  addLedDeployment: (record: Omit<LedDeploymentRecord, 'id'>) => LedDeploymentRecord;
  updateLedDeployment: (record: LedDeploymentRecord) => void;
  deleteLedDeployment: (id: string) => void;

  // Action methods
  addProduct: (product: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addEvent: (eventData: Partial<EventData>) => EventData;
  updateEvent: (id: string, updates: Partial<EventData>) => void;
  updateEventStatus: (id: string, status: EventStatus) => void;
  deleteEvent: (id: string) => { success: boolean; message: string };
  
  reserveEquipmentForEvent: (eventId: string, productId: string, qty: number, notes?: string) => { success: boolean; message: string };
  removeEquipmentFromEvent: (eventId: string, itemId: string) => void;
  toggleChecklistItem: (eventId: string, checklistId: string) => void;
  
  processCheckout: (checkoutData: Omit<CheckoutRecord, 'id' | 'checkoutCode'>) => CheckoutRecord;
  processCheckin: (checkinData: Omit<CheckinRecord, 'id' | 'checkinCode'>) => CheckinRecord;
  
  reportDamage: (report: Omit<DamageReport, 'id' | 'damageCode'>) => DamageReport;
  updateDamageStatus: (id: string, status: DamageReport['status'], techNotes?: string) => void;
  updateDamageReport: (id: string, updates: Partial<DamageReport>) => void;
  deleteDamageReport: (id: string) => void;
  
  addMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'maintenanceCode'>) => MaintenanceRecord;
  updateMaintenanceStatus: (id: string, status: MaintenanceRecord['status'], conditionAfter?: ItemCondition) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => void;
  
  addTransfer: (record: Omit<TransferRecord, 'id' | 'transferCode'>) => TransferRecord;
  updateTransferStatus: (id: string, status: TransferRecord['status']) => void;
  
  addBorrowing: (record: Omit<BorrowingRecord, 'id' | 'borrowCode'>) => BorrowingRecord;
  updateBorrowing: (id: string, updates: Partial<BorrowingRecord>) => { success: boolean; message: string };
  deleteBorrowing: (id: string) => { success: boolean; message: string };
  returnBorrowing: (id: string, returnCondition: ItemCondition, notes?: string) => void;
  
  saveStockOpname: (session: Omit<StockOpnameSession, 'id' | 'sessionCode'>) => StockOpnameSession;
  
  // Warehouse CRUD
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Warehouse;
  updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => { success: boolean; message: string };

  // Category CRUD
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; message: string };

  // Client, Crew, Vehicle CRUD
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => { success: boolean; message: string };

  addCrew: (crewMember: Omit<CrewMember, 'id'>) => CrewMember;
  updateCrew: (id: string, crewMember: Partial<CrewMember>) => void;
  deleteCrew: (id: string) => { success: boolean; message: string };

  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => { success: boolean; message: string };

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Backup & Reset
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonData: string) => boolean;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Legacy localStorage keys that must be permanently purged and never used for migration
const DEPRECATED_LOCAL_DATA_KEYS = [
  'EVENTOPS_STORAGE_V1',
  'EVENTOPS_ACCOUNTS_V1',
  'EVENTOPS_LED_TARGETS_V1',
  'EVENTOPS_LED_DEPLOYMENTS_V1',
  'EVENTOPS_FIRESTORE_MIGRATED_V1'
];

// Local UI preference & active session token keys ONLY
const AUTH_SESSION_KEY = 'EVENTOPS_SESSION_V1';
const THEME_KEY = 'EVENTOPS_THEME';

function purgeDeprecatedLocalStorage(): void {
  try {
    for (const key of DEPRECATED_LOCAL_DATA_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage access errors
  }
}

// Immediately purge any legacy localStorage data when module loads
purgeDeprecatedLocalStorage();

function getLedTargetId(target: MonthlyLedTarget): string {
  return `target-${target.year}-${String(target.month).padStart(2, '0')}`;
}

function extractTimestampFromId(id: string): number {
  const match = id.match(/(\d{12,15})/);
  return match ? parseInt(match[1], 10) : 0;
}

const INITIAL_ORDER_MAPS: Record<string, Map<string, number>> = {
  categories: new Map(INITIAL_CATEGORIES.map((item, idx) => [item.id, idx])),
  warehouses: new Map(INITIAL_WAREHOUSES.map((item, idx) => [item.id, idx])),
  products: new Map(INITIAL_PRODUCTS.map((item, idx) => [item.id, idx])),
  events: new Map(INITIAL_EVENTS.map((item, idx) => [item.id, idx])),
  clients: new Map(INITIAL_CLIENTS.map((item, idx) => [item.id, idx])),
  crew: new Map(INITIAL_CREW.map((item, idx) => [item.id, idx])),
  vehicles: new Map(INITIAL_VEHICLES.map((item, idx) => [item.id, idx])),
  damageReports: new Map(INITIAL_DAMAGE_REPORTS.map((item, idx) => [item.id, idx])),
  maintenanceRecords: new Map(INITIAL_MAINTENANCE.map((item, idx) => [item.id, idx])),
  transfers: new Map(INITIAL_TRANSFERS.map((item, idx) => [item.id, idx])),
  borrowings: new Map(INITIAL_BORROWINGS.map((item, idx) => [item.id, idx])),
  auditLogs: new Map(INITIAL_AUDIT_LOGS.map((item, idx) => [item.id, idx])),
  notifications: new Map(INITIAL_NOTIFICATIONS.map((item, idx) => [item.id, idx])),
  userAccounts: new Map(INITIAL_USER_ACCOUNTS.map((item, idx) => [item.id, idx])),
  ledDeployments: new Map(INITIAL_LED_DEPLOYMENTS.map((item, idx) => [item.id, idx])),
};

function sortCollectionItems<T extends { id?: string }>(collectionName: string, items: T[]): T[] {
  const copy = [...items];
  if (collectionName === 'ledMonthlyTargets') {
    return copy.sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  const orderMap = INITIAL_ORDER_MAPS[collectionName];
  return copy.sort((a, b) => {
    const idA = a.id || '';
    const idB = b.id || '';
    const tsA = extractTimestampFromId(idA);
    const tsB = extractTimestampFromId(idB);

    if (tsA > 0 && tsB > 0 && tsA !== tsB) {
      return tsB - tsA;
    }
    if (tsA > 0 && tsB === 0) return -1;
    if (tsB > 0 && tsA === 0) return 1;

    if (orderMap) {
      const idxA = orderMap.get(idA);
      const idxB = orderMap.get(idB);
      if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
      if (idxA !== undefined) return -1;
      if (idxB !== undefined) return 1;
    }

    return idA.localeCompare(idB);
  });
}

type FirestoreBatchOp = { type: 'set' | 'delete'; col: string; id: string; data?: any };

async function commitOperationsInChunks(ops: FirestoreBatchOp[]): Promise<void> {
  if (ops.length === 0) return;
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const slice = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of slice) {
      const ref = doc(db, op.col, op.id);
      if (op.type === 'set') {
        batch.set(ref, sanitizeForFirestore({ ...op.data, id: op.id }));
      } else {
        batch.delete(ref);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, slice[0]?.col || 'batch');
    }
  }
}

// Module-level singleton lock so initialization never runs concurrently
let singletonInitPromise: Promise<void> | null = null;

/**
 * Idempotent one-time production database initialization.
 * - Never reads or migrates from localStorage.
 * - Checks `systemMeta/appState` on the Firestore server first.
 * - If `systemMeta/appState` does not exist yet, checks whether any core collection
 *   already contains documents on the server. If any collection has data, it locks
 *   `systemMeta/appState` (`initialized: true`) WITHOUT seeding `INITIAL_*`.
 * - Only seeds `INITIAL_*` if the database is 100% brand-new and empty on the server,
 *   and writes `systemMeta/appState` FIRST before seeding so it can never re-run.
 */
async function ensureFirestoreDatabaseInitializedOnce(): Promise<void> {
  if (singletonInitPromise) {
    return singletonInitPromise;
  }

  singletonInitPromise = (async () => {
    purgeDeprecatedLocalStorage();

    const CLEAN_PRODUCTION_VERSION = '3.0.0-clean-zero';
    const metaRef = doc(db, 'systemMeta', 'appState');
    let metaSnap;
    try {
      metaSnap = await getDocFromServer(metaRef);
    } catch {
      metaSnap = await getDoc(metaRef);
    }

    if (
      metaSnap.exists() &&
      metaSnap.data()?.initialized === true &&
      metaSnap.data()?.version === CLEAN_PRODUCTION_VERSION
    ) {
      return;
    }

    // One-time clean reset of pre-filled operational & inventory data to 0
    // so the user starts with a completely clean database and fills data themselves.
    const operationalCollectionsToZero = [
      'categories',
      'warehouses',
      'products',
      'events',
      'clients',
      'crew',
      'vehicles',
      'checkouts',
      'checkins',
      'damageReports',
      'maintenanceRecords',
      'transfers',
      'borrowings',
      'stockOpnames',
      'auditLogs',
      'notifications',
      'ledMonthlyTargets',
      'ledDeployments'
    ];

    const ops: FirestoreBatchOp[] = [];

    for (const colName of operationalCollectionsToZero) {
      const snap = await getDocsFromServer(collection(db, colName));
      snap.docs.forEach(d => {
        ops.push({ type: 'delete', col: colName, id: d.id });
      });
    }

    // Ensure login userAccounts exist so the user can always sign in
    const userAccSnap = await getDocsFromServer(query(collection(db, 'userAccounts'), limit(1)));
    if (userAccSnap.empty) {
      INITIAL_USER_ACCOUNTS.forEach(item => {
        ops.push({ type: 'set', col: 'userAccounts', id: item.id, data: item });
      });
    }

    await commitOperationsInChunks(ops);

    const appStatePayload = {
      id: 'appState',
      initialized: true,
      initializedAt: new Date().toISOString(),
      version: CLEAN_PRODUCTION_VERSION
    };

    // Persist systemMeta/appState with version '3.0.0-clean-zero' so this cleanup NEVER runs again
    await setDoc(metaRef, appStatePayload);
  })().catch(err => {
    singletonInitPromise = null;
    throw err;
  });

  return singletonInitPromise;
}

/**
 * Pure Firestore-backed collection hook.
 * - Initial state is always `[]` (never `INITIAL_*`).
 * - `onSnapshot` is the sole authority that updates React state after Firestore changes succeed.
 * - Does not optimistically mutate React state prior to Firestore confirmation.
 */
function useFirestoreCollectionState<T>(
  collectionName: string,
  onFirestoreErrorReport: (msg: string) => void,
  getId: (item: T) => string = (item: any) => item.id,
  toFirestoreDoc: (item: T, id: string) => any = (item, id) => ({ ...item, id }),
  fromFirestoreDoc: (docData: any) => T = (docData) => docData as T
): [T[], React.Dispatch<React.SetStateAction<T[]>>, React.MutableRefObject<T[]>] {
  const [state, setRawState] = useState<T[]>([]);
  const stateRef = useRef<T[]>([]);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        // Wait for server confirmation on local writes/deletes so UI never updates optimistically before Firestore succeeds
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        const rawDocs = snapshot.docs.map(d => fromFirestoreDoc({ ...d.data(), id: d.id }));
        const sorted = sortCollectionItems(
          collectionName,
          rawDocs.map(item => ({ ...item, id: getId(item) }))
        ).map(item => {
          if (collectionName === 'ledMonthlyTargets') {
            const { month, year, targetMeters } = item as any;
            return { month, year, targetMeters } as unknown as T;
          }
          return item as unknown as T;
        });
        stateRef.current = sorted;
        setRawState(sorted);
      },
      (error) => {
        console.error(`[Firestore Listener Error] ${collectionName}:`, error);
        onFirestoreErrorReport(`Gagal memuat koleksi "${collectionName}" dari Cloud Firestore.`);
        try {
          handleFirestoreError(error, OperationType.GET, collectionName);
        } catch {
          // Handled via error report
        }
      }
    );

    return () => unsubscribe();
  }, [collectionName, onFirestoreErrorReport]);

  // Dispatcher for external state setters (persists to Firestore first, then lets onSnapshot update state)
  const setSyncedState: React.Dispatch<React.SetStateAction<T[]>> = useCallback(
    (updaterOrValue) => {
      const prev = stateRef.current;
      const next =
        typeof updaterOrValue === 'function'
          ? (updaterOrValue as (prevState: T[]) => T[])(prev)
          : updaterOrValue;

      const prevMap = new Map<string, T>();
      for (const item of prev) {
        prevMap.set(getId(item), item);
      }

      const nextIds = new Set<string>();
      const ops: FirestoreBatchOp[] = [];

      for (const item of next) {
        const id = getId(item);
        nextIds.add(id);
        const prevItem = prevMap.get(id);
        const docPayload = sanitizeForFirestore(toFirestoreDoc(item, id));
        const prevPayload = prevItem ? sanitizeForFirestore(toFirestoreDoc(prevItem, id)) : null;

        if (!prevPayload || JSON.stringify(prevPayload) !== JSON.stringify(docPayload)) {
          ops.push({ type: 'set', col: collectionName, id, data: docPayload });
        }
      }

      for (const [oldId] of prevMap.entries()) {
        if (!nextIds.has(oldId)) {
          ops.push({ type: 'delete', col: collectionName, id: oldId });
        }
      }

      if (ops.length === 0) return;

      (async () => {
        try {
          if (ops.length === 1) {
            const single = ops[0];
            const docRef = doc(db, single.col, single.id);
            if (single.type === 'set') {
              await setDoc(docRef, sanitizeForFirestore({ ...single.data, id: single.id }));
            } else {
              await deleteDoc(docRef);
            }
          } else {
            await commitOperationsInChunks(ops);
          }
        } catch (err: any) {
          console.error(`[Firestore Write Error] ${collectionName}:`, err);
          onFirestoreErrorReport(
            `Operasi database gagal pada "${collectionName}": ${err?.message || 'Periksa koneksi internet Anda.'}`
          );
          try {
            handleFirestoreError(err, OperationType.WRITE, collectionName);
          } catch {
            // Handled via error banner
          }
        }
      })();
    },
    [collectionName, onFirestoreErrorReport]
  );

  return [state, setSyncedState, stateRef];
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved !== null ? saved === 'dark' : true;
  });

  const [firestoreErrorBanner, setFirestoreErrorBanner] = useState<string | null>(null);

  const reportFirestoreError = useCallback((msg: string) => {
    setFirestoreErrorBanner(msg);
    setTimeout(() => {
      setFirestoreErrorBanner(prev => (prev === msg ? null : prev));
    }, 6000);
  }, []);

  // Realtime Firestore-backed states for all 19 collections (initial state is always `[]`)
  const [userAccounts, setUserAccounts, userAccountsRef] = useFirestoreCollectionState<UserAccount>(
    'userAccounts',
    reportFirestoreError
  );
  const [categories, setCategories, categoriesRef] = useFirestoreCollectionState<Category>(
    'categories',
    reportFirestoreError
  );
  const [warehouses, setWarehouses, warehousesRef] = useFirestoreCollectionState<Warehouse>(
    'warehouses',
    reportFirestoreError
  );
  const [products, setProducts, productsRef] = useFirestoreCollectionState<Product>(
    'products',
    reportFirestoreError
  );
  const [events, setEvents, eventsRef] = useFirestoreCollectionState<EventData>(
    'events',
    reportFirestoreError
  );
  const [clients, setClients, clientsRef] = useFirestoreCollectionState<Client>(
    'clients',
    reportFirestoreError
  );
  const [crew, setCrew, crewRef] = useFirestoreCollectionState<CrewMember>(
    'crew',
    reportFirestoreError
  );
  const [vehicles, setVehicles, vehiclesRef] = useFirestoreCollectionState<Vehicle>(
    'vehicles',
    reportFirestoreError
  );
  const [checkouts, setCheckouts] = useFirestoreCollectionState<CheckoutRecord>(
    'checkouts',
    reportFirestoreError
  );
  const [checkins, setCheckins] = useFirestoreCollectionState<CheckinRecord>(
    'checkins',
    reportFirestoreError
  );
  const [damageReports, setDamageReports, damageReportsRef] = useFirestoreCollectionState<DamageReport>(
    'damageReports',
    reportFirestoreError
  );
  const [maintenanceRecords, setMaintenanceRecords, maintenanceRecordsRef] = useFirestoreCollectionState<MaintenanceRecord>(
    'maintenanceRecords',
    reportFirestoreError
  );
  const [transfers, setTransfers, transfersRef] = useFirestoreCollectionState<TransferRecord>(
    'transfers',
    reportFirestoreError
  );
  const [borrowings, setBorrowings, borrowingsRef] = useFirestoreCollectionState<BorrowingRecord>(
    'borrowings',
    reportFirestoreError
  );
  const [stockOpnames, setStockOpnames] = useFirestoreCollectionState<StockOpnameSession>(
    'stockOpnames',
    reportFirestoreError
  );
  const [auditLogs, setAuditLogs] = useFirestoreCollectionState<AuditLogItem>(
    'auditLogs',
    reportFirestoreError
  );
  const [notifications, setNotifications, notificationsRef] = useFirestoreCollectionState<NotificationItem>(
    'notifications',
    reportFirestoreError
  );
  const [ledMonthlyTargets, setLedMonthlyTargets] = useFirestoreCollectionState<MonthlyLedTarget>(
    'ledMonthlyTargets',
    reportFirestoreError,
    getLedTargetId,
    (t, id) => ({ id, month: t.month, year: t.year, targetMeters: t.targetMeters }),
    (docData) => ({ month: docData.month, year: docData.year, targetMeters: docData.targetMeters })
  );
  const [ledDeployments, setLedDeployments, ledDeploymentsRef] = useFirestoreCollectionState<LedDeploymentRecord>(
    'ledDeployments',
    reportFirestoreError
  );

  // One-time idempotent database initialization check
  useEffect(() => {
    ensureFirestoreDatabaseInitializedOnce().catch((error) => {
      console.error('Error checking Firestore initialization state:', error);
    });
  }, []);

  // Auth session state (UI session only)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        return Boolean(parsed.isLoggedIn);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.userProfile) {
          return parsed.userProfile;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  // Sync currentUser profile when userAccounts updates in Firestore
  useEffect(() => {
    if (!isAuthenticated || !currentUser.id || userAccounts.length === 0) return;
    const matched = userAccounts.find(u => u.id === currentUser.id);
    if (matched) {
      if (matched.status === 'Nonaktif') {
        setIsAuthenticated(false);
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ isLoggedIn: false, userId: '' }));
        return;
      }
      const nextProfile: UserProfile = {
        id: matched.id,
        username: matched.username,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        division: matched.division,
        phone: matched.phone
      };
      if (
        nextProfile.name !== currentUser.name ||
        nextProfile.role !== currentUser.role ||
        nextProfile.division !== currentUser.division ||
        nextProfile.email !== currentUser.email ||
        nextProfile.phone !== currentUser.phone ||
        nextProfile.username !== currentUser.username
      ) {
        setCurrentUser(nextProfile);
        localStorage.setItem(
          AUTH_SESSION_KEY,
          JSON.stringify({ isLoggedIn: true, userId: nextProfile.id, userProfile: nextProfile })
        );
      }
    }
  }, [userAccounts, isAuthenticated, currentUser]);

  // Listen to Firebase Auth state changes (for Google Auth integration)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email && userAccounts.length > 0) {
        const emailLower = firebaseUser.email.toLowerCase();
        const existingAcc = userAccounts.find(u => u.email.toLowerCase() === emailLower);
        if (existingAcc) {
          const profile: UserProfile = {
            id: existingAcc.id,
            username: existingAcc.username,
            name: existingAcc.name,
            email: existingAcc.email,
            role: existingAcc.role,
            division: existingAcc.division,
            phone: existingAcc.phone
          };
          setCurrentUser(profile);
          setIsAuthenticated(true);
          localStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({ isLoggedIn: true, userId: existingAcc.id, userProfile: profile })
          );
        }
      }
    });
    return () => unsubscribe();
  }, [userAccounts]);

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Core Awaited Firestore CRUD Helpers (waits for Firestore server before considering operation complete)
  const persistDocToFirestore = useCallback(
    async (
      col: string,
      id: string,
      data: any,
      opType: OperationType = OperationType.WRITE,
      onSuccess?: () => void
    ): Promise<boolean> => {
      try {
        const docRef = doc(db, col, id);
        const cleanData = sanitizeForFirestore({ ...data, id });
        await setDoc(docRef, cleanData);
        if (onSuccess) onSuccess();
        return true;
      } catch (error: any) {
        console.error(`[Firestore ${opType} Failed] ${col}/${id}:`, error);
        reportFirestoreError(
          `Gagal menyimpan perubahan ke database (${col}/${id}): ${error?.message || 'Terjadi kesalahan koneksi/izin.'}`
        );
        try {
          handleFirestoreError(error, opType, `${col}/${id}`);
        } catch {
          // Handled via UI banner
        }
        return false;
      }
    },
    [reportFirestoreError]
  );

  const deleteDocFromFirestore = useCallback(
    async (col: string, id: string, onSuccess?: () => void): Promise<boolean> => {
      try {
        const docRef = doc(db, col, id);
        await deleteDoc(docRef);
        // Verify on server that document is genuinely deleted
        try {
          const checkSnap = await getDocFromServer(docRef);
          if (checkSnap.exists()) {
            throw new Error('Dokumen gagal dihapus dari server Firestore.');
          }
        } catch (verifyErr: any) {
          if (verifyErr?.message === 'Dokumen gagal dihapus dari server Firestore.') {
            throw verifyErr;
          }
        }
        if (onSuccess) onSuccess();
        return true;
      } catch (error: any) {
        console.error(`[Firestore DELETE Failed] ${col}/${id}:`, error);
        reportFirestoreError(
          `Gagal menghapus data dari database (${col}/${id}): ${error?.message || 'Terjadi kesalahan koneksi/izin.'}`
        );
        try {
          handleFirestoreError(error, OperationType.DELETE, `${col}/${id}`);
        } catch {
          // Handled via UI banner
        }
        return false;
      }
    },
    [reportFirestoreError]
  );

  const executeBatchInFirestore = useCallback(
    async (ops: FirestoreBatchOp[], onSuccess?: () => void): Promise<boolean> => {
      try {
        await commitOperationsInChunks(ops);
        // Verify any deleted documents in the batch are genuinely gone on the server
        const deleteOps = ops.filter(op => op.type === 'delete');
        for (const delOp of deleteOps) {
          try {
            const checkSnap = await getDocFromServer(doc(db, delOp.col, delOp.id));
            if (checkSnap.exists()) {
              throw new Error(`Dokumen ${delOp.col}/${delOp.id} gagal dihapus dari server Firestore.`);
            }
          } catch (verifyErr: any) {
            if (verifyErr?.message?.includes('gagal dihapus dari server Firestore')) {
              throw verifyErr;
            }
          }
        }
        if (onSuccess) onSuccess();
        return true;
      } catch (error: any) {
        console.error('[Firestore Batch Operation Failed]:', error);
        reportFirestoreError(
          `Operasi database gagal disimpan ke Cloud Firestore: ${error?.message || 'Periksa jaringan Anda.'}`
        );
        return false;
      }
    },
    [reportFirestoreError]
  );

  const logAudit = useCallback(
    (
      action: string,
      category: AuditLogItem['category'],
      description: string,
      entityId?: string,
      entityType?: string
    ) => {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString('id-ID'),
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        category,
        description,
        entityId,
        entityType
      };
      void persistDocToFirestore('auditLogs', newLog.id, newLog, OperationType.CREATE);
    },
    [currentUser.name, currentUser.role, persistDocToFirestore]
  );

  const addNotification = useCallback(
    (
      title: string,
      message: string,
      type: NotificationItem['type'],
      linkTab?: string,
      linkId?: string
    ) => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        message,
        type,
        timestamp: 'Baru saja',
        read: false,
        linkTab,
        linkId
      };
      void persistDocToFirestore('notifications', newNotif.id, newNotif, OperationType.CREATE);
    },
    [persistDocToFirestore]
  );

  const setCurrentUserRole = (role: UserRole) => {
    const roleTitles: Record<UserRole, { name: string; division: string }> = {
      SUPER_ADMIN: { name: 'Bambang Sudiro', division: 'Direksi & Super Administrator' },
      ADMIN: { name: 'Siti Nurhaliza', division: 'Administrasi Operasional' },
      WAREHOUSE: { name: 'Agus Setiawan', division: 'Gudang & Logistik' },
      PROJECT_MANAGER: { name: 'Andi Saputra', division: 'Project Management' },
      CREW: { name: 'Reza Fauzi', division: 'Sound & Show Crew' },
      TEKNISI: { name: 'Feri Irawan', division: 'Teknisi & Maintenance' },
      VIEWER: { name: 'Tamu / Observer', division: 'Public Viewer' }
    };
    setCurrentUser(prev => ({
      ...prev,
      role,
      name: roleTitles[role]?.name || prev.name,
      division: roleTitles[role]?.division || prev.division
    }));
    logAudit('ROLE_CHANGE', 'SYSTEM', `Beralih ke role pengguna: ${role}`);
  };

  // Auth & User Management methods
  const login = (usernameInput: string, passwordInput: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const activeList = userAccountsRef.current.length > 0 ? userAccountsRef.current : INITIAL_USER_ACCOUNTS;
    const account = activeList.find(
      u => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    if (!account) {
      return { success: false, message: 'Username atau email tidak terdaftar.' };
    }

    if (account.status === 'Nonaktif') {
      return { success: false, message: 'Akun Anda dinonaktifkan oleh administrator. Silakan hubungi admin.' };
    }

    if (account.password !== passwordInput) {
      return { success: false, message: 'Kata sandi / password salah. Silakan coba kembali.' };
    }

    const updatedAccount: UserAccount = {
      ...account,
      lastLogin: new Date().toLocaleString('id-ID')
    };
    if (userAccountsRef.current.some(u => u.id === account.id)) {
      void persistDocToFirestore('userAccounts', account.id, updatedAccount, OperationType.UPDATE);
    }

    const userProfile: UserProfile = {
      id: account.id,
      username: account.username,
      name: account.name,
      email: account.email,
      role: account.role,
      division: account.division,
      phone: account.phone
    };

    setCurrentUser(userProfile);
    setIsAuthenticated(true);
    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ isLoggedIn: true, userId: account.id, userProfile })
    );

    logAudit('LOGIN', 'SYSTEM', `Pengguna ${account.name} (${account.username}) berhasil masuk.`);
    addNotification('Login Berhasil', `Selamat datang kembali, ${account.name}!`, 'INFO');

    return { success: true, message: `Selamat datang kembali, ${account.name}!`, user: updatedAccount };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const cred = await signInWithGooglePopup();
      const fbUser = cred.user;
      const email = fbUser.email || '';
      const cleanEmail = email.toLowerCase();

      let account = userAccountsRef.current.find(u => u.email.toLowerCase() === cleanEmail);
      const nowStr = new Date().toLocaleString('id-ID');

      if (!account) {
        const safeId = `usr-google-${fbUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}`;
        const usernameFromEmail = (email.split('@')[0] || 'google_user')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .toLowerCase();
        const role: UserRole =
          cleanEmail === 'gading.artha21@smk.belajar.id' ? 'SUPER_ADMIN' : 'ADMIN';

        account = {
          id: safeId,
          username: usernameFromEmail,
          password: 'google-oauth-account',
          name: fbUser.displayName || usernameFromEmail,
          email: email,
          role,
          division: role === 'SUPER_ADMIN' ? 'Direksi & Super Administrator' : 'Operasional GL PRO',
          phone: fbUser.phoneNumber || '-',
          status: 'Aktif',
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: nowStr
        };
        const ok = await persistDocToFirestore('userAccounts', account.id, account, OperationType.CREATE);
        if (!ok) {
          return { success: false, message: 'Gagal menyimpan akun Google ke Cloud Firestore.' };
        }
      } else {
        if (account.status === 'Nonaktif') {
          return { success: false, message: 'Akun Anda dinonaktifkan oleh administrator.' };
        }
        const updatedAcc: UserAccount = { ...account, lastLogin: nowStr };
        account = updatedAcc;
        await persistDocToFirestore('userAccounts', updatedAcc.id, updatedAcc, OperationType.UPDATE);
      }

      const userProfile: UserProfile = {
        id: account.id,
        username: account.username,
        name: account.name,
        email: account.email,
        role: account.role,
        division: account.division,
        phone: account.phone
      };

      setCurrentUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({ isLoggedIn: true, userId: account.id, userProfile })
      );

      logAudit('LOGIN_GOOGLE', 'SYSTEM', `Pengguna ${account.name} (${account.email}) masuk via Google Auth.`);
      addNotification('Login Berhasil', `Selamat datang kembali, ${account.name}!`, 'INFO');

      return { success: true, message: `Selamat datang, ${account.name}!` };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Gagal melakukan autentikasi Google.'
      };
    }
  };

  const logout = () => {
    logAudit('LOGOUT', 'SYSTEM', `Pengguna ${currentUser.name} (${currentUser.username || 'user'}) keluar dari sistem.`);
    setIsAuthenticated(false);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ isLoggedIn: false, userId: '' }));
    signOut(auth).catch(() => {});
  };

  const changePassword = (userId: string, oldPassword: string, newPassword: string, isAdminBypass = false) => {
    const target = userAccountsRef.current.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    if (!isAdminBypass && target.password !== oldPassword) {
      return { success: false, message: 'Password lama tidak sesuai. Silakan masukkan password saat ini dengan benar.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Password baru minimal 4 karakter.' };
    }

    const updated: UserAccount = { ...target, password: newPassword };
    void persistDocToFirestore('userAccounts', userId, updated, OperationType.UPDATE, () => {
      logAudit('PASSWORD_CHANGE', 'SYSTEM', `Password akun ${target.username} (${target.name}) diperbarui.`);
      addNotification('Password Berhasil Diubah', `Kata sandi untuk akun ${target.username} telah diperbarui.`, 'SUCCESS');
    });

    return { success: true, message: 'Password berhasil diubah!' };
  };

  const addUserAccount = (newAcc: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const cleanUser = newAcc.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }
    if (userAccountsRef.current.some(u => u.username.toLowerCase() === cleanUser)) {
      return { success: false, message: `Username "${newAcc.username}" sudah digunakan oleh akun lain.` };
    }
    if (newAcc.email && userAccountsRef.current.some(u => u.email.toLowerCase() === newAcc.email.toLowerCase())) {
      return { success: false, message: `Email "${newAcc.email}" sudah terdaftar.` };
    }
    if (!newAcc.password || newAcc.password.length < 4) {
      return { success: false, message: 'Password akun minimal 4 karakter.' };
    }

    const created: UserAccount = {
      ...newAcc,
      id: `usr-${Date.now()}`,
      username: newAcc.username.trim(),
      email: newAcc.email?.trim() || '',
      phone: newAcc.phone?.trim() || '-',
      division: newAcc.division?.trim() || 'Operasional',
      createdAt: new Date().toISOString().split('T')[0]
    };

    void persistDocToFirestore('userAccounts', created.id, created, OperationType.CREATE, () => {
      logAudit('CREATE_USER', 'SYSTEM', `Akun baru "${created.username}" (${created.name} - ${created.role}) didaftarkan.`);
      addNotification('Pengguna Dibuat', `Akun baru "${created.name}" berhasil ditambahkan.`, 'SUCCESS');
    });

    return { success: true, message: `Akun "${created.username}" berhasil dibuat.` };
  };

  const updateUserAccount = (id: string, updates: Partial<UserAccount>) => {
    const existing = userAccountsRef.current.find(u => u.id === id);
    if (!existing) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    if (updates.username && updates.username.toLowerCase() !== existing.username.toLowerCase()) {
      const isTaken = userAccountsRef.current.some(
        u => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
      );
      if (isTaken) {
        return { success: false, message: `Username "${updates.username}" sudah digunakan oleh akun lain.` };
      }
    }

    const updated: UserAccount = { ...existing, ...updates, id };
    void persistDocToFirestore('userAccounts', id, updated, OperationType.UPDATE, () => {
      if (currentUser.id === id) {
        const updatedProfile: UserProfile = {
          ...currentUser,
          name: updated.name,
          role: updated.role,
          division: updated.division,
          phone: updated.phone,
          email: updated.email,
          username: updated.username
        };
        setCurrentUser(updatedProfile);
        localStorage.setItem(
          AUTH_SESSION_KEY,
          JSON.stringify({ isLoggedIn: true, userId: id, userProfile: updatedProfile })
        );
      }
      logAudit('UPDATE_USER', 'SYSTEM', `Data akun ${existing.username} (${existing.name}) diperbarui.`);
    });

    return { success: true, message: 'Data akun berhasil diperbarui.' };
  };

  const deleteUserAccount = (id: string) => {
    if (currentUser.id === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan!' };
    }
    if (userAccountsRef.current.length <= 1) {
      return { success: false, message: 'Minimal harus ada 1 akun aktif tersisa di sistem.' };
    }

    const target = userAccountsRef.current.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    void deleteDocFromFirestore('userAccounts', id, () => {
      logAudit('DELETE_USER', 'SYSTEM', `Akun "${target.username}" (${target.name}) dihapus dari sistem.`);
      addNotification('Akun Dihapus', `Akun ${target.name} telah dihapus.`, 'WARNING');
    });

    return { success: true, message: 'Akun berhasil dihapus.' };
  };

  // --- LED Monthly Target & Deployment Tracking ---
  const updateLedMonthlyTarget = (month: number, year: number, targetMeters: number) => {
    const targetObj: MonthlyLedTarget = { month, year, targetMeters };
    const id = getLedTargetId(targetObj);
    void persistDocToFirestore(
      'ledMonthlyTargets',
      id,
      { id, month, year, targetMeters },
      OperationType.WRITE,
      () => {
        logAudit('LED_TARGET_UPDATE', 'SYSTEM', `Target bulanan LED bulan ${month}/${year} disetel ke ${targetMeters} m².`);
      }
    );
  };

  const addLedDeployment = (record: Omit<LedDeploymentRecord, 'id'>): LedDeploymentRecord => {
    const newRecord: LedDeploymentRecord = {
      ...record,
      id: `led-dep-${Date.now()}`
    };
    void persistDocToFirestore('ledDeployments', newRecord.id, newRecord, OperationType.CREATE, () => {
      logAudit('LED_DEPLOYMENT', 'EVENT', `Pencatatan pengeluaran LED ${newRecord.totalSquareMeters} m² untuk event "${newRecord.eventName}".`);
      addNotification('Pencatatan LED Keluar', `${newRecord.totalSquareMeters} m² LED tercatat keluar untuk "${newRecord.eventName}".`, 'SUCCESS');
    });
    return newRecord;
  };

  const updateLedDeployment = (record: LedDeploymentRecord) => {
    void persistDocToFirestore('ledDeployments', record.id, record, OperationType.UPDATE, () => {
      logAudit('LED_DEPLOYMENT_UPDATE', 'EVENT', `Pembaruan data pengeluaran LED ${record.totalSquareMeters} m² untuk event "${record.eventName}".`);
      addNotification('Perubahan Data LED', `Catatan pengeluaran LED "${record.eventName}" berhasil diperbarui.`, 'SUCCESS');
    });
  };

  const deleteLedDeployment = (id: string) => {
    const target = ledDeploymentsRef.current.find(d => d.id === id);
    void deleteDocFromFirestore('ledDeployments', id, () => {
      if (target) {
        logAudit('LED_DEPLOYMENT_DELETE', 'EVENT', `Data pengeluaran LED event "${target.eventName}" (${target.totalSquareMeters} m²) dihapus.`);
      }
    });
  };

  // Offline actions queue & sync
  const syncOfflineData = () => {
    if (offlineQueue.length === 0) return;
    const count = offlineQueue.length;
    setOfflineQueue([]);
    setIsOffline(false);
    addNotification('Sinkronisasi Sukses', `${count} transaksi offline berhasil disinkronkan ke database server pusat.`, 'SUCCESS');
    logAudit('OFFLINE_SYNC', 'SYSTEM', `Menyinkronkan ${count} transaksi offline yang tertunda ke server.`);
  };

  // --- Product Methods ---
  const addProduct = (p: Partial<Product>): Product => {
    const count = productsRef.current.length + 1;
    const catCode = p.category ? p.category.slice(0, 3).toUpperCase() : 'EQP';
    const newCode = p.code || `INV-${catCode}-${String(count).padStart(4, '0')}`;
    const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const total = p.totalQty || 1;
    
    const newProduct: Product = {
      id: newId,
      code: newCode,
      name: p.name || 'Peralatan Baru',
      alias: p.alias || '',
      category: p.category || 'AUDIO',
      subcategory: p.subcategory || 'General',
      brand: p.brand || 'Universal',
      model: p.model || 'Model Standard',
      isIndividual: p.isIndividual ?? false,
      serialNumber: p.serialNumber,
      unit: p.unit || 'unit',
      totalQty: total,
      availableQty: total,
      reservedQty: 0,
      inUseQty: 0,
      inTransitQty: 0,
      inMaintenanceQty: 0,
      damagedQty: 0,
      lostQty: 0,
      minQty: p.minQty ?? 1,
      warehouseId: p.warehouseId || 'wh-utama',
      area: p.area || 'Area Penyimpanan Umum',
      rack: p.rack || 'Rak 01',
      shelf: p.shelf || 'Shelf 01',
      box: p.box,
      status: 'AVAILABLE',
      condition: p.condition || 'Baik',
      procurementYear: p.procurementYear || new Date().getFullYear(),
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      barcode: `BC-${newCode}`,
      qrCode: `QR-${newCode}`,
      notes: p.notes,
      units: p.isIndividual ? Array.from({ length: total }).map((_, idx) => ({
        id: `u-${newId}-${idx + 1}`,
        productId: newId,
        unitCode: `${newCode.replace('INV-', '')}-${String(idx + 1).padStart(2, '0')}`,
        serialNumber: p.serialNumber ? `${p.serialNumber}-${idx + 1}` : `SN-${newCode}-${idx + 1}`,
        barcode: `BC-${newCode}-${idx + 1}`,
        qrCode: `QR-${newCode}-${idx + 1}`,
        condition: p.condition || 'Baik',
        status: 'AVAILABLE',
        warehouseId: p.warehouseId || 'wh-utama',
        locationDetails: `${p.rack || 'Rak 01'} ${p.shelf || 'Shelf 01'}`
      })) : undefined
    };

    void persistDocToFirestore('products', newProduct.id, newProduct, OperationType.CREATE, () => {
      logAudit('CREATE_PRODUCT', 'INVENTORY', `Menambahkan master barang baru: ${newProduct.name} (${newProduct.code}) dengan jumlah ${newProduct.totalQty} ${newProduct.unit}.`, newProduct.id, 'Product');
    });
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const existing = productsRef.current.find(p => p.id === id);
    if (!existing) return;

    const updated: Product = { ...existing, ...updates, id };
    if (
      'totalQty' in updates ||
      'reservedQty' in updates ||
      'inUseQty' in updates ||
      'inTransitQty' in updates ||
      'inMaintenanceQty' in updates ||
      'damagedQty' in updates ||
      'lostQty' in updates
    ) {
      const unavailable =
        (updated.reservedQty || 0) +
        (updated.inUseQty || 0) +
        (updated.inTransitQty || 0) +
        (updated.inMaintenanceQty || 0) +
        (updated.damagedQty || 0) +
        (updated.lostQty || 0);
      updated.availableQty = Math.max(0, updated.totalQty - unavailable);
    }

    void persistDocToFirestore('products', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_PRODUCT', 'INVENTORY', `Memperbarui data inventaris barang ID ${id}.`, id, 'Product');
    });
  };

  const deleteProduct = (id: string) => {
    const item = productsRef.current.find(p => p.id === id);
    if (!item) return;
    void deleteDocFromFirestore('products', id, () => {
      logAudit('DELETE_PRODUCT', 'INVENTORY', `Menghapus master barang: ${item.name} (${item.code}).`, id, 'Product');
    });
  };

  // --- Event Methods ---
  const addEvent = (evt: Partial<EventData>): EventData => {
    const count = eventsRef.current.length + 1;
    const year = new Date().getFullYear();
    const eventCode = evt.eventCode || `EVT-${year}-${String(count).padStart(4, '0')}`;
    const newId = `evt-${Date.now()}`;
    
    const newEvent: EventData = {
      id: newId,
      eventCode,
      name: evt.name || 'Event Baru',
      clientId: evt.clientId || 'cli-01',
      clientName: evt.clientName || 'Client Mandiri',
      venueName: evt.venueName || 'Venue Lokasi Event',
      venueAddress: evt.venueAddress || 'Alamat Venue',
      startDate: evt.startDate || new Date().toISOString().split('T')[0],
      endDate: evt.endDate || new Date().toISOString().split('T')[0],
      loadingTime: evt.loadingTime,
      setupTime: evt.setupTime,
      showTime: evt.showTime,
      teardownTime: evt.teardownTime,
      picEventName: evt.picEventName || currentUser.name,
      projectManagerName: evt.projectManagerName || currentUser.name,
      status: evt.status || 'Draft',
      notes: evt.notes,
      equipmentList: evt.equipmentList || [],
      checklist: evt.checklist || [
        { id: `chk-${Date.now()}-1`, title: 'Finalisasi Equipment List Tech Rider', category: 'Production', isCompleted: false },
        { id: `chk-${Date.now()}-2`, title: 'Inspeksi & Picking Peralatan Gudang', category: 'Warehouse', isCompleted: false },
        { id: `chk-${Date.now()}-3`, title: 'Penerbitan Surat Jalan Check-out', category: 'Logistik', isCompleted: false },
        { id: `chk-${Date.now()}-4`, title: 'Loading In & Setting di Venue', category: 'Rigging', isCompleted: false },
        { id: `chk-${Date.now()}-5`, title: 'Soundcheck & Rehearsal Acara', category: 'Show', isCompleted: false },
        { id: `chk-${Date.now()}-6`, title: 'Teardown & Check-in Pengembalian Gudang', category: 'Logistik', isCompleted: false }
      ],
      timeline: evt.timeline || [
        { id: `tm-${Date.now()}-1`, stage: 'H-7', title: 'Final Tech Rider & Alokasi Barang', dueDate: evt.startDate || '', isCompleted: false, description: 'Kunci daftar kebutuhan alat di sistem.' },
        { id: `tm-${Date.now()}-2`, stage: 'H-3', title: 'Picking & Uji Fungsi di Gudang', dueDate: evt.startDate || '', isCompleted: false, description: 'Staff gudang menyiapkan flight case dan kabel.' },
        { id: `tm-${Date.now()}-3`, stage: 'H-1', title: 'Loading In & Berangkat ke Venue', dueDate: evt.startDate || '', isCompleted: false, description: 'Truk box berangkat dengan surat jalan.' },
        { id: `tm-${Date.now()}-4`, stage: 'HARI H', title: 'Live Event Acara', dueDate: evt.startDate || '', isCompleted: false, description: 'Operasional multimedia, sound, lighting, dan LED.' },
        { id: `tm-${Date.now()}-5`, stage: 'H+1', title: 'Teardown & Check-in Gudang', dueDate: evt.endDate || '', isCompleted: false, description: 'Pemeriksaan barang kembali dan cek kerusakan.' }
      ],
      crewAssignments: evt.crewAssignments || []
    };

    void persistDocToFirestore('events', newEvent.id, newEvent, OperationType.CREATE, () => {
      logAudit('CREATE_EVENT', 'EVENT', `Membuat event operasional baru: ${newEvent.name} (${newEvent.eventCode}).`, newEvent.id, 'Event');
      addNotification('Event Baru Dibuat', `Event ${newEvent.name} telah didaftarkan. Segera siapkan Equipment List dan Crew Roster.`, 'INFO', 'events', newEvent.id);
    });
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<EventData>) => {
    const existing = eventsRef.current.find(e => e.id === id);
    if (!existing) return;
    const updated: EventData = { ...existing, ...updates, id };
    void persistDocToFirestore('events', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_EVENT', 'EVENT', `Memperbarui detail event ID ${id}.`, id, 'Event');
    });
  };

  const updateEventStatus = (id: string, status: EventStatus) => {
    const existing = eventsRef.current.find(e => e.id === id);
    if (!existing) return;
    const updated: EventData = { ...existing, status, id };
    void persistDocToFirestore('events', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_EVENT_STATUS', 'EVENT', `Mengubah status event ID ${id} menjadi "${status}".`, id, 'Event');
    });
  };

  const deleteEvent = (id: string): { success: boolean; message: string } => {
    const targetEvent = eventsRef.current.find(e => e.id === id);
    if (!targetEvent) return { success: false, message: 'Event tidak ditemukan.' };

    const ops: FirestoreBatchOp[] = [];
    const productReleaseMap = new Map<string, number>();

    targetEvent.equipmentList.forEach(item => {
      const unCheckedOutQty = Math.max(0, item.requestedQty - (item.checkedOutQty || 0));
      if (unCheckedOutQty > 0) {
        productReleaseMap.set(item.productId, (productReleaseMap.get(item.productId) || 0) + unCheckedOutQty);
      }
    });

    for (const [prodId, releaseQty] of productReleaseMap.entries()) {
      const prod = productsRef.current.find(p => p.id === prodId);
      if (prod) {
        const updatedProd: Product = {
          ...prod,
          reservedQty: Math.max(0, prod.reservedQty - releaseQty),
          availableQty: prod.availableQty + releaseQty
        };
        ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
      }
    }

    ops.push({ type: 'delete', col: 'events', id });

    void executeBatchInFirestore(ops, () => {
      logAudit('DELETE_EVENT', 'EVENT', `Menghapus event: ${targetEvent.name} (${targetEvent.eventCode}).`, id, 'Event');
    });

    return { success: true, message: `Event "${targetEvent.name}" berhasil dihapus / cut.` };
  };

  const reserveEquipmentForEvent = (eventId: string, productId: string, qty: number, notes?: string): { success: boolean; message: string } => {
    const product = productsRef.current.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Barang tidak ditemukan.' };

    const targetEvent = eventsRef.current.find(e => e.id === eventId);
    if (!targetEvent) return { success: false, message: 'Event tidak ditemukan.' };

    if (product.availableQty < qty) {
      return { 
        success: false, 
        message: `Jumlah barang tidak mencukupi! Stok tersedia hanya ${product.availableQty} ${product.unit}, sedangkan kebutuhan ${qty} ${product.unit}.` 
      };
    }

    const updatedProduct: Product = {
      ...product,
      reservedQty: product.reservedQty + qty,
      availableQty: Math.max(0, product.availableQty - qty)
    };

    const existingIdx = targetEvent.equipmentList.findIndex(item => item.productId === productId);
    const updatedList = [...targetEvent.equipmentList];
    if (existingIdx >= 0) {
      updatedList[existingIdx] = {
        ...updatedList[existingIdx],
        requestedQty: updatedList[existingIdx].requestedQty + qty,
        notes: notes || updatedList[existingIdx].notes
      };
    } else {
      updatedList.push({
        id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        unit: product.unit,
        requestedQty: qty,
        pickedQty: 0,
        checkedOutQty: 0,
        returnedQty: 0,
        status: 'Belum Disiapkan',
        notes
      });
    }

    const updatedEvent: EventData = { ...targetEvent, equipmentList: updatedList };

    void executeBatchInFirestore(
      [
        { type: 'set', col: 'products', id: updatedProduct.id, data: updatedProduct },
        { type: 'set', col: 'events', id: updatedEvent.id, data: updatedEvent }
      ],
      () => {
        logAudit('RESERVE_EQUIPMENT', 'EVENT', `Mereservasi ${qty} ${product.unit} ${product.name} untuk Event ID ${eventId}.`, eventId, 'Event');
      }
    );

    return { success: true, message: `Berhasil mereservasi ${qty} ${product.unit} ${product.name} untuk event.` };
  };

  const removeEquipmentFromEvent = (eventId: string, itemId: string) => {
    const targetEvent = eventsRef.current.find(e => e.id === eventId);
    if (!targetEvent) return;
    const targetItem = targetEvent.equipmentList.find(i => i.id === itemId);
    if (!targetItem) return;

    const releasedQty = Math.max(0, targetItem.requestedQty - (targetItem.checkedOutQty || 0));
    const updatedEvent: EventData = {
      ...targetEvent,
      equipmentList: targetEvent.equipmentList.filter(i => i.id !== itemId)
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'events', id: updatedEvent.id, data: updatedEvent }
    ];

    if (targetItem.productId && releasedQty > 0) {
      const prod = productsRef.current.find(p => p.id === targetItem.productId);
      if (prod) {
        const updatedProd: Product = {
          ...prod,
          reservedQty: Math.max(0, prod.reservedQty - releasedQty),
          availableQty: prod.availableQty + releasedQty
        };
        ops.push({ type: 'set', col: 'products', id: updatedProd.id, data: updatedProd });
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('REMOVE_EQUIPMENT', 'EVENT', `Menghapus kebutuhan alat ${targetItem.productName} dari Event ID ${eventId}.`, eventId, 'Event');
    });
  };

  const toggleChecklistItem = (eventId: string, checklistId: string) => {
    const targetEvent = eventsRef.current.find(e => e.id === eventId);
    if (!targetEvent) return;
    const updatedEvent: EventData = {
      ...targetEvent,
      checklist: targetEvent.checklist.map(c => (c.id === checklistId ? { ...c, isCompleted: !c.isCompleted } : c))
    };
    void persistDocToFirestore('events', eventId, updatedEvent, OperationType.UPDATE);
  };

  // --- Check-out & Surat Jalan Methods ---
  const processCheckout = (checkoutData: Omit<CheckoutRecord, 'id' | 'checkoutCode'>): CheckoutRecord => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = checkouts.length + 1;
    const checkoutCode = `OUT-${today}-${String(count).padStart(4, '0')}`;
    const newRecord: CheckoutRecord = {
      ...checkoutData,
      id: `chkout-${Date.now()}`,
      checkoutCode
    };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, { id: `off-${Date.now()}`, type: 'CHECKOUT', payload: newRecord, timestamp: new Date().toISOString() }]);
    }

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'checkouts', id: newRecord.id, data: newRecord }
    ];

    productsRef.current.forEach(p => {
      const match = checkoutData.items.find(item => item.productId === p.id);
      if (match) {
        const qtyToOut = match.qty;
        const updatedProd: Product = {
          ...p,
          reservedQty: Math.max(0, p.reservedQty - qtyToOut),
          inUseQty: p.inUseQty + qtyToOut,
          status: 'IN_USE'
        };
        ops.push({ type: 'set', col: 'products', id: p.id, data: updatedProd });
      }
    });

    const targetEvent = eventsRef.current.find(e => e.id === checkoutData.eventId);
    if (targetEvent) {
      const updatedList = targetEvent.equipmentList.map(eq => {
        const match = checkoutData.items.find(ci => ci.productId === eq.productId);
        if (match) {
          return {
            ...eq,
            checkedOutQty: (eq.checkedOutQty || 0) + match.qty,
            status: 'Di Event' as const
          };
        }
        return eq;
      });
      const updatedEvent: EventData = {
        ...targetEvent,
        status: 'Loading' as const,
        equipmentList: updatedList,
        checkoutIds: [...(targetEvent.checkoutIds || []), newRecord.id],
        suratJalanIds: [...(targetEvent.suratJalanIds || []), newRecord.suratJalanNumber]
      };
      ops.push({ type: 'set', col: 'events', id: targetEvent.id, data: updatedEvent });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('PROCESS_CHECKOUT', 'CHECKOUT', `Check-out peralatan untuk ${checkoutData.eventName} via Surat Jalan ${checkoutData.suratJalanNumber}. Driver: ${checkoutData.driverName}.`, newRecord.id, 'CheckoutRecord');
      addNotification('Check-out Berhasil', `Surat Jalan ${checkoutData.suratJalanNumber} diterbitkan. Peralatan sedang bergerak ke lokasi acara.`, 'SUCCESS', 'checkout');
    });

    return newRecord;
  };

  // --- Check-in & Rekonsiliasi Pengembalian Methods ---
  const processCheckin = (checkinData: Omit<CheckinRecord, 'id' | 'checkinCode'>): CheckinRecord => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = checkins.length + 1;
    const checkinCode = `IN-${today}-${String(count).padStart(4, '0')}`;
    const newRecord: CheckinRecord = {
      ...checkinData,
      id: `chkin-${Date.now()}`,
      checkinCode
    };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, { id: `off-${Date.now()}`, type: 'CHECKIN', payload: newRecord, timestamp: new Date().toISOString() }]);
    }

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'checkins', id: newRecord.id, data: newRecord }
    ];

    productsRef.current.forEach(p => {
      const match = checkinData.items.find(item => item.productId === p.id);
      if (match) {
        const returnedGood = match.conditionAfter === 'Rusak Berat' || match.conditionAfter === 'Rusak Ringan' ? 0 : match.returnedQty;
        const damagedCount = match.conditionAfter === 'Rusak Berat' || match.conditionAfter === 'Rusak Ringan' ? match.returnedQty : 0;
        const missingCount = Math.max(0, match.differenceQty);

        const newInUse = Math.max(0, p.inUseQty - match.outQty);
        const newAvailable = p.availableQty + returnedGood;
        const newDamaged = p.damagedQty + damagedCount;
        const newLost = p.lostQty + missingCount;

        const updatedProd: Product = {
          ...p,
          inUseQty: newInUse,
          availableQty: newAvailable,
          damagedQty: newDamaged,
          lostQty: newLost,
          status: newAvailable > 0 ? 'AVAILABLE' : p.status
        };
        ops.push({ type: 'set', col: 'products', id: p.id, data: updatedProd });
      }
    });

    const targetEvent = eventsRef.current.find(e => e.id === checkinData.eventId);
    if (targetEvent) {
      const updatedList = targetEvent.equipmentList.map(eq => {
        const match = checkinData.items.find(ci => ci.productId === eq.productId);
        if (match) {
          return {
            ...eq,
            returnedQty: (eq.returnedQty || 0) + match.returnedQty,
            status: match.returnedQty >= eq.checkedOutQty ? ('Dikembalikan' as const) : ('Kurang' as const)
          };
        }
        return eq;
      });

      const allReturned = updatedList.every(eq => eq.returnedQty >= eq.checkedOutQty);
      const updatedEvent: EventData = {
        ...targetEvent,
        status: allReturned ? ('Selesai' as const) : ('Pengembalian' as const),
        equipmentList: updatedList,
        checkinIds: [...(targetEvent.checkinIds || []), newRecord.id]
      };
      ops.push({ type: 'set', col: 'events', id: targetEvent.id, data: updatedEvent });
    }

    const createdDamageReports: DamageReport[] = [];
    checkinData.items.forEach((item, idx) => {
      if (item.isDamaged || item.conditionAfter === 'Rusak Ringan' || item.conditionAfter === 'Rusak Berat') {
        const reportCount = damageReportsRef.current.length + idx + 1;
        const dmgCode = `DMG-${today}-${String(reportCount).padStart(4, '0')}`;
        const autoDamage: DamageReport = {
          id: `dmg-${Date.now()}-${item.productId}`,
          damageCode: dmgCode,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          eventId: checkinData.eventId,
          eventName: checkinData.eventName,
          picName: checkinData.inspectorName,
          inspectorName: checkinData.inspectorName,
          damageType: 'Body Penyok',
          severity: item.conditionAfter === 'Rusak Berat' ? 'Rusak Berat' : 'Rusak Ringan',
          description: item.damageNotes || `Kerusakan ditemukan saat inspeksi check-in pengembalian event ${checkinData.eventName}.`,
          photoUrl: item.inspectionPhotoUrl,
          reportDate: new Date().toISOString().split('T')[0],
          status: 'Dilaporkan'
        };
        createdDamageReports.push(autoDamage);
        ops.push({ type: 'set', col: 'damageReports', id: autoDamage.id, data: autoDamage });
      }
    });

    void executeBatchInFirestore(ops, () => {
      createdDamageReports.forEach(autoDamage => {
        logAudit('AUTO_DAMAGE_REPORT', 'DAMAGE', `Laporan kerusakan otomatis dibuat: ${autoDamage.damageCode} untuk ${autoDamage.productName}.`, autoDamage.id, 'DamageReport');
      });
      logAudit('PROCESS_CHECKIN', 'CHECKIN', `Check-in peralatan dari ${checkinData.eventName}. Selisih barang: ${checkinData.hasDiscrepancy ? 'ADA SELISIH BELUM KEMBALI' : 'Lengkap Sesuai'}.`, newRecord.id, 'CheckinRecord');

      if (checkinData.hasDiscrepancy) {
        addNotification('PERINGATAN SELISIH BARANG!', `Check-in event ${checkinData.eventName} mendeteksi barang belum lengkap kembali ke gudang!`, 'ALERT', 'checkin');
      } else {
        addNotification('Check-in Selesai', `Peralatan dari event ${checkinData.eventName} telah lengkap kembali ke gudang dan diinspeksi.`, 'SUCCESS', 'checkin');
      }
    });

    return newRecord;
  };

  // --- Damage Report Methods ---
  const reportDamage = (report: Omit<DamageReport, 'id' | 'damageCode'>): DamageReport => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = damageReportsRef.current.length + 1;
    const damageCode = `DMG-${today}-${String(count).padStart(4, '0')}`;
    const newDamage: DamageReport = {
      ...report,
      id: `dmg-${Date.now()}`,
      damageCode
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'damageReports', id: newDamage.id, data: newDamage }
    ];

    const prod = productsRef.current.find(p => p.id === report.productId);
    if (prod) {
      const updatedProd: Product = {
        ...prod,
        damagedQty: prod.damagedQty + 1,
        availableQty: Math.max(0, prod.availableQty - 1),
        condition: report.severity,
        status: 'DAMAGED'
      };
      ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('REPORT_DAMAGE', 'DAMAGE', `Laporan kerusakan ${damageCode}: ${report.productName} (${report.damageType} - ${report.severity}).`, newDamage.id, 'DamageReport');
      addNotification('Laporan Kerusakan Masuk', `${report.productName} dilaporkan rusak (${report.damageType}). Segera dijadwalkan servis teknisi.`, 'WARNING', 'inspection');
    });

    return newDamage;
  };

  const updateDamageStatus = (id: string, status: DamageReport['status'], techNotes?: string) => {
    const existing = damageReportsRef.current.find(d => d.id === id);
    if (!existing) return;

    const updatedDmg: DamageReport = {
      ...existing,
      status,
      technicianNotes: techNotes || existing.technicianNotes
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'damageReports', id: updatedDmg.id, data: updatedDmg }
    ];

    if (status === 'Selesai' && existing.status !== 'Selesai') {
      const prod = productsRef.current.find(p => p.id === existing.productId);
      if (prod) {
        const updatedProd: Product = {
          ...prod,
          damagedQty: Math.max(0, prod.damagedQty - 1),
          availableQty: prod.availableQty + 1,
          condition: 'Baik',
          status: 'AVAILABLE'
        };
        ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_DAMAGE_STATUS', 'DAMAGE', `Status laporan kerusakan ID ${id} diubah menjadi "${status}".`, id, 'DamageReport');
    });
  };

  const updateDamageReport = (id: string, updates: Partial<DamageReport>) => {
    const oldReport = damageReportsRef.current.find(d => d.id === id);
    if (!oldReport) return;

    const updatedReport: DamageReport = {
      ...oldReport,
      ...updates,
      id
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'damageReports', id, data: updatedReport }
    ];

    if (updates.status) {
      const prevStatus = oldReport.status;
      const nextStatus = updates.status;
      const prodId = updates.productId || oldReport.productId;
      const prod = productsRef.current.find(p => p.id === prodId);

      if (prod) {
        if (nextStatus === 'Selesai' && prevStatus !== 'Selesai') {
          const updatedProd: Product = {
            ...prod,
            damagedQty: Math.max(0, prod.damagedQty - 1),
            availableQty: prod.availableQty + 1,
            condition: 'Baik',
            status: 'AVAILABLE'
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        } else if (prevStatus === 'Selesai' && nextStatus !== 'Selesai') {
          const updatedProd: Product = {
            ...prod,
            damagedQty: prod.damagedQty + 1,
            availableQty: Math.max(0, prod.availableQty - 1),
            condition: updates.severity || oldReport.severity || 'Rusak Ringan',
            status: 'DAMAGED'
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        }
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_DAMAGE', 'DAMAGE', `Laporan kerusakan ${oldReport.damageCode || id} berhasil diperbarui.`, id, 'DamageReport');
      addNotification('Laporan Kerusakan Diperbarui', `Data kerusakan ${oldReport.damageCode || ''} berhasil diperbarui.`, 'INFO', 'inspection');
    });
  };

  const deleteDamageReport = (id: string) => {
    const reportToDelete = damageReportsRef.current.find(d => d.id === id);
    if (!reportToDelete) return;

    const ops: FirestoreBatchOp[] = [
      { type: 'delete', col: 'damageReports', id }
    ];

    if (reportToDelete.status !== 'Selesai') {
      const prod = productsRef.current.find(p => p.id === reportToDelete.productId);
      if (prod) {
        const newDamagedQty = Math.max(0, prod.damagedQty - 1);
        const updatedProd: Product = {
          ...prod,
          damagedQty: newDamagedQty,
          availableQty: prod.availableQty + 1,
          condition: newDamagedQty === 0 ? 'Baik' : prod.condition,
          status: newDamagedQty === 0 ? 'AVAILABLE' : prod.status
        };
        ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('DELETE_DAMAGE', 'DAMAGE', `Laporan kerusakan ${reportToDelete.damageCode} (${reportToDelete.productName}) dihapus.`, id, 'DamageReport');
      addNotification('Laporan Kerusakan Dihapus', `Laporan ${reportToDelete.damageCode} berhasil dihapus dari sistem.`, 'INFO', 'inspection');
    });
  };

  // --- Maintenance Methods ---
  const addMaintenance = (record: Omit<MaintenanceRecord, 'id' | 'maintenanceCode'>): MaintenanceRecord => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = maintenanceRecordsRef.current.length + 1;
    const maintenanceCode = `MNT-${today}-${String(count).padStart(4, '0')}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `mnt-${Date.now()}`,
      maintenanceCode
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'maintenanceRecords', id: newRecord.id, data: newRecord }
    ];

    const prod = productsRef.current.find(p => p.id === record.productId);
    if (prod) {
      const updatedProd: Product = {
        ...prod,
        inMaintenanceQty: prod.inMaintenanceQty + 1,
        availableQty: Math.max(0, prod.availableQty - 1),
        status: 'MAINTENANCE'
      };
      ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('SCHEDULE_MAINTENANCE', 'MAINTENANCE', `Menjadwalkan maintenance ${maintenanceCode} untuk ${record.productName} oleh ${record.technicianName}.`, newRecord.id, 'MaintenanceRecord');
    });

    return newRecord;
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceRecord['status'], conditionAfter?: ItemCondition) => {
    updateMaintenanceRecord(id, { 
      status, 
      ...(conditionAfter ? { conditionAfter } : {})
    });
  };

  const updateMaintenanceRecord = (id: string, updates: Partial<MaintenanceRecord>) => {
    const oldRecord = maintenanceRecordsRef.current.find(m => m.id === id);
    if (!oldRecord) return;

    const updatedMnt: MaintenanceRecord = {
      ...oldRecord,
      ...updates,
      id,
      completionDate: updates.status === 'Selesai'
        ? (updates.completionDate || oldRecord.completionDate || new Date().toISOString().split('T')[0])
        : (updates.status ? undefined : (updates.completionDate !== undefined ? updates.completionDate : oldRecord.completionDate))
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'maintenanceRecords', id, data: updatedMnt }
    ];

    const prevStatus = oldRecord.status;
    const nextStatus = updates.status || prevStatus;
    const prevProductId = oldRecord.productId;
    const nextProductId = updates.productId || prevProductId;

    const wasActive = prevStatus === 'Segera Dilakukan' || prevStatus === 'Dalam Proses';
    const isActive = nextStatus === 'Segera Dilakukan' || nextStatus === 'Dalam Proses';

    if (prevProductId === nextProductId) {
      const prod = productsRef.current.find(p => p.id === nextProductId);
      if (prod) {
        if (wasActive && !isActive) {
          const newMntQty = Math.max(0, prod.inMaintenanceQty - 1);
          const updatedProd: Product = {
            ...prod,
            inMaintenanceQty: newMntQty,
            availableQty: prod.availableQty + 1,
            condition: nextStatus === 'Selesai' ? (updates.conditionAfter || oldRecord.conditionAfter || 'Sangat Baik') : prod.condition,
            status: newMntQty === 0 && prod.status === 'MAINTENANCE' ? 'AVAILABLE' : prod.status
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        } else if (!wasActive && isActive) {
          const updatedProd: Product = {
            ...prod,
            inMaintenanceQty: prod.inMaintenanceQty + 1,
            availableQty: Math.max(0, prod.availableQty - 1),
            condition: updates.conditionBefore || oldRecord.conditionBefore || prod.condition,
            status: 'MAINTENANCE'
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        } else if (nextStatus === 'Selesai' && updates.conditionAfter) {
          const updatedProd: Product = {
            ...prod,
            condition: updates.conditionAfter || prod.condition
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        }
      }
    } else {
      if (wasActive) {
        const prevProd = productsRef.current.find(p => p.id === prevProductId);
        if (prevProd) {
          const newMntQty = Math.max(0, prevProd.inMaintenanceQty - 1);
          const updatedPrevProd: Product = {
            ...prevProd,
            inMaintenanceQty: newMntQty,
            availableQty: prevProd.availableQty + 1,
            status: newMntQty === 0 && prevProd.status === 'MAINTENANCE' ? 'AVAILABLE' : prevProd.status
          };
          ops.push({ type: 'set', col: 'products', id: prevProd.id, data: updatedPrevProd });
        }
      }
      if (isActive) {
        const nextProd = productsRef.current.find(p => p.id === nextProductId);
        if (nextProd) {
          const updatedNextProd: Product = {
            ...nextProd,
            inMaintenanceQty: nextProd.inMaintenanceQty + 1,
            availableQty: Math.max(0, nextProd.availableQty - 1),
            status: 'MAINTENANCE'
          };
          ops.push({ type: 'set', col: 'products', id: nextProd.id, data: updatedNextProd });
        }
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_MAINTENANCE', 'MAINTENANCE', `Data maintenance ${oldRecord.maintenanceCode} diperbarui (${updates.productName || oldRecord.productName}) status: ${nextStatus}.`, id, 'MaintenanceRecord');
      addNotification('Maintenance Diperbarui', `Data & rincian maintenance ${oldRecord.maintenanceCode} berhasil diperbarui.`, 'INFO', 'maintenance');
    });
  };

  const deleteMaintenanceRecord = (id: string) => {
    const recordToDelete = maintenanceRecordsRef.current.find(m => m.id === id);
    if (!recordToDelete) return;

    const ops: FirestoreBatchOp[] = [
      { type: 'delete', col: 'maintenanceRecords', id }
    ];

    if (recordToDelete.status === 'Segera Dilakukan' || recordToDelete.status === 'Dalam Proses') {
      const prod = productsRef.current.find(p => p.id === recordToDelete.productId);
      if (prod) {
        const newMntQty = Math.max(0, prod.inMaintenanceQty - 1);
        const updatedProd: Product = {
          ...prod,
          inMaintenanceQty: newMntQty,
          availableQty: prod.availableQty + 1,
          status: newMntQty === 0 && prod.status === 'MAINTENANCE' ? 'AVAILABLE' : prod.status
        };
        ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('DELETE_MAINTENANCE', 'MAINTENANCE', `Menghapus data maintenance ${recordToDelete.maintenanceCode} (${recordToDelete.productName}).`, id, 'MaintenanceRecord');
      addNotification('Maintenance Dihapus', `Data maintenance ${recordToDelete.maintenanceCode} berhasil dihapus dari sistem.`, 'INFO', 'maintenance');
    });
  };

  // --- Transfer Antar Gudang Methods ---
  const addTransfer = (record: Omit<TransferRecord, 'id' | 'transferCode'>): TransferRecord => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = transfersRef.current.length + 1;
    const transferCode = `TRF-${today}-${String(count).padStart(4, '0')}`;
    const newTransfer: TransferRecord = {
      ...record,
      id: `trf-${Date.now()}`,
      transferCode
    };

    void persistDocToFirestore('transfers', newTransfer.id, newTransfer, OperationType.CREATE, () => {
      logAudit('CREATE_TRANSFER', 'TRANSFER', `Membuat transfer antar gudang ${transferCode} dari ${record.fromWarehouseName} ke ${record.toWarehouseName}.`, newTransfer.id, 'TransferRecord');
    });
    return newTransfer;
  };

  const updateTransferStatus = (id: string, status: TransferRecord['status']) => {
    const existing = transfersRef.current.find(t => t.id === id);
    if (!existing) return;

    const updatedTransfer: TransferRecord = { ...existing, status };
    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'transfers', id, data: updatedTransfer }
    ];

    if (status === 'Diterima' || status === 'Selesai') {
      existing.items.forEach(item => {
        const prod = productsRef.current.find(p => p.id === item.productId);
        if (prod) {
          ops.push({
            type: 'set',
            col: 'products',
            id: prod.id,
            data: { ...prod, warehouseId: existing.toWarehouseId }
          });
        }
      });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_TRANSFER_STATUS', 'TRANSFER', `Status transfer antar gudang ID ${id} diubah menjadi "${status}".`, id, 'TransferRecord');
    });
  };

  // --- Peminjaman Barang Methods ---
  const addBorrowing = (record: Omit<BorrowingRecord, 'id' | 'borrowCode'>): BorrowingRecord => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = borrowingsRef.current.length + 1;
    const borrowCode = `BRW-${today}-${String(count).padStart(4, '0')}`;
    const newBorrowing: BorrowingRecord = {
      ...record,
      id: `brw-${Date.now()}`,
      borrowCode
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'borrowings', id: newBorrowing.id, data: newBorrowing }
    ];

    const prod = productsRef.current.find(p => p.id === record.productId);
    if (prod) {
      const updatedProd: Product = {
        ...prod,
        availableQty: Math.max(0, prod.availableQty - record.qty)
      };
      ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('CREATE_BORROW', 'BORROW', `Peminjaman barang ${borrowCode}: ${record.qty} ${record.unit} ${record.productName} dipinjam oleh ${record.borrowerName}.`, newBorrowing.id, 'BorrowingRecord');
    });

    return newBorrowing;
  };

  const returnBorrowing = (id: string, returnCondition: ItemCondition, notes?: string) => {
    const borrow = borrowingsRef.current.find(b => b.id === id);
    if (!borrow) return;

    const updatedBorrow: BorrowingRecord = {
      ...borrow,
      status: 'Dikembalikan',
      conditionReturn: returnCondition,
      actualReturnDate: new Date().toISOString().split('T')[0],
      notes: notes ? `${borrow.notes || ''} [Pengembalian: ${notes}]` : borrow.notes
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'borrowings', id: updatedBorrow.id, data: updatedBorrow }
    ];

    const prod = productsRef.current.find(p => p.id === borrow.productId);
    if (prod) {
      const isBroken = returnCondition === 'Rusak Berat' || returnCondition === 'Rusak Ringan';
      const updatedProd: Product = {
        ...prod,
        availableQty: isBroken ? prod.availableQty : prod.availableQty + borrow.qty,
        damagedQty: isBroken ? prod.damagedQty + borrow.qty : prod.damagedQty,
        condition: returnCondition
      };
      ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('RETURN_BORROW', 'BORROW', `Pengembalian peminjaman barang ID ${id}. Kondisi: ${returnCondition}.`, id, 'BorrowingRecord');
    });
  };

  const updateBorrowing = (id: string, updates: Partial<BorrowingRecord>): { success: boolean; message: string } => {
    const currentRecord = borrowingsRef.current.find(b => b.id === id);
    if (!currentRecord) {
      return { success: false, message: 'Data peminjaman tidak ditemukan.' };
    }

    const oldProductId = currentRecord.productId;
    const newProductId = updates.productId || oldProductId;
    const oldQty = currentRecord.qty;
    const newQty = updates.qty !== undefined ? updates.qty : oldQty;
    const oldStatus = currentRecord.status;
    const newStatus = updates.status || oldStatus;

    const wasActive = oldStatus === 'Dipinjam' || oldStatus === 'Terlambat';
    const isActive = newStatus === 'Dipinjam' || newStatus === 'Terlambat';

    const ops: FirestoreBatchOp[] = [];

    if (wasActive && isActive) {
      if (oldProductId === newProductId) {
        const diff = newQty - oldQty;
        const prod = productsRef.current.find(p => p.id === oldProductId);
        if (diff > 0) {
          if (!prod || prod.availableQty < diff) {
            return { success: false, message: `Stok tidak mencukupi untuk menambah ${diff} unit!` };
          }
        }
        if (diff !== 0 && prod) {
          ops.push({
            type: 'set',
            col: 'products',
            id: prod.id,
            data: { ...prod, availableQty: Math.max(0, prod.availableQty - diff) }
          });
        }
      } else {
        const newProd = productsRef.current.find(p => p.id === newProductId);
        if (!newProd || newProd.availableQty < newQty) {
          return { success: false, message: `Stok peralatan baru tidak mencukupi (${newProd?.availableQty || 0} unit tersedia)!` };
        }
        const oldProd = productsRef.current.find(p => p.id === oldProductId);
        if (oldProd) {
          ops.push({
            type: 'set',
            col: 'products',
            id: oldProd.id,
            data: { ...oldProd, availableQty: oldProd.availableQty + oldQty }
          });
        }
        ops.push({
          type: 'set',
          col: 'products',
          id: newProd.id,
          data: { ...newProd, availableQty: Math.max(0, newProd.availableQty - newQty) }
        });
      }
    } else if (wasActive && !isActive) {
      const oldProd = productsRef.current.find(p => p.id === oldProductId);
      if (oldProd) {
        if (newStatus === 'Dikembalikan') {
          ops.push({ type: 'set', col: 'products', id: oldProd.id, data: { ...oldProd, availableQty: oldProd.availableQty + oldQty } });
        } else if (newStatus === 'Rusak') {
          ops.push({ type: 'set', col: 'products', id: oldProd.id, data: { ...oldProd, damagedQty: oldProd.damagedQty + oldQty } });
        } else if (newStatus === 'Hilang') {
          ops.push({ type: 'set', col: 'products', id: oldProd.id, data: { ...oldProd, lostQty: oldProd.lostQty + oldQty } });
        }
      }
    } else if (!wasActive && isActive) {
      const prod = productsRef.current.find(p => p.id === newProductId);
      if (!prod || prod.availableQty < newQty) {
        return { success: false, message: 'Stok peralatan tidak mencukupi untuk meminjamkan kembali!' };
      }
      ops.push({
        type: 'set',
        col: 'products',
        id: prod.id,
        data: { ...prod, availableQty: Math.max(0, prod.availableQty - newQty) }
      });
    }

    const updatedBorrowing: BorrowingRecord = {
      ...currentRecord,
      ...updates,
      id
    };
    ops.push({ type: 'set', col: 'borrowings', id, data: updatedBorrowing });

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_BORROW', 'BORROW', `Memperbarui data peminjaman ${currentRecord.borrowCode} (${updates.borrowerName || currentRecord.borrowerName}).`, id, 'BorrowingRecord');
      addNotification('Peminjaman Diperbarui', `Data peminjaman ${currentRecord.borrowCode} berhasil diperbarui.`, 'INFO', 'borrowing');
    });

    return { success: true, message: 'Data peminjaman berhasil diperbarui.' };
  };

  const deleteBorrowing = (id: string): { success: boolean; message: string } => {
    const recordToDelete = borrowingsRef.current.find(b => b.id === id);
    if (!recordToDelete) {
      return { success: false, message: 'Data peminjaman tidak ditemukan.' };
    }

    const ops: FirestoreBatchOp[] = [
      { type: 'delete', col: 'borrowings', id }
    ];

    if (recordToDelete.status === 'Dipinjam' || recordToDelete.status === 'Terlambat') {
      const prod = productsRef.current.find(p => p.id === recordToDelete.productId);
      if (prod) {
        ops.push({
          type: 'set',
          col: 'products',
          id: prod.id,
          data: { ...prod, availableQty: prod.availableQty + recordToDelete.qty }
        });
      }
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('DELETE_BORROW', 'BORROW', `Menghapus data peminjaman ${recordToDelete.borrowCode} (${recordToDelete.productName} - ${recordToDelete.borrowerName}).`, id, 'BorrowingRecord');
      addNotification('Peminjaman Dihapus', `Data peminjaman ${recordToDelete.borrowCode} telah dihapus dari sistem.`, 'INFO', 'borrowing');
    });

    return { success: true, message: 'Data peminjaman berhasil dihapus.' };
  };

  // --- Stock Opname ---
  const saveStockOpname = (session: Omit<StockOpnameSession, 'id' | 'sessionCode'>): StockOpnameSession => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = stockOpnames.length + 1;
    const sessionCode = `OPN-${today}-${String(count).padStart(4, '0')}`;
    const newSession: StockOpnameSession = {
      ...session,
      id: `opn-${Date.now()}`,
      sessionCode
    };

    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'stockOpnames', id: newSession.id, data: newSession }
    ];

    session.items.forEach(item => {
      if (item.differenceQty !== 0) {
        const prod = productsRef.current.find(p => p.id === item.productId);
        if (prod) {
          const updatedProd: Product = {
            ...prod,
            totalQty: item.physicalQty,
            availableQty: Math.max(
              0,
              item.physicalQty - (prod.reservedQty + prod.inUseQty + prod.inMaintenanceQty + prod.damagedQty + prod.lostQty)
            )
          };
          ops.push({ type: 'set', col: 'products', id: prod.id, data: updatedProd });
        }
      }
    });

    void executeBatchInFirestore(ops, () => {
      logAudit('SAVE_STOCK_OPNAME', 'OPNAME', `Menyimpan hasil audit fisik Stock Opname ${sessionCode} di ${session.warehouseName}. Auditor: ${session.auditorName}.`, newSession.id, 'StockOpnameSession');
      addNotification('Stock Opname Selesai', `Audit fisik gudang ${session.warehouseName} selesai dan data sistem telah disinkronkan.`, 'SUCCESS', 'opname');
    });

    return newSession;
  };

  // --- Warehouse CRUD ---
  const addWarehouse = (wh: Omit<Warehouse, 'id'>): Warehouse => {
    const newWh: Warehouse = {
      ...wh,
      id: `wh-${Date.now()}`,
      address: wh.address || '-',
      picName: wh.picName || '-',
      picPhone: wh.picPhone || '-',
      capacityDescription: wh.capacityDescription || '-',
      areas: Array.isArray(wh.areas) ? wh.areas : ['Area Utama']
    };
    void persistDocToFirestore('warehouses', newWh.id, newWh, OperationType.CREATE, () => {
      logAudit('CREATE_WAREHOUSE', 'SYSTEM', `Menambahkan gudang baru: ${newWh.name} (${newWh.code}).`);
    });
    return newWh;
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    const existing = warehousesRef.current.find(w => w.id === id);
    if (!existing) return;
    const updated: Warehouse = { ...existing, ...updates, id };
    void persistDocToFirestore('warehouses', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_WAREHOUSE', 'SYSTEM', `Memperbarui data gudang ID ${id}.`);
    });
  };

  const deleteWarehouse = (id: string): { success: boolean; message: string } => {
    const hasProducts = productsRef.current.some(p => p.warehouseId === id);
    if (hasProducts) {
      return { success: false, message: 'Gudang tidak dapat dihapus karena masih terdapat barang inventaris yang tersimpan di dalamnya. Pindahkan barang terlebih dahulu.' };
    }
    const wh = warehousesRef.current.find(w => w.id === id);
    if (!wh) return { success: false, message: 'Gudang tidak ditemukan.' };

    void deleteDocFromFirestore('warehouses', id, () => {
      logAudit('DELETE_WAREHOUSE', 'SYSTEM', `Menghapus gudang: ${wh.name}.`);
    });
    return { success: true, message: 'Gudang berhasil dihapus.' };
  };

  // --- Category CRUD ---
  const addCategory = (cat: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      iconName: cat.iconName || 'Boxes',
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : ['Umum']
    };
    void persistDocToFirestore('categories', newCat.id, newCat, OperationType.CREATE, () => {
      logAudit('CREATE_CATEGORY', 'SYSTEM', `Menambahkan kategori baru: ${newCat.name} (${newCat.code}).`);
    });
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const oldCat = categoriesRef.current.find(c => c.id === id);
    if (!oldCat) return;

    const updatedCat: Category = { ...oldCat, ...updates, id };
    const ops: FirestoreBatchOp[] = [
      { type: 'set', col: 'categories', id, data: updatedCat }
    ];

    if (updates.name && updates.name !== oldCat.name) {
      productsRef.current.forEach(p => {
        if (p.category === oldCat.name) {
          ops.push({
            type: 'set',
            col: 'products',
            id: p.id,
            data: { ...p, category: updates.name! }
          });
        }
      });
    }

    void executeBatchInFirestore(ops, () => {
      logAudit('UPDATE_CATEGORY', 'SYSTEM', `Memperbarui kategori ${oldCat.name}.`);
    });
  };

  const deleteCategory = (id: string): { success: boolean; message: string } => {
    const cat = categoriesRef.current.find(c => c.id === id);
    if (!cat) return { success: false, message: 'Kategori tidak ditemukan.' };
    const inUse = productsRef.current.some(p => p.category === cat.name);
    if (inUse) {
      return { success: false, message: `Kategori "${cat.name}" tidak dapat dihapus karena masih digunakan oleh peralatan master barang.` };
    }
    void deleteDocFromFirestore('categories', id, () => {
      logAudit('DELETE_CATEGORY', 'SYSTEM', `Menghapus kategori: ${cat.name}.`);
    });
    return { success: true, message: 'Kategori berhasil dihapus.' };
  };

  // --- Client, Crew, Vehicle CRUD ---
  const addClient = (cli: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...cli,
      id: `cli-${Date.now()}`,
      picName: cli.picName || '-',
      phone: cli.phone || '-',
      email: cli.email || '',
      address: cli.address || '-',
      totalEventsCount: 0
    };
    void persistDocToFirestore('clients', newClient.id, newClient, OperationType.CREATE, () => {
      logAudit('CREATE_CLIENT', 'SYSTEM', `Menambahkan client baru: ${newClient.companyName}.`);
    });
    return newClient;
  };

  const updateClient = (id: string, cli: Partial<Client>) => {
    const existing = clientsRef.current.find(c => c.id === id);
    if (!existing) return;
    const updated: Client = { ...existing, ...cli, id };
    void persistDocToFirestore('clients', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_CLIENT', 'SYSTEM', `Memperbarui data client ID ${id}.`);
    });
  };

  const deleteClient = (id: string): { success: boolean; message: string } => {
    const cli = clientsRef.current.find(c => c.id === id);
    if (!cli) return { success: false, message: 'Client tidak ditemukan.' };
    const hasEvents = eventsRef.current.some(e => e.clientId === id);
    if (hasEvents) {
      return { success: false, message: `Client "${cli.companyName}" tidak dapat dihapus karena masih terhubung dengan riwayat event perusahaan.` };
    }
    void deleteDocFromFirestore('clients', id, () => {
      logAudit('DELETE_CLIENT', 'SYSTEM', `Menghapus client: ${cli.companyName}.`);
    });
    return { success: true, message: 'Client berhasil dihapus.' };
  };

  const addCrew = (crw: Omit<CrewMember, 'id'>): CrewMember => {
    const newMember: CrewMember = {
      ...crw,
      id: `crew-${Date.now()}`,
      division: crw.division || 'Audio',
      roleTitle: crw.roleTitle || 'Crew',
      phone: crw.phone || '-',
      skills: Array.isArray(crw.skills) ? crw.skills : ['Umum'],
      status: crw.status || 'Aktif'
    };
    void persistDocToFirestore('crew', newMember.id, newMember, OperationType.CREATE, () => {
      logAudit('CREATE_CREW', 'SYSTEM', `Menambahkan crew baru: ${newMember.name} (${newMember.division}).`);
    });
    return newMember;
  };

  const updateCrew = (id: string, crw: Partial<CrewMember>) => {
    const existing = crewRef.current.find(c => c.id === id);
    if (!existing) return;
    const updated: CrewMember = { ...existing, ...crw, id };
    void persistDocToFirestore('crew', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_CREW', 'SYSTEM', `Memperbarui data crew ID ${id}.`);
    });
  };

  const deleteCrew = (id: string): { success: boolean; message: string } => {
    const crw = crewRef.current.find(c => c.id === id);
    if (!crw) return { success: false, message: 'Crew tidak ditemukan.' };
    void deleteDocFromFirestore('crew', id, () => {
      logAudit('DELETE_CREW', 'SYSTEM', `Menghapus crew: ${crw.name}.`);
    });
    return { success: true, message: 'Crew berhasil dihapus.' };
  };

  const addVehicle = (veh: Omit<Vehicle, 'id'>): Vehicle => {
    const newVeh: Vehicle = {
      ...veh,
      id: `veh-${Date.now()}`,
      vehicleType: veh.vehicleType || 'Truk Box CDD',
      brand: veh.brand || '-',
      driverName: veh.driverName || '-',
      driverPhone: veh.driverPhone || '-',
      status: veh.status || 'Tersedia'
    };
    void persistDocToFirestore('vehicles', newVeh.id, newVeh, OperationType.CREATE, () => {
      logAudit('CREATE_VEHICLE', 'SYSTEM', `Menambahkan armada kendaraan baru: ${newVeh.plateNumber} (${newVeh.brand}).`);
    });
    return newVeh;
  };

  const updateVehicle = (id: string, veh: Partial<Vehicle>) => {
    const existing = vehiclesRef.current.find(v => v.id === id);
    if (!existing) return;
    const updated: Vehicle = { ...existing, ...veh, id };
    void persistDocToFirestore('vehicles', id, updated, OperationType.UPDATE, () => {
      logAudit('UPDATE_VEHICLE', 'SYSTEM', `Memperbarui data armada ID ${id}.`);
    });
  };

  const deleteVehicle = (id: string): { success: boolean; message: string } => {
    const veh = vehiclesRef.current.find(v => v.id === id);
    if (!veh) return { success: false, message: 'Kendaraan tidak ditemukan.' };
    void deleteDocFromFirestore('vehicles', id, () => {
      logAudit('DELETE_VEHICLE', 'SYSTEM', `Menghapus armada: ${veh.plateNumber}.`);
    });
    return { success: true, message: 'Kendaraan berhasil dihapus.' };
  };

  const markNotificationRead = (id: string) => {
    const existing = notificationsRef.current.find(n => n.id === id);
    if (!existing || existing.read) return;
    void persistDocToFirestore('notifications', id, { ...existing, read: true }, OperationType.UPDATE);
  };

  const markAllNotificationsRead = () => {
    const unread = notificationsRef.current.filter(n => !n.read);
    if (unread.length === 0) return;
    const ops: FirestoreBatchOp[] = unread.map(n => ({
      type: 'set',
      col: 'notifications',
      id: n.id,
      data: { ...n, read: true }
    }));
    void executeBatchInFirestore(ops);
  };

  // --- Backup & Restore JSON ---
  const exportDatabaseJSON = (): string => {
    const fullDb = {
      exportTimestamp: new Date().toISOString(),
      version: '2.0.0',
      company: 'GL PRO PRODUCTION',
      products,
      events,
      categories,
      warehouses,
      clients,
      crew,
      vehicles,
      checkouts,
      checkins,
      damageReports,
      maintenanceRecords,
      transfers,
      borrowings,
      stockOpnames,
      auditLogs,
      userAccounts,
      ledMonthlyTargets,
      ledDeployments
    };
    logAudit('BACKUP_DATABASE', 'SYSTEM', 'Admin melakukan unduhan file cadangan database sistem (Backup JSON).');
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabaseJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
      if (parsed.events && Array.isArray(parsed.events)) setEvents(parsed.events);
      if (parsed.categories && Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (parsed.warehouses && Array.isArray(parsed.warehouses)) setWarehouses(parsed.warehouses);
      if (parsed.clients && Array.isArray(parsed.clients)) setClients(parsed.clients);
      if (parsed.crew && Array.isArray(parsed.crew)) setCrew(parsed.crew);
      if (parsed.vehicles && Array.isArray(parsed.vehicles)) setVehicles(parsed.vehicles);
      if (parsed.checkouts && Array.isArray(parsed.checkouts)) setCheckouts(parsed.checkouts);
      if (parsed.checkins && Array.isArray(parsed.checkins)) setCheckins(parsed.checkins);
      if (parsed.damageReports && Array.isArray(parsed.damageReports)) setDamageReports(parsed.damageReports);
      if (parsed.maintenanceRecords && Array.isArray(parsed.maintenanceRecords)) setMaintenanceRecords(parsed.maintenanceRecords);
      if (parsed.transfers && Array.isArray(parsed.transfers)) setTransfers(parsed.transfers);
      if (parsed.borrowings && Array.isArray(parsed.borrowings)) setBorrowings(parsed.borrowings);
      if (parsed.stockOpnames && Array.isArray(parsed.stockOpnames)) setStockOpnames(parsed.stockOpnames);
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
      if (parsed.userAccounts && Array.isArray(parsed.userAccounts)) setUserAccounts(parsed.userAccounts);
      if (parsed.ledMonthlyTargets && Array.isArray(parsed.ledMonthlyTargets)) setLedMonthlyTargets(parsed.ledMonthlyTargets);
      if (parsed.ledDeployments && Array.isArray(parsed.ledDeployments)) setLedDeployments(parsed.ledDeployments);
      
      logAudit('RESTORE_DATABASE', 'SYSTEM', 'Admin memulihkan data sistem dari file cadangan backup JSON ke Cloud Firestore.');
      addNotification('Database Dipulihkan', 'Cadangan data berhasil dimuat dan disinkronkan ke Cloud Firestore.', 'SUCCESS');
      return true;
    } catch (err) {
      console.error('Failed to restore database:', err);
      return false;
    }
  };

  const resetToDemoData = () => {
    setCategories(INITIAL_CATEGORIES);
    setWarehouses(INITIAL_WAREHOUSES);
    setProducts(INITIAL_PRODUCTS);
    setEvents(INITIAL_EVENTS);
    setClients(INITIAL_CLIENTS);
    setCrew(INITIAL_CREW);
    setVehicles(INITIAL_VEHICLES);
    setDamageReports(INITIAL_DAMAGE_REPORTS);
    setMaintenanceRecords(INITIAL_MAINTENANCE);
    setTransfers(INITIAL_TRANSFERS);
    setBorrowings(INITIAL_BORROWINGS);
    setStockOpnames([]);
    setCheckouts([]);
    setCheckins([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLedMonthlyTargets(INITIAL_LED_MONTHLY_TARGETS);
    setLedDeployments(INITIAL_LED_DEPLOYMENTS);
    logAudit('RESET_DEMO_DATA', 'SYSTEM', 'Sistem diatur ulang ke data demo operasional awal di Cloud Firestore.');
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        currentUser,
        setCurrentUserRole,
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        userAccounts,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        changePassword,
        isOffline,
        setIsOffline,
        offlineQueue,
        syncOfflineData,
        categories,
        setCategories,
        warehouses,
        setWarehouses,
        products,
        setProducts,
        events,
        setEvents,
        clients,
        setClients,
        crew,
        setCrew,
        vehicles,
        setVehicles,
        checkouts,
        checkins,
        damageReports,
        maintenanceRecords,
        transfers,
        borrowings,
        stockOpnames,
        auditLogs,
        notifications,
        ledMonthlyTargets,
        updateLedMonthlyTarget,
        ledDeployments,
        addLedDeployment,
        updateLedDeployment,
        deleteLedDeployment,
        addProduct,
        updateProduct,
        deleteProduct,
        addEvent,
        updateEvent,
        updateEventStatus,
        deleteEvent,
        reserveEquipmentForEvent,
        removeEquipmentFromEvent,
        toggleChecklistItem,
        processCheckout,
        processCheckin,
        reportDamage,
        updateDamageStatus,
        updateDamageReport,
        deleteDamageReport,
        addMaintenance,
        updateMaintenanceStatus,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
        addTransfer,
        updateTransferStatus,
        addBorrowing,
        updateBorrowing,
        deleteBorrowing,
        returnBorrowing,
        saveStockOpname,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        addCategory,
        updateCategory,
        deleteCategory,
        addClient,
        updateClient,
        deleteClient,
        addCrew,
        updateCrew,
        deleteCrew,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        markNotificationRead,
        markAllNotificationsRead,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDemoData
      }}
    >
      {firestoreErrorBanner && (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-md bg-rose-950/95 border border-rose-500/60 text-rose-200 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center justify-between gap-3">
          <span>{firestoreErrorBanner}</span>
          <button
            onClick={() => setFirestoreErrorBanner(null)}
            className="text-rose-400 hover:text-white font-bold px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
