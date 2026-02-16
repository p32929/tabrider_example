import { Engine } from 'tabrider';
import type { IFuncParams } from '@/types/automations.js';

// Path to the test HTML file - update this to match your local path
const TEST_PAGE_PATH = 'file:///Users/mac/Documents/Fayaz/codes/nodejs/tabrider/example/test-page/AllInOneTests.html';

/**
 * All in one test - tests click operations and mouse actions
 * Keeps the tab open so you can visually verify the results
 */
export const all_in_one = async (params: IFuncParams): Promise<void> => {
  const engine = params.engine || Engine;

  // Initialize engine if needed
  if (!engine.isInitialized()) {
    await engine.init();
  }

  // Open the test HTML file
  const pageResult = await engine.createPage(TEST_PAGE_PATH);
  if (pageResult.is_err()) {
    throw new Error('Failed to create page: ' + pageResult.error);
  }
  const pageId = pageResult.unwrap();

  // Wait for page to load
  await engine.wait(1000);

  // ============ CLICK OPERATIONS ============

  // Test 1: Single Click
  console.log('[all_in_one] Testing single click...');
  await engine.click(pageId, '#click-btn');
  await engine.wait(300);
  const clickText = await engine.getText(pageId, '#click-btn');
  if (clickText !== 'clicked') {
    throw new Error(`Single click test failed. Expected "clicked", got "${clickText}"`);
  }
  console.log('[all_in_one] Single click: PASSED');

  // Test 2: Double Click
  console.log('[all_in_one] Testing double click...');
  await engine.doubleClick(pageId, '#dblclick-btn');
  await engine.wait(300);
  const dblClickText = await engine.getText(pageId, '#dblclick-btn');
  if (dblClickText !== 'double clicked') {
    throw new Error(`Double click test failed. Expected "double clicked", got "${dblClickText}"`);
  }
  console.log('[all_in_one] Double click: PASSED');

  // Test 3: Right Click
  console.log('[all_in_one] Testing right click...');
  await engine.rightClick(pageId, '#rightclick-btn');
  await engine.wait(300);
  const rightClickText = await engine.getText(pageId, '#rightclick-btn');
  if (rightClickText !== 'right clicked') {
    throw new Error(`Right click test failed. Expected "right clicked", got "${rightClickText}"`);
  }
  console.log('[all_in_one] Right click: PASSED');

  // ============ MOUSE ACTIONS ============

  // Test 4: Hover
  console.log('[all_in_one] Testing hover...');
  await engine.hover(pageId, '#hover-box');
  await engine.wait(300);
  const hoverText = await engine.getText(pageId, '#hover-box');
  if (hoverText !== 'hovered') {
    throw new Error(`Hover test failed. Expected "hovered", got "${hoverText}"`);
  }
  console.log('[all_in_one] Hover: PASSED');

  // Test 5: Drag and Drop
  console.log('[all_in_one] Testing drag and drop...');
  await engine.dragAndDrop(pageId, '#draggable', '#drop-zone');
  await engine.wait(300);
  const dropText = await engine.getText(pageId, '#drop-zone');
  if (dropText !== 'Dropped!') {
    throw new Error(`Drag and drop test failed. Expected "Dropped!", got "${dropText}"`);
  }
  console.log('[all_in_one] Drag and Drop: PASSED');

  // Test 6: Scroll Into View
  console.log('[all_in_one] Testing scroll into view...');
  await engine.scrollIntoView(pageId, '#scroll-target');
  await engine.wait(1000);
  const scrollText = await engine.getText(pageId, '#scroll-target');
  if (!scrollText.includes('scrolled into view')) {
    throw new Error(`Scroll test failed. Expected "scrolled into view", got "${scrollText}"`);
  }
  console.log('[all_in_one] Scroll Into View: PASSED');

  // ============ ELEMENT STATE ============

  // Test 7: exists
  console.log('[all_in_one] Testing exists...');
  const existsResult = await engine.exists(pageId, '#exists-element');
  if (existsResult !== true) {
    throw new Error(`Exists test failed. Expected true, got ${existsResult}`);
  }
  const notExistsResult = await engine.exists(pageId, '#non-existent-element');
  if (notExistsResult !== false) {
    throw new Error(`Exists test (negative) failed. Expected false, got ${notExistsResult}`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-exists');
    if (el) { el.classList.add('done'); (window as any).completedTests = ((window as any).completedTests || 6) + 1; }
  });
  console.log('[all_in_one] Exists: PASSED');

  // Test 8: isVisible
  console.log('[all_in_one] Testing isVisible...');
  const visibleResult = await engine.isVisible(pageId, '#visible-element');
  if (visibleResult !== true) {
    throw new Error(`isVisible test failed. Expected true, got ${visibleResult}`);
  }
  const hiddenResult = await engine.isVisible(pageId, '#hidden-element');
  if (hiddenResult !== false) {
    throw new Error(`isVisible test (hidden) failed. Expected false, got ${hiddenResult}`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-visible');
    if (el) { el.classList.add('done'); (window as any).completedTests = ((window as any).completedTests || 7) + 1; }
  });
  console.log('[all_in_one] isVisible: PASSED');

  // Test 9: isEnabled
  console.log('[all_in_one] Testing isEnabled...');
  const enabledResult = await engine.isEnabled(pageId, '#enabled-btn');
  if (enabledResult !== true) {
    throw new Error(`isEnabled test failed. Expected true, got ${enabledResult}`);
  }
  const disabledResult = await engine.isEnabled(pageId, '#disabled-btn');
  if (disabledResult !== false) {
    throw new Error(`isEnabled test (disabled) failed. Expected false, got ${disabledResult}`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-enabled');
    if (el) { el.classList.add('done'); (window as any).completedTests = ((window as any).completedTests || 8) + 1; }
  });
  console.log('[all_in_one] isEnabled: PASSED');

  // Test 10: isChecked
  console.log('[all_in_one] Testing isChecked...');
  const uncheckedResult = await engine.isChecked(pageId, '#test-checkbox');
  if (uncheckedResult !== false) {
    throw new Error(`isChecked test (unchecked) failed. Expected false, got ${uncheckedResult}`);
  }
  await engine.check(pageId, '#test-checkbox');
  await engine.wait(100);
  const checkedResult = await engine.isChecked(pageId, '#test-checkbox');
  if (checkedResult !== true) {
    throw new Error(`isChecked test (checked) failed. Expected true, got ${checkedResult}`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-checked');
    if (el) { el.classList.add('done'); (window as any).completedTests = ((window as any).completedTests || 9) + 1; }
  });
  console.log('[all_in_one] isChecked: PASSED');

  // Test 11: waitFor
  console.log('[all_in_one] Testing waitFor...');
  const waitForResult = await engine.waitFor(pageId, '#waitfor-element', 2000);
  if (!waitForResult) {
    throw new Error(`waitFor test failed. Element not found.`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-waitfor');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] waitFor: PASSED');

  // ============ FORM INPUT ============

  // Test 12: fill
  console.log('[all_in_one] Testing fill...');
  await engine.fill(pageId, '#text-input', 'filled text');
  await engine.wait(100);
  const filledValue = await engine.getValue(pageId, '#text-input');
  if (filledValue !== 'filled text') {
    throw new Error(`Fill test failed. Expected "filled text", got "${filledValue}"`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-fill');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] Fill: PASSED');

  // Test 13: clear
  console.log('[all_in_one] Testing clear...');
  await engine.clear(pageId, '#text-input');
  await engine.wait(100);
  const clearedValue = await engine.getValue(pageId, '#text-input');
  if (clearedValue !== '') {
    throw new Error(`Clear test failed. Expected "", got "${clearedValue}"`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-clear');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] Clear: PASSED');

  // Test 14: type
  console.log('[all_in_one] Testing type...');
  await engine.type(pageId, '#text-input', 'typed text', 30);
  await engine.wait(100);
  const typedValue = await engine.getValue(pageId, '#text-input');
  if (typedValue !== 'typed text') {
    throw new Error(`Type test failed. Expected "typed text", got "${typedValue}"`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-type');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] Type: PASSED');

  // Test 15: getValue (already used above, but let's verify explicitly)
  console.log('[all_in_one] Testing getValue...');
  const getValueResult = await engine.getValue(pageId, '#text-input');
  if (getValueResult !== 'typed text') {
    throw new Error(`getValue test failed. Expected "typed text", got "${getValueResult}"`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-getvalue');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] getValue: PASSED');

  // Test 16: selectOption
  console.log('[all_in_one] Testing selectOption...');
  await engine.selectOption(pageId, '#test-select', 'opt2');
  await engine.wait(100);
  const selectedValue = await engine.getValue(pageId, '#test-select');
  if (selectedValue !== 'opt2') {
    throw new Error(`selectOption test failed. Expected "opt2", got "${selectedValue}"`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-select');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] selectOption: PASSED');

  // Test 17: uncheck
  console.log('[all_in_one] Testing uncheck...');
  const beforeUncheck = await engine.isChecked(pageId, '#uncheck-checkbox');
  if (beforeUncheck !== true) {
    throw new Error(`Uncheck test setup failed. Checkbox should be checked initially.`);
  }
  await engine.uncheck(pageId, '#uncheck-checkbox');
  await engine.wait(100);
  const afterUncheck = await engine.isChecked(pageId, '#uncheck-checkbox');
  if (afterUncheck !== false) {
    throw new Error(`Uncheck test failed. Expected false, got ${afterUncheck}`);
  }
  await engine.evaluate(pageId, () => {
    const el = document.getElementById('status-uncheck');
    if (el) { el.classList.add('done'); }
  });
  console.log('[all_in_one] Uncheck: PASSED');

  // Test 18: uploadFile
  console.log('[all_in_one] Testing uploadFile...');
  const testImagePath = '/Users/mac/Documents/Fayaz/codes/nodejs/tabrider/example/assets/test-image.jpg';
  await engine.uploadFile(pageId, '#file-input', testImagePath);
  await engine.wait(300);
  const uploadedFileName = await engine.evaluate(pageId, () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    return input.files?.[0]?.name || '';
  });
  if (!uploadedFileName || uploadedFileName === '') {
    throw new Error(`uploadFile test failed. No file was uploaded.`);
  }
  console.log('[all_in_one] uploadFile: PASSED');

  // ============ EVALUATE (comprehensive tests) ============
  console.log('[all_in_one] Testing evaluate comprehensive...');

  // Test E1: Return string
  const evalString = await engine.evaluate(pageId, () => 'hello world');
  if (evalString !== 'hello world') {
    throw new Error(`evaluate (string) failed. Expected "hello world", got "${evalString}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-string')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (string): PASSED');

  // Test E2: Return number
  const evalNumber = await engine.evaluate(pageId, () => 42);
  if (evalNumber !== 42) {
    throw new Error(`evaluate (number) failed. Expected 42, got ${evalNumber}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-number')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (number): PASSED');

  // Test E3: Return boolean
  const evalBoolTrue = await engine.evaluate(pageId, () => true);
  const evalBoolFalse = await engine.evaluate(pageId, () => false);
  if (evalBoolTrue !== true || evalBoolFalse !== false) {
    throw new Error(`evaluate (boolean) failed. Got true=${evalBoolTrue}, false=${evalBoolFalse}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-boolean')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (boolean): PASSED');

  // Test E4: Return null
  const evalNull = await engine.evaluate(pageId, () => null);
  if (evalNull !== null) {
    throw new Error(`evaluate (null) failed. Expected null, got ${evalNull}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-null')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (null): PASSED');

  // Test E5: Return undefined (note: Chrome serializes undefined to null)
  const evalUndefined = await engine.evaluate(pageId, () => undefined);
  if (evalUndefined !== null && evalUndefined !== undefined) {
    throw new Error(`evaluate (undefined) failed. Expected null/undefined, got ${evalUndefined}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-undefined')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (undefined→null): PASSED');

  // Test E6: Return object
  const evalObject = await engine.evaluate(pageId, () => ({ name: 'test', value: 123 }));
  if (evalObject?.name !== 'test' || evalObject?.value !== 123) {
    throw new Error(`evaluate (object) failed. Got ${JSON.stringify(evalObject)}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-object')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (object): PASSED');

  // Test E7: Return array
  const evalArray = await engine.evaluate(pageId, () => [1, 2, 3, 'four']);
  if (!Array.isArray(evalArray) || evalArray.length !== 4 || evalArray[3] !== 'four') {
    throw new Error(`evaluate (array) failed. Got ${JSON.stringify(evalArray)}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-array')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (array): PASSED');

  // Test E8: Return nested object/array
  const evalNested = await engine.evaluate(pageId, () => ({
    users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    meta: { total: 2 }
  }));
  if (evalNested?.users?.[1]?.name !== 'Bob' || evalNested?.meta?.total !== 2) {
    throw new Error(`evaluate (nested) failed. Got ${JSON.stringify(evalNested)}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-nested')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (nested): PASSED');

  // Test E9: Pass arguments
  const evalArgs = await engine.evaluate(pageId, (a: number, b: number) => a + b, 10, 32);
  if (evalArgs !== 42) {
    throw new Error(`evaluate (args) failed. Expected 42, got ${evalArgs}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-args')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (args): PASSED');

  // Test E10: Pass multiple types of arguments
  const evalMixedArgs = await engine.evaluate(
    pageId,
    (str: string, num: number, bool: boolean, obj: {x: number}) => `${str}-${num}-${bool}-${obj.x}`,
    'hello', 42, true, { x: 99 }
  );
  if (evalMixedArgs !== 'hello-42-true-99') {
    throw new Error(`evaluate (mixed args) failed. Expected "hello-42-true-99", got "${evalMixedArgs}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-mixed')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (mixed args): PASSED');

  // Test E11: Access window object
  const evalWindow = await engine.evaluate(pageId, () => typeof window !== 'undefined' && typeof window.location !== 'undefined');
  if (evalWindow !== true) {
    throw new Error(`evaluate (window access) failed. Got ${evalWindow}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-window')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (window access): PASSED');

  // Test E12: Access document / DOM query
  const evalDocument = await engine.evaluate(pageId, () => document.title);
  if (evalDocument !== 'All In One Tests') {
    throw new Error(`evaluate (document) failed. Expected "All In One Tests", got "${evalDocument}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-document')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (document): PASSED');

  // Test E13: DOM manipulation
  await engine.evaluate(pageId, () => {
    const el = document.createElement('div');
    el.id = 'eval-created-element';
    el.textContent = 'Created by evaluate';
    document.body.appendChild(el);
  });
  const evalCreatedExists = await engine.exists(pageId, '#eval-created-element');
  const evalCreatedText = await engine.getText(pageId, '#eval-created-element');
  if (!evalCreatedExists || evalCreatedText !== 'Created by evaluate') {
    throw new Error(`evaluate (DOM manipulation) failed. exists=${evalCreatedExists}, text="${evalCreatedText}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-dom')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (DOM manipulation): PASSED');

  // Test E14: Computations
  const evalCompute = await engine.evaluate(pageId, () => {
    const arr = [1, 2, 3, 4, 5];
    return arr.reduce((sum, n) => sum + n, 0) * 2;
  });
  if (evalCompute !== 30) {
    throw new Error(`evaluate (computation) failed. Expected 30, got ${evalCompute}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-eval-compute')?.classList.add('done'); });
  console.log('[all_in_one] evaluate (computation): PASSED');

  console.log('[all_in_one] evaluate comprehensive: ALL PASSED');

  // ============ PAGE INFO ============

  // Test: getUrl
  console.log('[all_in_one] Testing getUrl...');
  const currentUrl = await engine.getUrl(pageId);
  if (!currentUrl || !currentUrl.includes('AllInOneTests.html')) {
    throw new Error(`getUrl failed. Expected URL containing "AllInOneTests.html", got "${currentUrl}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-geturl')?.classList.add('done'); });
  console.log('[all_in_one] getUrl: PASSED');

  // Test: getTitle
  console.log('[all_in_one] Testing getTitle...');
  const pageTitle = await engine.getTitle(pageId);
  if (pageTitle !== 'All In One Tests') {
    throw new Error(`getTitle failed. Expected "All In One Tests", got "${pageTitle}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-gettitle')?.classList.add('done'); });
  console.log('[all_in_one] getTitle: PASSED');

  // ============ KEYBOARD & FOCUS ============

  // Test: press
  console.log('[all_in_one] Testing press...');
  await engine.focus(pageId, '#press-input');
  await engine.press(pageId, '#press-input', 'Enter');
  await engine.wait(200);
  const pressResult = await engine.evaluate(pageId, () => {
    return document.getElementById('press-result')?.textContent || '';
  });
  if (!pressResult.includes('Enter pressed')) {
    throw new Error(`press failed. Expected "Enter pressed", got "${pressResult}"`);
  }
  console.log('[all_in_one] press: PASSED');

  // Test: focus
  console.log('[all_in_one] Testing focus...');
  await engine.focus(pageId, '#focus-input');
  await engine.wait(200);
  const focusStatus = await engine.evaluate(pageId, () => {
    return document.getElementById('focus-status')?.textContent || '';
  });
  if (focusStatus !== 'focused') {
    throw new Error(`focus failed. Expected "focused", got "${focusStatus}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-focus')?.classList.add('done'); });
  console.log('[all_in_one] focus: PASSED');

  // Test: blur
  console.log('[all_in_one] Testing blur...');
  await engine.blur(pageId, '#focus-input');
  await engine.wait(200);
  const blurStatus = await engine.evaluate(pageId, () => {
    return document.getElementById('focus-status')?.textContent || '';
  });
  if (!blurStatus.includes('blur')) {
    throw new Error(`blur failed. Expected text containing "blur", got "${blurStatus}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-blur')?.classList.add('done'); });
  console.log('[all_in_one] blur: PASSED');

  // Test: focus on button
  console.log('[all_in_one] Testing focus on button...');
  await engine.focus(pageId, '#focus-btn');
  await engine.wait(200);
  const focusBtnStatus = await engine.evaluate(pageId, () => {
    return document.getElementById('focus-btn-status')?.textContent || '';
  });
  if (!focusBtnStatus.includes('button focused')) {
    throw new Error(`focus (button) failed. Expected "button focused", got "${focusBtnStatus}"`);
  }
  console.log('[all_in_one] focus (button): PASSED');

  // ============ ELEMENT DATA ============

  // Test: getText
  console.log('[all_in_one] Testing getText...');
  const textContent = await engine.getText(pageId, '#text-element');
  if (textContent !== 'This is sample text') {
    throw new Error(`getText failed. Expected "This is sample text", got "${textContent}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-gettext')?.classList.add('done'); });
  console.log('[all_in_one] getText: PASSED');

  // Test: getAllTexts
  console.log('[all_in_one] Testing getAllTexts...');
  const allTexts = await engine.getAllTexts(pageId, '.list-item');
  if (!Array.isArray(allTexts) || allTexts.length !== 3) {
    throw new Error(`getAllTexts failed. Expected array of 3, got ${JSON.stringify(allTexts)}`);
  }
  if (allTexts[0] !== 'Item 1' || allTexts[1] !== 'Item 2' || allTexts[2] !== 'Item 3') {
    throw new Error(`getAllTexts failed. Expected ["Item 1", "Item 2", "Item 3"], got ${JSON.stringify(allTexts)}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-getalltexts')?.classList.add('done'); });
  console.log('[all_in_one] getAllTexts: PASSED');

  // Test: getInnerHTML
  console.log('[all_in_one] Testing getInnerHTML...');
  const innerHTML = await engine.getInnerHTML(pageId, '#html-element');
  if (!innerHTML.includes('<strong>Bold</strong>') || !innerHTML.includes('<em>italic</em>')) {
    throw new Error(`getInnerHTML failed. Expected HTML with strong and em tags, got "${innerHTML}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-getinnerhtml')?.classList.add('done'); });
  console.log('[all_in_one] getInnerHTML: PASSED');

  // Test: getAttribute
  console.log('[all_in_one] Testing getAttribute...');
  const hrefAttr = await engine.getAttribute(pageId, '#link-element', 'href');
  if (hrefAttr !== 'https://example.com') {
    throw new Error(`getAttribute (href) failed. Expected "https://example.com", got "${hrefAttr}"`);
  }
  const dataAttr = await engine.getAttribute(pageId, '#link-element', 'data-testid');
  if (dataAttr !== 'test-link') {
    throw new Error(`getAttribute (data-testid) failed. Expected "test-link", got "${dataAttr}"`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-getattribute')?.classList.add('done'); });
  console.log('[all_in_one] getAttribute: PASSED');

  // Test: count
  console.log('[all_in_one] Testing count...');
  const itemCount = await engine.count(pageId, '.list-item');
  if (itemCount !== 3) {
    throw new Error(`count failed. Expected 3, got ${itemCount}`);
  }
  const btnCount = await engine.count(pageId, 'button');
  if (btnCount < 5) {
    throw new Error(`count (buttons) failed. Expected at least 5 buttons, got ${btnCount}`);
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-count')?.classList.add('done'); });
  console.log('[all_in_one] count: PASSED');

  // ============ DOWNLOAD MANAGEMENT ============

  // Helper to log download info to the page
  const logDownload = async (message: string) => {
    await engine.evaluate(pageId, (msg: string) => {
      const log = document.getElementById('download-log');
      if (log) {
        log.innerHTML += msg + '<br>';
      }
    }, message);
  };

  // Test: download
  console.log('[all_in_one] Testing download...');
  const testImageUrl = 'https://httpbin.org/image/png';
  await logDownload(`<b>download()</b> → Starting download from: ${testImageUrl}`);
  const downloadResult = await engine.download(testImageUrl);
  if (downloadResult.is_err()) {
    throw new Error(`download failed: ${downloadResult.error}`);
  }
  const downloadId = downloadResult.unwrap();
  if (typeof downloadId !== 'number' || downloadId <= 0) {
    throw new Error(`download failed. Expected positive number downloadId, got ${downloadId}`);
  }
  await logDownload(`  ✓ Download started with ID: <span style="color:#3b82f6">${downloadId}</span>`);
  await engine.evaluate(pageId, () => { document.getElementById('status-download')?.classList.add('done'); });
  console.log('[all_in_one] download: PASSED');

  // Test: waitForDownload
  console.log('[all_in_one] Testing waitForDownload...');
  await logDownload(`<b>waitForDownload()</b> → Waiting for download #${downloadId} to complete...`);
  const waitDownloadResult = await engine.waitForDownload(downloadId, 30000);
  if (waitDownloadResult.is_err()) {
    throw new Error(`waitForDownload failed: ${waitDownloadResult.error}`);
  }
  const downloadItem = waitDownloadResult.unwrap();
  if (!downloadItem || downloadItem.state !== 'complete') {
    throw new Error(`waitForDownload failed. Expected complete state, got ${downloadItem?.state}`);
  }
  const downloadedFilePath = downloadItem.filename;
  await logDownload(`  ✓ Downloaded to: <span style="color:#22c55e">${downloadedFilePath}</span>`);
  await engine.evaluate(pageId, () => { document.getElementById('status-waitdownload')?.classList.add('done'); });
  console.log('[all_in_one] waitForDownload: PASSED');

  // Test: getDownloads
  console.log('[all_in_one] Testing getDownloads...');
  await logDownload(`<b>getDownloads(5)</b> → Fetching recent downloads...`);
  const getDownloadsResult = await engine.getDownloads(5);
  if (getDownloadsResult.is_err()) {
    throw new Error(`getDownloads failed: ${getDownloadsResult.error}`);
  }
  const downloads = getDownloadsResult.unwrap();
  if (!Array.isArray(downloads) || downloads.length === 0) {
    throw new Error(`getDownloads failed. Expected non-empty array, got ${JSON.stringify(downloads)}`);
  }
  const ourDownload = downloads.find(d => d.id === downloadId);
  if (!ourDownload) {
    throw new Error(`getDownloads failed. Our download (id: ${downloadId}) not found in list`);
  }
  await logDownload(`  ✓ Found ${downloads.length} downloads, verified ID #${downloadId} exists`);
  await engine.evaluate(pageId, () => { document.getElementById('status-getdownloads')?.classList.add('done'); });
  console.log('[all_in_one] getDownloads: PASSED');

  // Test: removeFile - delete the file we just downloaded (reusing first download)
  console.log('[all_in_one] Testing removeFile...');
  await logDownload(`<b>removeFile(${downloadId})</b> → Deleting file: ${downloadedFilePath}`);
  const removeFileResult = await engine.removeFile(downloadId);
  if (removeFileResult.is_err()) {
    throw new Error(`removeFile failed: ${removeFileResult.error}`);
  }
  await logDownload(`  ✓ Deleted file from disk: <span style="color:#ef4444">${downloadedFilePath}</span>`);
  await engine.evaluate(pageId, () => { document.getElementById('status-removefile')?.classList.add('done'); });
  console.log('[all_in_one] removeFile: PASSED');

  // Test: eraseDownload - erase the same download from history
  console.log('[all_in_one] Testing eraseDownload...');
  await logDownload(`<b>eraseDownload(${downloadId})</b> → Erasing from history...`);
  const eraseResult = await engine.eraseDownload(downloadId);
  if (eraseResult.is_err()) {
    throw new Error(`eraseDownload failed: ${eraseResult.error}`);
  }
  const afterEraseDownloads = await engine.getDownloads(20);
  if (afterEraseDownloads.is_ok()) {
    const erasedDownload = afterEraseDownloads.unwrap().find(d => d.id === downloadId);
    if (erasedDownload) {
      throw new Error(`eraseDownload failed: Download still in history after erase`);
    }
  }
  await logDownload(`  ✓ Erased download #${downloadId} from history`);
  await engine.evaluate(pageId, () => { document.getElementById('status-erasedownload')?.classList.add('done'); });
  console.log('[all_in_one] eraseDownload: PASSED');

  // Test: cancelDownload - start a slow download and cancel it
  console.log('[all_in_one] Testing cancelDownload...');
  const cancelUrl = 'https://httpbin.org/drip?duration=10&numbytes=1000';
  await logDownload(`<b>cancelDownload()</b> → Starting slow download: ${cancelUrl}`);
  const cancelDownloadResult = await engine.download(cancelUrl);
  if (cancelDownloadResult.is_err()) {
    throw new Error(`cancelDownload setup failed: ${cancelDownloadResult.error}`);
  }
  const cancelDownloadId = cancelDownloadResult.unwrap();
  await logDownload(`  → Download started with ID: ${cancelDownloadId}, cancelling...`);
  await engine.wait(500);
  const cancelResult = await engine.cancelDownload(cancelDownloadId);
  if (cancelResult.is_err()) {
    throw new Error(`cancelDownload failed: ${cancelResult.error}`);
  }
  await logDownload(`  ✓ Cancelled download #${cancelDownloadId}`);
  // Clean up: erase the cancelled download from history
  await engine.eraseDownload(cancelDownloadId);
  await engine.evaluate(pageId, () => { document.getElementById('status-canceldownload')?.classList.add('done'); });
  console.log('[all_in_one] cancelDownload: PASSED');

  // Test: clickAndDownload - click button, get URL, download, show downloaded file
  console.log('[all_in_one] Testing clickAndDownload...');
  await logDownload(`<b>clickAndDownload()</b> → Clicking download button...`);
  await engine.click(pageId, '#download-btn');
  await engine.wait(200);
  const downloadUrl = await engine.getAttribute(pageId, '#download-btn', 'data-url');
  if (!downloadUrl) {
    throw new Error('clickAndDownload failed: Could not get download URL from button');
  }
  await logDownload(`  → Downloading from: ${downloadUrl}`);
  const clickDownloadResult = await engine.download(downloadUrl);
  if (clickDownloadResult.is_err()) {
    throw new Error(`clickAndDownload failed: ${clickDownloadResult.error}`);
  }
  const clickDownloadId = clickDownloadResult.unwrap();
  const clickWaitResult = await engine.waitForDownload(clickDownloadId, 30000);
  if (clickWaitResult.is_err()) {
    throw new Error(`clickAndDownload wait failed: ${clickWaitResult.error}`);
  }
  const clickedDownload = clickWaitResult.unwrap();
  if (!clickedDownload || clickedDownload.state !== 'complete') {
    throw new Error(`clickAndDownload failed. Expected complete state, got ${clickedDownload?.state}`);
  }
  const clickDownloadPath = clickedDownload.filename;
  await logDownload(`  ✓ Downloaded to: <span style="color:#22c55e">${clickDownloadPath}</span>`);
  await logDownload(`  → Opening in background tab...`);
  if (clickDownloadPath) {
    await chrome.tabs.create({ url: 'file://' + clickDownloadPath, active: false });
  }
  await engine.evaluate(pageId, () => { document.getElementById('status-clickdownload')?.classList.add('done'); });
  console.log('[all_in_one] clickAndDownload: PASSED');

  // ============ SCREENSHOT ============

  // Test: screenshot
  console.log('[all_in_one] Testing screenshot...');
  const screenshotResult = await engine.screenshot(pageId, 'png');
  if (screenshotResult.is_err()) {
    throw new Error(`screenshot failed: ${screenshotResult.error}`);
  }
  const screenshotDataUrl = screenshotResult.unwrap();
  // Verify it's a valid data URL
  if (!screenshotDataUrl || !screenshotDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error(`screenshot failed. Expected PNG data URL, got: ${screenshotDataUrl?.substring(0, 50)}...`);
  }
  // Display the screenshot on the page
  await engine.evaluate(pageId, (dataUrl: string) => {
    const img = document.getElementById('screenshot-image') as HTMLImageElement;
    const info = document.getElementById('screenshot-info');
    if (img && dataUrl) {
      img.src = dataUrl;
      img.style.display = 'block';
    }
    if (info) {
      const sizeKB = Math.round((dataUrl.length * 3 / 4) / 1024);
      info.textContent = `Screenshot captured (PNG, ~${sizeKB}KB)`;
    }
  }, screenshotDataUrl);
  await engine.evaluate(pageId, () => { document.getElementById('status-screenshot')?.classList.add('done'); });
  console.log('[all_in_one] screenshot: PASSED');

  // Update the result display
  await engine.evaluate(pageId, () => {
    const result = document.getElementById('result');
    if (result) {
      result.className = 'result-success';
      result.textContent = 'All tests completed successfully!';
    }
  });

  // ============ FINAL VERIFICATION ============

  // Verify the success message is displayed
  const resultText = await engine.getText(pageId, '#result');
  if (!resultText.includes('All tests completed successfully')) {
    throw new Error(`Final result check failed. Got: "${resultText}"`);
  }

  console.log('[all_in_one] All tests PASSED! Tab kept open for verification.');
};
