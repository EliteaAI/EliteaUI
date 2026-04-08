export const SortComparators = {
  fileSize: (a, b) => {
    const parseSize = sizeStr => {
      if (!sizeStr || sizeStr === '-' || sizeStr === '') return 0;
      const match = sizeStr
        .toString()
        .trim()
        .match(/^([\d.]+)\s*([KMGTPE]?B?)$/i);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      if (isNaN(value)) return 0;
      const unit = match[2].toUpperCase();
      const multipliers = {
        B: 1,
        '': 1,
        K: 1024,
        KB: 1024,
        M: 1024 * 1024,
        MB: 1024 * 1024,
        G: 1024 * 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        T: 1024 * 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
      };
      return value * (multipliers[unit] || 1);
    };
    return parseSize(a) - parseSize(b);
  },

  date: (a, b) => {
    const parseDate = dateStr => {
      if (!dateStr || dateStr === 'Uploading...') return 0;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    };
    return parseDate(a) - parseDate(b);
  },

  number: (a, b) => {
    const numA = typeof a === 'number' ? a : parseFloat(a) || 0;
    const numB = typeof b === 'number' ? b : parseFloat(b) || 0;
    return numA - numB;
  },

  boolean: (a, b) => {
    return (b ? 1 : 0) - (a ? 1 : 0);
  },
};
