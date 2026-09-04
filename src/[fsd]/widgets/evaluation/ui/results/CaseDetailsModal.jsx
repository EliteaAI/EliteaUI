import { memo, useCallback, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { Box, Dialog, IconButton, Typography } from '@mui/material';

const stringifyContent = value => {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const ContentColumn = memo(props => {
  const { label, content, onFullScreen } = props;

  const styles = contentColumnStyles();

  return (
    <Box sx={styles.column}>
      <Box sx={styles.columnHeader}>
        <Typography
          variant="labelSmall"
          sx={styles.columnLabel}
        >
          {label}
        </Typography>
        <IconButton
          size="small"
          onClick={onFullScreen}
          sx={styles.fullScreenButton}
        >
          <FullscreenIcon sx={styles.fullScreenIcon} />
        </IconButton>
      </Box>
      <Box sx={styles.columnContent}>
        <Typography
          variant="bodySmall"
          sx={styles.contentText}
          component="pre"
        >
          {stringifyContent(content)}
        </Typography>
      </Box>
    </Box>
  );
});

ContentColumn.displayName = 'ContentColumn';

/** @type {MuiSx} */
const contentColumnStyles = () => ({
  column: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    borderRight: `0.0625rem solid ${palette.border.lines}`,
    '&:last-child': {
      borderRight: 'none',
    },
  }),
  columnHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  columnLabel: ({ palette }) => ({
    color: palette.text.default,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 500,
  }),
  fullScreenButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: palette.background.tabButton?.active ?? palette.action.selected,
    },
  }),
  fullScreenIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  columnContent: {
    flex: 1,
    padding: '1rem',
    overflow: 'auto',
  },
  contentText: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
});

const FullScreenPreview = memo(props => {
  const { open, label, content, onClose } = props;

  const styles = fullScreenPreviewStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      sx={styles.dialog}
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.title}
        >
          {label}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={styles.closeButton}
        >
          <CloseIcon sx={styles.closeIcon} />
        </IconButton>
      </Box>
      <Box sx={styles.content}>
        <Typography
          variant="bodySmall"
          sx={styles.contentText}
          component="pre"
        >
          {stringifyContent(content)}
        </Typography>
      </Box>
    </Dialog>
  );
});

FullScreenPreview.displayName = 'FullScreenPreview';

/** @type {MuiSx} */
const fullScreenPreviewStyles = () => ({
  dialog: ({ palette }) => ({
    '& .MuiDialog-paper': {
      backgroundColor: palette.background.secondary,
    },
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  closeButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.tabButton?.active ?? palette.action.selected,
    },
  }),
  closeIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.icon.fill.default,
  }),
  content: {
    flex: 1,
    padding: '1.5rem',
    overflow: 'auto',
  },
  contentText: ({ palette }) => ({
    color: palette.text.default,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.7,
  }),
});

const CaseDetailsModal = memo(props => {
  const { open, caseData, onClose } = props;

  const [fullScreenColumn, setFullScreenColumn] = useState(null);

  const handleOpenFullScreen = useCallback(column => {
    setFullScreenColumn(column);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setFullScreenColumn(null);
  }, []);

  const caseItem = caseData?.case;
  const caseId = caseData?.id;

  const hasInstructions = caseItem?.structure != null && caseItem?.structure !== '';

  const columns = [
    { key: 'input', label: 'Input', content: caseItem?.input },
    { key: 'actualOutput', label: 'Actual Output', content: caseItem?.output },
    { key: 'expectedOutput', label: 'Expected Output', content: caseItem?.expected_output },
  ];

  if (hasInstructions) {
    columns.push({ key: 'instructions', label: 'Instructions', content: caseItem?.structure });
  }

  const styles = caseDetailsModalStyles(columns.length);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        sx={styles.dialog}
        data-testid="case-details-modal"
      >
        <Box sx={styles.header}>
          <Typography
            variant="bodyMedium"
            sx={styles.title}
          >
            Case #{caseId} details
          </Typography>
          <IconButton
            onClick={onClose}
            sx={styles.closeButton}
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        </Box>
        <Box sx={styles.columnsContainer}>
          {columns.map(col => (
            <ContentColumn
              key={col.key}
              label={col.label}
              content={col.content}
              onFullScreen={() => handleOpenFullScreen(col)}
            />
          ))}
        </Box>
      </Dialog>

      <FullScreenPreview
        open={fullScreenColumn != null}
        label={fullScreenColumn?.label}
        content={fullScreenColumn?.content}
        onClose={handleCloseFullScreen}
      />
    </>
  );
});

CaseDetailsModal.displayName = 'CaseDetailsModal';

/** @type {MuiSx} */
const caseDetailsModalStyles = columnCount => ({
  dialog: ({ palette }) => ({
    '& .MuiDialog-paper': {
      width: columnCount === 4 ? '70rem' : '56rem',
      maxWidth: '95vw',
      height: '80vh',
      maxHeight: '80vh',
      backgroundColor: palette.background.secondary,
      borderRadius: '0.75rem',
      overflow: 'hidden',
    },
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  closeButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.tabButton?.active ?? palette.action.selected,
    },
  }),
  closeIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.icon.fill.default,
  }),
  columnsContainer: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default CaseDetailsModal;
