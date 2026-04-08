import { useCallback, useRef } from 'react';

import ExcellentExport from 'excellentexport';

import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';

import { useDownloadMarkdown } from './useDownloadMarkdown';
import { removeTagsFromTableCells, useDownloadTableToHtml } from './useDownloadTableToHtml';
import useToast from './useToast';

export const downloadTableOptions = [
  { label: 'Copy as markdown', value: 'markdown' },
  { label: 'Copy as html', value: 'html' },
  { label: 'Download as xlsx', value: 'xlsx' },
];

export default function useDownloadTable({ tableRowData }) {
  const downloadLink = useRef();
  const { toastInfo } = useToast();
  const tableRef = useRef();

  // console.log('tableRawData======>', tableRowData)

  const { onCopyHtml } = useDownloadTableToHtml({
    tableRef: tableRef.current,
    filename: 'table',
  });

  const onDownloadExcel = useCallback(() => {
    ExcellentExport.convert(
      {
        anchor: downloadLink.current,
        filename: 'table',
        format: 'xlsx',
        openAsDownload: true,
      },
      [
        {
          name: 'worksheet',
          from: {
            table: removeTagsFromTableCells(tableRef.current),
          },
        },
      ],
      'xlsx',
    );
  }, [tableRef]);

  const { onCopyRawTable } = useDownloadMarkdown({
    markdown: tableRowData,
    filename: 'table.md',
  });

  const onClick = useCallback(
    option => {
      switch (option) {
        case 'markdown':
          onCopyRawTable();
          toastInfo('The markdown presentation of the table has been copied into clipboard');
          break;
        case 'html':
          onCopyHtml();
          toastInfo('The html presentation of the table has been copied into clipboard');
          break;
        case 'xlsx':
          onDownloadExcel();
          break;
        default:
          break;
      }
    },
    [onCopyHtml, onCopyRawTable, onDownloadExcel, toastInfo],
  );

  const { onClickDownload } = useCopyDownloadHandlers({
    onDownload: onClick,
  });

  return {
    tableRef,
    onClickDownloadWithMonitor: onClickDownload,
    onClick,
  };
}
