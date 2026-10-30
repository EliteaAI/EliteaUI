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

const renderTopSkills = (
  topSkills = [{ id: 7, name: 'bug-triage', uses: 2, spend: 0.004 }],
  topSkillsByRuns = topSkills,
) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <UsageTopSkills
          topSkills={topSkills}
          topSkillsByRuns={topSkillsByRuns}
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
    expect(card.getByText('Per run')).toBeInTheDocument();
    expect(card.queryByText('Uses')).not.toBeInTheDocument();
    expect(card.queryByText('Per use')).not.toBeInTheDocument();
  });

  it('divides spend by runs for the per-run cost', () => {
    renderTopSkills();

    expect(screen.getByText('$0.0020')).toBeInTheDocument();
  });

  it('shows "Top Spend Skills" title by default', () => {
    renderTopSkills();

    expect(screen.getByText('Top Spend Skills')).toBeInTheDocument();
  });

  it('switches to "Top Run Skills" title and uses the by-runs dataset when sorted by Runs', () => {
    const topSkillsByRuns = [
      { id: 99, name: 'high-runner', uses: 100, spend: 0.001 },
      { id: 1, name: 'skill-a', uses: 1, spend: 0.002 },
    ];
    renderTopSkills(
      [
        { id: 1, name: 'skill-a', uses: 1, spend: 0.002 },
        { id: 2, name: 'skill-b', uses: 10, spend: 0.003 },
      ],
      topSkillsByRuns,
    );

    fireEvent.click(screen.getByText('Runs'));

    expect(screen.getByText('Top Run Skills')).toBeInTheDocument();
    // high-runner appears from the by-runs dataset (not in the spend list)
    expect(screen.getByText('high-runner')).toBeInTheDocument();
    // skill-b was in the spend list but not in the by-runs dataset
    expect(screen.queryByText('skill-b')).not.toBeInTheDocument();
  });

  it.each([['Per run', ['skill-c', 'skill-a', 'skill-b']]])(
    'sorts by %s within the active dataset',
    (header, expectedOrder) => {
      renderTopSkills([
        { id: 1, name: 'skill-a', uses: 1, spend: 0.002 },
        { id: 2, name: 'skill-b', uses: 10, spend: 0.003 },
        { id: 3, name: 'skill-c', uses: 5, spend: 0.02 },
      ]);

      fireEvent.click(screen.getByText(header));

      const names = screen.getAllByText(/^skill-/).map(node => node.textContent);
      expect(names).toEqual(expectedOrder);
    },
  );
});
