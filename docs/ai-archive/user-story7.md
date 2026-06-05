# Application User Stories & Acceptance Criteria

User stories 1 through 6 have already been implemented.

---

## 7. Active Itemizer Tax Savings Engine (2026+)

**Story:** As a user who already itemizes my tax deductions, I want to configure my Estimated AGI alongside my Marginal Tax Rate on the Settings page, and see a dynamic, high-precision calculation of my 2026+ tax savings on the Dashboard that handles regulatory floors and ceilings seamlessly based on the selected tax year.

### Acceptance Criteria:

#### 7a. Settings Page Inputs

* **Estimated AGI Entry:** On the Settings card, add a new numeric text input labeled `ESTIMATED AGI ($)`. This configuration must save persistently to the database settings model alongside the existing `MARGINAL TAX RATE (%)` field.

#### 7b. Decoupled, Year-Specific Calculation Architecture

* The tax engine utility functions must be abstracted into a strategy pattern (e.g., `calculators/2026.ts`, `calculators/2027.ts`) mapping to the active selection in the Dashboard's `TAX YEAR` pulldown element. This allows effortless code updates for future tax adjustments without breaking previous years' historical logs.

#### 7c. The 2026 OBBBA Core Calculation Rules

When the `TAX YEAR` pulldown is set to `2026`:

* **The 0.5% AGI Floor:** The system automatically calculates a baseline non-deductible floor: $\text{Floor} = \text{Estimated AGI} \times 0.005$.
* **The 35% High-Earner Benefit Cap:** If the saved `Marginal Tax Rate` is set to `37%`, the calculator automatically drops the effective calculation rate for itemized deductions down to `35%`.
* **Asset-Specific Ceilings:**
* Deductions derived from Cash & Asset-type events are capped at **60% of AGI**.
* Deductions derived from Physical Items are capped at **30% of AGI**.

#### 7d. Dashboard Dynamic States & Progressive Helper Text

The `ESTIMATED TAX SAVINGS` display container on the Dashboard must dynamically render one of three states:

* **State 1: Below the Floor (Total Giving $\le$ Floor)**
* **Calculated Savings Display:** `$0.00`
* **Helper Text:** *"You are **$X** away from clearing your statutory 2026 0.5% AGI floor ($Y). Once crossed, your giving will begin unlocking tax savings."* (Where $X$ is the remaining dollar amount needed to clear the floor).


* **State 2: In the Active Zone (Floor $<$ Total Giving $\le$ Ceilings)**
* **Calculated Savings Display:** True calculated tax impact based on the effective marginal rate applied only to the value exceeding the floor.
* **Helper Text:** *"Your donations are actively saving you money! You can log another **$Z** in contributions before hitting your annual AGI deduction limit."*


* **State 3: Above the Ceiling (Total Giving $>$ Ceilings)**
* **Calculated Savings Display:** The maximum allowable tax savings capped strictly at the AGI threshold limits.
* **Helper Text:** *"You have fully maximized your allowable 2026 deductions. Remaining tracked balances will carry forward as future tax assets."*
