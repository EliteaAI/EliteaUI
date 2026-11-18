// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/entities/edit-entity-with-ai', () => ({
  EditEntityComparisonLayout: props => (
    <div>
      <div data-testid="left">{props.currentContent}</div>
      <div data-testid="right">{props.suggestedContent}</div>
    </div>
  ),
  TextDiffHighlight: props => (
    <div
      data-testid="diff-field"
      data-editable={String(Boolean(props.editable))}
    >
      {props.modified}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/button', () => ({ CopyIconButton: () => null }));
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const { default: CompareUserInteractionStep } = await import('../CompareUserInteractionStep');

const theme = createTheme({ palette: darkPalette });

const renderStep = (leftData, rightData, extraProps) =>
  render(
    <ThemeProvider theme={theme}>
      <CompareUserInteractionStep
        leftVersion={{ name: 'base' }}
        rightVersion={{ name: 'v2' }}
        leftData={leftData}
        rightData={rightData}
        leftEdits={{}}
        rightEdits={{}}
        onLeftEdit={vi.fn()}
        onRightEdit={vi.fn()}
        onSaveLeft={vi.fn()}
        onSaveRight={vi.fn()}
        savingLeftKeys={{}}
        savingRightKeys={{}}
        {...extraProps}
      />
    </ThemeProvider>,
  );

describe('CompareUserInteractionStep', () => {
  afterEach(() => cleanup());

  it('shows Chat Starters with an empty field for a pipeline without starters', () => {
    renderStep(
      { welcome_message: '', conversation_starters: [] },
      { welcome_message: '', conversation_starters: [] },
      { alwaysShowStarters: true },
    );
    ['left', 'right'].forEach(side => {
      const column = screen.getByTestId(side);
      expect(column).toHaveTextContent('Chat Starters');
      expect(column.querySelectorAll('[data-testid="diff-field"]')).toHaveLength(2);
    });
    expect(screen.getAllByText('No differences in this section.')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Save starters — base' })).toBeDisabled();
  });

  it('shows one row per starter of the longer list', () => {
    renderStep({ conversation_starters: ['a', 'b', 'c'] }, { conversation_starters: ['a'] });
    expect(screen.getByTestId('right').querySelectorAll('[data-testid="diff-field"]')).toHaveLength(4);
  });

  it('keeps an agent without starters as it was: no Chat Starters block', () => {
    renderStep({ conversation_starters: [] }, { conversation_starters: [] });
    ['left', 'right'].forEach(side => {
      expect(screen.getByTestId(side)).not.toHaveTextContent('Chat Starters');
    });
    expect(screen.queryByRole('button', { name: /Save starters/ })).not.toBeInTheDocument();
  });

  describe('when comparing with a public version', () => {
    const left = { welcome_message: 'mine', conversation_starters: ['a'] };
    const right = { welcome_message: 'theirs', conversation_starters: ['b'] };

    it('shows both sides and lets neither be edited', () => {
      renderStep(left, right, { readOnly: true });
      const fields = screen.getAllByTestId('diff-field');
      expect(fields.length).toBeGreaterThan(0);
      fields.forEach(field => expect(field).toHaveAttribute('data-editable', 'false'));
    });

    it('offers no save button on either side', () => {
      renderStep(left, right, { readOnly: true });
      expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument();
    });

    it('still shows the text to copy from either side', () => {
      renderStep(left, right, { readOnly: true });
      expect(screen.getByTestId('left')).toHaveTextContent('mine');
      expect(screen.getByTestId('right')).toHaveTextContent('theirs');
    });

    it('keeps both sides editable, with their save buttons, otherwise', () => {
      renderStep(left, right);
      screen
        .getAllByTestId('diff-field')
        .forEach(field => expect(field).toHaveAttribute('data-editable', 'true'));
      expect(screen.getAllByRole('button', { name: /^Save/ }).length).toBeGreaterThan(0);
    });
  });
});
