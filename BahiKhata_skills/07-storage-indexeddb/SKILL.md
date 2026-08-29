# BahiKhata Local Storage Skill

## Purpose
Provide reliable local-first persistence for customer and application data.

## Invoke When
- Adding/editing/deleting persistent data.
- Changing the data model.
- Adding migrations.
- Investigating persistence failures.

## Inputs
- Domain models
- Storage schema
- Migration requirements

## Outputs
- Repository/storage implementation
- Schema version
- Migration path
- Storage tests

## Allowed
- Use IndexedDB for structured records.
- Use localStorage for small preferences only.
- Add versioned migrations.
- Implement safe CRUD operations.

## Forbidden
- Send customer records to a server.
- Store secrets unnecessarily.
- Use localStorage as a substitute for structured storage when scale/robustness requires IndexedDB.

## Rules
1. Persistence must be abstracted from UI.
2. Schema changes require migration planning.
3. Failed writes must be surfaced clearly.
4. Deletion must be intentional.

## Verification
- Data survives app restart.
- CRUD works.
- Migration tests pass.
- Corrupt/missing data is handled safely.
