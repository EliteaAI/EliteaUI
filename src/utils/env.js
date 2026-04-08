/* global process */
/* eslint-env node */

export function getEnvVar(key, fallback = undefined) {
  // 1. Check elitea_ui_config on globalThis or window
  const config =
    typeof globalThis !== 'undefined' && globalThis.elitea_ui_config
      ? globalThis.elitea_ui_config
      : typeof window !== 'undefined' && window.elitea_ui_config
        ? window.elitea_ui_config
        : undefined;
  if (config && Object.prototype.hasOwnProperty.call(config, key.toLowerCase())) {
    return config[key.toLowerCase()];
  }

  // 2. Try Vite's import.meta.env, but only if available
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key];
    }
  } catch {
    // Ignore if import.meta is not available
  }
  // 3. Check globalThis.__ENV__ (for Jest or custom setups)
  if (typeof globalThis !== 'undefined' && globalThis.__ENV__ && key in globalThis.__ENV__) {
    return globalThis.__ENV__[key];
  }
  // 4. Check process.env (Node, only if process is defined)
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return fallback;
}
