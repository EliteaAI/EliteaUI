// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('@/[fsd]/entities/edit-entity-with-ai', () => ({
  EditEntityComparisonLayout: props => (
    <div>
      <div data-testid="left-header">{props.currentLabel}</div>
      <div data-testid="right-header">{props.suggestedLabel}</div>
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

  describe('Save under each field', () => {
    it('stays disabled with no edit, and when an edit is reverted to the saved text', () => {
      renderStep();
      expect(screen.getByRole('button', { name: 'Save mine' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save public' })).toBeDisabled();
      cleanup();

      renderStep({
        leftEdits: { instructions: 'my text' },
        rightEdits: { instructions: 'their text' },
      });
      expect(screen.getByRole('button', { name: 'Save mine' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save public' })).toBeDisabled();
    });

    it('enables once an edit differs from the saved text', () => {
      renderStep({
        leftEdits: { instructions: 'changed' },
        rightEdits: { instructions: 'changed too' },
      });
      expect(screen.getByRole('button', { name: 'Save mine' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Save public' })).toBeEnabled();
    });

    it('treats a missing saved text as empty, so an emptied field is not an edit', () => {
      renderStep({
        leftData: {},
        rightData: {},
        leftEdits: { instructions: '' },
        rightEdits: { instructions: '' },
      });
      expect(screen.getByRole('button', { name: 'Save mine' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Save public' })).toBeDisabled();
    });
  });

  describe('with one Save in each version header', () => {
    const headerSave = overrides => ({ isDirty: true, isSaving: false, onSave: vi.fn(), ...overrides });

    it('drops the Save under each field', () => {
      renderStep({ leftHeaderSave: headerSave(), rightHeaderSave: headerSave() });
      expect(screen.queryByRole('button', { name: 'Save mine' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save public' })).not.toBeInTheDocument();
    });

    it('saves a version from its own header', () => {
      const left = headerSave();
      const right = headerSave();
      renderStep({ leftHeaderSave: left, rightHeaderSave: right });
      fireEvent.click(within(screen.getByTestId('right-header')).getByRole('button', { name: 'Save' }));
      expect(right.onSave).toHaveBeenCalledTimes(1);
      expect(left.onSave).not.toHaveBeenCalled();
    });

    it('stays disabled until that version has an edit, and while it saves', () => {
      renderStep({
        leftHeaderSave: headerSave({ isDirty: false }),
        rightHeaderSave: headerSave({ isSaving: true }),
      });
      expect(within(screen.getByTestId('left-header')).getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(
        within(screen.getByTestId('right-header')).getByRole('button', { name: 'Saving...' }),
      ).toBeDisabled();
    });
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
