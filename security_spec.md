# Security Specification - Real Estate App

## Data Invariants
1. A property must have a valid title, price, location, type, and status.
2. Property IDs must be alphanumeric strings.
3. Timestamps (createdAt, updatedAt) must be valid date strings.
4. Visibility must be either "visível" or "oculto".
5. Public users can only read "visível" properties.
6. Admin (imo/12345) can read and write all properties.
   - Note: Since we are using hardcoded credentials for now, we'll keep rules permissive for authenticated admins if we add auth later, but for now, we'll implement a simple "admin" concept if needed. However, the user specifically asked for image uploads via Firebase/Cloud Storage.

## The "Dirty Dozen" Payloads
1. Create property with price as string.
2. Create property without required "location" field.
3. Update property with a "Ghost Field" (e.g., `isSuperAdmin: true`).
4. Update a property's `createdAt` timestamp (immutable field).
5. Inject a 10MB string into the `title` field (DoS attack).
6. Create property with an invalid `visibility` value like "deleted".
7. Update a property with an ID containing malicious characters (e.g., `../`).
8. Unauthorized user attempting to read an "oculto" property.
9. Unauthorized user attempting to write a property.
10. Update `updatedAt` with a client-side timestamp (non-server timestamp).
11. Add 10,000 features to a property (resource exhaustion).
12. Delete a property as a guest user.

## Rules Draft Strategy
- Default deny.
- `properties` collection:
  - `read`: anyone can read if `visibility == "visível"`.
  - `write`: only admins (for now, we'll use a specific condition or just keep it simple until auth is fully integrated).
