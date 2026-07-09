# Feature: Implement "Mileage" Donation Type with 2026 IRS Guidelines

## Executive Summary
This feature requests the addition of a new donation type, **Mileage**, to the donation tracker application. This allows users to track their unreimbursed out-of-pocket volunteer driving expenses as a charitable contribution. 

According to the **2026 IRS guidelines** (IRS Publication 526 and IRC Section 170(i)), volunteer driving can be deducted using either actual expenses (gas/oil) or the standard charitable mileage rate of **14 cents ($0.14) per mile**, in addition to parking fees and tolls. These volunteer driving expenses are treated as **cash contributions** for AGI tax deductibility limits (subject to the 60% of AGI cap).

This issue details the user stories, IRS reference details, database schema migrations, server-side/action changes, frontend UI changes, and a strict Test-Driven Development (TDD) implementation path to ensure clean integration.

---

## User Stories
1. **Add Mileage Donation:** As a volunteer, I want to add a mileage donation by inputting the Date, Organization, Miles Driven, Parking/Tolls, and Notes, so that I can automatically compute the tax deduction value at the standard 2026 rate ($0.14/mile).
2. **Review in Ledger:** As a taxpayer, I want to see my mileage donations listed in my ledger with a distinct "MILEAGE" type and its calculated total value, so that I have a unified ledger of all giving.
3. **Expand Details:** As a user, I want to click "Expand" on a mileage donation to review the trip details: miles driven, rate applied, parking fees/tolls, attached receipts (such as parking receipts or trip logs), and notes.
4. **Edit/Delete Mileage:** As a user, I want to update or delete a mileage donation if my records change, ensuring the ledger and tax calculators revalidate and update immediately.
5. **Dashboard & Tax Calculations:** As a taxpayer, I want my mileage contributions to be aggregated into the dashboard totals, treated as **CASH contributions** (60% limit category) in the 2026 tax calculator, and included in the total estimated tax savings.
6. **Post-Save Prompt to Log Mileage:** As a user, after finalizing and saving a physical `ITEMS` donation, I want a convenient prompt asking if I want to "Log mileage for this trip" which opens a pre-populated mileage creation form (carrying over the Organization and Date).
7. **Navigate Between Related Donations:** As a user, when viewing the details of a donation, I want to see links to any related donations on that same date for that organization (e.g., viewing item details shows a link to the corresponding mileage donation, and vice versa) to satisfy my mental model of them being connected.

## IRS Regulations & Calculations (2026 and Prior Years)

