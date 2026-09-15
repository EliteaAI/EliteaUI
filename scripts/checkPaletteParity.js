/* eslint-disable no-undef */
import dark from '../src/darkPalette.js';
import light from '../src/lightPalette.js';

function flatKeys(obj, p = '') {
  return Object.keys(obj).flatMap(k => {
    const path = p ? `${p}.${k}` : k;
    return obj[k] && typeof obj[k] === 'object' ? flatKeys(obj[k], path) : [path];
  });
}

const dk = new Set(flatKeys(dark));
const lk = new Set(flatKeys(light));
const onlyDark = [...dk].filter(k => !lk.has(k));
const onlyLight = [...lk].filter(k => !dk.has(k));

if (onlyDark.length || onlyLight.length) {
  if (onlyDark.length) console.error('ONLY IN DARK:\n' + onlyDark.map(k => `  ${k}`).join('\n'));
  if (onlyLight.length) console.error('ONLY IN LIGHT:\n' + onlyLight.map(k => `  ${k}`).join('\n'));
  process.exit(1);
}

console.log('✓ Palette parity OK');
