# AI Automation Practice

Playwright end-to-end tests for the Rahul Shetty Academy client shop at `https://rahulshettyacademy.com`. The suite signs in, checks the catalog and cart, checks out, and places an order. One Chromium worker runs the tests in order because they share a single shop account and cart.

## Project architecture

```text
playwright.config.ts          Root Playwright config
tests/shop.spec.ts            Scenarios
tests/playwright.config.ts    Re-exports the root config with testDir set to tests/
fixtures/test.ts              shop fixture: page objects, test data, credentials
pages/                        Page objects
utils/money.ts                Parses cart amounts
test-data.json                Products, invalid email, and payment data
.env                          Local EMAIL, PASSWORD, and optional BASE_URL
.github/workflows/playwright.yml
```

`npm test` from the repository root uses `playwright.config.ts`. That file loads `.env`, points `testDir` at `tests/`, and runs only the `chromium` project on Desktop Chrome. The test timeout is 120 seconds and the expect timeout is 15 seconds. `fullyParallel` is off and `workers` is 1.

`fixtures/test.ts` builds a `shop` object for each test:

| Piece | Role |
|---|---|
| `login` | Opens `/client` and submits the login form |
| `dashboard` | Reads the catalog, adds a product, and reads the cart count |
| `cart` | Opens the cart, checks line items, stock, and the total |
| `checkout` | Fills CVV and card name, selects the country, and places the order |
| `confirmation` | Asserts the thank-you message and an order id |
| `data` | Contents of `test-data.json` |
| `credentials` | `EMAIL` and `PASSWORD` from the environment |

`utils/money.ts` turns cart price text into a number so the cart total can be compared with the sum of the line prices.

## Tags explanation

Describe-level tags apply to every test in that block. A test can add its own area tags.

| Tag | Meaning |
|---|---|
| `@smoke` | Short shop checks in the `shop scenarios` block |
| `@regression` | The full two-product order in `shop end to end` |
| `@valid` | A path that should succeed with the real account |
| `@invalid` | A path that should be rejected or leave state unchanged |
| `@login` | Login screen |
| `@dashboard` | Catalog and cart count |
| `@cart` | Cart contents, stock, or total |
| `@checkout` | Checkout form and country |
| `@confirmation` | Order confirmation |

Examples:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @cart
npx playwright test --grep "(?=.*@smoke)(?=.*@checkout)"
```

The last command runs smoke tests that are also tagged `@checkout`.

## Modes explanation

| Mode | Command | What changes |
|---|---|---|
| Headless | `npm test` | Default local run. The browser stays hidden. Retries are 0. |
| Headed | `npx playwright test --headed` | The Chromium window is visible. |
| Debug | `npx playwright test --debug` | Playwright Inspector pauses the run so you can step through it. |
| UI | `npx playwright test --ui` | Playwright UI mode for picking and watching tests. |
| CI | GitHub Actions | `CI` is set, so `retries` is 1. Credentials come from repository secrets. |

Headless, headed, debug, and UI modes all use the same config: one Chromium worker, screenshots only on failure, and the HTML report written to `report/`.

## Valid and Invalid scenario classification

`@valid` tests use `EMAIL` and `PASSWORD` and expect the shop to accept the action. `@invalid` tests expect a rejection or no change.

### Valid

These ten tests are `@smoke` and `@valid`. Each one signs in first.

| Test | Area tags |
|---|---|
| sign in opens the dashboard | `@login` `@dashboard` |
| dashboard shows the catalog products | `@dashboard` |
| adding the first product increases the cart by 1 | `@dashboard` |
| the cart lists the first product | `@cart` |
| checkout opens from the cart | `@checkout` |
| adding a second product updates the cart count | `@dashboard` |
| cart total equals the sum of the product prices | `@cart` |
| every cart product is in stock | `@cart` |
| checkout accepts France | `@checkout` |
| place order shows the confirmation | `@confirmation` |

This test is `@regression` and `@valid`. It signs in, then walks the catalog, cart, checkout, and confirmation in one flow.

| Test | Area tags |
|---|---|
| place an order for two products | `@dashboard` `@cart` `@checkout` `@confirmation` |

Product names, the invalid email, CVV, card name, and country come from `test-data.json`. The first product is `iphone 13 pro` and the second is `ZARA COAT 3`.

### Invalid

These tests are `@invalid`. They are not tagged `@valid`.

| Test | Area tag | Expected result |
|---|---|---|
| login with an invalid email | `@login` | The toast reports an incorrect email or password and the browser stays on the login URL. The password is the real account password. The email is `invalidEmail` from `test-data.json`. |
| adding an exited product leaves the cart unchanged | `@dashboard` | After sign-in, `EXITED PRODUCT` is absent and the cart count stays the same. |

## Local execution commands

Install dependencies and Chromium once:

```bash
npm ci
npx playwright install chromium
```

Create a `.env` file in the repository root. `.env` is gitignored.

```text
EMAIL=your-account@example.com
PASSWORD=your-password
BASE_URL=https://rahulshettyacademy.com
```

`BASE_URL` is optional. When it is omitted, the config uses `https://rahulshettyacademy.com`.

Run the suite and open the report:

```bash
npm test
npm run report
```

Run one file or one group:

```bash
npx playwright test tests/shop.spec.ts
npx playwright test --grep @valid
npx playwright test --grep @invalid
npx playwright test --grep @regression
```

## GitHub Actions execution

`.github/workflows/playwright.yml` runs on every push and pull request.

The `shop` job uses `ubuntu-latest` and Node.js 20. It installs dependencies, installs Chromium with system libraries, and runs `npx playwright test`. The job timeout is 20 minutes. Because GitHub sets `CI`, a failed test is retried once.

The test step receives:

| Variable | Source |
|---|---|
| `EMAIL` | Repository secret `EMAIL` |
| `PASSWORD` | Repository secret `PASSWORD` |
| `BASE_URL` | `https://rahulshettyacademy.com` |

Add `EMAIL` and `PASSWORD` under the repository Settings, Secrets and variables, Actions. The workflow does not read a `.env` file from the repository.

After the run, the job uploads the `report/` folder as the `playwright-report` artifact and keeps it for 14 days. The upload runs even when tests fail.

## HTML Report generation

The config always writes an HTML report:

```ts
['html', { outputFolder: 'report', open: 'never' }]
```

`npm test` and the GitHub Actions job both generate `report/index.html`. The report does not open a browser by itself. Open the latest local report with:

```bash
npm run report
```

That command runs `playwright show-report report`.

On GitHub, open the workflow run, download the `playwright-report` artifact, and open `index.html` inside it. `report/` is gitignored, so the report is not committed.

## Screenshot locations

Screenshots are taken only when a test fails (`screenshot: 'only-on-failure'`).

| Location | What you find |
|---|---|
| `test-results/` | The failed test folder, including `test-failed-1.png` |
| `report/index.html` | The same screenshot attached to the failed test |
| `playwright-report` artifact | The HTML report from GitHub Actions, with those screenshots inside it |

A failure also keeps a trace and a video (`trace: 'retain-on-failure'`, `video: 'retain-on-failure'`). Those files stay in the same `test-results/` folder and are linked from the HTML report. `test-results/` is gitignored.
