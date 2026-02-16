interface AutomationFunction {
  name: string;
  module: string;
  function: string;
  description: string;
}

class PopupManager {
  private functions: AutomationFunction[] = [];
  private selectedFunctions: Set<string> = new Set();
  private runningFunctions: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('Popup manager initialized');

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      this.handleBackgroundMessage(request);
      sendResponse({ success: true });
      return true;
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializePopup());
    } else {
      await this.initializePopup();
    }

    // Update status when popup is reopened
    window.addEventListener('focus', () => this.updateRunningFunctionsFromBackground());
  }

  private setupEventListeners(): void {
    const runButton = document.getElementById('runButton') as HTMLButtonElement;
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');

    runButton?.addEventListener('click', () => this.handleRunClick());
    selectAllBtn?.addEventListener('click', () => this.selectAll());
    deselectAllBtn?.addEventListener('click', () => this.deselectAll());
  }

  private handleBackgroundMessage(request: { action: string; automationId?: string; result?: unknown; error?: string }): void {
    switch (request.action) {
      case 'automationComplete':
        this.handleAutomationComplete(request.automationId || '');
        break;

      case 'automationFailed':
        this.handleAutomationFailed(request.automationId || '', request.error || 'Unknown error');
        break;
    }
  }

  private handleAutomationComplete(automationId: string): void {
    const functionName = automationId.split('_')[0];
    console.log(`Automation ${functionName} completed`);

    this.runningFunctions.delete(functionName);
    this.updateUI();
    this.updateStatus(`Completed: ${functionName}`);

    setTimeout(() => {
      if (this.runningFunctions.size === 0) {
        this.updateStatus('Ready');
      }
    }, 3000);
  }

  private handleAutomationFailed(automationId: string, error: string): void {
    const functionName = automationId.split('_')[0];
    console.error(`Automation ${functionName} failed: ${error}`);

    this.runningFunctions.delete(functionName);
    this.updateUI();
    this.updateStatus(`Error: ${error}`);

    setTimeout(() => {
      if (this.runningFunctions.size === 0) {
        this.updateStatus('Ready');
      }
    }, 5000);
  }

  private async loadFunctions(): Promise<void> {
    // Retry logic to handle background service worker not being ready
    const maxRetries = 3;
    const retryDelay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getAvailableFunctions' }) as {
          success: boolean;
          functions?: AutomationFunction[];
        };

        if (response && response.success && response.functions && response.functions.length > 0) {
          this.functions = response.functions;
          console.log(`Loaded ${this.functions.length} functions on attempt ${attempt}`);
          return;
        }

        // If response is empty or invalid, wait and retry
        if (attempt < maxRetries) {
          console.log(`No functions received on attempt ${attempt}, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, (error as Error).message);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries failed
    this.functions = [];
    console.warn('Failed to load functions after all retries');
  }

  private async updateRunningFunctionsFromBackground(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAutomationStatus' }) as {
        success: boolean;
        automations?: Array<{ id: string; status: string }>;
      };

      if (response.success && response.automations) {
        this.runningFunctions.clear();

        response.automations.forEach((automation) => {
          const functionName = automation.id.split('_')[0];
          if (automation.status === 'running') {
            this.runningFunctions.add(functionName);
          }
        });

        this.updateUI();
      }
    } catch (error) {
      console.warn('Could not get status:', (error as Error).message);
    }
  }

  private renderUI(): void {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const functionCount = document.getElementById('functionCount');
    const automationList = document.getElementById('automationList');

    if (loadingIndicator) loadingIndicator.style.display = 'none';

    if (functionCount) {
      functionCount.textContent = `${this.functions.length} functions`;
    }

    if (automationList) {
      automationList.innerHTML = '';

      this.functions.forEach(func => {
        const item = document.createElement('div');
        item.className = 'automation-item';
        item.dataset.name = func.name;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'automation-checkbox';
        checkbox.id = `cb-${func.name}`;
        checkbox.checked = this.selectedFunctions.has(func.name);

        const info = document.createElement('div');
        info.className = 'automation-info';

        const name = document.createElement('div');
        name.className = 'automation-name';
        name.textContent = `${func.module}.${func.function}`;

        const desc = document.createElement('div');
        desc.className = 'automation-desc';
        desc.textContent = func.description;

        info.appendChild(name);
        info.appendChild(desc);

        item.appendChild(checkbox);
        item.appendChild(info);

        // Click on item toggles checkbox
        item.addEventListener('click', (e) => {
          if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
          }
          this.handleCheckboxChange(func.name, checkbox.checked);
        });

        checkbox.addEventListener('change', () => {
          this.handleCheckboxChange(func.name, checkbox.checked);
        });

        automationList.appendChild(item);
      });
    }

    this.updateUI();
  }

  private handleCheckboxChange(funcName: string, checked: boolean): void {
    if (checked) {
      this.selectedFunctions.add(funcName);
    } else {
      this.selectedFunctions.delete(funcName);
    }
    this.updateUI();
  }

  private selectAll(): void {
    this.functions.forEach(func => {
      this.selectedFunctions.add(func.name);
      const checkbox = document.getElementById(`cb-${func.name}`) as HTMLInputElement;
      if (checkbox) checkbox.checked = true;
    });
    this.updateUI();
  }

  private deselectAll(): void {
    this.selectedFunctions.clear();
    this.functions.forEach(func => {
      const checkbox = document.getElementById(`cb-${func.name}`) as HTMLInputElement;
      if (checkbox) checkbox.checked = false;
    });
    this.updateUI();
  }

  private updateUI(): void {
    const selectedCount = document.getElementById('selectedCount');
    const runButton = document.getElementById('runButton') as HTMLButtonElement;
    const runningFunctionsDiv = document.getElementById('runningFunctions');

    // Update selected count
    if (selectedCount) {
      selectedCount.textContent = `${this.selectedFunctions.size} selected`;
    }

    // Update run button
    if (runButton) {
      const hasRunning = this.runningFunctions.size > 0;
      const hasSelected = this.selectedFunctions.size > 0;

      if (hasRunning) {
        runButton.textContent = `Running ${this.runningFunctions.size} automation(s)...`;
        runButton.disabled = true;
        runButton.style.background = '#9ca3af';
      } else if (hasSelected) {
        runButton.textContent = `Start ${this.selectedFunctions.size} Automation(s)`;
        runButton.disabled = false;
        runButton.style.background = '#2563eb';
      } else {
        runButton.textContent = 'Select automations to start';
        runButton.disabled = true;
        runButton.style.background = '#9ca3af';
      }
    }

    // Update running indicator
    if (runningFunctionsDiv) {
      if (this.runningFunctions.size > 0) {
        runningFunctionsDiv.style.display = 'block';
        runningFunctionsDiv.textContent = `Running: ${Array.from(this.runningFunctions).join(', ')}`;
      } else {
        runningFunctionsDiv.style.display = 'none';
      }
    }

    // Update item styles
    this.functions.forEach(func => {
      const item = document.querySelector(`[data-name="${func.name}"]`);
      if (item) {
        item.classList.toggle('selected', this.selectedFunctions.has(func.name));
        item.classList.toggle('running', this.runningFunctions.has(func.name));

        // Add running badge if running
        let badge = item.querySelector('.automation-status');
        if (this.runningFunctions.has(func.name)) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'automation-status running';
            badge.textContent = 'Running';
            item.appendChild(badge);
          }
        } else if (badge) {
          badge.remove();
        }
      }
    });

    // Update status dot
    const statusDot = document.getElementById('statusDot');
    if (statusDot) {
      statusDot.className = 'status-dot';
      if (this.runningFunctions.size > 0) {
        statusDot.classList.add('running');
      }
    }
  }

  private async handleRunClick(): Promise<void> {
    if (this.selectedFunctions.size === 0) return;

    const selected = Array.from(this.selectedFunctions);
    console.log(`Starting ${selected.length} automations in parallel`);

    // Mark all as running immediately
    selected.forEach(funcName => {
      this.runningFunctions.add(funcName);
    });
    this.updateUI();
    this.updateStatus(`Starting ${selected.length} automations...`);

    // Launch all automations in parallel
    selected.forEach(funcName => {
      const func = this.functions.find(f => f.name === funcName);
      if (!func) return;

      chrome.runtime.sendMessage({
        action: 'runAutomation',
        module: func.module,
        function: func.function,
        params: {}
      }).then(response => {
        const res = response as { success: boolean; error?: string };
        if (res.success) {
          console.log(`Started: ${funcName}`);
        } else {
          console.error(`Failed to start ${funcName}: ${res.error}`);
          this.runningFunctions.delete(funcName);
          this.updateUI();
        }
      }).catch(error => {
        console.error(`Failed to start ${funcName}: ${(error as Error).message}`);
        this.runningFunctions.delete(funcName);
        this.updateUI();
      });
    });

    // Clear selection after starting
    this.selectedFunctions.clear();
    this.functions.forEach(func => {
      const checkbox = document.getElementById(`cb-${func.name}`) as HTMLInputElement;
      if (checkbox) checkbox.checked = false;
    });
    this.updateUI();
  }

  private updateStatus(message: string): void {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');

    if (statusText) {
      statusText.textContent = message;
    }

    if (statusDot) {
      statusDot.className = 'status-dot';
      if (message.includes('Running') || message.includes('Starting')) {
        statusDot.classList.add('running');
      } else if (message.includes('Error') || message.includes('Failed')) {
        statusDot.classList.add('error');
      }
    }
  }

  private async initializePopup(): Promise<void> {
    try {
      await this.loadFunctions();
      this.renderUI();
      this.setupEventListeners();
      await this.updateRunningFunctionsFromBackground();
    } catch (error) {
      console.error('Failed to initialize:', (error as Error).message);
      this.showError('Failed to initialize popup');
    }
  }

  private showError(message: string): void {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.innerHTML = `<div class="error">${message}</div>`;
    }
  }
}

// Initialize when script loads
new PopupManager();
