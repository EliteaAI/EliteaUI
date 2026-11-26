// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NodeAiRequirementStep from '../NodeAiRequirementStep';

// Input.InputBase reads the toast context (copy action)
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('@/[fsd]/features/pipelines/yaml-editor/ui', () => ({
  YamlCodeEditor: props => (
    <textarea
      data-testid={props['data-testid']}
      value={props.code}
      readOnly
    />
  ),
}));

const theme = createTheme({ palette: darkPalette });

const renderStep = (props = {}) => {
  const handlers = { setRequirement: vi.fn(), generate: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <NodeAiRequirementStep
        mode="build"
        nodeType="llm"
        modelName="GPT-5 mini"
        requirement=""
        charactersLeft={2000}
        canGenerate={false}
        isGenerating={false}
        currentNode={{ id: 'summarize', type: 'llm' }}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return handlers;
};

describe('NodeAiRequirementStep', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the type, its description and the model in Build mode', () => {
    renderStep();
    expect(screen.getByTestId('node-ai-type-description')).toHaveTextContent(
      'LLM · Generates or processes text using a language model.',
    );
    expect(screen.getByTestId('node-ai-model-chip')).toHaveTextContent('Model: GPT-5 mini');
    expect(screen.getByText('What should this node do?')).toBeInTheDocument();
    expect(screen.getByTestId('node-ai-requirement-input')).toHaveAttribute(
      'placeholder',
      'e.g. Summarize the issues in a table with ID, title, assignee and status',
    );
  });

  it('shows 3 examples that fill the box', () => {
    const { setRequirement } = renderStep();
    const chips = screen.getAllByTestId('node-ai-example-chip');
    expect(chips).toHaveLength(3);
    fireEvent.click(chips[1]);
    expect(setRequirement).toHaveBeenCalledWith('Classify the request as bug, feature or question');
  });

  it('uses the edit label and examples and shows the current configuration in Edit mode', () => {
    renderStep({ mode: 'edit', currentNode: { id: 'summarize', type: 'llm', transition: 'END' } });
    expect(screen.getByText('What should change?')).toBeInTheDocument();
    expect(screen.getAllByTestId('node-ai-example-chip')[0]).toHaveTextContent('Make the summary shorter');
    fireEvent.click(screen.getByTestId('node-ai-current-config-toggle'));
    expect(screen.getByTestId('node-ai-current-config-yaml').value).toContain('transition: END');
  });

  it('hides the current configuration in Build mode', () => {
    renderStep();
    expect(screen.queryByTestId('node-ai-current-config-toggle')).toBeNull();
  });

  it('disables Generate draft until the requirement has text', () => {
    renderStep();
    expect(screen.getByTestId('node-ai-generate-button')).toBeDisabled();
    cleanup();
    renderStep({ requirement: 'Summarize', canGenerate: true });
    expect(screen.getByTestId('node-ai-generate-button')).toBeEnabled();
  });

  it('shows the counter from 200 characters left', () => {
    renderStep({ requirement: 'x', charactersLeft: 201 });
    expect(screen.queryByTestId('node-ai-requirement-counter')).toBeNull();
    cleanup();
    renderStep({ requirement: 'x', charactersLeft: 200 });
    expect(screen.getByTestId('node-ai-requirement-counter')).toHaveTextContent('200 characters left');
  });

  it('runs Generate draft on Ctrl/Cmd+Enter', () => {
    const { generate } = renderStep({ requirement: 'Summarize', canGenerate: true });
    const input = screen.getByTestId('node-ai-requirement-input');
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('does not run Ctrl+Enter when it can not generate', () => {
    const { generate } = renderStep();
    fireEvent.keyDown(screen.getByTestId('node-ai-requirement-input'), { key: 'Enter', ctrlKey: true });
    expect(generate).not.toHaveBeenCalled();
  });

  it('shows the generating state', () => {
    renderStep({ requirement: 'Summarize', isGenerating: true });
    expect(screen.getByTestId('node-ai-generate-button')).toHaveTextContent('Generating draft...');
    expect(screen.getByTestId('node-ai-generate-button')).toBeDisabled();
    expect(screen.getByTestId('node-ai-requirement-input')).toHaveAttribute('readonly');
    expect(screen.getByTestId('node-ai-stop-button')).toBeEnabled();
    expect(screen.getByText('Usually takes 5–20 seconds')).toBeInTheDocument();
    expect(screen.queryAllByTestId('node-ai-example-chip').every(chip => chip.disabled)).toBe(true);
  });
});
