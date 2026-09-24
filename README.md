# Tabrider Example Extension

A complete Chrome extension example demonstrating how to use [tabrider](https://www.npmjs.com/package/tabrider) — a Playwright-style automation engine for Chrome extensions.

## Demo ( Extension + Server )
https://github.com/user-attachments/assets/c31e3cd5-1eca-4c5b-a805-6f3e2e8bdb8f

## Prerequisites

- Node.js >= 18
- npm
- Chrome browser

## Getting Started

> Before running, update `package.json` to use the latest published version of tabrider: change `"tabrider": "file:.."` to `"tabrider": "^1.0.0"`.

### Development

```bash
./run_dev.sh
```

Installs all dependencies, starts the server (with hot reload), and builds the extension in watch mode. The extension auto-reloads in Chrome whenever you save a file — no manual reload needed.

On first run, load the extension once in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the `dist` folder. After that, it auto-reloads on every change.

### Production

```bash
./run_prod.sh
```

Installs all dependencies, builds the extension once, and starts the server.

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

## Contributing

Contributions are warmly welcomed and greatly appreciated! Whether it's a bug fix, new feature, or improvement, your input helps make this project better for everyone.

Before submitting a pull request, please:

1. Create an issue describing the feature or bug fix you'd like to work on
2. Wait for discussion and approval to ensure alignment with project goals
3. Fork the repository and create your feature branch
4. Submit your pull request with a clear description of changes

This approach helps avoid duplicate efforts and ensures smooth collaboration. Thank you for considering contributing!

## Share

Sharing this repository with your friends is just one click away from here

[![facebook](https://user-images.githubusercontent.com/6418354/179013321-ac1d1452-0689-493f-9066-940cf2302b6e.png)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/p32929/tabrider_example/)
[![twitter](https://user-images.githubusercontent.com/6418354/179013351-7d8d6d1c-4ce2-46ab-bef8-4c4765a1b888.png)](https://twitter.com/intent/tweet?url=https://github.com/p32929/tabrider_example/)
[![tumblr](https://user-images.githubusercontent.com/6418354/179013343-3111f55a-3b90-40c7-8487-9777348672b0.png)](https://www.tumblr.com/share?v=3&u=https://github.com/p32929/tabrider_example/)
[![pocket](https://user-images.githubusercontent.com/6418354/179013334-b095c45f-becf-49f4-9ee1-5a731a9b1f85.png)](https://getpocket.com/save?url=https://github.com/p32929/tabrider_example/)
[![pinterest](https://user-images.githubusercontent.com/6418354/179013331-44cd9206-11b1-4b65-becb-5863b61c828f.png)](https://pinterest.com/pin/create/button/?url=https://github.com/p32929/tabrider_example/)
[![reddit](https://user-images.githubusercontent.com/6418354/179013338-7416ae3f-73ba-4522-86e1-1374d7082d22.png)](https://www.reddit.com/submit?url=https://github.com/p32929/tabrider_example/)
[![linkedin](https://user-images.githubusercontent.com/6418354/179013327-ca7b7102-1da8-4b1c-858f-1a6e5f21bd70.png)](https://www.linkedin.com/shareArticle?mini=true&url=https://github.com/p32929/tabrider_example/)
[![whatsapp](https://user-images.githubusercontent.com/6418354/179013353-f477fa0b-3e6f-4138-a357-c9991b23ff88.png)](https://api.whatsapp.com/send?text=https://github.com/p32929/tabrider_example/)

---

## Support

If this saved you time, you can buy me a coffee — it keeps these projects maintained and free.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/p32929)

<!-- hire-block -->

---

## 💼 Using this at a company?

I do fixed-price delivery work on my own projects. One invoice, one date, no hourly billing:

| | |
|---|---|
| **White-label build** — this project rebranded, extended and deployed as yours | **$6,500** · 3 weeks |
| **Custom app from scratch** on my own stack, signed and auto-updating | **$12,500** · 6 weeks |
| **Production-hardening sprint** — 72 hours on this project, for your load and your security review | **$999** |
| **Ongoing capacity** — one project-week of my time reserved every month | **$9,000 / month** |

Full details → **[p32929.github.io/hire](https://p32929.github.io/hire/)** · Email **[fayazbinsalam@uberip.com](mailto:fayazbinsalam@uberip.com)** — scoping and quotes are free and I answer within one business day.

### Commercial use of this repo

This repo has **no license file**, which in copyright law means *all rights reserved*.
Personal use, learning and open-source forks: go ahead, just link back. Shipping it inside a
commercial or closed-source product needs a license — **$2,500** for one product, **$9,500**
company-wide and perpetual, signed and issued the same day
([details](https://p32929.github.io/hire/)).
