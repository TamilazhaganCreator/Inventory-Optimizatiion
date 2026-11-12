# Dependency migration — 12 November 2026

The original application used Angular 7.1, TypeScript 3.1, Firebase 5, Handsontable 6, and the legacy Angular CLI webpack/Karma/TSLint/Protractor toolchain.

## Angular upgrade process

Reviewed the official [Angular update guide](https://angular.dev/update-guide), [ng update reference](https://angular.dev/cli/update), and [version compatibility table](https://angular.dev/reference/versions).

Angular's automated upgrade process advances one major version at a time, applying migrations and verifying each step with a supported Node.js and TypeScript version. This change instead performs a **manual compatibility migration** to Angular 22.2.6: it does not claim that the Angular 8–22 `ng update` schematics were executed. The old Angular-specific Firebase and Materialize integrations cannot be carried into the final dependency tree unchanged. The current source, tooling, production build, and tests have been migrated together.

For future Angular majors, use `ng update @angular/core@^<next-major> @angular/cli@^<next-major>`, follow that release's guide, and run the checks in the README before proceeding to another major. Do not use `--force` to conceal incompatible peer dependencies or `--next` for stable upgrades.

## Selected versions and compatibility

| Dependency | Target |
| --- | --- |
| Angular framework, CLI, build, compiler, language service | 22.2.6 |
| TypeScript | 6.0.3 |
| RxJS / Zone.js | 7.8.2 / 0.16.3 |
| Firebase | 13.3.0 |
| AG Grid Community / Angular component (MIT) | 36.3.0 |
| Materialize maintained package | @materializecss/materialize 2.4.0 |
| jsPDF / html2canvas | 4.2.1 / 1.4.1 |
| Vitest / Playwright | 5.1.0 / 1.65.0 |

The npm registry was checked for stable releases. TypeScript 7.0.2 is newer, but Angular 22 requires TypeScript `>=6.0 <6.1`; 6.0.3 is the latest compatible stable release. Angular animation packages remain aligned with the framework at 22.2.6 despite their deprecation, to preserve the existing animation behavior.

## Source and tooling changes

- Replace string-based lazy routes with dynamic imports and explicitly keep components/pipes in their existing NgModules.
- Use `@angular/build:application`, current serve/extraction targets, modern browser targets, and current Zone.js entry points. Explicitly retain eager component change detection (Angular 22 defaults to OnPush) and enable Zone.js change detection to preserve the app's subscription/timer-based updates under Angular 22.
- Replace AngularFire with a small injectable Firebase SDK initialization service. The latest AngularFire release (21.0.0) requires Angular 21 and TypeScript below 6. Firebase's official `compat` APIs preserve existing Firestore queries, document references, batched writes, and promise results. Document reads that previously returned AngularFire Observables are wrapped with RxJS `from`. A future modular Firebase API migration can be done separately.
- Replace `angular2-materialize` with a local directive over the maintained Materialize API. Keep selects native so Angular value binding and dynamic options work. Translate modal callbacks/actions, collapsible actions, date formatting/input events, and navigation dropdowns. The directive corrects the invalid dropdown `top` value emitted by Materialize 2.4.
- Replace Handsontable and its Angular wrapper with `ag-grid-community` and `ag-grid-angular` 36.3.0. A shared report grid uses only Community modules, retaining sorting, text/number filtering, row numbering, column resizing, and negative-balance styling. Sales/purchase/person-wise reports expose View buttons and preserve the right-click View action. Outputs carry the actual row record, so navigation remains correct after sorting/filtering; person-wise payment records retain their warning instead of navigating to an invoice.
- Use current default/named imports for html2canvas/jsPDF and explicit A4 image dimensions for PDF generation. Preserve the float grid used by the existing templates and fix clipped invoice totals revealed by rendered-PDF QA.
- Replace retired TSLint/Codelyzer, Karma/Jasmine, and Protractor tooling with ESLint, Angular's Vitest builder, and Playwright. Component tests use mocked Firebase and actual feature modules. JSDOM shims cover missing layout APIs; Playwright covers real browser interactions.
- Remove unused jQuery, Hammer.js, core-js direct dependency, node-snackbar, obsolete AngularFire wrappers, and legacy tool configurations. TypeScript's original non-strict behavior is explicitly retained; enabling strict typing throughout the business models is a separate change.

## Free reporting grid

All seven reports use [AG Grid Community](https://www.ag-grid.com/angular-data-grid/community-vs-enterprise/), whose installed packages declare the MIT license. No Enterprise package or feature is used. The user requested a free replacement, so Handsontable, its CSS, environment license settings, and build-time license checks have been removed. Both normal and release builds use Angular CLI directly and require no grid key.

View actions now appear in a pinned Actions column as well as a small application-owned right-click menu. These use the actual row data, rather than a displayed row index, to avoid opening the wrong invoice after sorting or filtering. All existing report-level filter controls and totals are retained.

## Audit and verification limits

`npm audit` reports **zero vulnerabilities**. Scoped overrides resolve Firebase Firestore's Node transport to `@grpc/grpc-js 1.14.7` and ESLint/typescript-eslint minimatch consumers to `11.0.8`. These intentionally exceed the upstream narrow dependency ranges to apply the published security fixes while retaining the latest direct releases. The Node SDK's real authentication/Firestore queries/batches run against official emulators, exercising the patched transport. Lint, unit tests, browser tests, and the production build verify the affected consumers. Remove the overrides once upstream packages declare patched ranges.

The production build emits CommonJS optimization warnings from html2canvas and jsPDF's optional canvg/core-js dependencies. These warnings do not prevent the build.

Firebase acceptance checks now run against the official Auth and Firestore emulators with a demo project, authenticated test-only rules, and disposable data. No production credentials are needed or used. The integration setup verifies unauthenticated access is denied, then authenticates and commits/query-checks seed data using the Node SDK. Browser tests verify invalid/valid login, logout, payment persistence, the updated customer balance, customer report rendering, and both invoice downloads. Requests to Google production API endpoints fail the browser suite.

Exported sales and purchase PDFs were rendered to PNGs with PDF.js and visually inspected. This exposed Materialize 2's CSS-grid incompatibility with the existing float layouts and html2canvas. `src/legacy-layout.css` preserves the original grid semantics; invoice total pairs use a stable flex layout to prevent clipping. Stored invoices restore customer/supplier addresses, and purchase exports use the same high-resolution canvas settings as sales. Both inspected samples have a legible A4 page with complete totals and footers.

The deployed Firebase project's actual security rules cannot be established from this repository. No deployment was performed.

## Validation results

- `npm ci`: passed from the final lockfile; zero audit findings.
- `npm run build`: passed; production output generated within the existing bundle budget.
- `npm test`: 26 tests passed across 22 files, including real feature-module rendering, Firebase authentication delegation, and date-picker event regression coverage.
- `npm run lint`: passed.
- `npm run e2e`: 3 Chromium tests passed: empty login validation/toast rendering, saved-session navigation dropdowns, and the lazy sales route with date-picker updates and cheque-modal actions. The saved-session flag is seeded only inside browser tests; these do not authenticate against Firebase.
- `npm run e2e:integration`: 8 emulator-backed browser tests passed, including Node SDK setup checks and valid A4 PDF exports, unclipped invoice totals; sorted/filtered sales and purchase navigation, and person-wise customer/supplier invoice actions plus the payment-record guard.
- `npm audit`: zero vulnerabilities.
- `.github/workflows/ci.yml`: added current stable Actions releases to run clean installation, audit, verification, and both browser suites on Node 24 / Java 21. The remote workflow has not been triggered from this workspace.
- `npm ls --depth=0`: passed with no invalid direct dependencies.
- `git diff --check`: passed.
