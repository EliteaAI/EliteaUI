// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AgentInternalToolSwitch from '../AgentInternalToolSwitch';

const shared = vi.hoisted(() => ({ internalTools: [], setFieldValue: null }));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { version_details: { meta: { internal_tools: shared.internalTools } } },
    setFieldValue: shared.setFieldValue,
  }),
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Switch: {
    BaseSwitch: ({ checked, disabled, onChange }) => (
      <input
        type="checkbox"
        data-testid="tool-switch"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange?.(event, event.target.checked)}
      />
    ),
  },
  Text: { TextWithLink: () => null },
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({ default: () => null }));

const renderSwitch = props =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <AgentInternalToolSwitch
        title="Web Search"
        name="web_search"
        icon="GlobeIcon"
        {...props}
      />
    </ThemeProvider>,
  );

describe('AgentInternalToolSwitch unavailable state (#6982 review)', () => {
  afterEach(() => cleanup());

  it('shows an active module as on and toggleable', () => {
    shared.internalTools = ['web_search'];
    shared.setFieldValue = vi.fn();
    renderSwitch();
    const toggle = screen.getByTestId('tool-switch');
    expect(toggle).toBeChecked();
    expect(toggle).toBeEnabled();
    fireEvent.click(toggle);
    expect(shared.setFieldValue).toHaveBeenCalledWith('version_details.meta.internal_tools', []);
  });

  it('shows an unavailable module that is still in the list as off and disabled', () => {
    shared.internalTools = ['web_search'];
    shared.setFieldValue = vi.fn();
    renderSwitch({ unavailable: true });
    const toggle = screen.getByTestId('tool-switch');
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(shared.setFieldValue).not.toHaveBeenCalled();
  });

  it('keeps the stored module list untouched when unavailable', () => {
    shared.internalTools = ['web_search', 'pyodide'];
    shared.setFieldValue = vi.fn();
    renderSwitch({ unavailable: true });
    expect(shared.setFieldValue).not.toHaveBeenCalled();
  });
});
