# User Story: Data Export & Import (Sync) Feature

**Issue Link:** [Issue #75](https://github.com/padolph/donation-tracker/issues/75)

## 📋 Description & Value Proposition

As a user running **Donation Tracker** across multiple local machines (e.g., iMac, laptop, Chromebook), I want to be able to export my donation ledger, custom items, organizations, and associated receipt photos from a secondary device and merge/import them safely onto a primary device (iMac). 

The synchronization must:
- Prevent duplicate ledger entries.
- Avoid primary key/foreign key ID conflicts.
- Retain all associated physical receipt photo attachments.
- Prevent data loss or database corruption on the primary machine.

This allows us to maintain separate local installations throughout the year and consolidate everything seamlessly at tax time for a unified Tax Report.

---

## 👥 User Scenarios

### Scenario 1: Exporting from a Secondary Device
* **Given** a user is logged into Donation Tracker on a secondary device (e.g., a laptop).
* **When** they click **"Export Sync Package"** under the settings panel.
* **Then** the application bundles:
  1. A flat JSON database export representing all categories, custom items, organizations, donation events, donated items, and event photo metadata.
  2. All referenced physical receipt images from the local storage folder.
* **And** packages them into a single compressed archive file named `donation_tracker_sync_[date]_[hash].dtpack` (which is technically a `.zip` archive).
* **And** prompts the user to download/save this file.

---

### Scenario 2: Selecting and Loading the Package on the Primary Device
* **Given** the user has transferred the `.dtpack` file to their primary machine (e.g., iMac).
* **When** they open the app on the primary machine, go to Settings, and select the `.dtpack` file for import.
* **Then** the application:
  1. Unpacks the archive into a temporary local directory.
  2. Validates that the archive contains a valid structure and a readable metadata JSON file.
  3. Displays a pre-import summary of the contents (e.g., "Found 6 donation events, 3 organizations, and 4 receipt photos").

---

### Scenario 3: Deduplicating Custom Items & Organizations (Merge & Match)
* **When** the import engine processes incoming organizations and custom items:
* **Then** it must resolve them by matching existing database rows rather than using database-generated primary keys:
  - **Organizations:** Check for matches based on tax ID (`taxId`) OR an exact case-insensitive match on the organization `name`.
  - **Custom Items:** Check for matches based on `categoryId` and a case-insensitive match on `description`.
* **If** a match is found:
  - The import runner maps the secondary device's ID to the existing primary device's ID in memory.
* **If** no match is found:
  - The record is created, and the secondary device's ID is mapped to the newly generated primary ID in memory.

---

### Scenario 4: Donation Event Deduplication
* **When** the import engine processes a donation event:
* **Then** it must check if an identical donation event already exists in the primary database.
* **Criteria for "Identical Event":**
  - Match on `date` (same day) AND
  - Match on `organizationId` (resolved via mapping) AND
  - Match on `cashAmount` (for cash/asset donations) AND
  - Match on the total value of items/contributions.
* **If** it is a duplicate:
  - The event and all its sub-items (donated items, photos) are **skipped** to prevent duplicating ledger entries.
* **If** it is a new event:
  - The event is inserted using the mapped organization ID.
  - The secondary event ID is mapped in memory to the newly created primary event ID.
  - Associated `DonatedItem` entries are inserted using the mapped item and event IDs.

---

### Scenario 5: Event Photos & Physical Files Merge
* **Given** a new donation event is being imported and it contains event photos.
* **When** the photos are processed:
* **Then** the application copies the physical files from the temporary directory into the primary machine's designated image storage path.
* **And** rename the files using a unique prefix (e.g., `[timestamp]_[original_filename]` or `[uuid]_[original_filename]`) to prevent any file collision or overwrite.
* **And** creates database `EventPhoto` records linked to the new event ID, storing the correct path of the new local file.

---

## 🛠️ Technical Implementation Strategy

Two main technical designs were evaluated to handle primary key conflicts between independent local SQLite databases.

### Option A: UUID Schema Migration
Migrate all SQLite table IDs from auto-incrementing integers (`Int`) to unique string identifiers (`String` with `default(uuid())`).

*   **Pros:**
    *   Trivial merge logic: new database rows have universally unique IDs and can be directly written without mapping maps.
*   **Cons:**
    *   **High SQLite Migration Risk:** SQLite lacks native support for renaming columns, changing primary keys, or altering foreign keys. Migrating existing user databases (dev.db, production.db) would require writing complex SQL scripts to disable foreign keys, create temp tables, copy data, drop old tables, rename tables, and re-enable constraints.
    *   **Extensive Refactoring:** Requires modifying types, models, server actions, and API endpoints across the entire codebase.

### Option B: Dynamic ID Remapping (Recommended)
Keep the existing auto-increment integer schema. The import engine processes the JSON dump in dependency order, maintaining an in-memory dictionary mapping old IDs to new IDs (e.g., `Map<oldItemId, newItemId>`).

*   **Pros:**
    *   **Zero Schema Changes:** Completely avoids complex, potentially database-corrupting SQLite migrations.
    *   **Localized Logic:** The entire synchronization engine can be built in isolated utilities/services, without touching code path logic in other parts of the application.
*   **Cons:**
    *   Requires writing an in-memory ID-remapping loop during the transaction execution.

---

## 🔒 Security & Safety Guarantees

1.  **Transactional Safety:** The import process must run inside a Prisma database transaction (`$transaction`). If any error occurs (e.g., corrupted JSON, disk full, invalid ID mapping), the database must roll back fully to its pre-import state.
2.  **Path Traversal Prevention:** When extracting the `.dtpack` zip archive, filenames must be strictly sanitized to prevent directory traversal attacks (e.g., checking that no file paths escape the temporary extraction folder via `../`).
3.  **Authentication Guard:** Export and import endpoints/server actions must be fully protected by the app's `APP_PASSWORD` middleware checks.
4.  **Zip Bomb Protection:** Implement maximum size and count limits on extracted files from the sync package to prevent memory overflow or disk exhaustion.

---

## 🧪 Verification Plan

### Automated Tests
1.  **Serialization/Deserialization Tests:** Verify that data maps correctly to/from JSON.
2.  **Remapping Logic Unit Tests:**
    *   Simulate importing categories and ensure name collisions are mapped.
    *   Simulate custom item imports with both matching and non-matching entries.
    *   Simulate organization matches based on exact case-insensitive names and tax IDs.
    *   Simulate importing duplicate donation events and verify they are skipped.
    *   Verify correct relational links are created using the in-memory map.
3.  **File System Integration Tests:**
    *   Test zip archiving of a database dump and mock image files.
    *   Test extraction and check that directory traversal attempts are rejected.

### Manual Verification
1.  Add sample custom items, charities, and receipt images on a secondary test instance.
2.  Perform a sync export to generate a `.dtpack` file.
3.  Import the `.dtpack` file on a primary test instance containing different existing events.
4.  Verify that:
    *   New events are present.
    *   Duplicate events did not double-record.
    *   Receipt photos render correctly on the new machine (verifying local copying worked).
    *   The overall tax summaries show correct consolidated numbers.
