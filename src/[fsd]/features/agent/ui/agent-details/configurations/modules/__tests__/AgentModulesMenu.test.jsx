// @vitest-environment jsdom
import { Formik, useFormikContext } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import AgentModulesMenu from '../AgentModulesMenu';

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: ({ children, onClick, 'data-testid': testId }) => (
      <button
        data-testid={testId}
        onClick={onClick}
      >
        {children}
      </button>
    ),
  },
  Input: {
    InputBase: ({ value, onChange, onKeyDown, placeholder, inputProps }) => (
      <input
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        {...inputProps}
      />
    ),
  },
  Switch: {
    BaseSwitch: ({ checked, disabled, slotProps }) => (
      <input
        type="checkbox"
        readOnly
        checked={checked}
        disabled={disabled}
        data-testid={slotProps?.switch?.slotProps?.input?.['data-testid']}
      />
    ),
  },
  Text: { TextWithLink: () => null },
}));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({
  BUTTON_VARIANTS: { iconLabel: 'iconLabel' },
}));
vi.mock('@/[fsd]/shared/ui/input', () => ({ INPUT_VARIANTS: { standard: 'standard' } }));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip', () => ({
  TypographyWithConditionalTooltip: ({ children }) => <span>{children}</span>,
}));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/agent/lib/constants', () => ({
  INTERNAL_TOOL_ICONS: {},
}));
vi.mock('../CodeModeWarningModal', () => ({
  default: ({ open, onConfirm, onClose }) =>
    open ? (
      <div data-testid="code-mode-warning">
        <button
          data-testid="code-mode-warning-confirm"
          onClick={onConfirm}
        />
        <button
          data-testid="code-mode-warning-cancel"
          onClick={onClose}
        />
      </div>
    ) : null,
}));
vi.mock('@/assets/plus-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/SearchIcon', () => ({ default: () => null }));

const MODULES = [
  { name: 'attachments', title: 'Attachments', icon: 'AttachSvgIcon' },
  { name: 'web_search', title: 'Web Search', icon: 'GlobeIcon' },
  { name: 'image_generation', title: 'Image Creation', icon: 'ImageSvgIcon', unavailable: true },
  { name: 'code_mode', title: 'Code Mode (beta)', icon: 'CodeModeIcon', requiresCodeModeWarning: true },
];

const ValuesProbe = () => {
  const { values } = useFormikContext();
  return <output data-testid="internal-tools">{values.version_details.meta.internal_tools.join(',')}</output>;
};

const renderMenu = ({ initial = [], ...menuProps } = {}) =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <Formik
        initialValues={{ version_details: { meta: { internal_tools: initial } } }}
        onSubmit={vi.fn()}
      >
        <>
          <AgentModulesMenu
            modules={MODULES}
            {...menuProps}
          />
          <ValuesProbe />
        </>
      </Formik>
    </ThemeProvider>,
  );

const storedTools = () => screen.getByTestId('internal-tools').textContent;

const openMenu = () => fireEvent.click(screen.getByTestId('agent-add-modules-button'));

