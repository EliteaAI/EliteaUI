import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
// FEATURE TOGGLE: Pruning Strategy - Hidden
// import { SingleSelect } from '@/[fsd]/shared/ui/select';
import FormInput from '@/components/FormInput';

import ContextWindowModeSelector from './ContextWindowModeSelector';

// FEATURE TOGGLE: Pruning Strategy - Hidden
// const CONTEXT_STRATEGIES = [
//   {
//     value: 'oldest_first',
//     label: 'Oldest First',
//     description: 'Remove oldest messages first when limit is reached',
//   },
//   {
//     value: 'importance_based',
//     label: 'Importance Based',
//     description: 'Prioritize messages based on importance scoring',
//   },
//   {
//     value: 'thread_aware',
//     label: 'Thread Aware',
//     description: 'Maintain thread continuity when pruning messages',
//   },
//   {
//     value: 'hybrid',
//     label: 'Hybrid',
//     description: 'Combine multiple strategies for optimal context management',
//   },
// ];

const ContextStrategyTokenManagement = memo(props => {
  const { formData, errors, handleInputChange, isEnabled, modelWindow, manualMaxTokensEnabled } = props;
  const styles = tokenManagementStyles();

  const handleWindowModeChange = useCallback(
    value => handleInputChange({ target: { value } }, 'context_window_mode'),
    [handleInputChange],
  );

  return (
    <Box sx={styles.container}>
      {/* FEATURE TOGGLE: Pruning Strategy - Hidden */}
      {/* <Box sx={[styles.section, styles.sectionWithLargerGap]}>
        <Label.InfoLabelWithTooltip
          label="Pruning Strategy"
          tooltip="Method for removing messages from context when limit is exceeded"
          sx={styles.label}
        />
        <SingleSelect
          showBorder
          value={formData.pruning_method}
          onChange={e => handleInputChange(e, 'pruning_method')}
          disabled={!isEnabled || true}
          options={CONTEXT_STRATEGIES.map(strategy => ({
            value: strategy.value,
            label: strategy.label,
          }))}
        />
      </Box> */}

      <Box sx={styles.fullRow}>
        <ContextWindowModeSelector
          value={formData.context_window_mode}
          onChange={handleWindowModeChange}
          disabled={!isEnabled}
          modelWindow={modelWindow}
        />
      </Box>

      {manualMaxTokensEnabled && (
        <Box sx={styles.section}>
          <Label.InfoLabelWithTooltip
            label="Max Context Tokens"
            tooltip="Admin only, for summarization testing: manual summarization trigger that replaces the context window mode's value. Leave empty to use the mode."
            sx={styles.label}
          />
          <FormInput
            sx={styles.formInput}
            type="text"
            inputMode="numeric"
            value={formData.manual_max_context_tokens ?? ''}
            onChange={e => handleInputChange(e, 'manual_max_context_tokens')}
            error={!!errors.manual_max_context_tokens}
            helperText={errors.manual_max_context_tokens || ' '}
            disabled={!isEnabled}
            inputProps={{
              pattern: '[1-9][0-9]*',
              'data-testid': 'context-modal-manual-max-tokens-input',
            }}
          />
        </Box>
      )}

      {/* Preserve Recent Messages */}
      <Box sx={styles.section}>
        <Label.InfoLabelWithTooltip
          label="Preserve Recent Messages"
          tooltip="Number of most recent messages to always keep in context"
          sx={styles.label}
        />
        <FormInput
          sx={styles.formInput}
          type="text"
          inputMode="numeric"
          value={formData.preserve_recent_messages}
          onChange={e => handleInputChange(e, 'preserve_recent_messages', true)}
          error={!!errors.preserve_recent_messages}
          helperText={errors.preserve_recent_messages || ' '}
          disabled={!isEnabled}
          inputProps={{
            pattern: '[1-9][0-9]*',
            'data-testid': 'context-modal-preserve-recent-input',
          }}
        />
      </Box>

      {/* FEATURE TOGGLE: Summaries Limit Count - Hidden */}
      {/* <Box sx={styles.section}>
        <Label.InfoLabelWithTooltip
          label="Summaries Limit Count"
          tooltip="Maximum number of chat summaries to maintain"
          sx={styles.label}
        />
        <FormInput
          sx={styles.formInput}
          type="text"
          inputMode="numeric"
          value={formData.summaries_limit_count}
          onChange={e => handleInputChange(e, 'summaries_limit_count', true)}
          error={!!errors.summaries_limit_count}
          helperText={errors.summaries_limit_count || ' '}
          disabled={!isEnabled}
          inputProps={{
            pattern: '[1-9][0-9]*',
          }}
        />
      </Box> */}
    </Box>
  );
});

ContextStrategyTokenManagement.displayName = 'ContextStrategyTokenManagement';

/** @type {MuiSx} */
const tokenManagementStyles = () => ({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0rem 1rem',
    paddingRight: '1rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0rem 0rem',
  },
  fullRow: {
    gridColumn: '1 / -1',
    paddingBottom: '1rem',
  },
  sectionWithLargerGap: {
    gap: '0.6rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default ContextStrategyTokenManagement;
