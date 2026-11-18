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

const { default: CompareInstructionsStep } = await import('../CompareInstructionsStep');

const theme = createTheme({ palette: darkPalette });

const renderStep = extraProps =>
  render(
    <ThemeProvider theme={theme}>
      <CompareInstructionsStep
        leftVersion={{ name: 'mine' }}
        rightVersion={{ name: 'public' }}
        leftData={{ instructions: 'my text' }}
        rightData={{ instructions: 'their text' }}
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

describe('CompareInstructionsStep', () => {
  afterEach(() => cleanup());

  it('lets both versions be edited and saved, as before', () => {
    renderStep();
    screen
      .getAllByTestId('diff-field')
      .forEach(field => expect(field).toHaveAttribute('data-editable', 'true'));
    expect(screen.getByRole('button', { name: 'Save mine' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save public' })).toBeInTheDocument();
  });

  describe('when comparing with a public version', () => {
    it('lets neither side be edited', () => {
      renderStep({ readOnly: true });
      const fields = screen.getAllByTestId('diff-field');
      expect(fields).toHaveLength(2);
      fields.forEach(field => expect(field).toHaveAttribute('data-editable', 'false'));
    });

    it('offers no save button on either side', () => {
      renderStep({ readOnly: true });
      expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument();
    });

    it('still shows the instructions of both sides', () => {
      renderStep({ readOnly: true });
      expect(screen.getByTestId('left')).toHaveTextContent('my text');
      expect(screen.getByTestId('right')).toHaveTextContent('their text');
    });
  });
});
