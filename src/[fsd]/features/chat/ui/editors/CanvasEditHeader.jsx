import { memo, useMemo } from 'react';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { CodeMirrorEditorHelpers } from '@/[fsd]/shared/lib/helpers';
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

const CanvasEditHeader = memo(props => {
  const {
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
  } = props;

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

  const styles = canvasEditHeaderStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.titleGroup}>
        <IconButton
          data-testid="chat-canvas-close-button"
          sx={styles.iconButton}
          variant="elitea"
          color="tertiary"
          onClick={onClose}
        >
          <CloseIcon
            fill={theme.palette.icon.default}
            sx={styles.closeIcon}
          />
        </IconButton>
        <Typography
          data-testid="chat-canvas-title"
          variant="bodyMedium"
          color={'text.secondary'}
          sx={styles.title}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={styles.actions}>
        <Tooltip
          title={'Undo'}
          placement="top"
        >
          <Box component="span">
            <IconButton
              disabled={disableUndo || disabledAll}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onUndo}
            >
              <UndoIcon sx={styles.actionIcon} />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip
          title={'Redo'}
          placement="top"
        >
          <Box component="span">
            <IconButton
              disabled={disableRedo || disabledAll}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onRedo}
            >
              <RedoIcon sx={styles.actionIcon} />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip
          title={'Copy'}
          placement="top"
        >
          <Box component="span">
            <IconButton
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onCopy}
            >
              <CopyIcon
                sx={styles.actionIcon}
                fill={disabledAll ? theme.palette.icon.disabled : undefined}
              />
            </IconButton>
          </Box>
        </Tooltip>
        {isThisWholeMessage && (
          <Tooltip title={'Regenerate'}>
            <Box component="span">
              <IconButton
                aria-label="stop streaming"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onRegenerate}
                sx={styles.iconButton}
              >
                <RegenerateIcon sx={styles.actionIcon} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
        {isThisWholeMessage && (
          <Tooltip
            title="Delete the message"
            placement="top"
          >
            <Box component="span">
              <IconButton
                aria-label="delete the message"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onDelete}
                sx={styles.iconButton}
              >
                <DeleteIcon sx={styles.actionIcon} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
        {showLangSelect && (
          <Box>
            <SingleSelect
              onValueChange={onChangeLanguage}
              value={finalLanguage}
              disabled={disabledAll || disableLanguageSelect}
              options={CodeMirrorEditorHelpers.languageOptions}
              customSelectedColor={`${theme.palette.text.primary} !important`}
              customSelectedFontSize={'0.875rem'}
              sx={styles.languageSelect}
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
            <Box component="span">
              <IconButton
                aria-label="delete the message"
                variant="elitea"
                color="tertiary"
                disabled={disableDeleteTableRowsCols}
                onClick={onDeleteSelectedRowsOrColumns}
                sx={styles.iconButton}
              >
                <DeleteIcon
                  sx={styles.actionIcon}
                  fill={disableDeleteTableRowsCols ? theme.palette.icon.disabled : undefined}
                />
              </IconButton>
            </Box>
          </Tooltip>
        )}
        {isTableEditing && (
          <Tooltip
            title="Add column"
            placement="top"
          >
            <Box component="span">
              <IconButton
                aria-label="add column to table"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onClickAddColumn}
                sx={styles.iconButton}
              >
                <AddColumnIcon sx={styles.actionIcon} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
        {isTableEditing && (
          <Tooltip
            title="Add row"
            placement="top"
          >
            <Box component="span">
              <IconButton
                aria-label="add row to table"
                variant="elitea"
                color="tertiary"
                disabled={disabledAll}
                onClick={onClickAddRow}
                sx={styles.iconButton}
              >
                <AddRowIcon
                  sx={styles.actionIcon}
                  fill={theme.palette.icon.default}
                />
              </IconButton>
            </Box>
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
});

CanvasEditHeader.displayName = 'CanvasEditHeader';

/** @type {MuiSx} */
const canvasEditHeaderStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
    gap: '0.5rem',
    paddingRight: '0.5rem',
    boxSizing: 'border-box',
    height: '2.25rem',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'start-start',
    gap: '0.5rem',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'start-end',
    gap: '0.5rem',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: '0',
  },
  closeIcon: {
    fontSize: '1.125rem',
    cursor: 'pointer',
  },
  actionIcon: {
    fontSize: '1rem',
  },
  languageSelect: {
    margin: '0.3125rem 0 0 0 !important',
  },
});

export default CanvasEditHeader;
