import { memo, useCallback } from 'react';

import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { formatCaseContent } from '../../lib/helpers';

const CaseContentColumn = memo(props => {
  const { column, onFullScreen } = props;

  const handleFullScreen = useCallback(() => {
    onFullScreen?.(column);
  }, [onFullScreen, column]);

  const styles = caseContentColumnStyles();

  return (
    <Box sx={styles.column}>
      <Box sx={styles.columnHeader}>
        <Typography
          variant="labelSmall"
          sx={styles.columnLabel}
        >
          {column.label}
        </Typography>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          aria-label={`Expand ${column.label}`}
          onClick={handleFullScreen}
          sx={styles.fullScreenButton}
          startIcon={<FullscreenIcon sx={styles.fullScreenIcon} />}
        />
      </Box>
      <Box sx={styles.columnContent}>
        <Typography
          variant="bodySmall"
          sx={styles.contentText}
          component="pre"
        >
          {formatCaseContent(column.content)}
        </Typography>
      </Box>
    </Box>
  );
});

CaseContentColumn.displayName = 'CaseContentColumn';

/** @type {MuiSx} */
const caseContentColumnStyles = () => ({
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
    minWidth: 'unset',
    padding: '0.25rem',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '&:hover': {
      backgroundColor: palette.background.tabButton.active,
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

export default CaseContentColumn;
