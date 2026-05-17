# Application User Stories & Acceptance Criteria

This document defines the functional requirements for the Donation Tracker. When implementing a feature, reference the associated screenshot in the `/SampleUI` folder for layout and content guidance. However, feel free to make aesthetic changes to ensure an attractive consistent look.

---

## 1. Entering a New Item Donation
**Reference Image:** `New Item Donation Builder.png`

**Story:** As a user, I want to create a new donation event and add physical items to it, so that I can track my charitable deductions.

**Acceptance Criteria:**
* **1a. Catalog Search:** I can search the seeded database of 1,700+ items. Selecting an item populates its default "High" and "Medium" values.
* **1b. Custom Items:** If an item isn't in the database, I can click "Add Custom Item," enter my own description and values, and it saves to the database for future use.
* **1c. Line Item Entry:** I can select an item, specify the quantity, choose the condition (High/Medium/Custom), and add it to a "Current Session" staging list.
* **1d. Running Total:** The staging list displays a real-time running total of the donation's value.
* **1e. Attachments:** I can click an upload button to attach image files (receipts/photos). The system copies these to the local app directory and saves the path.
* **1f. Save Session:** Clicking "Save Donation" commits the event, the locked-in values of the items, and the photo paths to the database.

---

## 2. Entering Cash or Asset Donations
**Reference Images:** `New Cash Donation Builder.png`, `New Asset Donation Builder.png`

**Story:** As a user, I want to log direct cash contributions or stock/asset transfers so that all my philanthropic giving is tracked in one place.

**Acceptance Criteria:**
* The interface provides distinct entry modes for Cash vs. Assets (e.g., Stock ticker, number of shares, value on date of transfer).
* These events save to the same central Donation Ledger but are categorized accordingly to differentiate them from physical item donations.

---

## 3. Organization Management (CRUD)
**Reference Image:** `Organizations Browser.png`

**Story:** As a user, I want to manage a directory of charitable organizations so that I can easily associate donations with the correct charity without retyping their details.

**Acceptance Criteria:**
* **Read:** I can view a table of all organizations, showing their name, location, and the aggregate total I have donated to them.
* **Create/Update:** I can add a new organization or edit an existing one (Name, Address, Tax ID/EIN, Default Category).
* **Delete:** I can remove an organization (with a warning if it has associated donations).
* When creating a new Donation, a pulldown is presented offering a choice of existing Organizations to select, with an option to create a new one (see Create/Update) to be used with the current donation and saved for later use as well.

---

## 4. Donation Ledger & Browsing
**Reference Image:** `All Donations Browser.png`

**Story:** As a user, I want to see a comprehensive historical ledger of all my donation events so that I can review past activity and pull data for tax preparation.

**Acceptance Criteria:**
* The ledger displays a chronological table of events (Date, Organization, Type, Total Value).
* I can filter the ledger by Date Range (e.g., "Tax Year 2025") or Organization.
* Clicking a row expands or navigates to a detailed view showing the specific line items and attached receipt photos.

---

## 5. Dashboard & Year Summaries
**Reference Image:** `Top Level Dashboard.png`

**Story:** As a user, I want a high-level dashboard summarizing my giving for the current tax year so that I can quickly understand my total impact and estimated tax savings.

**Acceptance Criteria:**
* The dashboard defaults to the current calendar/tax year but allows toggling to previous years.
* It displays aggregate cards for Total Donated, Cash vs. Items breakdown, and total organizations supported.
* **Tax Impact Widget:** It calculates an estimated tax savings based on a configurable marginal tax rate (e.g., Total Donated * 32%).

### 6: Annual Tax Reporting Dashboard & Archival Export

**Story:** As a user preparing for tax season, I want to generate a yearly summary report of my donations strictly grouped by Organization and then by Donation Date, with options to both print a clean hard copy and export the raw data, so that I can easily transcribe the required IRS Form 8283 data into TurboTax from paper, and securely archive the digital records for my permanent financial files.

**Acceptance Criteria:**
* **Year Filter:** The user must be able to select a specific tax year to filter the report via a simple dropdown or toggle.
* **Hierarchical Grouping:** The on-screen and printed data must be grouped first by `Organization`, and secondarily by `Donation Date`.
* **IRS Required Fields:** The lowest level of the report (the items) must display the aggregated category description, condition, quantity, total Fair Market Value (FMV), and the valuation method (defaulting to "Thrift Shop Value").
* **Calculated Subtotals:** The report must automatically calculate and display the total FMV per Donation Date, the total FMV per Organization, and a Grand Total for the selected tax year.
* **Print-Optimized View:** The UI must include a "Print Report" action that utilizes CSS print media queries (`@media print`) to automatically hide sidebars, navigation buttons, and extraneous UI elements, ensuring the printed hard copy is high-contrast, perfectly paginated, and strictly focused on the data hierarchy.
* **CSV Data Export:** The UI must include an "Export to CSV" action that generates and downloads a flat-file `.csv` of the selected year's data. This export should denormalize the hierarchy into a flat table (e.g., columns for Year, Org, Date, Item, Value) making it easily readable by spreadsheet applications for cold-storage archival.
