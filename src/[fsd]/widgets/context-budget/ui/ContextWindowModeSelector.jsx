import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { CONTEXT_WINDOW_COPY, CONTEXT_WINDOW_MODES } from '@/[fsd]/widgets/context-budget/lib/constants';
import { formatWindowSize } from '@/[fsd]/widgets/context-budget/lib/utils';

import ContextWindowHint from './ContextWindowHint';

const LAYOUTS = {
  inline: 'inline',
  stacked: 'stacked',
};

const buildTabLabel = (name, tokens) => (tokens > 0 ? `${name} · ${formatWindowSize(tokens)}` : name);

/**
 * Balanced / Full context window tab group. Each tab shows the tokens it gives the selected model.
 * `inline` puts the label beside the tabs (forms), `stacked` puts it above them (popup).
 */
const ContextWindowModeSelector = memo(props => {
  const {
    value = CONTEXT_WINDOW_MODES.BALANCED,
    onChange,
    layout = LAYOUTS.inline,
    disabled = false,
    disabledReason,
    balancedWindowTokens,
    fullWindowTokens,
  } = props;
  const isStacked = layout === LAYOUTS.stacked;
  const styles = contextWindowModeSelectorStyles(isStacked);

  const tabs = useMemo(
    () => [
      {
        value: CONTEXT_WINDOW_MODES.BALANCED,
        label: buildTabLabel('Balanced', balancedWindowTokens),
        buttonProps: { disabled, 'data-testid': 'context-window-mode-balanced' },
      },
      {
        value: CONTEXT_WINDOW_MODES.FULL,
        label: buildTabLabel('Full', fullWindowTokens),
        buttonProps: { disabled, 'data-testid': 'context-window-mode-full' },
      },
    ],
    [balancedWindowTokens, fullWindowTokens, disabled],
  );

  const handleChange = useCallback(
    (_event, newValue) => {
      if (!disabled && newValue !== value) onChange?.(newValue);
    },
    [disabled, onChange, value],
  );

  const content = (
    <Box
      sx={styles.container}
      data-testid="context-window-mode-selector"
    >
      <Box sx={styles.row}>
        <Box sx={styles.label}>
          <Typography
            component="span"
            variant="headingSmall"
            sx={styles.labelText}
          >
            {CONTEXT_WINDOW_COPY.LABEL}
          </Typography>
          <InfoTooltip
            infoTooltip={CONTEXT_WINDOW_COPY.MODES_TOOLTIP}
            testId="context-window-mode-info"
          />
        </Box>
        <Box
          component="span"
          sx={styles.tabs}
        >
          <TabGroupButton
            value={value}
            onChange={handleChange}
            size="small"
            arrayBtn={tabs}
            disableTooltip
            customSx={styles.tabButton}
          />
        </Box>
      </Box>
      <ContextWindowHint
        balancedWindowTokens={balancedWindowTokens}
        fullWindowTokens={fullWindowTokens}
      />
    </Box>
  );

  return disabled && disabledReason ? (
    <Tooltip
      title={disabledReason}
      placement="top-start"
    >
      {content}
    </Tooltip>
  ) : (
    content
  );
});

ContextWindowModeSelector.displayName = 'ContextWindowModeSelector';

/** @type {MuiSx} */
const contextWindowModeSelectorStyles = isStacked => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: isStacked ? 'column' : 'row',
    alignItems: isStacked ? 'stretch' : 'center',
    justifyContent: 'space-between',
    gap: isStacked ? '0.5rem' : '0.75rem',
    ...(isStacked
      ? {}
      : {
          padding: '0.75rem 1rem',
          backgroundColor: palette.background.surface.interactive.default,
          borderRadius: '0.75rem',
        }),
  }),
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  labelText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  tabs: {
    display: 'flex',
    flex: isStacked ? 'none' : '0 0 auto',
    width: isStacked ? '100%' : 'auto',
    ...(isStacked && {
      '& .MuiToggleButtonGroup-root': {
        width: '100%',
        display: 'flex',
      },
      '& .MuiToggleButtonGroup-root .MuiToggleButton-root': {
        flex: '1 1 0',
        minWidth: 0,
      },
    }),
  },
  tabButton: { whiteSpace: 'nowrap' },
});

export default ContextWindowModeSelector;
