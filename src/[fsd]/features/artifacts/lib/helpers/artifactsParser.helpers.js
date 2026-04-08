const parseCSVLine = line => {
  const result = [];

  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
};

export const parseCSV = content => {
  const lines = content.trim().split('\n');

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  return { headers, rows };
};

export const parseTSV = content => {
  const lines = content.trim().split('\n');

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split('\t');
  const rows = lines.slice(1).map(line => line.split('\t'));

  return { headers, rows };
};

export const parseDataFile = (fileType, content, AvailableFormatsEnum) => {
  try {
    let data = null;
    if (fileType === AvailableFormatsEnum.CSV) {
      data = parseCSV(content);
    } else if (fileType === AvailableFormatsEnum.TSV) {
      data = parseTSV(content);
    }
    return data;
  } catch {
    return null;
  }
};
