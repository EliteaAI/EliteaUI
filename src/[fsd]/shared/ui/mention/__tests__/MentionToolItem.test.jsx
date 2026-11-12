// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import MentionToolItem from '../MentionToolItem';

const theme = createTheme({
  palette: { background: { surface: { interactive: { default: '#fff', active: '#eee' } } } },
});

const renderItem = props =>
  render(
    <ThemeProvider theme={theme}>
      <MentionToolItem
        label="greet"
        testId="row"
        onClick={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('MentionToolItem', () => {
  afterEach(() => cleanup());

  it('shows the argument hint next to the label, on one truncating line', () => {
    renderItem({ hint: '[name]', description: 'Greets someone' });

    const hint = screen.getByTestId('row-hint');
    expect(hint).toHaveTextContent('[name]');
    expect(hint).toHaveStyle({ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' });
    expect(screen.getByText('Greets someone')).toBeInTheDocument();
  });

  it('renders no hint element without a hint', () => {
    renderItem({});

    expect(screen.queryByTestId('row-hint')).not.toBeInTheDocument();
  });
});
