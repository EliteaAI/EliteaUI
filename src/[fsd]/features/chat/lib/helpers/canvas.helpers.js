const trimEmptyStringsAtEnd = (array = []) => {
  let end = array.length - 1;
  while (end >= 0 && array[end] === '') end--;
  return array.slice(0, end + 1);
};

export const extraCodeFromBlock = (code = '') => {
  if (code.startsWith('```')) {
    const lines = trimEmptyStringsAtEnd(code.split('\n'));
    return lines.slice(1, lines.length - 1).join('\n');
  }
  return code;
};
