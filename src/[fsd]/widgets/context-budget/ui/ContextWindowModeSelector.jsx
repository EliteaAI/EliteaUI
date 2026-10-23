import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip as MuiTooltip, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import TooltipMarkdownContent from '@/[fsd]/shared/ui/tooltip/TooltipMarkdownContent';
import {
  BALANCED_WINDOW_TOKENS,
  CONTEXT_WINDOW_COPY,
  CONTEXT_WINDOW_MODES,
} from '@/[fsd]/widgets/context-budget/lib/constants';

// Popper offsets are px numbers: [skidding, distance] — 8px = 0.5rem gap between icon and tooltip.
const INFO_TOOLTIP_SLOT_PROPS = {
  popper: {
    sx: { zIndex: 9999 },
    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
  },
};

const MODES_TOOLTIP = `**Balanced**: ${CONTEXT_WINDOW_COPY.BALANCED_DESCRIPTION}\n**Full**: ${CONTEXT_WINDOW_COPY.FULL_DESCRIPTION}`;

/**
 * Balanced / Full context window switch: a labelled switch with a single info tooltip for forms (`labelled`),
 * or a bare compact switch (`segmented`).
 */
const ContextWindowModeSelector = memo(props => {
  const {
    value = CONTEXT_WINDOW_MODES.BALANCED,
    onChange,
    variant = 'labelled',
    disabled = false,
    disabledReason,
    modelWindow,
    showHelper = true,
  } = props;
  const styles = contextWindowModeSelectorStyles();

  const showIdenticalHint = modelWindow > 0 && modelWindow <= BALANCED_WINDOW_TOKENS;
  const infoTooltip = showHelper ? `${MODES_TOOLTIP}\n\n${CONTEXT_WINDOW_COPY.HELPER}` : MODES_TOOLTIP;

  const segmentedItems = useMemo(
    () => [
      {
        value: CONTEXT_WINDOW_MODES.BALANCED,
        label: 'Balanced',
        buttonProps: { disabled, 'data-testid': 'context-window-mode-balanced' },
      },
      {
        value: CONTEXT_WINDOW_MODES.FULL,
        label: 'Full',
        buttonProps: { disabled, 'data-testid': 'context-window-mode-full' },
      },
    ],
    [disabled],
  );

  const handleChange = useCallback(
    (_event, newValue) => {
      if (!disabled && newValue !== value) onChange?.(newValue);
    },
    [disabled, onChange, value],
  );

  const toggle = (
    <Box component="span">
      <TabGroupButton
        value={value}
        onChange={handleChange}
        size="small"
        arrayBtn={segmentedItems}
        disableTooltip
        customSx={styles.segmentedButton}
      />
    </Box>
  );

  const content =
    variant === 'segmented' ? (
      toggle
    ) : (
      <Box sx={styles.container}>
        <Box sx={styles.row}>
          <Box sx={styles.infoLabel}>
            <Typography
              component="span"
              variant="bodySmall"
              sx={styles.label}
            >
              {CONTEXT_WINDOW_COPY.LABEL}
            </Typography>
            <MuiTooltip
              title={<TooltipMarkdownContent>{infoTooltip}</TooltipMarkdownContent>}
              placement="top"
              slotProps={INFO_TOOLTIP_SLOT_PROPS}
            >
              <Box
                component="span"
                sx={styles.infoIcon}
              >
                <InfoTooltip
                  infoTooltip={infoTooltip}
                  testId="context-window-mode-info"
                  disableTooltip
                />
              </Box>
            </MuiTooltip>
          </Box>
          {toggle}
        </Box>
        {showIdenticalHint && (
          <Typography
            variant="bodySmall"
            color="text.default"
            data-testid="context-window-mode-identical-hint"
          >
            {CONTEXT_WINDOW_COPY.IDENTICAL_HINT}
          </Typography>
        )}
      </Box>
    );

  return disabled && disabledReason ? (
    <Tooltip
      title={disabledReason}
      placement={variant === 'segmented' ? 'top' : 'top-start'}
    >
      {content}
    </Tooltip>
  ) : (
    content
  );
});

ContextWindowModeSelector.displayName = 'ContextWindowModeSelector';

/** @type {MuiSx} */
const contextWindowModeSelectorStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  infoLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  infoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 0,
  },
  segmentedButton: {
    height: '1.5rem',
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    '& .MuiTypography-root': {
      fontSize: '0.75rem',
      lineHeight: '1rem',
    },
  },
});

export default ContextWindowModeSelector;
