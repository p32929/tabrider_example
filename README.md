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

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Watch mode — rebuilds on file changes |
| `npm run build` | Full build with type checking |
| `npm run build:fast` | Fast build without type checking |

## Project Structure

```
├── src/
│   ├── background.ts           # Service worker — initializes Engine, runs automations
│   ├── index.ts                # Popup script — UI for selecting and running automations
│   ├── automations/
│   │   └── tests.ts            # Example automation functions
│   └── types/
│       └── automations.ts      # Type-safe automation registry
├── public/
│   ├── index.html              # Popup UI
│   └── manifest.json           # Chrome extension manifest (MV3)
├── test-page/
│   └── AllInOneTests.html      # Test page used by the automations
├── assets/
│   └── test-image.jpg          # Used for file upload tests
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

## Pairing with a Backend Server

Chrome extensions run in a sandboxed browser environment — they're great at interacting with pages, but limited when it comes to heavy computation, database access, file system operations, or calling external APIs that block CORS.

By pairing tabrider with a backend server (in any language — Node.js, Python, Go, Rust, whatever you prefer), you can offload the heavy lifting and build automation scripts that can do practically anything:

- **Data processing** — Scrape a page with tabrider, send the raw HTML to your server for parsing, cleaning, or AI-powered extraction
- **Proxy requests** — Hit external APIs from your server to avoid CORS restrictions that block the extension
- **Storage** — Persist data in a real database instead of `chrome.storage`
- **File operations** — Generate PDFs, process images, write to disk
- **Long-running tasks** — Queue jobs that run longer than a service worker's lifetime

The extension handles the browser, the server handles everything else. Together, they can automate complex workflows end-to-end.

## Permissions

The extension requests these Chrome permissions (see `manifest.json`):

- `activeTab` — Access the current tab
- `tabs` — Create and manage tabs
- `scripting` — Inject scripts into pages
- `storage` — Persist automation state
- `downloads` — Manage file downloads
- `<all_urls>` — Interact with any page
