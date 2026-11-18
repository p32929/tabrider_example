# Tabrider Example Extension

A complete Chrome extension that shows how to use [tabrider](https://www.npmjs.com/package/tabrider), a Playwright-style automation library for Chrome extensions.

Most browser automation needs a separate Node server, a driver and a second browser. With tabrider the automation runs inside a normal extension, in the browser you already use: click, fill, wait, scrape, download and upload, all from your extension's code. This repo is a ready-to-run starting point you can copy.

## Demo (extension and server)
https://github.com/user-attachments/assets/c31e3cd5-1eca-4c5b-a805-6f3e2e8bdb8f

## Prerequisites

1. Node.js >= 18
2. npm
3. Chrome browser

## Getting Started

> The `tests.all_in_one` demo opens a test page using a full path from my computer (`TEST_PAGE_PATH` in `src/automations/tests.ts`). Change it to the path of `test-page/AllInOneTests.html` on your computer before you run it.

### Development

```bash
./run_dev.sh
```

This installs everything, starts the server with hot reload, and builds the extension in watch mode. The extension reloads in Chrome by itself whenever you save a file.

The first time, load the extension in Chrome once: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `dist` folder. After that it reloads on every change.

### Production

```bash
./run_prod.sh
```

This installs everything, builds the extension once, and starts the server.

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

1. **Background service worker** (`background.ts`): Initializes the tabrider Engine, listens for messages from the popup, and executes automation functions.
2. **Popup** (`index.ts`): UI for browsing, selecting, and launching automations. Communicates with the background via `chrome.runtime.sendMessage()`.

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

An example Express server is included in `server/` and starts automatically with the bash scripts. It runs on `http://localhost:3000` and demonstrates how to pair tabrider with a backend for heavy lifting that extensions can't do alone.

### Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/files` | Save content to a file on disk |
| `GET` | `/files/:filename` | Read a file's content |
| `PUT` | `/files/:filename` | Update a file's content |

### Why Use a Server?

Chrome extensions are sandboxed. They can interact with web pages, but they **cannot** access the file system, run heavy computations, or freely call external APIs. A companion server removes all of those limitations.

**File system access:** Extensions have no way to read or write files on disk. With a server, your automation can save scraped data to files, read config files, generate reports, export CSVs — anything that touches the file system. The included `server_demo.file_demo` automation shows this in action: it generates a random number, saves it to a file on the server, reads it back, updates it, and displays every step on screen.

**Heavy work:** Parsing large HTML documents, processing images, running AI models, transforming data between formats — all of this is expensive and sometimes impossible inside a service worker (which Chrome can terminate at any time). Offload it to the server where there are no memory limits or execution timeouts.

**Outside APIs:** Many APIs block requests from browser extensions due to CORS. A server acts as a proxy — the extension sends the request to your server, the server hits the external API, and returns the result. No CORS issues, no blocked requests.

**Storage:** `chrome.storage` is limited and slow for large datasets. A server can use a real database (SQLite, PostgreSQL, MongoDB) or even simple JSON files on disk for reliable, queryable storage.

**Long tasks:** Chrome MV3 service workers get terminated after ~30 seconds of inactivity. Any task that takes longer than that needs to live on the server. Queue jobs, run them in the background, and let the extension check back for results.

The pattern is simple: **the extension handles the browser, the server handles everything else.** You can write the server in any language — Node.js, Python, Go, Rust — whatever fits your use case. Together, they can automate complex workflows end-to-end.

## Permissions

The extension requests these Chrome permissions (see `manifest.json`):

1. `activeTab`: Access the current tab
2. `tabs`: Create and manage tabs
3. `scripting`: Inject scripts into pages
4. `storage`: Persist automation state
5. `downloads`: Manage file downloads
6. `<all_urls>`: Interact with any page

## Contributing

Contributions are very welcome, thank you! Before you start on a pull request, please open an issue and tell me what you would like to add or change. That way we can agree on it first, and your time is not wasted on something that might not fit. Thanks for helping make tabrider example better.

## You might also like

<p><a href="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/0"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/0-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/0-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (1)"></picture></a><a href="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/1"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/1-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/1-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (2)"></picture></a><br><a href="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/2"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/2-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/2-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (3)"></picture></a><a href="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/3"><picture><source media="(prefers-color-scheme: dark)" srcset="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/3-dark.svg"><img src="https://openstore.pfay.workers.dev/more/p32929/tabrider_example/3-light.svg" width="50%" align="top" alt="More apps by p32929 on OpenStore (4)"></picture></a></p>

<p><a href="https://p32929.github.io/share/?repo=tabrider_example"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-share-dark.svg"><img src="https://p32929.github.io/readme/footer-share-light.svg" width="50%" align="top" alt="Share this project with your friends in one click"></picture></a><a href="https://p32929.github.io/support/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-support-dark.svg"><img src="https://p32929.github.io/readme/footer-support-light.svg" width="50%" align="top" alt="If you like my work and want to support me, feel free to support"></picture></a><br><a href="https://openstore.pfay.workers.dev/add"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/footer-join-dark.svg"><img src="https://p32929.github.io/readme/footer-join-light.svg" width="100%" align="top" alt="Put your own apps on OpenStore: free, your listing lives in your own repo"></picture></a></p>
