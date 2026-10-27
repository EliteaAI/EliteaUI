// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SchedulePromptSection from '../SchedulePromptSection';

let variableProps;

vi.mock('@/[fsd]/shared/ui/checkbox/RadioButtonGroup', () => ({
  default: ({ items, onChange, testId }) => (
    <div data-testid={testId}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          data-testid={`${testId}-${item.value}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/input/StyledInputEnhancer', () => ({
  default: ({ label, value, onChange, helperText }) => (
    <label>
      {label}
      <textarea
        value={value}
        onChange={onChange}
      />
      {helperText}
    </label>
  ),
}));
vi.mock('@/components/VariableList', () => ({
  default: props => {
    variableProps = props;
    return <div data-testid="variable-list" />;
  },
}));

const renderSection = (props = {}) => {
  const setFieldValue = vi.fn();
  const setValues = vi.fn();
  render(
    <SchedulePromptSection
      type="agent"
      runMode="prompt"
      prompt=""
      variables={[]}
      promptError=""
      variablesError=""
      setFieldValue={setFieldValue}
      setValues={setValues}
      {...props}
    />,
  );
  return { setFieldValue, setValues };
};

describe('SchedulePromptSection', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the prompt field for an agent and no run mode switch', () => {
    renderSection();

    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-mode')).not.toBeInTheDocument();
  });

  it('syncs the variables with the typed prompt', () => {
    const { setFieldValue } = renderSection();

    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'Hello {{name}}' } });

    expect(setFieldValue).toHaveBeenCalledWith('prompt', 'Hello {{name}}');
    expect(setFieldValue).toHaveBeenCalledWith('variables', [expect.objectContaining({ name: 'name' })]);
  });

  it('writes a changed variable value into the variable list', () => {
    const variables = [
      { name: 'a', value: '' },
      { name: 'b', value: '' },
    ];
    const { setFieldValue } = renderSection({ variables });

    variableProps.onChangeVariable('b', 'x');

    expect(setFieldValue).toHaveBeenCalledWith('variables', [
      { name: 'a', value: '' },
      { name: 'b', value: 'x' },
    ]);
  });

  it('hides the prompt for a pipeline in entry point mode and clears the fields on a mode change', () => {
    const { setValues } = renderSection({ type: 'pipeline', runMode: 'entry_point' });

    expect(screen.queryByLabelText('Prompt')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('schedule-run-mode-prompt'));

    const update = setValues.mock.calls[0][0];
    expect(update({ run_mode: 'entry_point', prompt: 'x', variables: [1] })).toEqual({
      run_mode: 'prompt',
      prompt: '',
      variables: [],
    });
  });

  it('shows the prompt error and the variables error', () => {
    renderSection({ promptError: 'Prompt is required', variablesError: 'Fill the variables' });

    expect(screen.getByRole('textbox').closest('label')).toHaveTextContent('Prompt is required');
    expect(screen.getByRole('alert')).toHaveTextContent('Fill the variables');
  });
});
