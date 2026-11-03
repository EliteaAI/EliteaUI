import { memo, useCallback, useEffect, useId, useState } from 'react';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Chip, Tooltip, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { VISUALLY_HIDDEN } from '../lib/constants';

const MAX_VARIABLE_CHIPS = 3;

/**
 * The read-only prompt of the schedule with Run test, as one pinned
 * line: the chevron opens the full prompt and the variable chips; a test start closes it.
 * The prompt changes in the form; `onTestRun` saves a changed form first. `running`: a test runs now.
 * `description`: read with Run test by screen readers. `disabledHint`: Run test is disabled and the hint says why (#7254).
 */
const SchedulePromptSummary = memo(props => {
  const {
    prompt,
    variables = [],
    versionLabel,
    running,
    pending,
    description,
    disabledHint,
    onTestRun,
  } = props;

  const [open, setOpen] = useState(false);
  const regionId = useId();
  const descriptionId = useId();
  const hintId = useId();
  const toggle = useCallback(() => setOpen(value => !value), []);

  useEffect(() => {
    if (running) setOpen(false);
  }, [running]);

  const canOpen = !!prompt || variables.length > 0;
  const shownVariables = variables.slice(0, MAX_VARIABLE_CHIPS);
  const hiddenCount = variables.length - shownVariables.length;
  const styles = schedulePromptSummaryStyles();

  const versionChip = versionLabel && (
    <Chip
      data-testid="schedule-prompt-chip"
      size="small"
      variant="outlined"
      icon={<AccessTimeIcon />}
      label={versionLabel}
    />
  );

  return (
    <Box sx={styles.root}>
      {open && (
        <Box
          id={regionId}
          sx={styles.region}
        >
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Prompt from the schedule
          </Typography>
          {prompt && (
            <Typography
              data-testid="schedule-prompt-text"
              variant="bodyMedium"
              sx={styles.fullPrompt}
            >
              {prompt}
            </Typography>
          )}
          <Box sx={styles.chips}>
            {versionChip}
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
        </Box>
      )}
      <Box sx={styles.row}>
        {canOpen && (
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<ExpandMoreIcon />}
            aria-label="Show the full prompt"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={toggle}
            sx={styles.chevron(open)}
          />
        )}
        {running && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.line}
          >
            A test is running.
          </Typography>
        )}
        {!running && !open && prompt && (
          <Tooltip
            title={prompt}
            placement="top"
          >
            <Typography
              data-testid="schedule-prompt-text"
              variant="bodyMedium"
              sx={styles.line}
            >
              {prompt}
            </Typography>
          </Tooltip>
        )}
        {!open && versionChip}
        {description && (
          <Box
            component="span"
            id={descriptionId}
            sx={VISUALLY_HIDDEN}
          >
            {description}
          </Box>
        )}
        {disabledHint && (
          <Typography
            id={hintId}
            data-testid="schedule-test-run-hint"
            variant="bodySmall"
            color="text.secondary"
          >
            {disabledHint}
          </Typography>
        )}
        <BaseBtn
          data-testid="schedule-test-run"
          variant="elitea"
          color="primary"
          startIcon={<PlayArrowIcon />}
          disabled={running || pending || !!disabledHint}
          aria-describedby={disabledHint ? hintId : description ? descriptionId : undefined}
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
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  region: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  fullPrompt: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '3',
    overflow: 'hidden',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  // One 36 px line: chevron, the prompt with an ellipsis, the version chip and Run test at the right
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '2.25rem' },
  chevron: open => ({
    '& svg': { transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' },
  }),
  line: { flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  runTest: { marginLeft: 'auto', flexShrink: 0 },
});

export default SchedulePromptSummary;
