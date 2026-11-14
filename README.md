# Inventory Management

Angular application for customer, supplier, stock, purchase, sales, payment, and reporting workflows.

Use Node.js **22.22.3+**, **24.15.0+**, or **26.x** (within those major versions). Dependencies are pinned in `package.json` and `package-lock.json` for reproducible installs.

```sh
npm ci
npm start
```

The development server runs at http://localhost:4200. Firebase settings are in `src/environments/environment.ts` and `environment.prod.ts`.

```sh
npm run build   # production output: dist/InventoryManagement/browser
npm test        # Angular + Vitest component/service tests, no live Firebase requests
npm run lint    # ESLint for TypeScript and Angular templates
npm exec -- playwright install chromium
npm run e2e    # browser smoke tests; starts the development server automatically
```

To use an installed Chrome instead of downloaded Chromium, run `PLAYWRIGHT_CHANNEL=chrome npm run e2e`.

Run `npm run verify` for lint, unit tests, and the production build. The dependency audit is clean (`npm audit`). CI also runs both browser suites.

For Firebase integration tests, install **Java 21** and run:

```sh
npm run e2e:integration
```

This starts the official Auth and Firestore emulators, seeds disposable data in `demo-inventory-upgrade`, checks real SDK login/logout and payment writes, renders a customer report, and downloads sales/purchase invoice PDFs. It never connects to the production Firebase project. The pinned Firebase CLI is fetched into npm's tool cache on first use. Emulator rules under `e2e/firebase/` are test-only.

Reports use **AG Grid Community (MIT)** with sorting, text/number filters, row numbers, and resizable columns. Sales, purchase, and person-wise reports retain both a visible **View** button and the right-click **View** action. Actions use the row's actual record, so sorting or filtering does not change the transaction opened. Payment rows in person-wise reports retain the payment-record notice. No grid license key or commercial build configuration is required.

```sh
npm run build:release
```

See [the dependency migration notes](DEPENDENCY_UPGRADE.md) for compatibility decisions and verification details.


## Yugan invoice printing

Sales and purchase invoices share the theme setting in
`src/app/transaction/invoice/invoice.config.ts`:

- `theme: 'monochrome'` (default): black text, light grey rules, and minimal ink coverage for black-and-white printers.
- `theme: 'color'`: the navy-and-copper design, with the same information and A4 pagination.

Change this one setting and rebuild to switch both invoice PDFs. Print at A4 / 100% scale.

`factoryAddress` holds the clearly marked temporary factory/godown address; replace it with the actual address when available. `jurisdictionText` controls the optional commercial jurisdiction line; set it to `null` to omit it. Tax rows follow recorded invoice tax amounts. Local invoices show Tamil Nadu (33); interstate invoices use a recorded `placeOfSupply` when available and otherwise clearly flag that the destination state needs confirmation.
