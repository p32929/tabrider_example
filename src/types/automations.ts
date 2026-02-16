import * as tests from '../automations/tests.js';
import * as server_demo from '../automations/server_demo.js';

// Create a map of all automation modules
const automationModules = {
  tests,
  server_demo
} as const;

// Extract all function names as string literal types dynamically
type ExtractFunctionNames<T> = {
  [K in keyof T]: {
    [F in keyof T[K]]: T[K][F] extends Function ? `${K & string}.${F & string}` : never
  }[keyof T[K]]
}[keyof T];

// This gives you autocomplete for strings like "tests.all_in_one"
export type AutomationFunctionName = ExtractFunctionNames<typeof automationModules>;

// Automation config object
export interface AutomationConfig {
  name: AutomationFunctionName;
  params?: {
    [key: string]: string | number | boolean
  }
}

// Type for all automation functions - they all have the same signature
export type AutomationFunction = (params: IFuncParams) => void | Promise<void>;

// Params passed to automation functions
import type { AutomationEngine } from 'tabrider';

export interface IFuncParams {
  configs: AutomationConfig;
  engine?: AutomationEngine;
}

// Helper to get function by string path
export function getAutomation(path: AutomationFunctionName): AutomationFunction {
  const [module, func] = path.split('.') as [keyof typeof automationModules, string];
  return (automationModules[module] as Record<string, AutomationFunction>)[func];
}

// Export modules for runtime access
export { automationModules };
