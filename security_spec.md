# Security Specification (`security_spec.md`) — GL PRO Production

## 1. Data Invariants

1. **Global Default-Deny Catch-All**: Any path not explicitly matched in `firestore.rules` is strictly denied (`allow read, write: if false;`).
2. **Path Variable Hardening (`isValidId`)**: Every single-document operation (`get`, `create`, `update`, `delete`) validates that the document ID matches `^[a-zA-Z0-9_\-]+$` and has `.size() <= 128`.
3. **Document Identity Integrity**: On `create`, `incoming().id == docId`. On `update`, `incoming().id == existing().id` (immutable primary identifier).
4. **Volumetric & Type Bounds**: Every required string field enforces `is string` and `.size() <= MAX`. Every list field enforces `is list` and `.size() <= MAX`. Numeric stock quantities (`totalQty`, `availableQty`, `qty`, `totalSquareMeters`, `targetMeters`) enforce `is number && >= 0`.
5. **Role & Status Enum Guards**: User accounts enforce valid `UserRole` (`SUPER_ADMIN`, `ADMIN`, `WAREHOUSE`, `PROJECT_MANAGER`, `CREW`, `TEKNISI`, `VIEWER`) and valid status (`Aktif`, `Nonaktif`).

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (ID Poisoning)**: Document ID containing spaces/special characters (`prod-$#@!`) or > 128 characters. -> `PERMISSION_DENIED`
2. **Payload 2 (Immutable ID Mutation)**: Updating `products/prod-cam-01` with `incoming().id = 'prod-hijacked'`. -> `PERMISSION_DENIED`
3. **Payload 3 (Negative Stock Injection)**: Creating or updating `products/prod-01` with `totalQty: -50` or `availableQty: -10`. -> `PERMISSION_DENIED`
4. **Payload 4 (Privilege Escalation Invalid Role)**: Creating or updating `userAccounts/usr-99` with `role: 'ROOT_HACKER'`. -> `PERMISSION_DENIED`
5. **Payload 5 (Oversized String / Denial of Wallet)**: Creating `products/prod-01` with a `name` > 300 chars or `auditLogs/aud-01` with `description` > 2000 chars. -> `PERMISSION_DENIED`
6. **Payload 6 (Unbounded Array Injection)**: Updating `events/evt-01` with `equipmentList` exceeding 500 items or `categories/cat-01` with `subcategories` exceeding 200 items. -> `PERMISSION_DENIED`
7. **Payload 7 (Type Confusion on Borrowing)**: Creating `borrowings/brw-01` with `qty: "ten"` (string instead of number). -> `PERMISSION_DENIED`
8. **Payload 8 (Invalid LED Target Month)**: Creating `ledMonthlyTargets/target-2026-13` with `month: 13` or `targetMeters: -5`. -> `PERMISSION_DENIED`
9. **Payload 9 (Missing Required Schema Keys)**: Creating `events/evt-02` without `eventCode`, `venueName`, or `equipmentList`. -> `PERMISSION_DENIED`
10. **Payload 10 (Unprotected Unknown Collection)**: Writing to `/unprotectedCollection/doc1`. -> `PERMISSION_DENIED`
11. **Payload 11 (Empty/Blank Required Strings)**: Creating `warehouses/wh-99` with `name: ""` or `code: ""`. -> `PERMISSION_DENIED`
12. **Payload 12 (Corrupted Notification Read State)**: Creating `notifications/notif-99` with `read: "yes"` (string instead of boolean). -> `PERMISSION_DENIED`
