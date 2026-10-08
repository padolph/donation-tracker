# Keeping Item Values Current

Donation Tracker ships with a catalog of 1,700+ items and suggested Fair Market Values. Thrift-store prices change over time, so you can update those values from a CSV file whenever you like.

Updating the catalog only changes the values suggested for **new** donations. Every donation you have already saved keeps the value it was recorded with, and your own custom items are never changed.

---

## Where to find it

Go to **Settings** and scroll to **Item Value Catalog**. It has three controls:

* **Download catalog:** saves the current catalog as a CSV in the import format below. Edit it in a spreadsheet, or give it to an AI assistant (see the prompt below), then import the result.
* **Use bundled values:** loads the values that shipped with the version of Donation Tracker you are running. Use this after an app update to pick up refreshed values, or to undo an earlier import.
* **Import values from CSV:** choose a CSV file to load.

Both import options show a preview first: how many items will be updated, added or left unchanged, the first changes with old and new values, and any rows that could not be read. Nothing changes until you click **Apply**.

---

## File format

A CSV file with this header row (the same format as the bundled `prisma/seed-data.csv`):

```csv
Item Category,Item Description,High Quality Value,Medium Quality Value
Clothing,Clothing: Men's Jeans,$12.00,$6.00
Kitchen,Kitchen: Blender,25,
```

| Column | Meaning |
| --- | --- |
| Item Category | The catalog category, such as `Kitchen` or `Sporting Goods`. |
| Item Description | The full item name. Catalog items use `Group: Item`, and the part after the last `:` is what searches show. |
| High Quality Value | The value for an item in excellent condition. |
| Medium Quality Value | The value for an item in good condition. |

How rows are handled:

* Rows are matched to existing items by **category and description**, exactly as written. A row that matches nothing is added as a new catalog item, creating its category if needed.
* Values may be written as `$12.00`, `12`, or `1,050.50`. They are rounded to cents.
* A **blank** value means "leave this value alone", not zero. Leave both blank, or simply leave the row out, to skip an item.
* Items that are not in the file are left as they are. Nothing is ever deleted.
* Rows matching one of your custom items are skipped.
* Rows with problems (a missing category or description, an amount that isn't a number, a High value below the Medium value, or a repeated item) are listed by line number in the preview and skipped. The rest of the file still imports.
* Files can be up to 5MB.

---

## Building an updated file with an AI assistant

Charities publish donation value guides, for example:

* Goodwill NNE: https://goodwillnne.org/donate/donation-value-guide/
* The Salvation Army: https://satruck.org/Home/DonationValueGuide

These guides list price ranges for broad item types. An AI assistant that can browse the web can match them to the catalog for you. Click **Download catalog**, attach the file to a chat with the assistant, and paste this prompt:

```text
The attached CSV is the item value catalog from my donation tracking app.
Its columns are: Item Category, Item Description, High Quality Value,
Medium Quality Value.

Please read these current donation value guides:
- https://goodwillnne.org/donate/donation-value-guide/
- https://satruck.org/Home/DonationValueGuide

For each catalog row that clearly corresponds to an item type in the guides,
work out new values:
- High Quality Value = the top of the guides' price range for that item.
- Medium Quality Value = the midpoint of that range.
- If the guides disagree, use the average of their values.

Rules:
- Copy Item Category and Item Description exactly as they appear in my file,
  character for character, so the rows match my catalog.
- Only include rows you are confident about. Leave out any row where the
  guides have no clearly matching item. Do not invent new items.
- Write amounts like $12.00. High must not be lower than Medium.
- Output only CSV with the same header row, with no commentary, so I can save
  it as a .csv file.

After the CSV, in a separate message, list the guide entries you used for
each category so I can spot-check them.
```

Save the assistant's CSV output as a `.csv` file, then choose it under **Import values from CSV**. Check the preview before you apply it: the old and new values appear side by side, so a mismatch is easy to spot. If something looks wrong, don't apply it, or click **Use bundled values** later to go back to the shipped values.

> These values are estimates to help you prepare your return. You are responsible for the values you claim. For items worth more than $500 in total, see the guidance for IRS Form 8283 in [Reports & Sync](reports-and-sync.md).

---

## For maintainers

* `prisma/seed-data.csv` is the bundled catalog. To refresh it for a release, edit it, or export from a database that has the values you want and replace the file. Test with `npx jest prisma/__tests__/catalogValues.test.ts`, which checks that the bundled file parses cleanly.
* The seed (`prisma/seed.ts`) only **adds missing items**. Docker runs it on every boot, so it must never overwrite values a user imported. Existing installs pick up new bundled values through **Use bundled values**.
* Parsing and updating live in `prisma/catalogValues.ts`, which the seed and the Settings page both use.
