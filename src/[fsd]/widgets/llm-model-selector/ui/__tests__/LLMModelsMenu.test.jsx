// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { autoModel } from '@/[fsd]/shared/lib/utils';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import LLMModelsMenu from '../LLMModelsMenu';

const theme = createTheme({ palette: lightPalette });

const LUNA = {
  id: '1_gpt-5.6-luna',
  name: 'gpt-5.6-luna',
  display_name: 'GPT-5.6 Luna',
  description: 'Fast and low-cost for simple tasks',
  supports_vision: true,
  supports_reasoning: true,
  shared: true,
};
const SOL = {
  id: '2_gpt-5.6-sol',
  name: 'gpt-5.6-sol',
  display_name: 'GPT-5.6 Sol',
  shared: false,
};
// A model name with no pattern match — verifies no spurious description is shown.
const UNMATCHED = {
  id: '3_custom-xyz',
  name: 'custom-xyz',
  display_name: 'Custom XYZ',
  shared: false,
};
const AUTO = autoModel({ id: 'quality-cost', revision: 1 });

const renderMenu = (models, selectedModel = LUNA) =>
  render(
    <ThemeProvider theme={theme}>
      <LLMModelsMenu
        anchorEl={document.body}
        onClose={() => {}}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={() => {}}
      />
    </ThemeProvider>,
  );

afterEach(cleanup);

describe('LLMModelsMenu — model descriptions', () => {
  it('shows a backend description as a second line under its name', () => {
    renderMenu([LUNA]);
    expect(screen.getByTestId('model-selector-option-description-gpt-5.6-luna')).toHaveTextContent(
      'Fast and low-cost for simple tasks',
    );
  });

  it('shows a derived description when the backend provides none', () => {
    renderMenu([SOL]);
    expect(screen.getByTestId('model-selector-option-description-gpt-5.6-sol')).toHaveTextContent(
      'Deep reasoning for complex problems',
    );
  });

  it('leaves no description line when neither backend nor pattern provides one', () => {
    renderMenu([UNMATCHED]);
    const option = screen.getByTestId('model-selector-option-custom-xyz');
    expect(within(option).getByText('Custom XYZ')).toBeInTheDocument();
    expect(screen.queryByTestId('model-selector-option-description-custom-xyz')).not.toBeInTheDocument();
  });

  it('shows the Auto description', () => {
    renderMenu([AUTO, LUNA], AUTO);
    expect(screen.getByTestId(`model-selector-option-description-${AUTO.name}`)).toHaveTextContent(
      'Based on your task and real-time usage',
    );
  });
});

describe('LLMModelsMenu — ordering', () => {
  it('places Auto first regardless of its position in the input array', () => {
    renderMenu([LUNA, SOL, AUTO]);
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('data-testid', `model-selector-option-${AUTO.name}`);
  });

  it('sorts non-Auto models alphabetically by display name', () => {
    renderMenu([SOL, UNMATCHED, LUNA]);
    const options = screen.getAllByRole('option');
    const names = options.map(o => o.getAttribute('data-testid'));
    expect(names).toEqual([
      'model-selector-option-gpt-5.6-luna',
      'model-selector-option-gpt-5.6-sol',
      'model-selector-option-custom-xyz',
    ]);
  });

  it('Auto first then alphabetical when Auto is present', () => {
    renderMenu([SOL, AUTO, LUNA]);
    const options = screen.getAllByRole('option');
    const names = options.map(o => o.getAttribute('data-testid'));
    expect(names).toEqual([
      `model-selector-option-${AUTO.name}`,
      'model-selector-option-gpt-5.6-luna',
      'model-selector-option-gpt-5.6-sol',
    ]);
  });
});
