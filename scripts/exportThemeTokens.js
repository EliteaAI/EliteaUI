/* eslint-disable no-undef */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import dark from '../src/darkPalette.js';
import light from '../src/lightPalette.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function flattenPalette(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenPalette(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

const outDir = resolve(__dirname, '../src/[fsd]/shared/config/theme');
mkdirSync(outDir, { recursive: true });

writeFileSync(resolve(outDir, 'darkTheme.json'), JSON.stringify(flattenPalette(dark), null, 2) + '\n');

writeFileSync(resolve(outDir, 'lightTheme.json'), JSON.stringify(flattenPalette(light), null, 2) + '\n');

console.log('✓ Exported darkTheme.json and lightTheme.json');
