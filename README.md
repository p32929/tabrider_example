# Tabrider Example Extension

A complete Chrome extension example demonstrating how to use [tabrider](https://www.npmjs.com/package/tabrider) — a Playwright-style automation engine for Chrome extensions.

## Prerequisites

- Node.js >= 18
- npm
- Chrome browser

## Setup

1. Install dependencies:

```bash
npm install
```

2. Update `package.json` to use the latest version of tabrider:

```diff
  "dependencies": {
-   "tabrider": "file:.."
+   "tabrider": "^1.0.0"
  }
```

> The local `file:..` reference is used during development. Replace it with the latest published version from npm.

3. Build the extension:

```bash
npm run build
```

4. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `dist` folder

## Running

### Development

```bash
./run_dev.sh
```

Starts both the server (with hot reload) and the extension build (watch mode) in parallel. The extension auto-reloads in Chrome whenever you save a file — no manual reload needed. This works via a WebSocket connection between the Vite build and the extension's background script.

> On first run, you still need to load the extension once: `chrome://extensions` → **Load unpacked** → select the `dist` folder.

### Production

```bash
./run_prod.sh
```

Builds the extension once and starts the server normally.

### Individual Scripts

| Script | Description |
|---|---|
| `npm run dev` | Extension watch mode — rebuilds on file changes |
| `npm run build` | Extension full build with type checking |
| `npm run build:fast` | Extension fast build without type checking |

## Project Structure

```
├── src/
│   ├── background.ts           # Service worker — initializes Engine, runs automations
│   ├── index.ts                # Popup script — UI for selecting and running automations
│   ├── automations/
│   │   ├── tests.ts            # Example automation functions
│   │   └── server_demo.ts      # Demonstrates all server endpoints from the extension
│   └── types/
│       └── automations.ts      # Type-safe automation registry
├── public/
│   ├── index.html              # Popup UI
│   └── manifest.json           # Chrome extension manifest (MV3)
├── test-page/
│   └── AllInOneTests.html      # Test page used by the automations
├── assets/
│   └── test-image.jpg          # Used for file upload tests
├── server/
│   ├── src/
│   │   └── index.ts            # Express server — all routes in one file
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
├── run_dev.sh                  # Start server + extension in dev/watch mode
├── run_prod.sh                 # Build extension + start server
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

### Architecture

The extension follows the standard Chrome MV3 pattern:

- **Background service worker** (`background.ts`) — Initializes the tabrider Engine, listens for messages from the popup, and executes automation functions.
- **Popup** (`index.ts`) — UI for browsing, selecting, and launching automations. Communicates with the background via `chrome.runtime.sendMessage()`.

### Adding Your Own Automations

1. Create a new file in `src/automations/`:

```typescript
import { AutomationEngine } from 'tabrider';

export async function my_automation() {
  const engine = new AutomationEngine();
  await engine.init();

  const page = await engine.createPage('https://example.com');
  if (page.is_err()) return;

  await engine.click('#some-button');
  await engine.fill('#input-field', 'Hello');

  const text = await engine.getText('.result');
  console.log(text.unwrap());
}
```

2. Register it in `src/types/automations.ts` so it shows up in the popup.

## Example Server

An example Express server is included in `server/`. It demonstrates how to pair tabrider with a backend for heavy lifting that extensions can't do alone.

### Server Setup

```bash
cd server
npm install
npm run dev
```

The server runs on `http://localhost:3000` with hot reload.

### Available Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/files` | Save content to a file on disk |
| `GET` | `/files/:filename` | Read a file's content |
| `PUT` | `/files/:filename` | Update a file's content |
| `POST` | `/fetch` | Proxy external API calls (avoids CORS) |
| `POST` | `/extract` | Send HTML + regex patterns, get structured data back |
| `POST` | `/transform` | Data conversion (JSON to CSV, flatten nested objects) |
| `POST` | `/store` | Save a key-value pair (in-memory) |
| `GET` | `/store/:key` | Retrieve a stored value |
| `DELETE` | `/store/:key` | Delete a stored value |
| `POST` | `/logs` | Receive logs from the extension |
| `GET` | `/logs` | View all collected logs |

### Why Use a Server?

Chrome extensions are sandboxed. They can interact with web pages, but they **cannot** access the file system, run heavy computations, or freely call external APIs. A companion server removes all of those limitations.

**File system access** — Extensions have no way to read or write files on disk. With a server, your automation can save scraped data to files, read config files, generate reports, export CSVs — anything that touches the file system. The included `server_demo.file_demo` automation shows this in action: it generates a random number, saves it to a file on the server, reads it back, updates it, and displays every step on screen.

**Heavy lifting** — Parsing large HTML documents, processing images, running AI models, transforming data between formats — all of this is expensive and sometimes impossible inside a service worker (which Chrome can terminate at any time). Offload it to the server where there are no memory limits or execution timeouts.

**External API calls** — Many APIs block requests from browser extensions due to CORS. A server acts as a proxy — the extension sends the request to your server, the server hits the external API, and returns the result. No CORS issues, no blocked requests.

**Persistent storage** — `chrome.storage` is limited and slow for large datasets. A server can use a real database (SQLite, PostgreSQL, MongoDB) or even simple JSON files on disk for reliable, queryable storage.

**Long-running tasks** — Chrome MV3 service workers get terminated after ~30 seconds of inactivity. Any task that takes longer than that needs to live on the server. Queue jobs, run them in the background, and let the extension check back for results.

The pattern is simple: **the extension handles the browser, the server handles everything else.** You can write the server in any language — Node.js, Python, Go, Rust — whatever fits your use case. Together, they can automate complex workflows end-to-end.

## Permissions

The extension requests these Chrome permissions (see `manifest.json`):

- `activeTab` — Access the current tab
- `tabs` — Create and manage tabs
- `scripting` — Inject scripts into pages
- `storage` — Persist automation state
- `downloads` — Manage file downloads
- `<all_urls>` — Interact with any page
