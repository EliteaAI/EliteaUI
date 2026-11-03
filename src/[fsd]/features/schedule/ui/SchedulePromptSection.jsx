import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import VariableList from '@/components/VariableList';

import { isPromptShown, syncPromptVariables } from '../lib/helpers';
import FieldError from './FieldError';
import ScheduleSegmentedToggle from './ScheduleSegmentedToggle';

const RUN_MODE_ITEMS = [
  { value: 'entry_point', label: 'Entrypoint' },
  { value: 'prompt', label: 'Prompt' },
];

const RUN_MODE_INFO =
  'Entrypoint starts the pipeline from its entry point. Prompt sends the text below as the first message.';

const PROMPT_PLACEHOLDER = "e.g. Summarize yesterday's new requests and list those that need a reply.";
const PROMPT_INFO = 'The text the run receives as its first message. Use {{name}} to add a variable.';

const SchedulePromptSection = memo(props => {
  const { type, runMode, prompt, variables, promptError, variablesError, setFieldValue, setValues } = props;

  const showPrompt = isPromptShown({ type, run_mode: runMode });

  // setValues with a function keeps a fast second change; the run mode clears what the other mode filled
  const handleRunModeChange = useCallback(
    nextMode => setValues(prev => ({ ...prev, run_mode: nextMode, prompt: '', variables: [] })),
    [setValues],
  );

  const handlePromptChange = useCallback(
    event => {
      const nextPrompt = event.target.value;
      setFieldValue('prompt', nextPrompt);
      setFieldValue('variables', syncPromptVariables(nextPrompt, variables));
    },
    [setFieldValue, variables],
  );

  const handleVariableChange = useCallback(
    (name, value) =>
      setFieldValue(
        'variables',
        variables.map(variable => (variable.name === name ? { ...variable, value } : variable)),
      ),
    [setFieldValue, variables],
  );

  return (
    <>
      {type === 'pipeline' && (
        <Box sx={styles.runMode}>
          <Box sx={styles.runModeLabel}>
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              Starting input *
            </Typography>
            <InfoTooltip
              infoTooltip={RUN_MODE_INFO}
              pinnable
              label="More info about Starting input"
            />
          </Box>
          <ScheduleSegmentedToggle
            testId="schedule-run-mode"
            items={RUN_MODE_ITEMS}
            value={runMode}
            onChange={handleRunModeChange}
          />
        </Box>
      )}
      {showPrompt && (
        <>
          <StyledInputEnhancer
            required
            multiline
            label="Starting input"
            placeholder={PROMPT_PLACEHOLDER}
            tooltipDescription={PROMPT_INFO}
            tooltipPinnable
            minRows={4}
            maxRows={6}
            variantInput={INPUT_VARIANTS.outlined}
            InputLabelProps={{ shrink: true }}
            value={prompt}
            onChange={handlePromptChange}
            error={!!promptError}
            helperText={promptError}
          />
          <VariableList
            variables={variables}
            onChangeVariable={handleVariableChange}
          />
          <FieldError message={variablesError} />
        </>
      )}
    </>
  );
});

SchedulePromptSection.displayName = 'SchedulePromptSection';

/** @type {MuiSx} */
const styles = {
  runMode: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  runModeLabel: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
};

export default SchedulePromptSection;
