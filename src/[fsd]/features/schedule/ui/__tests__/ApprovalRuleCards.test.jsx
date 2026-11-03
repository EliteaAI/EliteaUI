// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ApprovalRuleCards from '../ApprovalRuleCards';

const renderCards = () =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <ApprovalRuleCards
        value="pause_and_ask"
        onChange={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('ApprovalRuleCards', () => {
  afterEach(() => cleanup());

  it('names each radio after its title only', () => {
    renderCards();

    expect(screen.getByRole('radio', { name: /^Pause and ask me\s*Default$/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Run without asking' })).toBeInTheDocument();
  });

  it('gives each info icon its own name', () => {
    renderCards();

    expect(screen.getByRole('button', { name: 'More info about Pause and ask me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More info about Run without asking' })).toBeInTheDocument();
  });
});
