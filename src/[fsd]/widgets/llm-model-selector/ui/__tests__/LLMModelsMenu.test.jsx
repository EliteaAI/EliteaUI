// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import LLMModelsMenu from '../LLMModelsMenu';

const theme = createTheme({ palette: lightPalette });

const DESCRIBED = {
  id: '1_gpt-5.6-luna',
  name: 'gpt-5.6-luna',
  display_name: 'GPT-5.6-Luna',
  description: 'Fast and low-cost for simple tasks',
  supports_vision: true,
  supports_reasoning: true,
  shared: true,
};
const UNDESCRIBED = { id: '2_gpt-5.4', name: 'gpt-5.4', display_name: 'GPT-5.4', shared: false };

const renderMenu = () =>
  render(
    <ThemeProvider theme={theme}>
      <LLMModelsMenu
        anchorEl={document.body}
        onClose={() => {}}
        models={[DESCRIBED, UNDESCRIBED]}
        selectedModel={DESCRIBED}
        onSelectModel={() => {}}
      />
    </ThemeProvider>,
  );

afterEach(cleanup);

describe('LLMModelsMenu', () => {
  it('shows a model description as a second line under its name', () => {
    renderMenu();
    const option = screen.getByTestId('model-selector-option-gpt-5.6-luna');

    expect(within(option).getByText('GPT-5.6-Luna')).toBeInTheDocument();
    expect(screen.getByTestId('model-selector-option-description-gpt-5.6-luna')).toHaveTextContent(
      'Fast and low-cost for simple tasks',
    );
  });

  it('leaves no description line for a model without one', () => {
    renderMenu();
    const option = screen.getByTestId('model-selector-option-gpt-5.4');

    expect(within(option).getByText('GPT-5.4')).toBeInTheDocument();
    expect(screen.queryByTestId('model-selector-option-description-gpt-5.4')).not.toBeInTheDocument();
    expect(option.textContent).toBe('GPT-5.4');
  });
});
