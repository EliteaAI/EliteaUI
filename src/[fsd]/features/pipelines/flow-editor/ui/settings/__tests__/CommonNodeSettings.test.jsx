// @vitest-environment jsdom
import { createContext } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CommonNodeSettings from '../CommonNodeSettings';

const { updateYamlNode } = vi.hoisted(() => ({ updateYamlNode: vi.fn() }));

vi.mock('@mui/material', () => ({
  Box: ({ children }) => <div data-testid="common-node-settings-row">{children}</div>,
  FormControlLabel: ({ control, label }) => (
    <label>
      {control}
      {label}
    </label>
  ),
  Typography: ({ children }) => <span>{children}</span>,
}));

vi.mock('@/[fsd]/shared/lib/context', () => ({
  FlowEditorContext: createContext({}),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/helpers', () => ({
  FlowEditorHelpers: { updateYamlNode },
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Switch: {
    BaseSwitch: ({ checked, disabled, onChange, ...rest }) => (
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        data-testid={rest['data-testid']}
      />
    ),
  },
}));

const NODE_ID = 'LLM 1';
const NODE_TYPE = 'llm';
const STRUCTURED_OUTPUT_TEST_ID = 'pipeline-llm-node-structured-output-toggle';

const yamlJsonObject = {
  entry_point: 'LLM 0',
  interrupt_before: [NODE_ID],
  interrupt_after: [NODE_ID],
  nodes: [{ id: NODE_ID, type: NODE_TYPE, structured_output: true }],
};

const renderSettings = (props = {}, contextValue = {}) => {
  const setYamlJsonObject = vi.fn();
  const utils = render(
    <FlowEditorContext.Provider value={{ yamlJsonObject, setYamlJsonObject, ...contextValue }}>
      <CommonNodeSettings
        id={NODE_ID}
        type={NODE_TYPE}
        structuredOutputTestId={STRUCTURED_OUTPUT_TEST_ID}
        {...props}
      />
    </FlowEditorContext.Provider>,
  );
  return { ...utils, setYamlJsonObject };
};

describe('CommonNodeSettings', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('does not render deprecated interrupt toggles even when the node is listed in YAML', () => {
    renderSettings();

    expect(screen.queryByText('Interrupt before')).not.toBeInTheDocument();
    expect(screen.queryByText('Interrupt after')).not.toBeInTheDocument();
    expect(screen.queryByTestId(`pipeline-node-interrupt-before-toggle-${NODE_ID}`)).not.toBeInTheDocument();
  });

  it('renders the structured output toggle with its test id and current value', () => {
    renderSettings();

    expect(screen.getByText('Structured output')).toBeInTheDocument();
    expect(screen.getByTestId(STRUCTURED_OUTPUT_TEST_ID)).toBeChecked();
  });

  it('updates structured_output in YAML when the toggle changes', () => {
    const { setYamlJsonObject } = renderSettings();

    fireEvent.click(screen.getByTestId(STRUCTURED_OUTPUT_TEST_ID));

    expect(updateYamlNode).toHaveBeenCalledWith(
      NODE_ID,
      'structured_output',
      false,
      yamlJsonObject,
      setYamlJsonObject,
    );
  });

  it('disables the structured output toggle when disabled', () => {
    renderSettings({ disabled: true });

    expect(screen.getByTestId(STRUCTURED_OUTPUT_TEST_ID)).toBeDisabled();
  });
});
