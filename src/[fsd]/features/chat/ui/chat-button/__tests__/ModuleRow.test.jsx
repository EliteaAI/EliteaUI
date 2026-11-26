// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ModuleRow from '../ModuleRow';

vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));

const theme = createTheme(getDesignTokens('dark'));
const TOOL = { name: 'planner', title: 'Planner', icon: 'CalendarIcon' };

const renderRow = (props = {}) => {
  const onToggle = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ModuleRow
        tool={TOOL}
        title={TOOL.title}
        description={
          <>
            Plans tasks. <a href="https://example.com/docs">Docs</a>
          </>
        }
        onToggle={onToggle}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onToggle, row: screen.getByTestId('modules-row-planner') };
};

describe('ModuleRow', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the name, the description and the switch state', () => {
    const { row } = renderRow({ checked: true });

    expect(row).toHaveTextContent('Planner');
    expect(row).toHaveTextContent('Plans tasks.');
    expect(row).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('modules-toggle-planner')).toBeChecked();
  });

  it('toggles on a click anywhere on the row', () => {
    const { onToggle } = renderRow({ checked: false });

    fireEvent.click(screen.getByText('Planner'));

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('toggles once on a click on the switch', () => {
    const { onToggle } = renderRow({ checked: true });

    fireEvent.click(screen.getByTestId('modules-toggle-planner'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('does not toggle on a click on a link in the description', () => {
    const { onToggle } = renderRow();

    fireEvent.click(screen.getByText('Docs'));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('toggles on Enter and on Space', () => {
    const { onToggle, row } = renderRow({ checked: false });

    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyUp(row, { key: ' ' });

    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('is locked when disabled: no toggle, out of the tab order', () => {
    const { onToggle, row } = renderRow({ disabled: true });

    fireEvent.click(row);

    expect(onToggle).not.toHaveBeenCalled();
    expect(row).toHaveAttribute('tabindex', '-1');
    expect(row).toHaveAttribute('aria-disabled', 'true');
  });
});
