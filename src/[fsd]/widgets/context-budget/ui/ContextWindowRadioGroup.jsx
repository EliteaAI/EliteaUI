import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { CONTEXT_WINDOW_COPY, CONTEXT_WINDOW_MODES } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Balanced / Full choice with descriptions, for the Settings page where no model is selected yet.
 */
const ContextWindowRadioGroup = memo(props => {
  const { value, onChange, disabled = false } = props;
  const styles = contextWindowRadioGroupStyles();

  const items = useMemo(
    () => [
      {
        value: CONTEXT_WINDOW_MODES.BALANCED,
        label: 'Balanced',
        description: CONTEXT_WINDOW_COPY.BALANCED_DESCRIPTION(),
      },
      {
        value: CONTEXT_WINDOW_MODES.FULL,
        label: 'Full',
        description: CONTEXT_WINDOW_COPY.FULL_DESCRIPTION,
      },
    ],
    [],
  );

  return (
    <Box
      sx={styles.container}
      data-testid="memory-context-window-mode"
    >
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          {CONTEXT_WINDOW_COPY.LABEL}
        </Typography>
        <InfoTooltip
          infoTooltip={`${CONTEXT_WINDOW_COPY.MODES_TOOLTIP}\n\n${CONTEXT_WINDOW_COPY.HELPER}`}
          testId="context-window-mode-info"
        />
      </Box>
      <Typography variant="bodySmall">{CONTEXT_WINDOW_COPY.SETTINGS_CAPTION}</Typography>
      <Checkbox.RadioButtonGroup
        testId="context-window-mode"
        direction="column"
        items={items}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </Box>
  );
});

ContextWindowRadioGroup.displayName = 'ContextWindowRadioGroup';

/** @type {MuiSx} */
const contextWindowRadioGroupStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.surface.interactive.default,
    borderRadius: '0.75rem',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default ContextWindowRadioGroup;
