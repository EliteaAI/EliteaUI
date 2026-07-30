const MAX_COLUMN_WIDTH = 50;
const MIN_COLUMN_WIDTH = 10;

// Long enough for any browser to start reading the blob, short enough not to leak
const REVOKE_DELAY_MS = 60_000;

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

/** Excel formats, so cells stay numeric and remain usable in formulas. */
export const ExcelFormats = {
  currency: '$#,##0.00####',
  percent: '0.00"%"',
  integer: '#,##0',
};

const cellValue = (row, column) => {
  const value = row[column.key];

  return column.transform ? column.transform(value, row) : (value ?? '');
};

/**
 * Build and download a multi-sheet workbook.
 *
 * Sheets are `{ sheetName, columns, rows }`, columns `{ header, key, numFmt?, transform? }`.
 * Values are written unformatted and styled with numFmt instead, so numbers stay numeric —
 * a pre-formatted string would break sums and sorting in the spreadsheet.
 */
export const exportToExcel = async (fileName, sheets) => {
  // Loaded on demand: the library is large and only needed when someone exports
  const { default: ExcelJS } = await import('exceljs');

  const workbook = new ExcelJS.Workbook();

  for (const { sheetName, columns, rows = [] } of sheets) {
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map(column => {
      const widest = rows.reduce(
        (longest, row) => Math.max(longest, String(cellValue(row, column)).length),
        column.header.length,
      );

      return {
        header: column.header,
        width: Math.min(Math.max(widest + 2, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH),
        ...(column.numFmt ? { style: { numFmt: column.numFmt } } : {}),
      };
    });

    rows.forEach(row => worksheet.addRow(columns.map(column => cellValue(row, column))));

    const header = worksheet.getRow(1);
    header.font = { bold: true };
    header.fill = HEADER_FILL;

    // Keep headers visible and filterable while scrolling a long sheet
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  // Safari requires the link to be in the DOM
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Revoking before the browser has read the blob cancels the download silently
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY_MS);
};

/** Make a project name safe for a filename: no separators, no runs of whitespace. */
export const sanitizeFileNamePart = (value, fallback = 'Project') => {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  return cleaned || fallback;
};
