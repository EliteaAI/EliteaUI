import { useCallback, useMemo } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ThemeProvider,
  tableCellClasses,
} from '@mui/material';
import Table from '@mui/material/Table';

import Tooltip from '@/ComponentsLib/Tooltip';
import { PERMISSIONS } from '@/common/constants';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';
import useAlitaTheme from '@/hooks/useAlitaTheme';
import useCheckPermission from '@/hooks/useCheckPermission';
import useDownloadTable, { downloadTableOptions } from '@/hooks/useDownloadTable';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import EditingPlaceholder from './Chat/EditingPlaceholder';
import { useCheckIsBlockEditing } from './CodeBlock';
import EditIcon from './Icons/EditIcon';
import { parseMarkdownTable } from './MarkdownTableEditor';
import SplitButton from './SplitButton';

export const useShouldDisableEditCanvas = isStreaming => {
  const { checkPermission } = useCheckPermission();
  const shouldDisableEdit = useMemo(
    () => isStreaming || !checkPermission(PERMISSIONS.chat.canvas.create),
    [checkPermission, isStreaming],
  );
  return shouldDisableEdit;
};

export default function MarkdownTableBlock({
  children,
  tableRowData,
  interaction_uuid,
  conversation_uuid,
  onEdit,
  startPos,
  endPos,
  selectedCodeBlockInfo,
  tableId,
  canvasId,
  messageItemId,
  isStreaming,
  showToolbar,
}) {
  const theme = useTheme();
  const { localGridTheme } = useAlitaTheme();
  const { toastInfo } = useToast();
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const { headers, rows } = useMemo(() => parseMarkdownTable(tableRowData), [tableRowData]);
  const shouldDisableEdit = useShouldDisableEditCanvas(isStreaming);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(tableRowData);
    toastInfo('The code has been copied into clipboard');
  }, [tableRowData, toastInfo]);
  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: tableRowData,
      codeBlock: tableRowData,
      language: 'markdownTable',
      isBlock: true,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
    });
  }, [onEdit, tableRowData, startPos, endPos, canvasId, messageItemId, blockId]);

  const {
    tableRef,
    onClickDownloadWithMonitor: onClickDownload,
    onClick,
  } = useDownloadTable({
    tableRowData,
    interaction_uuid,
    conversation_uuid,
  });

  return !isBlockEditing ? (
    <>
      <Box
        sx={{
          width: '100%',
          display: showToolbar ? 'flex' : 'none',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '8px 0px 8px 8px',
          gap: '8px',
        }}
      >
        {onEdit && (
          <Tooltip
            title="Edit table"
            placement="top"
          >
            <span>
              <IconButton
                variant="alita"
                color="tertiary"
                disabled={shouldDisableEdit}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onClick={onClickEdit}
              >
                <EditIcon
                  sx={{ fontSize: 16 }}
                  fill={
                    !shouldDisableEdit ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled
                  }
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip
          title="Copy code"
          placement="top"
        >
          <IconButton
            variant="alita"
            color="tertiary"
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: '0px',
            }}
            onClick={onClickCopy}
          >
            <ContentCopyIcon sx={{ fontSize: '16px', color: theme.palette.icon.fill.default }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ width: '100%', overflowX: 'auto', marginTop: '8px' }}>
        <ThemeProvider theme={localGridTheme}>
          <Table
            id={tableId}
            ref={tableRef}
            sx={{
              '& .MuiTableCell-root': {
                whiteSpace: 'normal',
                overflowWrap: 'break-word',
                borderRight: `1px solid ${theme.palette.border.lines}`,
                [`&.${tableCellClasses.head}`]: {
                  backgroundColor: theme.palette.background.tabPanel,
                  borderTop: `1px solid ${theme.palette.border.lines}`,
                  whiteSpace: 'nowrap',
                },
              },
              '& .MuiTableRow-root .MuiTableCell-root:first-of-type': {
                borderLeft: `1px solid ${theme.palette.border.lines}`,
              },
              minWidth: '1070px', // Ensure it doesn't exceed parent width
            }}
          >
            {!children ? (
              <>
                <TableHead>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableCell key={index}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows?.map((row, rowIndex) => (
                    <TableRow
                      id={row.id}
                      key={rowIndex}
                    >
                      {headers.map((header, index) => (
                        <TableCell key={index}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </>
            ) : (
              children
            )}
          </Table>
        </ThemeProvider>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '40px',
          display: 'flex',
          flexDirection: 'row',
          marginTop: '12px',
          marginBottom: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <SplitButton
          defaultValue="xlsx"
          options={downloadTableOptions}
          onClick={interaction_uuid ? onClickDownload : onClick}
        />
      </Box>
    </>
  ) : (
    <EditingPlaceholder title="Table editing..." />
  );
}
