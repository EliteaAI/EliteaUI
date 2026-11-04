// @vitest-environment jsdom
import { useEffect } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

const smallWindow = { value: false };
const mounts = { config: 0, chat: 0 };

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsSmallWindow: () => ({ isSmallWindow: smallWindow.value }),
}));

vi.mock('../../lib/hooks/useTestPanelWidth.hooks', () => ({
  useTestPanelWidth: () => ({ containerRef: { current: null }, width: 373, handleResizeStart: vi.fn() }),
}));

const { default: EntityEditorWorkspace } = await import('../EntityEditorWorkspace');

const theme = createTheme({ palette: darkPalette });

const MountCounter = props => {
  const { name } = props;
  useEffect(() => {
    mounts[name] += 1;
  }, [name]);
  return <div data-testid={name} />;
};

const renderConfig = ({ isConfigStacked, toolbar }) => (
  <div
    data-testid="config-root"
    data-stacked={isConfigStacked}
  >
    <MountCounter name="config" />
    <div data-testid="config-section-header">{toolbar}</div>
  </div>
);

const renderWorkspace = (props = {}) => {
  const element = overrides => (
    <ThemeProvider theme={theme}>
      <EntityEditorWorkspace
        renderConfig={renderConfig}
        toolbarActions={<button data-testid="edit-with-ai" />}
        testButton={<button data-testid="test-button" />}
        testPanelControls={<button data-testid="close" />}
        testPanelContent={<MountCounter name="chat" />}
        isTestPanelOpen={false}
        testIdPrefix="agent"
        {...props}
        {...overrides}
      />
    </ThemeProvider>
  );
  const view = render(element());
  return { ...view, rerenderWith: overrides => view.rerender(element(overrides)) };
};

describe('EntityEditorWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    smallWindow.value = false;
    mounts.config = 0;
    mounts.chat = 0;
  });
  afterEach(() => cleanup());

  it('starts with the configuration only and the Test panel hidden', () => {
    renderWorkspace();

    expect(screen.getByTestId('config-root')).toBeVisible();
    expect(screen.getByTestId('config-root')).toHaveAttribute('data-stacked', 'false');
    expect(screen.getByTestId('config-section-header')).toContainElement(screen.getByTestId('test-button'));
    expect(screen.getByTestId('agent-test-panel')).not.toContainElement(screen.getByTestId('edit-with-ai'));
    expect(screen.getByTestId('edit-with-ai').nextSibling).toBe(screen.getByTestId('test-button'));
    expect(screen.getByTestId('agent-test-panel')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('agent-test-panel')).not.toBeVisible();
  });

  it('opens and closes the panel without remounting the configuration or the chat', () => {
    const { rerenderWith } = renderWorkspace();

    rerenderWith({ isTestPanelOpen: true });
    expect(screen.getByTestId('agent-test-panel')).toBeVisible();
    expect(screen.queryByTestId('test-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('agent-test-panel')).toContainElement(screen.getByTestId('edit-with-ai'));
    expect(screen.getByTestId('edit-with-ai').parentElement.nextSibling).toBe(screen.getByTestId('close'));
    expect(screen.getByTestId('agent-test-panel-resize-handle')).toBeInTheDocument();
    expect(screen.getByTestId('config-root')).toHaveAttribute('data-stacked', 'true');

    rerenderWith({ isTestPanelOpen: false });
    expect(screen.getByTestId('agent-test-panel')).not.toBeVisible();
    expect(screen.getByTestId('test-button')).toBeVisible();
    expect(screen.getByTestId('config-root')).toHaveAttribute('data-stacked', 'false');

    expect(mounts).toEqual({ config: 1, chat: 1 });
  });

  it('hides the configuration while the open panel is full screen', () => {
    renderWorkspace({ isTestPanelOpen: true, isFullScreen: true });

    expect(screen.getByTestId('config-root')).not.toBeVisible();
    expect(screen.getByTestId('agent-test-panel')).toBeVisible();
    expect(screen.queryByTestId('agent-test-panel-resize-handle')).not.toBeInTheDocument();
  });

  it('stacks the configuration on small windows', () => {
    smallWindow.value = true;
    renderWorkspace();

    expect(screen.getByTestId('config-root')).toHaveAttribute('data-stacked', 'true');
    expect(screen.getByTestId('config-section-header')).toBeEmptyDOMElement();
    expect(screen.getByTestId('edit-with-ai').nextSibling).toBe(screen.getByTestId('test-button'));
  });

  it('keeps Edit with AI above the configuration when the open panel stacks below on small windows', () => {
    smallWindow.value = true;
    renderWorkspace({ isTestPanelOpen: true });

    expect(screen.getByTestId('agent-test-panel')).not.toContainElement(screen.getByTestId('edit-with-ai'));
    expect(screen.getByTestId('config-section-header')).toBeEmptyDOMElement();
    expect(screen.queryByTestId('test-button')).not.toBeInTheDocument();
  });
});
