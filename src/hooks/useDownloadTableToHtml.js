/***
 * Simplified from react-export-table-to-excel
 */
import { useCallback } from 'react';

const template =
  '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-mic' +
  'rosoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta cha' +
  'rset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:Exce' +
  'lWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/>' +
  '</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></' +
  'xml><![endif]-->' +
  ` <style>
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
  </style>
` +
  '</head><body>{table}</body></html>';

export function removeTagsFromTableCells(table) {
  const cloneTable = table.cloneNode(true);
  // Get all the cells in the new table
  const cells = cloneTable.getElementsByTagName('td');
  // Loop over the cells and remove the tags from their content
  for (let i = 0; i < cells.length; i++) {
    const textContent = cells[i].textContent;
    cells[i].innerHTML = textContent;
  }
  // Get all the head cells in the new table
  const heads = cloneTable.getElementsByTagName('th');
  // Loop over the head cells and remove the tags from their content
  for (let i = 0; i < heads.length; i++) {
    const textContent = heads[i].textContent;
    heads[i].innerHTML = textContent;
  }
  return cloneTable;
}

function getTable(table) {
  return removeTagsFromTableCells(table).outerHTML;
}

function format(string, context) {
  return string.replace(/{(\w+)}/g, (_, p) => context[p]);
}

function download(fileName, context) {
  const element = window.document.createElement('a');
  const data = new Blob([format(template, context)], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(data);
  element.href = url;
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  return true;
}

export function useDownloadTableToHtml({ tableRef, filename }) {
  const onDownloadHtml = useCallback(() => {
    const table = getTable(tableRef);
    const fileName = `${filename}.html`;

    const context = {
      table,
    };

    return download(fileName, context);
  }, [filename, tableRef]);

  const onCopyHtml = useCallback(async () => {
    const table = getTable(tableRef);
    const context = {
      table,
    };
    const htmlContent = format(template, context);
    await navigator.clipboard.writeText(htmlContent);
  }, [tableRef]);

  return {
    onDownloadHtml,
    onCopyHtml,
  };
}
