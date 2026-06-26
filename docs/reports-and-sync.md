# Reports & Database Synchronization

This guide covers tax-season reporting (printing and exporting CSVs) and synchronization between multiple devices.

---

## Annual Tax Report

Preparing for tax filing is simple with the built-in **Tax Report** page. 

To view your report:
1. Navigate to **Tax Report** in the sidebar.
2. Select the desired tax year from the dropdown at the top.

### Report Hierarchy & Content
The report is designed specifically to match the requirements for transcribing data onto **IRS Form 8283** (or entering details into tax prep software like TurboTax). The page organizes information into a clear tree layout:
* **Level 1: Organization:** Grouped by charity. Shows the organization name and its calculated subtotal.
* **Level 2: Donation Date:** Displays individual donation events under each charity.
* **Level 3: Donated Items:** Lists the items in that donation event.

For each item, the report displays all IRS-required details:
* **Category/Description**
* **Condition** (High/Medium/Custom)
* **Quantity**
* **Fair Market Value (FMV)** (individual and total)
* **Valuation Method** (defaults to "Thrift Shop Value")

### Subtotals & Totals
The calculator automatically computes and displays:
* **Date Subtotals:** Total Fair Market Value (FMV) for each specific donation date.
* **Organization Subtotals:** Total FMV donated to that organization for the selected year.
* **Grand Total:** The cumulative FMV of all donations for the selected tax year.

### Printing the Report
Click **Print Report** at the top of the page.
* The application uses CSS print media queries (`@media print`) to hide sidebar menus, header banners, action buttons, and scroll elements.
* The resulting page is a high-contrast, clean printout optimized for standard paper sizes.

### Flat CSV Export
For digital backup or spreadsheet analysis (e.g., in Excel or Google Sheets):
1. Click **Export to CSV**.
2. The application denormalizes the hierarchical data structure into a flat table and downloads a `.csv` file.
3. The CSV includes columns for: `Year`, `Organization`, `Tax ID`, `Date`, `Item Description`, `Category`, `Condition`, `Quantity`, `Value Per Item`, `Total Value`, and `Valuation Method`.

---

## Multi-Machine Synchronization (Export & Import)

If you use Donation Tracker on multiple devices (for example, logging donations on a laptop when out and about, and maintaining a primary ledger on an iMac), you can merge your records using the **Data Sync** tool.

### Scenario 1: Exporting from a Secondary Device
1. On the secondary machine, navigate to **Settings / Sync**.
2. Under the synchronization panel, click **Export Sync Package**.
3. The system bundles:
   * A JSON representation of your SQLite database tables (charities, events, items, photos, and custom catalog descriptions).
   * All physical receipt photos stored in your local directory.
4. It compresses these files into a single archive named `donation_tracker_sync_[date]_[hash].dtpack` (which is a standard zip container). Save this file to an external drive or transfer it to your primary machine.

### Scenario 2: Importing on the Primary Device
1. On your primary machine, go to the **Settings / Sync** page.
2. Click **Import Sync Package** and select the `.dtpack` file you transferred.
3. The application will analyze the package and display a **Pre-import Summary** showing the counts of found donation events, organizations, and receipt photos.
4. Review the summary and click **Confirm Merge** to run the import.

### How the Remapping & Deduplication Logic Works
To prevent database corruption and key conflicts, the import engine runs a dynamic remapping pipeline:

* **Organization Deduplication:** The engine checks incoming organizations against your database. It matches them if they have the same tax ID (`taxId`) or an exact case-insensitive match on the organization's `name`. If matched, the engine maps the secondary device's ID to the existing primary organization ID in memory. Otherwise, it creates a new charity record.
* **Custom Item Deduplication:** Custom items are matched based on the parent category and a case-insensitive match on the item `description`. If a match is found, they are merged.
* **Donation Event Deduplication:** To prevent double-counting, the engine scans for duplicate donation events. An event is flagged as a duplicate if it matches an existing event on:
  * Same Date (Day) AND
  * Same Organization AND
  * Same Cash/Asset Value AND
  * Identical item counts and staging totals.
  
  *Duplicate events and their items are skipped, while new events are inserted using the mapped IDs.*
* **Event Photos Merge:** New photos are extracted into the local image folder. The engine prepends a unique prefix to the filenames (e.g., `[uuid]_[original_name]`) to prevent overwriting existing files, and links them to the new event record in the database.

### Security & Integrity Guarantees
The import engine is designed with strict security standards:
1. **Transactional Safety:** The entire import executes within a single database transaction. If any part of the process fails (due to a corrupt package, disk full, or write error), the database rolls back fully to its pre-import state.
2. **Path Traversal Prevention:** Extracted filenames are sanitized. The importer rejects zip archive entries that use relative paths (e.g., `../`) to prevent writing files outside the designated storage directory.
3. **Zip Bomb Protection:** Limits are enforced on total file count and uncompressed size to protect the application from memory or disk exhaustion.
4. **Authentication Check:** Sync exports and imports require matching your password, safeguarding your data package from unauthorized API requests.