### 1. Charitable Mileage Deduction Rules
*   **Standard Mileage Rate:** **$0.14 per mile** (statutory rate under IRC Section 170(i)). This rate has been set by statute at exactly 14 cents per mile since 1998, meaning it is uniform across all tax years (both 2026 and all prior years).
*   **Additional Deductions:** Parking fees and tolls are deductible in addition to the mileage rate.
*   **IRS Publication Reference:** [IRS Publication 526, Charitable Contributions](https://www.irs.gov/forms-pubs/about-publication-526) -> Section *Out-of-Pocket Expenses in Giving Services* -> subsection *Car Expenses*.
*   **Deduction Tier:** Unreimbursed volunteer out-of-pocket expenses are treated as **cash contributions** (not non-cash/physical contributions) and are subject to the **60% of AGI limit** tier.
*   **Multi-Year Calculations:** The app continues to support mileage donations for prior tax years using the same $0.14/mile rate. When calculating tax savings:
    *   For pre-2026 years, calculations will delegate to the `defaultCalculator` (`src/utils/calculators/default.ts`), which does not apply the 2026-specific floor/ceilings.
    *   For 2026 and future years with specific caps, it will delegate to their respective year calculators (e.g. `2026.ts`).

### 2. Formulas
*   **Total Donation Value** = (Miles Driven * Mileage Rate) + Parking & Tolls
*   **Example:** Driving 150 miles to volunteer, with a $10.00 parking fee:
    *   Value = (150 * 0.14) + 10.00 = 21.00 + 10.00 = $31.00

---

## Architectural & Product Decisions

### 1. Separate First-Class Donation Types (No Schema Pollution)
*   **Decision:** Driving mileage associated with other donation types (e.g., driving to and from a donation center to drop off physical items) should be logged as a **separate, first-class Mileage donation event**.
*   **Rationale:**
    *   **Simplicity:** Avoids introducing complex conditional UI and fields to the `ITEMS`, `CASH`, and `ASSETS` donation flows, which would pollute their schema and make components like `DonationBuilder` harder to maintain.
    *   **Data Integrity:** The ledger, dashboards, and tax calculators can treat a `MILEAGE` donation cleanly and independently without having to parse sub-components of an `ITEMS` donation.
    *   **Deduction Limits:** Physical items (subject to the 50% AGI limit) and driving mileage (treated as a cash contribution under the 60% AGI limit) have different tax treatments. Storing them as separate donation events simplifies categorization in the calculators.
*   **Instruction:** Do not add mileage-related inputs or database columns to non-mileage donation events (like `ITEMS`, `CASH`, or `ASSETS`). Users wishing to claim mileage for physical item drop-offs should simply log a separate `MILEAGE` event to the same organization on that date.

### 2. Soft-Linking via URL Parameters & Date/Organization Match
*   **Decision:** To connect physical item donations with their corresponding travel trip, we will implement **soft-linking** rather than foreign-key constraints.
*   **Finalization Flow:** After a user saves or updates an `ITEMS` donation, the UI will display a post-save confirmation dialog: *"Donation saved! Did you drive to drop these items off? [Log Mileage for this Trip]"*. Clicking "[Log Mileage]" routes the user to the mileage creation form with pre-populated values.
*   **URL Pre-population:** The creation form at `/donations/new` will parse search parameters (e.g., `?type=mileage&orgId=12&date=2026-07-07`) to pre-initialize the form state.
*   **Visual Association:** Detail and edit views for a donation event will query the database for any other events on the **same calendar date** with the **same organization ID**. If a related event is found (e.g., a `MILEAGE` event found while viewing an `ITEMS` event), the UI will display a link and key details of the related event (e.g. *"Related trip: 🚗 25.5 miles logged ($14.33) - [View Details]"*).

---

## Database Schema Changes

Modify the `DonationEvent` model in [schema.prisma](file:///Users/paul/Documents/github/donation-tracker/prisma/schema.prisma) to add three optional columns. They must be optional so that existing donations of other types (`ITEMS`, `CASH`, `ASSETS`) do not fail.

```prisma
model DonationEvent {
  id             Int           @id @default(autoincrement())
  date           DateTime
  organizationId Int   
  type           String        @default("ITEMS") // "ITEMS", "CASH", "ASSETS", "MILEAGE"
  cashAmount     Float?        // Stores total value for CASH, ASSETS, and MILEAGE (calculated value)
  assetTicker    String?
  assetShares    Float?
  
  // [NEW] Mileage Specific Fields
  milesDriven    Float?        // The number of miles driven for volunteer work
  parkingAndTolls Float?       // Parking fees and tolls incurred during the trip
  mileageRate    Float?        @default(0.14) // The rate utilized ($0.14 per mile for 2026)
  
  notes          String?
  organization   Organization  @relation(fields: [organizationId], references: [id])
  items          DonatedItem[]
  photos         EventPhoto[]
}
```

*Note on migrations:* A Prisma migration should be run (`npx prisma migrate dev --name add_mileage_fields`) to apply these changes to the SQLite database.

---

## Technical Architecture & File Changes

The implementation will span the following layers:

### 1. Server Actions & Types (`src/app/actions`)
*   **[donationActions.ts](file:///Users/paul/Documents/github/donation-tracker/src/app/actions/donationActions.ts):**
    *   Extend the `DonationData` interface:
        ```typescript
        interface DonationData {
          organizationId: number;
          date: Date;
          type?: string;
          cashAmount?: number; // Total calculated value for mileage
          assetTicker?: string;
          assetShares?: number;
          milesDriven?: number;
          parkingAndTolls?: number;
          mileageRate?: number;
          notes?: string;
          items: Array<{ itemId: number; quantity: number; condition: string; lockedValue: number }>;
          photos: string[];
        }
        ```
    *   Update `saveDonation` and `updateDonation` to persist `milesDriven`, `parkingAndTolls`, and `mileageRate`.
*   **[dashboardActions.ts](file:///Users/paul/Documents/github/donation-tracker/src/app/actions/dashboardActions.ts):**
    *   In `getDashboardStats`, loop through `donations` and check if `donation.type === 'MILEAGE'`.
    *   Extract the mileage donation's total value: `(donation.milesDriven || 0) * (donation.mileageRate || 0.14) + (donation.parkingAndTolls || 0)`.
    *   Aggregate this mileage value into `cashTotal` (since the IRS treats unreimbursed volunteer expenses as cash contributions).
*   **[reportActions.ts](file:///Users/paul/Documents/github/donation-tracker/src/app/actions/reportActions.ts):**
    *   In `getReportData`, handle `event.type === 'MILEAGE'`.
    *   Populate `reportItems` with a single entry representing the trip:
        *   `description`: `"Volunteer Mileage: " + milesDriven + " miles @ $" + mileageRate + "/mi"`
        *   `category`: `"Mileage"`
        *   `condition`: `"N/A"`
        *   `quantity`: `milesDriven`
        *   `unitValue`: `mileageRate`
        *   `totalValue`: calculated value + parkingAndTolls
        *   `valuationMethod`: `"Standard Mileage Rate"`

### 2. Tax Calculators (`src/utils/calculators`)
*   **[2026.ts](file:///Users/paul/Documents/github/donation-tracker/src/utils/calculators/2026.ts):**
    *   Verify that `cashTotal` correctly absorbs the mileage totals in the calculator. (Since it receives `cashTotal` from `getDashboardStats`, this will happen automatically if the action aggregates mileage into `cashTotal`).

### 3. Frontend Client Components (`src/app/donations`)
*   **[DonationsClient.tsx](file:///Users/paul/Documents/github/donation-tracker/src/app/donations/DonationsClient.tsx):**
    *   Extend `DonationEvent` client interface with `milesDriven`, `parkingAndTolls`, and `mileageRate`.
    *   Update `calculateTotalValue` to handle `'MILEAGE'`:
        ```typescript
        if (donation.type === 'MILEAGE') {
          return (donation.milesDriven || 0) * (donation.mileageRate || 0.14) + (donation.parkingAndTolls || 0);
        }
        ```
*   **[DonationDetailsClient.tsx](file:///Users/paul/Documents/github/donation-tracker/src/app/donations/[id]/DonationDetailsClient.tsx):**
    *   Update `calculateTotalValue` to handle `'MILEAGE'`.
    *   Render a custom "Mileage Details" card if `donation.type === 'MILEAGE'`:
        *   Show "Miles Driven" (e.g., `45.2 mi`), "IRS Charitable Rate" (`$0.14/mi`), "Parking & Tolls" (e.g., `$8.00`), and the "Total Deductible Value" (`$14.33`).
    *   Accept a `relatedDonations` array prop (loaded by the parent page based on matches to the same date and organization).
    *   If `relatedDonations` contains entries:
        *   If the current event is `ITEMS` and there is a related `MILEAGE` event, render a sub-card: *"Related Trip Mileage: 🚗 25.5 miles logged ($14.33) - [View Details]"*.
        *   If the current event is `MILEAGE` and there is a related `ITEMS` event, render: *"Related Items Donated: 📦 Physical Items Donation - [View Details]"*.
*   **[DonationBuilder.tsx](file:///Users/paul/Documents/github/donation-tracker/src/app/donations/new/DonationBuilder.tsx):**
    *   Add a fourth item to `donationTypes`:
        ```typescript
        { id: 'mileage', title: 'Mileage', description: 'Volunteer driving & parking', icon: '🚗' }
        ```
    *   Update initialization (`useEffect` or state initializer) to read query parameters using Next.js `useSearchParams()`:
        *   Pre-populate `activeType` if parameter `type` is present (e.g. `'mileage'`).
        *   Pre-populate `organizationId` if parameter `orgId` is present.
        *   Pre-populate `date` if parameter `date` is present.
    *   Maintain states for `milesDriven` (string/number), `parkingAndTolls` (string/number), and `mileageRate` (pre-filled to `'0.14'`).
    *   Include a dynamic preview calculation `totalDonationValue` calculation:
        ```typescript
        const totalDonationValue = activeType === 'items'
          ? stagedItems.reduce((acc, item) => acc + item.totalValue, 0)
          : activeType === 'cash'
            ? parseFloat(cashAmount) || 0
            : activeType === 'assets'
              ? parseFloat(assetValue) || 0
              : activeType === 'mileage'
                ? (parseFloat(milesDriven) || 0) * 0.14 + (parseFloat(parkingAndTolls) || 0)
                : 0;
        ```
    *   Render input fields when `activeType === 'mileage'`:
        *   **Miles Driven**: Number input, min = `0.1`, step = `any`, placeholders like `0.0`.
        *   **Standard Mileage Rate ($)**: Read-only disabled input showing `0.14`, with helper text "IRS 2026 Statutory Charitable Rate".
        *   **Parking & Tolls ($)**: Optional number input, min = `0`, step = `0.01`, placeholders like `0.00`.
    *   Update save button logic. The save button should be disabled under the following conditions for mileage:
        *   `milesDriven` is not entered, or `parseFloat(milesDriven) <= 0`.
    *   Update `handleSaveDonation` payloads to extract:
        *   `type: 'MILEAGE'`
        *   `milesDriven: parseFloat(milesDriven)`
        *   `parkingAndTolls: parseFloat(parkingAndTolls) || 0`
        *   `mileageRate: 0.14`
        *   `cashAmount: calculatedTotalValue`
    *   **Post-Save Promotion:** After a successful database save of an `ITEMS` donation event, render a temporary success modal or alert dialog overlay:
        *   Title: *"Donation Saved successfully!"*
        *   Description: *"Would you like to log the volunteer mileage driven for this donation?"*
        *   Buttons:
            *   *Yes, Log Mileage:* Routes to `/donations/new?type=mileage&orgId=${orgId}&date=${date}`.
            *   *No, Go to Ledger:* Routes to `/donations`.

---

## Strict TDD Execution Plan

To adhere to the workspace's strict TDD instructions, follow these steps sequentially:

### Step 1: Write Database Migration & Generate Client
1. Apply the new optional fields to `schema.prisma`.
2. Run database migration command:
   ```bash
   npx prisma migrate dev --name add_mileage_fields
   ```

### Step 2: Write & Satisfy Server Action Tests (TDD)
1. Add new test cases to `src/app/actions/__tests__/donationActions.test.ts`:
   * Test: `should correctly save a MILEAGE donation with milesDriven, parkingAndTolls, and mileageRate`.
   * Test: `should correctly update an existing MILEAGE donation`.
2. Implement backend schema validation and save/update logic in `donationActions.ts` until tests pass.
3. Add test cases to `src/app/actions/__tests__/dashboardActions.test.ts` and `reportActions.test.ts`:
   * Test: `should include mileage donations in the dashboard totals, treating them as cash contributions`.
   * Test: `should format mileage item details appropriately in reports`.
4. Implement modifications in `dashboardActions.ts` and `reportActions.ts` until tests pass.

### Step 3: Write & Satisfy Client Component Tests (TDD)
1. Update `src/app/donations/__tests__/DonationsClient.test.tsx`:
   * Test: `correctly displays MILEAGE donation types and calculates their total value in ledger list`.
2. Implement ledger updates in `DonationsClient.tsx`.
3. Update `src/app/donations/[id]/__tests__/DonationDetailsClient.test.tsx`:
   * Test: `renders Mileage details card when donation type is MILEAGE`.
   * Test: `renders related donations section when matching events (same date and organization) are present`.
4. Implement expand details view and related donations display in `DonationDetailsClient.tsx` and query matching in its parent server component.
5. Update `src/app/donations/new/__tests__/page.test.tsx` (or add tests for `DonationBuilder` rendering):
   * Test: `renders mileage form fields (Miles, Rate, Parking) when Mileage type is selected`.
   * Test: `performs correct real-time preview calculations for mileage donations`.
   * Test: `pre-populates activeType, organizationId, and date from URL search parameters on initialization`.
   * Test: `displays post-save confirmation prompt with Log Mileage link after saving an ITEMS donation`.
6. Implement `DonationBuilder.tsx` changes to satisfy the tests.

### Step 4: Update Project Documentation
1. Update [README.md](file:///Users/paul/Documents/github/donation-tracker/README.md) to add "Mileage" to the list of core donation features.
2. Update [docs/user-guide.md](file:///Users/paul/Documents/github/donation-tracker/docs/user-guide.md) to explain how to log independent mileage donations (e.g. for volunteer driving services) as well as using the soft-linking feature to log mileage for physical item drop-offs.
3. Update [docs/reports-and-sync.md](file:///Users/paul/Documents/github/donation-tracker/docs/reports-and-sync.md) to state that mileage donations are included in ledger reports and calculated under cash contribution limits.

---

## Verification Plan

### Automated Tests
Run the following test suite to verify implementation correctness:
```bash
npm run test
```

### Manual Verification
1. Open the application.
2. Select "Add New Donation".
3. Verify the new "Mileage" option is available in the "Donation Type" selector.
4. Choose "Mileage" and enter 100 miles, 0 parking. Total should display `$14.00`.
5. Add a note and save the donation.
6. Verify the donation appears in the Ledger list as type `MILEAGE` with a value of `$14.00`.
7. Click "Expand" and inspect the breakdown of miles driven, rate, and total.
8. Verify on the Dashboard that this $14.00 is aggregated into the Cash donation limit and tax calculations.
