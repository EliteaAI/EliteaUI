import { useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import AddColumnIcon from '@/assets/add-column-icon.svg?react';
import AddRowIcon from '@/assets/add-row-icon.svg?react';
import RedoIcon from '@/assets/redo-icon.svg?react';
import UndoIcon from '@/assets/undo-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import RegenerateIcon from '@/components/Icons/RegenerateIcon';
import ImportTableButton from '@/components/ImportTableButton';
import { languageOptions } from '@/hooks/useCodeMirrorLanguageExtensions';
import { useTheme } from '@emotion/react';

const CanvasEditHeader = ({
  title = 'Edit response',
  onUndo,
  disableUndo = false,
  onRedo,
  disableRedo = false,
  onClose,
  onCopy,
  onRegenerate,
  onDelete,
  showLangSelect,
  onChangeLanguage,
  language = 'text',
  isThisWholeMessage,
  isTableEditing,
  hasSelectedRowsColumns,
  onImportTableData,
  onClickAddColumn,
  onClickAddRow,
  onDeleteSelectedRowsOrColumns,
  disabledAll,
  disableLanguageSelect,
}) => {
  const theme = useTheme();
  const disableDeleteTableRowsCols = useMemo(
    () =>
      disabledAll || (!hasSelectedRowsColumns.hasSelectedRows && !hasSelectedRowsColumns.hasSelectedColumns),
    [disabledAll, hasSelectedRowsColumns.hasSelectedColumns, hasSelectedRowsColumns.hasSelectedRows],
  );
  const finalLanguage =
    (language === 'cpp'
      ? 'c++'
      : language === 'js'
        ? 'javascript'
        : language === 'ts'
          ? 'typescript'
          : language) ?? 'text';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '4px',
        paddingBottom: '4px',
        gap: '8px',
        paddingRight: '8px',
        boxSizing: 'border-box',
        height: '36px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'start-start',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <IconButton
          sx={{ marginLeft: '0px' }}
          variant="elitea"
          color="tertiary"
          onClick={onClose}
        >
          <CloseIcon
            fill={theme.palette.icon.fill.default}
            sx={{ fontSize: '18px', cursor: 'pointer' }}
          />
        </IconButton>
        <Typography
          variant="bodyMedium"
          color={'text.secondary'}
          sx={{
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'start-end',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <Tooltip
          title={'Undo'}
          placement="top"
        >
          <span>
            <IconButton
              disabled={disableUndo || disabledAll}
              sx={{ marginLeft: '0px' }}
              variant="elitea"
              color="tertiary"
              onClick={onUndo}
            >
              <UndoIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={'Redo'}
          placement="top"
        >
          <span>
            <IconButton
              disabled={disableRedo || disabledAll}
              sx={{ marginLeft: '0px' }}
              variant="elitea"
              color="tertiary"
              onClick={onRedo}
            >
              <RedoIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={'Copy'}
          placement="top"
        >
          <span>
            <IconButton
              sx={{ marginLeft: '0px' }}
              variant="elitea"
              color="tertiary"
              onClick={onCopy}
            >
              <CopyIcon
                sx={{ fontSize: '16px' }}
                fill={disabledAll ? theme.palette.text.button.disabled : undefined}
              />
            </IconButton>
          </span>
        </Tooltip>
        {isThisWholeMessage && (
          <Tooltip title={'Regenerate'}>
            <span>
              <IconButton
                aria-label="stop streaming"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onRegenerate}
                sx={{ marginLeft: '0px' }}
              >
                <RegenerateIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {isThisWholeMessage && (
          <Tooltip
            title="Delete the message"
            placement="top"
          >
            <span>
              <IconButton
                aria-label="delete the message"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onDelete}
                sx={{ marginLeft: '0px' }}
              >
                <DeleteIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showLangSelect && (
          <Box>
            <SingleSelect
              onValueChange={onChangeLanguage}
              value={finalLanguage}
              disabled={disabledAll || disableLanguageSelect}
              options={languageOptions}
              customSelectedColor={`${theme.palette.text.primary} !important`}
              customSelectedFontSize={'0.875rem'}
              sx={{ margin: '5px 0 0 0 !important' }}
            />
          </Box>
        )}
        {isTableEditing && (
          <Tooltip
            title={
              hasSelectedRowsColumns.hasSelectedRows
                ? 'Delete selected rows'
                : hasSelectedRowsColumns.hasSelectedColumns
                  ? 'Delete selected columns'
                  : ''
            }
            placement="top"
          >
            <span>
              <IconButton
                aria-label="delete the message"
                variant="elitea"
                color="tertiary"
                disabled={disableDeleteTableRowsCols}
                onClick={onDeleteSelectedRowsOrColumns}
                sx={{ marginLeft: '0px' }}
              >
                <DeleteIcon
                  sx={{ fontSize: '16px' }}
                  fill={disableDeleteTableRowsCols ? theme.palette.text.button.disabled : undefined}
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {isTableEditing && (
          <Tooltip
            title="Add column"
            placement="top"
          >
            <span>
              <IconButton
                aria-label="add column to table"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onClickAddColumn}
                sx={{ marginLeft: '0px' }}
              >
                <AddColumnIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {isTableEditing && (
          <Tooltip
            title="Add row"
            placement="top"
          >
            <span>
              <IconButton
                aria-label="add row to table"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onClickAddRow}
                sx={{ marginLeft: '0px' }}
              >
                <AddRowIcon
                  sx={{ fontSize: '16px' }}
                  fill={theme.palette.icon.fill.default}
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {isTableEditing && (
          <ImportTableButton
            onImported={onImportTableData}
            disabled={disabledAll}
          />
        )}
      </Box>
    </Box>
  );
};

export default CanvasEditHeader;
