# Changelog

## [1.5.2](https://github.com/padolph/donation-tracker/compare/v1.5.1...v1.5.2) (2026-06-18)


### Bug Fixes

* set default marginal tax rate to 22% and AGI to $100K ([601d91a](https://github.com/padolph/donation-tracker/commit/601d91adba2f85a68746c6e5a88c6ef7b55838f2))
* set default marginal tax rate to 22% and AGI to $100K ([9f7acde](https://github.com/padolph/donation-tracker/commit/9f7acde07fb334086d29e0a2d831088ccc51c88d))

## [1.5.1](https://github.com/padolph/donation-tracker/compare/v1.5.0...v1.5.1) (2026-06-14)


### Bug Fixes

* 85 resolve startup app icon unpacking race condition ([aabe14f](https://github.com/padolph/donation-tracker/commit/aabe14ff6ea60f9563e1fcdb766010d057105185))
* resolve startup app icon unpacking race condition ([baeae29](https://github.com/padolph/donation-tracker/commit/baeae2996d717029fca190020ee4a6fe085e2f72))

## [1.5.0](https://github.com/padolph/donation-tracker/compare/v1.4.0...v1.5.0) (2026-06-12)


### Features

* 75 feat add export import feature ([cb84677](https://github.com/padolph/donation-tracker/commit/cb84677a9f312be3b047734fbe4082d5175b371b)), closes [#75](https://github.com/padolph/donation-tracker/issues/75)
* implement sync package export and import with UI and unit tests ([5900d65](https://github.com/padolph/donation-tracker/commit/5900d655d0c7d13e1e213ad0e7805e6ce67d1214))


### Bug Fixes

* enforce string-level includes and indexOf sanitizer inline to satisfy CodeQL tracking ([269df10](https://github.com/padolph/donation-tracker/commit/269df100840f275e1d5260e4de9831cfa6069b18))
* harmonize path traversal startsWith check using path.sep separator ([576ee18](https://github.com/padolph/donation-tracker/commit/576ee18a7203f6ae64ea53feac5a66dedd8fc467))
* implement isSafeArchiveEntryName sanitization suggested by CodeQL ([561eeee](https://github.com/padolph/donation-tracker/commit/561eeeea657c3eaf26eff03e3617a5a4c62ce896))
* implement resolveSafeArchiveTargetPath as suggested by CodeQL ([c328286](https://github.com/padolph/donation-tracker/commit/c328286455f856fd33b9232f19d32a41a56c0da6))
* inline char-by-char validation loop inside render context to resolve CodeQL XSS warning ([55665cc](https://github.com/padolph/donation-tracker/commit/55665cc83acd93e65abbfc442f563372f9648d77))
* inline path traversal sanitization checks to satisfy CodeQL inter-procedural restrictions ([768563b](https://github.com/padolph/donation-tracker/commit/768563bde442100f75aaa605c7830beb62e92258))
* resolve CodeQL DOM-based XSS vulnerability in image preview ([c0a219e](https://github.com/padolph/donation-tracker/commit/c0a219ee43049fdecc29c19c6aa77dd7bbb6178c))
* resolve CodeQL DOM-based XSS vulnerability in image preview ([4e8db64](https://github.com/padolph/donation-tracker/commit/4e8db64dfec18ce9bd56c8452e78c73782062789))
* sanitize zip entry paths in sync actions to satisfy CodeQL ([d800995](https://github.com/padolph/donation-tracker/commit/d8009958f740e1ee82d6d36cafe6b5e941389166))

## [1.4.0](https://github.com/padolph/donation-tracker/compare/v1.3.0...v1.4.0) (2026-06-11)


### Features

* Force release again ([03bad30](https://github.com/padolph/donation-tracker/commit/03bad30a01feb654eb04b21eb1b56a2b3915e9a8))

## [1.3.0](https://github.com/padolph/donation-tracker/compare/v1.2.0...v1.3.0) (2026-06-11)


### Features

* Force release again ([03bad30](https://github.com/padolph/donation-tracker/commit/03bad30a01feb654eb04b21eb1b56a2b3915e9a8))

## [1.2.0](https://github.com/padolph/donation-tracker/compare/v1.1.2...v1.2.0) (2026-06-10)


### Features

* **dashboard:** generalize AGI floor description to be year-independent ([c8b8e90](https://github.com/padolph/donation-tracker/commit/c8b8e90b7fc097bd7c4eafceee383124d7f33faf))
* **dashboard:** show helper text and progress bar before AGI floor is met ([a00fd2a](https://github.com/padolph/donation-tracker/commit/a00fd2acd1cd9a723c4ea89c8ac97bebe04068b6))
* show application version at bottom of sidebar ([#84](https://github.com/padolph/donation-tracker/issues/84)) ([8a140a4](https://github.com/padolph/donation-tracker/commit/8a140a49b2fcfe5c12a11f97555453c57512ca6a))


### Bug Fixes

* add image loading retry mechanism for sidebar app icon ([#85](https://github.com/padolph/donation-tracker/issues/85)) ([60a487c](https://github.com/padolph/donation-tracker/commit/60a487c5a5f1e048a97dfbf6041f1b0d591748c1))
* **donations:** restrict condition dropdown to High and Medium and resolve relative database path mismatch ([e8dfae2](https://github.com/padolph/donation-tracker/commit/e8dfae25e68fcdbd61c8e2b58f4cf75f0eec04e8))
* **test:** dynamically check sidebar version from package.json ([336a173](https://github.com/padolph/donation-tracker/commit/336a17390b13cccddacefd17c672908b2cfa5a4e))

## [1.1.2](https://github.com/padolph/donation-tracker/compare/v1.1.1...v1.1.2) (2026-06-08)


### Bug Fixes

* implement cascading AGI limits and add remaining room UI lines ([55e3ad7](https://github.com/padolph/donation-tracker/commit/55e3ad78a9d67a60636547956fba4c60ebf224e8))
* update tax savings calculation and remove redundant sentence ([a315c05](https://github.com/padolph/donation-tracker/commit/a315c05484770d8e490ca24e2867660b1f7368c6))

## [1.1.1](https://github.com/padolph/donation-tracker/compare/v1.1.0...v1.1.1) (2026-06-07)


### Bug Fixes

* **reports:** format asset donations with ticker as description, shares as quantity, and total value as unitValue ([73e242b](https://github.com/padolph/donation-tracker/commit/73e242bf41605ba1144ee4bb08599b8bb40bf553))
* **ui:** correct application name to DonationTracker in layout, sidebar, and login ([eac53de](https://github.com/padolph/donation-tracker/commit/eac53de7a1abdb54acda7127b9fa0cb7f98624d5))
* **ui:** rename adjust tax rate button to adjust tax settings on dashboard ([9fb71d9](https://github.com/padolph/donation-tracker/commit/9fb71d91ea18c98adb87a2c9f93f80765d26ced4))

## [1.1.0](https://github.com/padolph/donation-tracker/compare/v1.0.0...v1.1.0) (2026-06-05)


### Features

* implement 2026 OBBBA tax savings compliance engine ([9d4fc22](https://github.com/padolph/donation-tracker/commit/9d4fc22b56caa656059b227a57411cde81598607))


### Bug Fixes

* make updateSettings properties optional to resolve TS compilation error ([871574c](https://github.com/padolph/donation-tracker/commit/871574c77fbfa864e85396d6a7020a5c6ee5e265))

## 1.0.0 (2026-06-04)


### Features

* add hierarchical browse feature for item selection ([67f0f5f](https://github.com/padolph/donation-tracker/commit/67f0f5fcee8f6efc11ff48d85aa556b7ed775472))
* add icons for packaged app ([3286bcd](https://github.com/padolph/donation-tracker/commit/3286bcd03086aeea41bb5293eddb0eec12f91741))
* add image overlay for donation attachments in ledger ([62f35e2](https://github.com/padolph/donation-tracker/commit/62f35e222aca61a6b4fcf4d72b409d206fd06638))
* add PDF support to donation attachment overlay ([adc6ddf](https://github.com/padolph/donation-tracker/commit/adc6ddf881b688ebd171d2c6f241e284c6830fec))
* add read-only display of image storage path to settings page ([7a1338a](https://github.com/padolph/donation-tracker/commit/7a1338ac81f4ce3f84ccda91e8d15d1ebac9cfd9))
* **auth:** add first-run setup wizard for app password ([fea4208](https://github.com/padolph/donation-tracker/commit/fea4208fcb7738c595e4b4add8ad7627691915de))
* complete User Story [#1](https://github.com/padolph/donation-tracker/issues/1) with UI overhaul and server config fixes ([dcaaf4f](https://github.com/padolph/donation-tracker/commit/dcaaf4f5549dad16ec4404fcb9cb0bc359eff242))
* configure prisma and initialize sqlite database ([749cccd](https://github.com/padolph/donation-tracker/commit/749cccdba39f99abf7df0dc906965a4c5a595392))
* **desktop:** resolve custom icon on Linux/ChromeOS and in sidebar ([f3884c9](https://github.com/padolph/donation-tracker/commit/f3884c98cf2d89f9c434e2e71d966a87fa9e48e2))
* display read-only database path on settings page and add ANTIGRAVITY.md ([9d9a3ea](https://github.com/padolph/donation-tracker/commit/9d9a3ea0735969626dceacf78342ddbdc9501c3f))
* **donations:** add dedicated donation details subview page and remove inline expansion ([ed754ff](https://github.com/padolph/donation-tracker/commit/ed754ff90c03d624420077e6f7f8e311df8b1b57))
* **donations:** relocate edit donation action from ledger table to details subview page ([320a2a3](https://github.com/padolph/donation-tracker/commit/320a2a39b3a34590a7862555361ff7eb1f7687ff))
* **electron:** handle production environment variables and dynamic database path ([0523adb](https://github.com/padolph/donation-tracker/commit/0523adbef9c5c25cfe2b44473b49dcc0d1c49d67))
* implement annual tax reporting dashboard and archival export ([601e73c](https://github.com/padolph/donation-tracker/commit/601e73ca86b20363b282835ba7b507cb10d95f74))
* implement Electron wrapper with production readiness fixes ([e916e3b](https://github.com/padolph/donation-tracker/commit/e916e3b4e1817bfc01f9fc162df2903e30fd4841))
* implement password protection via NextAuth.js ([bcee749](https://github.com/padolph/donation-tracker/commit/bcee7496458524b2961e7ce6a94deddb48f545d9))
* implement User Story [#2](https://github.com/padolph/donation-tracker/issues/2) for cash and asset donations ([20cc9d4](https://github.com/padolph/donation-tracker/commit/20cc9d46e7a088ce9f952a278b610ccc3cd54b04))
* implement User Story [#3](https://github.com/padolph/donation-tracker/issues/3) (Organization Management) and fix item search ([deaddd4](https://github.com/padolph/donation-tracker/commit/deaddd4cd184f0fbef292ea815ba7de63bd10e1d))
* implement User Story [#4](https://github.com/padolph/donation-tracker/issues/4) Donation Ledger & Browsing with edit and delete capabilities ([7724182](https://github.com/padolph/donation-tracker/commit/7724182e58407eb1a07ee5dc2fc8221f1cf67a9c))
* implement User Story [#5](https://github.com/padolph/donation-tracker/issues/5) Dashboard & Year Summaries ([4bf9cbc](https://github.com/padolph/donation-tracker/commit/4bf9cbc399cb4963413519ebf1ec47f8b7afc2de))
* **linux:** minimize window chrome by hiding default menu bar ([00ee88b](https://github.com/padolph/donation-tracker/commit/00ee88ba42f562a4bd276be93eb0a6004dbf79ac))
* populated initial db, added user stories, more AI config ([9b12643](https://github.com/padolph/donation-tracker/commit/9b126439464052bfde5f9d585182552c3cb3fa1b))
* remove nonfunctional Dashboard and Sidebar cards ([4f8e1ae](https://github.com/padolph/donation-tracker/commit/4f8e1ae304eadcaa42456b7fa4ca8436a49386e4))


### Bug Fixes

* **actions:** clean up associated photo files when a donation is deleted ([565ec4e](https://github.com/padolph/donation-tracker/commit/565ec4e5011dd2bc8a9e5b5ef52eea6037c6137e))
* **auth:** prevent generic PASSWORD environment variables from overriding setup wizard detection ([5cf2e46](https://github.com/padolph/donation-tracker/commit/5cf2e464dc601c2bb08ab5cab62dd3f234ad61eb))
* **auth:** resolve ESLint warnings in setup wizard actions and tests ([331a75d](https://github.com/padolph/donation-tracker/commit/331a75da5d7d1f06741d5b8565938d038649dd9d))
* **build:** resolve path mismatch and stale Prisma client in desktop:build ([a0ebff7](https://github.com/padolph/donation-tracker/commit/a0ebff7668654783c8bbf915ed1b207723f548b7))
* **ci:** rebuild electron native modules for linux and align prisma binary targets ([cc0194c](https://github.com/padolph/donation-tracker/commit/cc0194c319f4cfcb41ee674b0339fadbb7df81ad))
* **ci:** remove npm_config_build_from_source to prevent sharp build failure ([7ffa4a4](https://github.com/padolph/donation-tracker/commit/7ffa4a48d3ddba087a8831f3c8dcd38371e2ccf9))
* **ci:** target both x64 and arm64 architectures on macOS ([55120e8](https://github.com/padolph/donation-tracker/commit/55120e8aa802bb86e4ba7ade5e03f0a99409096e))
* **ci:** use absolute database path for production seeding in github workflow ([f4bfe14](https://github.com/padolph/donation-tracker/commit/f4bfe1440a6a22c3782d48f54a967ad7a166abc0))
* **deps:** override postcss to resolve moderate security vulnerability ([8ca37e8](https://github.com/padolph/donation-tracker/commit/8ca37e8ce453892c473cdceef59bd9d488f3d3f2))
* **desktop:** exclude tests from electron compiler in tsconfig ([72f8d98](https://github.com/padolph/donation-tracker/commit/72f8d98e239a4923f563480a2476ff9f2fe79ddf))
* **desktop:** unpack public assets in ASAR for next server to access them ([eca8a90](https://github.com/padolph/donation-tracker/commit/eca8a90b5a7f3138477d3d25e14fe43b632e1154))
* **electron:** assign DATABASE_URL to process.env before Next.js initialization ([1e06905](https://github.com/padolph/donation-tracker/commit/1e06905e8f1a51bf33614bdc58567f12eccf309c))
* implement database fallback for old photo attachments and resolve test environment issues ([2e996e6](https://github.com/padolph/donation-tracker/commit/2e996e668e564882d3b0993161326f67859a8237))
* make database path override dynamic and package seeded production template ([767e78e](https://github.com/padolph/donation-tracker/commit/767e78e51b34f8d6a5d099c8ddeb631dbdcaf0df))
* prevent item duplication and make seeding idempotent ([1f067e3](https://github.com/padolph/donation-tracker/commit/1f067e337215439c2603dc6ecf720228734d7137))
* **prisma:** add darwin binary target for Intel macOS support ([b3824fd](https://github.com/padolph/donation-tracker/commit/b3824fd3e1e93de76c1c5170048f6288681bf382))
* **prisma:** remove unsupported RegExp /s flag for ES2017 target ([61ef673](https://github.com/padolph/donation-tracker/commit/61ef673b16844e26d529f3fd6ddd9689d9153c78))
* resolve hydration mismatch in ReportClient timestamp ([191e8b8](https://github.com/padolph/donation-tracker/commit/191e8b8004eab732375c8d5194b34403d002d8a0))
* resolve TypeScript compiler error with Node Buffer in NextResponse constructor ([af9b998](https://github.com/padolph/donation-tracker/commit/af9b9986403071b0e6ea5804d5547cf6f55514ad))
* standardize PDF thumbnails and restore missing attachments in edit view ([7501f22](https://github.com/padolph/donation-tracker/commit/7501f2268b6ba7ae3a7a8f5e52cc2b0e19080563))
* sync react and react-dom versions ([cb02dbb](https://github.com/padolph/donation-tracker/commit/cb02dbb437cbe0faec41cb71fcbd2fde0ac4e89a))
* **test:** exclude build directories and correct mock assertions ([e658524](https://github.com/padolph/donation-tracker/commit/e6585242b010f0b821c33ece7c93b70c100b70b0))
* use --legacy-peer-deps in CI for NextAuth compatibility ([295ff14](https://github.com/padolph/donation-tracker/commit/295ff146651b932a582e3e9143946689c8cb75d3))
