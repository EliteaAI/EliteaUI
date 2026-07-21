const tokenize = str => {
  const tokens = [];
  const regex = /(\S+|\s+)/g;

  let match;

  while ((match = regex.exec(str)) !== null) {
    tokens.push(match[0]);
  }

  return tokens;
};

const lcsMatrix = (originalTokens, modifiedTokens) => {
  const originalLen = originalTokens.length;
  const modifiedLen = modifiedTokens.length;
  const matrix = Array.from({ length: originalLen + 1 }, () => new Uint16Array(modifiedLen + 1));

  for (let origIdx = 1; origIdx <= originalLen; origIdx++) {
    for (let modIdx = 1; modIdx <= modifiedLen; modIdx++) {
      if (originalTokens[origIdx - 1] === modifiedTokens[modIdx - 1])
        matrix[origIdx][modIdx] = matrix[origIdx - 1][modIdx - 1] + 1;
      else matrix[origIdx][modIdx] = Math.max(matrix[origIdx - 1][modIdx], matrix[origIdx][modIdx - 1]);
    }
  }

  return matrix;
};

const backtrack = (matrix, originalTokens, modifiedTokens) => {
  const segments = [];

  let origIdx = originalTokens.length;
  let modIdx = modifiedTokens.length;

  const prepend = (type, text) => {
    if (segments.length > 0 && segments[0].type === type) segments[0].text = text + segments[0].text;
    else segments.unshift({ type, text });
  };

  while (origIdx > 0 || modIdx > 0) {
    if (origIdx > 0 && modIdx > 0 && originalTokens[origIdx - 1] === modifiedTokens[modIdx - 1]) {
      prepend('equal', originalTokens[origIdx - 1]);
      origIdx--;
      modIdx--;
    } else if (modIdx > 0 && (origIdx === 0 || matrix[origIdx][modIdx - 1] >= matrix[origIdx - 1][modIdx])) {
      prepend('added', modifiedTokens[modIdx - 1]);
      modIdx--;
    } else {
      prepend('removed', originalTokens[origIdx - 1]);
      origIdx--;
    }
  }

  return segments;
};

export const computeWordDiff = (original, modified) => {
  if (original === modified) return original ? [{ type: 'equal', text: original }] : [];
  if (!original) return modified ? [{ type: 'added', text: modified }] : [];
  if (!modified) return original ? [{ type: 'removed', text: original }] : [];

  const originalTokens = tokenize(original);
  const modifiedTokens = tokenize(modified);

  const matrix = lcsMatrix(originalTokens, modifiedTokens);

  return backtrack(matrix, originalTokens, modifiedTokens);
};
