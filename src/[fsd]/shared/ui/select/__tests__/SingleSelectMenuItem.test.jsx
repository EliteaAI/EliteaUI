// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SingleSelectMenuItem from '../SingleSelectMenuItem';

vi.mock('react-redux', () => ({
  useSelector: select => select({ settings: { project: { id: 5 } } }),
}));

const renderItem = (option, props = {}) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ palette: lightPalette })}>
        <SingleSelectMenuItem
          option={{ value: 'a', label: 'Alpha', ...option }}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('SingleSelectMenuItem open in new tab', () => {
  afterEach(cleanup);

  it('renders an option with `to` as a link prefixed with the active project', () => {
    renderItem({ to: '/agents/all/7' });

    const item = screen.getByTestId('select-option-a');
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '/5/agents/all/7');
  });

  it('renders an option without `to`, or a disabled one, as a plain item', () => {
    renderItem({});
    expect(screen.getByTestId('select-option-a')).not.toHaveAttribute('href');
    cleanup();

    renderItem({ to: '/agents/all/7', disabled: true });
    expect(screen.getByTestId('select-option-a')).not.toHaveAttribute('href');
  });

  it('selects on a plain click without following the link', () => {
    const onClick = vi.fn();
    renderItem({ to: '/agents/all/7' }, { onClick });

    // fireEvent returns false when the click's default action (following the href) was prevented
    expect(fireEvent.click(screen.getByTestId('select-option-a'))).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('leaves a modified click to the browser and does not select', () => {
    const onClick = vi.fn();
    renderItem({ to: '/agents/all/7' }, { onClick });

    fireEvent.click(screen.getByTestId('select-option-a'), { ctrlKey: true });

    expect(onClick).not.toHaveBeenCalled();
  });
});
