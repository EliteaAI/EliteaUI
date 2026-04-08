// Suppress React testing warnings in Storybook
if (typeof window !== 'undefined') {
  // Suppress act warnings in Storybook environment
  const originalError = console.error;
  console.error = function (...args) {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: The current testing environment is not configured') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return; // Suppress these specific warnings
    }
    return originalError.apply(console, args);
  };

  // Suppress warning about preloaded resources
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('was preloaded using link preload but not used')
    ) {
      return; // Suppress preload warnings
    }
    return originalWarn.apply(console, args);
  };
}
