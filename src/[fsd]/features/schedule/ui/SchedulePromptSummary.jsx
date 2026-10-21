import { memo } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Chip, Tooltip, Typography } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';

const MAX_VARIABLE_CHIPS = 3;

/**
 * The read-only prompt of the schedule with Run test (owner CR 2026-10-21 test panel log).
 * The prompt changes in the form; `onTestRun` saves a changed form first. `running`: a test runs now.
 */
const SchedulePromptSummary = memo(props => {
  const { prompt, variables = [], versionLabel, running, pending, onTestRun } = props;

  const shownVariables = variables.slice(0, MAX_VARIABLE_CHIPS);
  const hiddenCount = variables.length - shownVariables.length;
  const styles = schedulePromptSummaryStyles();

  return (
    <Box sx={styles.root}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
      >
        Prompt from the schedule
      </Typography>
      {prompt && (
        <Tooltip
          title={prompt}
          placement="top"
        >
          <Typography
            data-testid="schedule-prompt-text"
            variant="bodyMedium"
            sx={styles.prompt}
          >
            {prompt}
          </Typography>
        </Tooltip>
      )}
      <Box sx={styles.chips}>
        {versionLabel && (
          <Chip
            data-testid="schedule-prompt-chip"
            size="small"
            variant="outlined"
            icon={<AccessTimeIcon />}
            label={versionLabel}
          />
        )}
        {shownVariables.map(({ name, value }) => (
          <Chip
            key={name}
            data-testid="schedule-prompt-chip"
            size="small"
            variant="outlined"
            label={`${name} = ${value}`}
          />
        ))}
        {hiddenCount > 0 && (
          <Chip
            data-testid="schedule-prompt-chip"
            size="small"
            variant="outlined"
            label={`+${hiddenCount}`}
          />
        )}
      </Box>
      <Box sx={styles.footer}>
        {running && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            A test is running.
          </Typography>
        )}
        <BaseBtn
          data-testid="schedule-test-run"
          variant="elitea"
          color="primary"
          startIcon={<PlayArrowIcon />}
          disabled={running || pending}
          onClick={onTestRun}
          sx={styles.runTest}
        >
          Run test
        </BaseBtn>
      </Box>
    </Box>
  );
});

SchedulePromptSummary.displayName = 'SchedulePromptSummary';

/** @type {MuiSx} */
const schedulePromptSummaryStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
  }),
  prompt: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '3',
    overflow: 'hidden',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  footer: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  runTest: { marginLeft: 'auto' },
});

export default SchedulePromptSummary;
