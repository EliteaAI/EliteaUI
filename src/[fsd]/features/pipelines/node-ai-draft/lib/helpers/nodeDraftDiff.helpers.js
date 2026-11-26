const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// `{type, value}` mapping objects are one field, as in the backend's changed_paths
const isValueObject = value => isPlainObject(value) && 'type' in value && 'value' in value;
const isNested = value => isPlainObject(value) && !isValueObject(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const collect = (before, after, prefix, paths) => {
  new Set([...Object.keys(before), ...Object.keys(after)]).forEach(key => {
    if (!prefix && (key === 'id' || key === 'type')) return;
    const path = `${prefix}${key}`;
    const old = before[key];
    const next = after[key];
    if (same(old, next)) return;
    if (isNested(old) && isNested(next)) collect(old, next, `${path}.`, paths);
    else if (isNested(next) && old === undefined) collect({}, next, `${path}.`, paths);
    else paths.push(path);
  });
};

/** Fields that differ between the node before the modal and the current draft (spec AC-13) */
export const changedFieldPaths = (original = {}, node = {}) => {
  const paths = [];
  collect(original, node, '', paths);
  return paths.sort();
};

/** Line diff (longest common subsequence) of two YAML texts, for the Edit-mode YAML highlight */
export const diffYamlLines = (before = '', after = '') => {
  const a = before.replace(/\n$/, '').split('\n');
  const b = after.replace(/\n$/, '').split('\n');
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  // Walk the table: keep common lines, otherwise take the side that keeps the longer common rest;
  // on a tie the removed line comes first, so a changed line reads as − then +
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: 'same', text: a[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({ kind: 'removed', text: a[i] });
      i += 1;
    } else {
      lines.push({ kind: 'added', text: b[j] });
      j += 1;
    }
  }
  a.slice(i).forEach(text => lines.push({ kind: 'removed', text }));
  b.slice(j).forEach(text => lines.push({ kind: 'added', text }));
  return lines;
};
