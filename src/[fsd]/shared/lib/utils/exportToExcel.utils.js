const MAX_COLUMN_WIDTH = 50;
const MIN_COLUMN_WIDTH = 10;

// Long enough for any browser to start reading the blob, short enough not to leak
const REVOKE_DELAY_MS = 60_000;

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
const META_LABEL_FONT = { bold: true };
const WRAP_ALIGNMENT = { wrapText: true, vertical: 'top' };

// Excel's own worksheet-name rules: 31 characters, and none of []:*?/\ anywhere in the name.
export const EXCEL_SHEET_NAME_MAX_LENGTH = 31;
const EXCEL_SHEET_NAME_FORBIDDEN = /[\\/*?:[\]]/g;

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

const addSection = (worksheet, { columns, rows }, startRow) => {
  const colDefs = columns.map(column => {
    // A wrapped column holds prose that is longer than any width would show on one line, so it
    // takes the widest column outright rather than measuring its content.
    const widest = column.wrap
      ? MAX_COLUMN_WIDTH
      : rows.reduce(
          (longest, row) => Math.max(longest, String(cellValue(row, column)).length),
          column.header.length,
        );

    return {
      header: column.header,
      width: Math.min(Math.max(widest + 2, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH),
      numFmt: column.numFmt,
    };
  });

  const headerRow = worksheet.getRow(startRow);
  colDefs.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;

    const wsCol = worksheet.getColumn(i + 1);
    wsCol.width = Math.max(wsCol.width || MIN_COLUMN_WIDTH, col.width);
    if (col.numFmt) wsCol.style = { ...wsCol.style, numFmt: col.numFmt };
  });

  rows.forEach((row, ri) => {
    const excelRow = worksheet.getRow(startRow + 1 + ri);
    columns.forEach((column, ci) => {
      const cell = excelRow.getCell(ci + 1);
      cell.value = cellValue(row, column);
      // Set per cell rather than on the column: a column-level style would also repaint the
      // header row that was just styled above.
      if (column.wrap) cell.alignment = WRAP_ALIGNMENT;
    });
  });

  return startRow + rows.length + 1;
};

/**
 * Build and download a multi-sheet workbook.
 *
 * Sheets are `{ sheetName, columns, rows, metadata?, sections? }`.
 *
 * Simple form: `columns` + `rows` — one data table per sheet.
 * Rich form: `metadata` (key/value pairs at the top) + `sections` (array of
 * `{ title, columns, rows }` blocks rendered sequentially below the metadata).
 * `columns`/`rows` at the top level are treated as a single implicit section.
 *
 * Columns are `{ header, key, numFmt?, transform?, wrap? }`. A `wrap` column takes the widest
 * width and wraps its text, for prose no single line would show. Values are written
 * unformatted and styled with numFmt instead, so numbers stay numeric —
 * a pre-formatted string would break sums and sorting in the spreadsheet.
 */
export const exportToExcel = async (fileName, sheets) => {
  // Loaded on demand: the library is large and only needed when someone exports
  const { default: ExcelJS } = await import('exceljs');

  const workbook = new ExcelJS.Workbook();

  for (const { sheetName, columns, rows = [], metadata, sections } of sheets) {
    const worksheet = workbook.addWorksheet(sheetName);

    if (metadata || sections) {
      let currentRow = 1;
      let freezeAfter = 0;

      if (metadata) {
        for (const [label, value] of metadata) {
          const row = worksheet.getRow(currentRow);
          row.getCell(1).value = label;
          row.getCell(1).font = META_LABEL_FONT;
          row.getCell(2).value = value;
          currentRow++;
        }
        freezeAfter = currentRow;
        currentRow++;
      }

      const allSections = sections || [{ columns, rows }];

      for (const section of allSections) {
        if (section.title) {
          const titleRow = worksheet.getRow(currentRow);
          titleRow.getCell(1).value = section.title;
          titleRow.getCell(1).font = { bold: true, size: 12 };
          currentRow++;
        }
        currentRow = addSection(worksheet, section, currentRow) + 1;
      }

      if (freezeAfter > 0) {
        worksheet.views = [{ state: 'frozen', ySplit: freezeAfter }];
      }
    } else {
      worksheet.columns = columns.map(column => {
        const widest = column.wrap
          ? MAX_COLUMN_WIDTH
          : rows.reduce(
              (longest, row) => Math.max(longest, String(cellValue(row, column)).length),
              column.header.length,
            );

        return {
          header: column.header,
          width: Math.min(Math.max(widest + 2, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH),
          ...(column.numFmt ? { style: { numFmt: column.numFmt } } : {}),
        };
      });

      rows.forEach(row => {
        const excelRow = worksheet.addRow(columns.map(column => cellValue(row, column)));
        columns.forEach((column, ci) => {
          if (column.wrap) excelRow.getCell(ci + 1).alignment = WRAP_ALIGNMENT;
        });
      });

      const header = worksheet.getRow(1);
      header.font = { bold: true };
      header.fill = HEADER_FILL;

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };
    }
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

/**
 * Makes one worksheet name Excel will accept: forbidden characters dropped, whitespace collapsed,
 * and clipped to 31 characters. Excel refuses to open a workbook whose sheet name breaks any of
 * those rules, so every caller-supplied name (a dimension name, a case id) has to pass through here.
 */
export const sanitizeSheetName = (value, fallback = 'Sheet') => {
  const cleaned = String(value ?? '')
    .replace(EXCEL_SHEET_NAME_FORBIDDEN, ' ')
    .replace(/\s+/g, ' ')
    // Excel also rejects a name wrapped in apostrophes.
    .replace(/^'+|'+$/g, '')
    .trim();

  return (cleaned || fallback).slice(0, EXCEL_SHEET_NAME_MAX_LENGTH).trim();
};

/**
 * Returns a namer that hands out unique, Excel-legal worksheet names. A name already taken gets a
 * " (n)" suffix, and the base is trimmed far enough back to keep the whole thing within 31
 * characters — so "Response Quality and Relevance" becomes "Response Quality and Releva (2)"
 * rather than a duplicate Excel would reject.
 *
 * `reserved` claims names up front (the workbook's "Summary" sheet, say).
 */
export const createSheetNamer = (reserved = []) => {
  const used = new Set(reserved.map(name => sanitizeSheetName(name).toLowerCase()));

  return (value, fallback = 'Sheet') => {
    const base = sanitizeSheetName(value, fallback);
    if (!used.has(base.toLowerCase())) {
      used.add(base.toLowerCase());
      return base;
    }

    for (let index = 2; ; index += 1) {
      const suffix = ` (${index})`;
      const candidate = `${base.slice(0, EXCEL_SHEET_NAME_MAX_LENGTH - suffix.length).trim()}${suffix}`;
      if (!used.has(candidate.toLowerCase())) {
        used.add(candidate.toLowerCase());
        return candidate;
      }
    }
  };
};
