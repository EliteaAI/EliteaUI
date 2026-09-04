import { memo } from 'react';

import { Box, LinearProgress, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import WaitingIcon from '@/assets/waiting.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';

const EvaluationProgress = memo(props => {
  const { done = 0, total = 0, percent = 0, cancelRequested = false, onCancel } = props;

  const styles = evaluationProgressStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.content}>
        <SvgIcon
          component={WaitingIcon}
          inheritViewBox
          sx={styles.icon}
        />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          Evaluating...
        </Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.caseCount}
        >
          {total ? `${done}/${total} cases` : 'Preparing cases…'}
        </Typography>
        <Box sx={styles.progressRow}>
          <LinearProgress
            variant={total ? 'determinate' : 'indeterminate'}
            value={percent}
            sx={styles.progressBar}
          />
          <Tooltip
            title={cancelRequested ? 'Cancelling...' : ''}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={onCancel}
                disabled={cancelRequested}
                sx={styles.cancelIconButton}
                startIcon={<CloseIcon sx={styles.closeIcon} />}
              />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
});

EvaluationProgress.displayName = 'EvaluationProgress';

/** @type {MuiSx} */
const evaluationProgressStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    gap: '0.5rem',
    padding: '2rem',
    marginTop: '2.5rem',
  },
  icon: ({ palette }) => ({
    fontSize: '2rem',
    marginBottom: '0.5rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
  caseCount: ({ palette }) => ({
    color: palette.text.default,
    textAlign: 'center',
  }),
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    maxWidth: '21.75rem',
    marginTop: '0.5rem',
  },
  progressBar: ({ palette }) => ({
    flex: 1,
    height: '0.5rem',
    borderRadius: '0.4375rem',
    backgroundColor: palette.background.tabButton.default,
    '& .MuiLinearProgress-bar': {
      borderRadius: '0.4375rem',
      backgroundColor: palette.info.main,
    },
  }),
  cancelIconButton: ({ palette }) => ({
    padding: '0.25rem',
    minWidth: 0,
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  closeIcon: ({ palette }) => ({
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
});

export default EvaluationProgress;
