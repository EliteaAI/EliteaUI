import { memo, useCallback } from 'react';

import RadioButtonGroup from '@/[fsd]/shared/ui/checkbox/RadioButtonGroup';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import VariableList from '@/components/VariableList';

import { isPromptShown, syncPromptVariables } from '../lib/helpers';
import FieldError from './FieldError';

const RUN_MODE_ITEMS = [
  { value: 'entry_point', label: 'Entry point' },
  { value: 'prompt', label: 'Prompt' },
];

const SchedulePromptSection = memo(
  ({ type, runMode, prompt, variables, promptError, variablesError, setFieldValue, setValues }) => {
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
          <RadioButtonGroup
            testId="schedule-run-mode"
            items={RUN_MODE_ITEMS}
            value={runMode}
            onChange={handleRunModeChange}
          />
        )}
        {showPrompt && (
          <>
            <StyledInputEnhancer
              required
              multiline
              label="Prompt"
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
  },
);

SchedulePromptSection.displayName = 'SchedulePromptSection';

export default SchedulePromptSection;
