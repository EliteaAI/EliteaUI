// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import RadioButtonGroup from '../RadioButtonGroup';

const ITEMS = [
  { value: 'a', label: 'Option A', info: 'About A', infoPinnable: true },
  { value: 'b', label: 'Option B', info: 'About B' },
  { value: 'c', label: 'Option C' },
];

const setup = () =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <RadioButtonGroup
        testId="group"
        items={ITEMS}
        value="a"
        onChange={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('RadioButtonGroup', () => {
  afterEach(cleanup);

  it('opens the info text on focus when the item asks for a pinnable icon', async () => {
    setup();

    act(() => screen.getByRole('button', { name: 'More info' }).focus());

    expect(await screen.findByText('About A')).toBeInTheDocument();
  });

  it('renders a focusable icon only for items with the pinnable flag', () => {
    setup();

    expect(screen.getAllByRole('button', { name: 'More info' })).toHaveLength(1);
  });

  it('names the info icon with the label of the item', () => {
    render(
      <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
        <RadioButtonGroup
          testId="group"
          items={[
            {
              value: 'a',
              label: 'Option A',
              info: 'About A',
              infoPinnable: true,
              infoLabel: 'More info about A',
            },
          ]}
          value="a"
          onChange={vi.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'More info about A' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More info' })).not.toBeInTheDocument();
  });
});
