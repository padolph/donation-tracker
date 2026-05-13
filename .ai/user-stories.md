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

