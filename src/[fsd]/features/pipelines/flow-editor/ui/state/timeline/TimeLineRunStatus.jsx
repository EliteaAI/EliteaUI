import { memo } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';

const { PipelineStatus } = FlowEditorConstants;

const TimeLineRunStatus = memo(props => {
  const { lastStep } = props;

  const styles = timeLineRunStatusStyles();
  const attentionIcon = (
    <Box sx={styles.attentionBox}>
      <AttentionIcon
        width="14"
        height="14"
      />
    </Box>
  );
  const indicators = {
    [PipelineStatus.InProgress]: {
      label: 'Performing',
      textSx: styles.textInactive,
      icon: (
        <Box sx={styles.progressBox}>
          <StyledCircleProgress
            size={14}
            sx={styles.progressColor}
          />
        </Box>
      ),
    },
    [PipelineStatus.Error]: {
      label: 'Error',
      textSx: styles.textError,
      icon: (
        <Box sx={styles.progressBox}>
          <ErrorOutlineIcon
            fontSize="1rem"
            sx={styles.errorIcon}
          />
        </Box>
      ),
    },
    [PipelineStatus.Interrupt]: {
      label: 'User action waiting...',
      textSx: styles.textInactive,
      icon: attentionIcon,
    },
    [PipelineStatus.Completed]: { label: 'Completed', textSx: styles.textPublished },
    [PipelineStatus.Stopped]: { label: 'Stopped', textSx: styles.textInactive, icon: attentionIcon },
  };
  const indicator = indicators[lastStep?.status];

  return (
    <Box sx={styles.container}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {`${lastStep?.id || ''}:`}
      </Typography>
      {indicator && (
        <>
          {indicator.icon}
          <Typography
            variant="bodyMedium"
            sx={indicator.textSx}
          >
            {indicator.label}
          </Typography>
        </>
      )}
    </Box>
  );
});

TimeLineRunStatus.displayName = 'TimeLineRunStatus';

/** @type {MuiSx} */
const timeLineRunStatusStyles = () => ({
  container: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  progressBox: {
    width: '0.875rem',
    height: '0.875rem',
  },
  attentionBox: ({ palette }) => ({
    width: '0.875rem',
    height: '0.875rem',
    color: palette.status.onModeration,
  }),
  progressColor: ({ palette }) => ({
    color: palette.icon.inactive,
  }),
  errorIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.status.rejected,
  }),
  textInactive: ({ palette }) => ({
    color: palette.icon.inactive,
  }),
  textError: ({ palette }) => ({
    color: palette.status.rejected,
  }),
  textPublished: ({ palette }) => ({
    color: palette.status.published,
  }),
});

export default TimeLineRunStatus;
