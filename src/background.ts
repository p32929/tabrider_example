import { Engine } from 'tabrider';
import { getAutomation, automationModules, type AutomationFunctionName, type IFuncParams } from '@/types/automations.js';

console.log('Background service worker starting...');

interface AutomationStatus {
  module: string;
  function: string;
  startTime: number;
  status: 'running' | 'completed' | 'failed';
  endTime?: number;
  result?: { success: boolean; message: string };
  error?: string;
}

interface AutomationRequest {
  action: string;
  module?: string;
  function?: string;
  params?: Record<string, unknown>;
  tabId?: number;
}

class BackgroundService {
  private runningAutomations: Map<string, AutomationStatus> = new Map();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('Background service worker initialized');

    // Initialize the Engine
    await Engine.init();

    // Restore state from storage
    await this.restoreState();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request as AutomationRequest, sender, sendResponse);
      return true;
    });

    console.log('Background service ready');
  }

  private async restoreState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['runningAutomations']);
      if (result.runningAutomations) {
        const entries = Object.entries(result.runningAutomations) as [string, AutomationStatus][];
        const automations = new Map<string, AutomationStatus>(entries);

        // Mark all "running" automations as "failed" since browser was closed
        for (const [, automation] of automations.entries()) {
          if (automation.status === 'running') {
            automation.status = 'failed';
            automation.endTime = Date.now();
            automation.error = 'Browser was closed while automation was running';
          }
        }

        this.runningAutomations = automations;
        await this.saveState();
      }
    } catch (error) {
      console.error('Failed to restore automation state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const stateObject = Object.fromEntries(this.runningAutomations);
      await chrome.storage.local.set({ runningAutomations: stateObject });
    } catch (error) {
      console.error('Failed to save automation state:', error);
    }
  }

  private async handleMessage(
    request: AutomationRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case 'runAutomation':
          if (request.module && request.function) {
            this.runAutomation(request.module, request.function, request.params || {}, sendResponse);
          } else {
            sendResponse({ success: false, error: 'Missing required parameters' });
          }
          break;

        case 'getAutomationStatus':
          sendResponse(this.getAutomationStatus());
          break;

        case 'getAvailableFunctions':
          sendResponse(this.getAvailableFunctions());
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async runAutomation(
    module: string,
    functionName: string,
    params: Record<string, unknown>,
    sendResponse: (response: unknown) => void
  ): Promise<void> {
    const automationId = `${module}.${functionName}_${Date.now()}`;

    try {
      console.log(`Starting automation: ${automationId}`);

      // Mark as running
      this.runningAutomations.set(automationId, {
        module,
        function: functionName,
        startTime: Date.now(),
        status: 'running'
      });

      await this.saveState();

      // Send initial response
      sendResponse({
        success: true,
        automationId,
        message: 'Automation started',
        status: 'running'
      });

      // Set automation name and start session
      Engine.setAutomationName(functionName);
      await Engine.startAutomationSession();

      try {
        await this.executeAutomation(module, functionName, params);
      } finally {
        Engine.setAutomationName(null);
        await Engine.endAutomationSession();
      }

      // Mark as completed
      const originalAutomation = this.runningAutomations.get(automationId);
      this.runningAutomations.set(automationId, {
        module,
        function: functionName,
        startTime: originalAutomation?.startTime || Date.now(),
        endTime: Date.now(),
        status: 'completed',
        result: { success: true, message: 'Automation completed' }
      });

      await this.saveState();
      console.log(`Automation completed: ${automationId}`);

      this.notifyPopup('automationComplete', { automationId, result: { success: true } });

      // Clean up after delay
      setTimeout(() => {
        this.runningAutomations.delete(automationId);
        this.saveState();
      }, 5000);

    } catch (error) {
      console.error(`Automation failed: ${automationId}`, error);

      const originalAutomation = this.runningAutomations.get(automationId);
      this.runningAutomations.set(automationId, {
        module,
        function: functionName,
        startTime: originalAutomation?.startTime || Date.now(),
        endTime: Date.now(),
        status: 'failed',
        error: (error as Error).message
      });

      await this.saveState();

      this.notifyPopup('automationFailed', {
        automationId,
        error: (error as Error).message
      });

      setTimeout(() => {
        this.runningAutomations.delete(automationId);
        this.saveState();
      }, 5000);
    }
  }

  private async executeAutomation(
    module: string,
    functionName: string,
    params: Record<string, unknown>
  ): Promise<void> {
    const automationPath = `${module}.${functionName}` as AutomationFunctionName;
    const automationFunction = getAutomation(automationPath);

    if (!automationFunction) {
      throw new Error(`Function ${functionName} not found in module ${module}`);
    }

    await automationFunction({
      configs: { name: automationPath, params: params as Record<string, string | number | boolean> },
      engine: Engine
    } as IFuncParams);
  }

  private getAutomationStatus(): {
    success: boolean;
    automations: Array<{ id: string; module: string; function: string; startTime: number; status: string }>
  } {
    const runningAutomations = Array.from(this.runningAutomations.entries())
      .filter(([, automation]) => automation.status === 'running')
      .map(([id, automation]) => ({
        id,
        ...automation
      }));

    return { success: true, automations: runningAutomations };
  }

  private async notifyPopup(action: string, data: { automationId: string; result?: unknown; error?: string }): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ action, ...data });
    } catch {
      console.log('Popup not available for notification');
    }
  }

  private getAvailableFunctions(): {
    success: boolean;
    functions: Array<{ name: string; module: string; function: string; description: string }>
  } {
    const availableFunctions: Array<{ name: string; module: string; function: string; description: string }> = [];

    const modules = Object.keys(automationModules) as Array<keyof typeof automationModules>;

    for (const moduleName of modules) {
      const module = automationModules[moduleName];
      const functionNames = Object.keys(module);

      for (const func of functionNames) {
        // Format description nicely (e.g., "all_in_one" -> "All in one")
        const description = func
          .replace(/_/g, ' ')
          .replace(/^\w/, c => c.toUpperCase());

        availableFunctions.push({
          name: `${moduleName}.${func}`,
          module: moduleName,
          function: func,
          description
        });
      }
    }

    return { success: true, functions: availableFunctions };
  }
}

// Initialize background service
new BackgroundService();

// Dev auto-reload: connects to the WebSocket server started by the vite plugin.
// When vite finishes a build, it sends "reload" and the extension reloads instantly.
// Reconnects automatically if the connection drops (e.g. service worker restart).
(function devAutoReload() {
  function connect() {
    try {
      const ws = new WebSocket('ws://localhost:8789');
      ws.onmessage = (event) => {
        if (event.data === 'reload') {
          console.log('[dev] Build complete, reloading extension...');
          chrome.runtime.reload();
        }
      };
      ws.onopen = () => console.log('[dev] Auto-reload connected');
      ws.onclose = () => {
        console.log('[dev] Auto-reload disconnected, reconnecting in 2s...');
        setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
    } catch {
      setTimeout(connect, 2000);
    }
  }

  connect();

  // Keep service worker alive so the WebSocket connection persists
  chrome.alarms.create('dev-keepalive', { periodInMinutes: 0.4 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dev-keepalive') { /* just waking up */ }
  });
})();
