import express from 'express';
import morgan from 'morgan';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = resolve(import.meta.dirname, '../../data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Middleware
app.use(morgan(':method :url :status :response-time\\ms'));
app.use(express.json({ limit: '50mb' }));

// CORS — allow all origins (extensions send from chrome-extension:// )
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory key-value store
const store = new Map<string, any>();

// ======================
// HEALTH
// ======================

app.get('/', (_req, res) => {
  res.json({ message: 'Tabrider Example Server', status: 'running', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ======================
// FILES — read/write files on disk (the heavy lifting extensions can't do)
// ======================

app.post('/files', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || content === undefined) return res.status(400).json({ success: false, error: 'Missing required fields: filename, content' });

    const filePath = resolve(DATA_DIR, filename);
    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));

    res.json({ success: true, filePath, filename });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/files/:filename', (req, res) => {
  try {
    const filePath = resolve(DATA_DIR, req.params.filename);
    if (!existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });

    const content = readFileSync(filePath, 'utf-8');
    res.json({ success: true, filePath, content });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.put('/files/:filename', (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined) return res.status(400).json({ success: false, error: 'Missing required field: content' });

    const filePath = resolve(DATA_DIR, req.params.filename);
    if (!existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });

    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    res.json({ success: true, filePath, content: readFileSync(filePath, 'utf-8') });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================
// STORE — temp key-value storage for passing data between automation steps
// ======================

app.post('/store', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ success: false, error: 'Missing required field: key' });
  store.set(key, value);
  res.json({ success: true, key });
});

app.get('/store/:key', (req, res) => {
  const { key } = req.params;
  if (!store.has(key)) return res.status(404).json({ success: false, error: 'Key not found' });
  res.json({ success: true, key, value: store.get(key) });
});

app.delete('/store/:key', (req, res) => {
  const { key } = req.params;
  store.delete(key);
  res.json({ success: true, key });
});

app.get('/store', (_req, res) => {
  const entries = Object.fromEntries(store);
  res.json({ success: true, entries, count: store.size });
});

// ======================
// FETCH — proxy external requests (avoids CORS issues extensions face)
// ======================

app.post('/fetch', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Missing required field: url' });

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    res.json({ success: true, status: response.status, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================
// EXTRACT — send HTML, get back structured data
// ======================

app.post('/extract', (req, res) => {
  try {
    const { html, selectors } = req.body;
    if (!html || !selectors) return res.status(400).json({ success: false, error: 'Missing required fields: html, selectors' });

    const results: Record<string, string[]> = {};
    for (const [name, pattern] of Object.entries(selectors)) {
      const regex = new RegExp(pattern as string, 'gi');
      const matches = html.match(regex) || [];
      results[name] = matches;
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================
// TRANSFORM — data conversion and formatting
// ======================

app.post('/transform', (req, res) => {
  try {
    const { data, format } = req.body;
    if (!data) return res.status(400).json({ success: false, error: 'Missing required field: data' });

    let result: any;

    switch (format) {
      case 'csv': {
        if (!Array.isArray(data)) return res.status(400).json({ success: false, error: 'Data must be an array for CSV' });
        const headers = Object.keys(data[0] || {});
        const rows = data.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
        result = [headers.join(','), ...rows].join('\n');
        break;
      }
      case 'flatten': {
        const flatten = (obj: any, prefix = ''): Record<string, any> => {
          const out: Record<string, any> = {};
          for (const [k, v] of Object.entries(obj)) {
            const key = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
            else out[key] = v;
          }
          return out;
        };
        result = flatten(data);
        break;
      }
      default:
        result = data;
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ======================
// LOGS — receive logs from the extension
// ======================

const logs: Array<{ timestamp: string; level: string; source: string; message: string }> = [];

app.post('/logs', (req, res) => {
  const { level = 'info', source = 'ext', message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Missing required field: message' });

  const entry = { timestamp: new Date().toISOString(), level, source, message };
  logs.push(entry);
  console.log(`[${entry.timestamp}][${source}][${level.toUpperCase()}] ${message}`);

  res.json({ success: true });
});

app.get('/logs', (_req, res) => {
  res.json({ success: true, logs, count: logs.length });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
