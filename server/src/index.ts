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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
