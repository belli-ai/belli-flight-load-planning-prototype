/**
 * Optimizer Registry
 * 
 * Central registry for optimization algorithm implementations.
 * Allows runtime switching between different optimization strategies.
 */

import type { IUldOptimizer, OptimizerFactory } from "./types";

// Registry of available optimizers
const optimizerRegistry = new Map<string, OptimizerFactory>();

// Default optimizer name
let defaultOptimizerName = "ffd-3d";

/**
 * Register an optimizer implementation
 */
export function registerOptimizer(name: string, factory: OptimizerFactory): void {
  optimizerRegistry.set(name, factory);
}

/**
 * Get an optimizer by name
 */
export function getOptimizer(name?: string): IUldOptimizer {
  const optimizerName = name ?? defaultOptimizerName;
  const factory = optimizerRegistry.get(optimizerName);
  
  if (!factory) {
    const available = Array.from(optimizerRegistry.keys()).join(", ");
    throw new Error(
      `Optimizer "${optimizerName}" not found. Available: ${available || "none"}`
    );
  }
  
  return factory();
}

/**
 * Set the default optimizer
 */
export function setDefaultOptimizer(name: string): void {
  if (!optimizerRegistry.has(name)) {
    throw new Error(`Cannot set default: optimizer "${name}" not registered`);
  }
  defaultOptimizerName = name;
}

/**
 * Get list of registered optimizer names
 */
export function getAvailableOptimizers(): string[] {
  return Array.from(optimizerRegistry.keys());
}

/**
 * Get the default optimizer name
 */
export function getDefaultOptimizerName(): string {
  return defaultOptimizerName;
}






