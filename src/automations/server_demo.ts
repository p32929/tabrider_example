import { Engine } from 'tabrider';
import type { IFuncParams } from '@/types/automations.js';

const SERVER_URL = 'http://localhost:3000';
const FILENAME = 'random_number.txt';

/** Helper to call the server */
async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

/**
 * Demonstrates extension ↔ server file operations:
 * 1. Generate a random number → show on page
 * 2. Save it to a file on the server → show file path
 * 3. Read the file back from server → show content
 * 4. Update the file on server → show updated content
 *
 * Make sure the server is running: cd server && npm run dev
 */
export const file_demo = async (params: IFuncParams): Promise<void> => {
  const engine = params.engine || Engine;

  if (!engine.isInitialized()) {
    await engine.init();
  }

  // Open a blank-ish page we can take over
  const pageResult = await engine.createPage('https://example1.com');
  if (pageResult.is_err()) {
    throw new Error('Failed to create page: ' + pageResult.error);
  }
  const pageId = pageResult.unwrap();
  await engine.wait(1000);

  // Build the UI on the page
  await engine.evaluate(pageId, () => {
    document.title = 'Tabrider Server Demo';
    document.head.innerHTML = `<style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
      h1 { font-size: 24px; margin-bottom: 24px; color: #38bdf8; }
      .step { background: #1e293b; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; border-left: 3px solid #334155; }
      .step.done { border-left-color: #22c55e; }
      .step.active { border-left-color: #f59e0b; }
      .step-title { font-size: 14px; color: #94a3b8; margin-bottom: 6px; }
      .step-value { font-size: 18px; font-weight: 600; word-break: break-all; }
      .step-value.number { color: #a78bfa; font-size: 32px; }
      .step-value.path { color: #fb923c; font-size: 14px; font-family: monospace; }
      .step-value.content { color: #34d399; font-family: monospace; }
    </style>`;
    document.body.innerHTML = `
      <h1>Extension ↔ Server Demo</h1>
      <div id="step1" class="step"><div class="step-title">1. Generate random number</div><div class="step-value" id="val1">waiting...</div></div>
      <div id="step2" class="step"><div class="step-title">2. Save to file on server</div><div class="step-value" id="val2">waiting...</div></div>
      <div id="step3" class="step"><div class="step-title">3. Read file back from server</div><div class="step-value" id="val3">waiting...</div></div>
      <div id="step4" class="step"><div class="step-title">4. Update file on server</div><div class="step-value" id="val4">waiting...</div></div>
      <div id="step5" class="step"><div class="step-title">5. Read updated file from server</div><div class="step-value" id="val5">waiting...</div></div>
    `;
  });

  // Step 1: Generate random number
  const randomNum = Math.floor(Math.random() * 1000000);
  await engine.evaluate(pageId, (num: number) => {
    document.getElementById('step1')!.className = 'step done';
    document.getElementById('val1')!.className = 'step-value number';
    document.getElementById('val1')!.textContent = String(num);
  }, randomNum);
  await engine.wait(800);

  // Step 2: Save to file on server
  await engine.evaluate(pageId, () => {
    document.getElementById('step2')!.className = 'step active';
    document.getElementById('val2')!.textContent = 'saving...';
  });

  const saveResult = await api('/files', {
    method: 'POST',
    body: JSON.stringify({ filename: FILENAME, content: `Random number: ${randomNum}` }),
  });

  if (!saveResult.success) throw new Error(`Save failed: ${saveResult.error}`);

  await engine.evaluate(pageId, (path: string) => {
    document.getElementById('step2')!.className = 'step done';
    document.getElementById('val2')!.className = 'step-value path';
    document.getElementById('val2')!.textContent = path;
  }, saveResult.filePath);
  await engine.wait(800);

  // Step 3: Read file back from server
  await engine.evaluate(pageId, () => {
    document.getElementById('step3')!.className = 'step active';
    document.getElementById('val3')!.textContent = 'reading...';
  });

  const readResult = await api(`/files/${FILENAME}`);
  if (!readResult.success) throw new Error(`Read failed: ${readResult.error}`);

  await engine.evaluate(pageId, (content: string) => {
    document.getElementById('step3')!.className = 'step done';
    document.getElementById('val3')!.className = 'step-value content';
    document.getElementById('val3')!.textContent = content;
  }, readResult.content);
  await engine.wait(800);

  // Step 4: Update the file
  await engine.evaluate(pageId, () => {
    document.getElementById('step4')!.className = 'step active';
    document.getElementById('val4')!.textContent = 'updating...';
  });

  const doubled = randomNum * 2;
  const updatedContent = `Random number: ${randomNum}\nDoubled: ${doubled}\nUpdated at: ${new Date().toISOString()}`;

  const updateResult = await api(`/files/${FILENAME}`, {
    method: 'PUT',
    body: JSON.stringify({ content: updatedContent }),
  });

  if (!updateResult.success) throw new Error(`Update failed: ${updateResult.error}`);

  await engine.evaluate(pageId, (content: string) => {
    document.getElementById('step4')!.className = 'step done';
    document.getElementById('val4')!.className = 'step-value content';
    document.getElementById('val4')!.textContent = content;
  }, updateResult.content);
  await engine.wait(800);

  // Step 5: Read updated file to confirm
  await engine.evaluate(pageId, () => {
    document.getElementById('step5')!.className = 'step active';
    document.getElementById('val5')!.textContent = 'reading...';
  });

  const finalRead = await api(`/files/${FILENAME}`);
  if (!finalRead.success) throw new Error(`Final read failed: ${finalRead.error}`);

  await engine.evaluate(pageId, (content: string) => {
    document.getElementById('step5')!.className = 'step done';
    document.getElementById('val5')!.className = 'step-value content';
    document.getElementById('val5')!.textContent = content;
  }, finalRead.content);

  console.log('[server_demo] File demo completed successfully!');
};