describe('AgentModulesMenu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens a searchable list of modules from the + Modules button', () => {
    renderMenu();
    expect(screen.queryByTestId('agent-modules-menu')).not.toBeInTheDocument();
    openMenu();
    expect(screen.getByTestId('agent-modules-search-input')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Web Search')).toBeInTheDocument();
  });

  it('filters modules by search without touching selections', () => {
    renderMenu({ initial: ['attachments'] });
    openMenu();
    fireEvent.change(screen.getByTestId('agent-modules-search-input'), { target: { value: 'web' } });
    expect(screen.queryByText('Attachments')).not.toBeInTheDocument();
    expect(screen.getByText('Web Search')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('agent-modules-search-input'), { target: { value: 'nothing' } });
    expect(screen.getByText('No modules found')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('agent-modules-search-input'), { target: { value: '' } });
    expect(screen.getByTestId('agent-canvas-tools-toggle-attachments')).toBeChecked();
  });

  it('clears the search when closed from the + Modules button', async () => {
    renderMenu();
    openMenu();
    fireEvent.change(screen.getByTestId('agent-modules-search-input'), { target: { value: 'web' } });
    openMenu();
    await waitFor(() => expect(screen.queryByTestId('agent-modules-menu')).not.toBeInTheDocument());
    openMenu();
    expect(screen.getByTestId('agent-modules-search-input')).toHaveValue('');
    expect(screen.getByText('Attachments')).toBeInTheDocument();
  });

  it('toggles several modules while staying open', () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('agent-module-menu-item-attachments'));
    fireEvent.click(screen.getByTestId('agent-module-menu-item-web_search'));
    expect(screen.getByTestId('agent-modules-menu')).toBeInTheDocument();
    expect(screen.getByTestId('agent-canvas-tools-toggle-attachments')).toBeChecked();
    expect(screen.getByTestId('agent-canvas-tools-toggle-web_search')).toBeChecked();
    expect(storedTools()).toBe('attachments,web_search');
    fireEvent.click(screen.getByTestId('agent-module-menu-item-attachments'));
    expect(screen.getByTestId('agent-canvas-tools-toggle-attachments')).not.toBeChecked();
    expect(storedTools()).toBe('web_search');
  });

  it('does not toggle unavailable modules', () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('agent-module-menu-item-image_generation'));
    expect(storedTools()).toBe('');
    expect(screen.getByTestId('agent-canvas-tools-toggle-image_generation')).toBeDisabled();
  });

  it('keeps toggles locked in read-only mode', () => {
    renderMenu({ initial: ['web_search'], readOnly: true });
    openMenu();
    fireEvent.click(screen.getByTestId('agent-module-menu-item-web_search'));
    expect(storedTools()).toBe('web_search');
    expect(screen.getByTestId('agent-canvas-tools-toggle-web_search')).toBeChecked();
    expect(screen.getByTestId('agent-canvas-tools-toggle-web_search')).toBeDisabled();
  });

  it('closes on Escape', async () => {
    renderMenu();
    openMenu();
    fireEvent.keyDown(screen.getByTestId('agent-modules-search-input'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('agent-modules-menu')).not.toBeInTheDocument());
  });

  describe('Code Mode warning (#7580)', () => {
    it('closes the menu and asks for confirmation before enabling, without enabling yet', async () => {
      renderMenu();
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-code_mode'));
      expect(screen.getByTestId('code-mode-warning')).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByTestId('agent-modules-menu')).not.toBeInTheDocument());
      expect(storedTools()).toBe('');
    });

    it('enables Code Mode on confirm and leaves it off on cancel', () => {
      renderMenu();
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-code_mode'));
      fireEvent.click(screen.getByTestId('code-mode-warning-cancel'));
      expect(storedTools()).toBe('');
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-code_mode'));
      fireEvent.click(screen.getByTestId('code-mode-warning-confirm'));
      expect(storedTools()).toBe('code_mode');
      expect(screen.queryByTestId('code-mode-warning')).not.toBeInTheDocument();
    });

    it('asks every time it is enabled but turns it off without asking', () => {
      renderMenu({ initial: ['code_mode'] });
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-code_mode'));
      expect(screen.queryByTestId('code-mode-warning')).not.toBeInTheDocument();
      expect(storedTools()).toBe('');
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-code_mode'));
      expect(screen.getByTestId('code-mode-warning')).toBeInTheDocument();
    });

    it('does not ask for tools that do not need a warning', () => {
      renderMenu();
      openMenu();
      fireEvent.click(screen.getByTestId('agent-module-menu-item-attachments'));
      expect(screen.queryByTestId('code-mode-warning')).not.toBeInTheDocument();
      expect(storedTools()).toBe('attachments');
    });
  });
});
