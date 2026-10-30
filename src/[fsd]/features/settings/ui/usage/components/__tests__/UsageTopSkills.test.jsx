// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import UsageTopSkills from '../UsageTopSkills';

afterEach(() => cleanup());

const theme = createTheme({ palette: lightPalette });

const renderTopSkills = (topSkills = [{ id: 7, name: 'bug-triage', uses: 2, spend: 0.004 }]) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <UsageTopSkills
          topSkills={topSkills}
          canSeeAmounts
          currency="USD"
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('UsageTopSkills', () => {
  it('names the count Runs, as the Analytics Skill Activity table does', () => {
    renderTopSkills();
    const card = within(screen.getByTestId('usage-top-skills'));

    expect(card.getByText('Runs')).toBeInTheDocument();
    expect(card.getByText('Avg per run')).toBeInTheDocument();
    expect(card.queryByText('Uses')).not.toBeInTheDocument();
    expect(card.queryByText('Per use')).not.toBeInTheDocument();
    expect(card.queryByText('Per run')).not.toBeInTheDocument();
  });

  it('divides spend by runs for the per-run cost', () => {
    renderTopSkills();

    expect(screen.getByText('$0.0020')).toBeInTheDocument();
  });

  it.each([
    ['Runs', ['skill-b', 'skill-c', 'skill-a']],
    ['Avg per run', ['skill-c', 'skill-a', 'skill-b']],
  ])('sorts by %s', (header, expectedOrder) => {
    renderTopSkills([
      { id: 1, name: 'skill-a', uses: 1, spend: 0.002 },
      { id: 2, name: 'skill-b', uses: 10, spend: 0.003 },
      { id: 3, name: 'skill-c', uses: 5, spend: 0.02 },
    ]);

    fireEvent.click(screen.getByText(header));

    const names = screen.getAllByText(/^skill-/).map(node => node.textContent);
    expect(names).toEqual(expectedOrder);
  });
});
