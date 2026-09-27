/**
 * Firestore Security Rules Test Suite for GL PRO Production
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestPayload {
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'delete' | 'get';
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestPayload[] = [
  {
    name: '1. ID Poisoning with invalid characters',
    collection: 'products',
    docId: 'prod-invalid$id!',
    operation: 'create',
    payload: { id: 'prod-invalid$id!', code: 'INV-01', name: 'Speaker', category: 'AUDIO', brand: 'RCF', totalQty: 2, availableQty: 2, warehouseId: 'wh-utama', status: 'AVAILABLE', condition: 'Baik' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '2. Immutable ID Mutation during update',
    collection: 'products',
    docId: 'prod-cam-01',
    operation: 'update',
    payload: { id: 'prod-hijacked', code: 'INV-01', name: 'Speaker', category: 'AUDIO', brand: 'RCF', totalQty: 2, availableQty: 2, warehouseId: 'wh-utama', status: 'AVAILABLE', condition: 'Baik' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '3. Negative Stock Quantity Injection',
    collection: 'products',
    docId: 'prod-neg-01',
    operation: 'create',
    payload: { id: 'prod-neg-01', code: 'INV-01', name: 'Speaker', category: 'AUDIO', brand: 'RCF', totalQty: -10, availableQty: -5, warehouseId: 'wh-utama', status: 'AVAILABLE', condition: 'Baik' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '4. Privilege Escalation with invalid role enum',
    collection: 'userAccounts',
    docId: 'usr-99',
    operation: 'create',
    payload: { id: 'usr-99', username: 'hacker', password: 'pw', name: 'Hacker', email: 'h@x.com', role: 'ROOT_HACKER', division: 'IT', phone: '0800', status: 'Aktif', createdAt: '2026-09-27' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '5. Oversized String Payload (Denial of Wallet)',
    collection: 'products',
    docId: 'prod-big-01',
    operation: 'create',
    payload: { id: 'prod-big-01', code: 'INV-01', name: 'X'.repeat(500), category: 'AUDIO', brand: 'RCF', totalQty: 1, availableQty: 1, warehouseId: 'wh-utama', status: 'AVAILABLE', condition: 'Baik' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '6. Unbounded Array Injection on Categories',
    collection: 'categories',
    docId: 'cat-big-01',
    operation: 'create',
    payload: { id: 'cat-big-01', name: 'AUDIO', code: 'AUD', iconName: 'Volume2', subcategories: new Array(250).fill('Sub') },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '7. Type Confusion on Borrowing qty',
    collection: 'borrowings',
    docId: 'brw-bad-01',
    operation: 'create',
    payload: { id: 'brw-bad-01', borrowCode: 'BRW-01', borrowerName: 'Budi', productId: 'prod-01', qty: 'sepuluh', status: 'Dipinjam' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '8. Invalid LED Target Month (> 12)',
    collection: 'ledMonthlyTargets',
    docId: 'target-2026-13',
    operation: 'create',
    payload: { id: 'target-2026-13', month: 13, year: 2026, targetMeters: 500 },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '9. Missing Required Keys on Event creation',
    collection: 'events',
    docId: 'evt-incomplete',
    operation: 'create',
    payload: { id: 'evt-incomplete', name: 'Incomplete Event' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '10. Write to Unprotected Unknown Collection',
    collection: 'shadowCollection',
    docId: 'doc-1',
    operation: 'create',
    payload: { id: 'doc-1' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '11. Empty Required String on Warehouse',
    collection: 'warehouses',
    docId: 'wh-empty',
    operation: 'create',
    payload: { id: 'wh-empty', code: '', name: '', address: 'Jl', picName: 'A', picPhone: '08', capacityDescription: '100m2', areas: [] },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: '12. Non-boolean read state on Notification',
    collection: 'notifications',
    docId: 'notif-bad',
    operation: 'create',
    payload: { id: 'notif-bad', title: 'Alert', message: 'Msg', type: 'INFO', read: 'false' },
    expectedResult: 'PERMISSION_DENIED'
  }
];
