// @vitest-environment jsdom
import { forwardRef, useImperativeHandle } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const fitView = vi.fn();
const stopRun = vi.fn();

vi.mock('@/[fsd]/features/interactive-tours/lib/constants', () => ({
  PIPELINE_TOUR_TARGET_IDS: { workspace: 'workspace' },
}));

vi.mock('@/[fsd]/features/pipelines/lib/hooks', () => ({
  usePipelineAttachmentYamlSync: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsSmallWindow: () => ({ isSmallWindow: false }),
}));

vi.mock('@/pages/Pipelines/Components/GeneralFormPanel', () => ({
  default: ({ isCreateMode }) => (
    <div
      data-testid="general-form"
      data-create={String(isCreateMode)}
    />
  ),
}));

vi.mock('@/pages/Pipelines/Components/EditorPanel', () => {
  const EditorPanelMock = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({ fitView }));
    return (
      <div
        data-testid="editor-panel"
        data-test-panel-open={String(props.isTestPanelOpen)}
        data-test-disabled-reason={props.testDisabledReason}
      >
        <button
          data-testid="test-pipeline"
          onClick={props.onTestPipeline}
        />
        <button
          data-testid="stop-run"
          onClick={props.stopRun}
        />
      </div>
    );
  });
  EditorPanelMock.displayName = 'EditorPanelMock';
  return { default: EditorPanelMock };
});

vi.mock('../PipelineTestRegion', () => {
  const PipelineTestRegionMock = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({ stopRun }));
    return (
      <div
        data-testid="test-region"
        data-open={String(props.isOpen)}
      >
        <button
          data-testid="close-test-panel"
          onClick={props.onClose}
        />
      </div>
    );
  });
  PipelineTestRegionMock.displayName = 'PipelineTestRegionMock';
  return { default: PipelineTestRegionMock };
});

const { default: PipelineEditorWorkspace } = await import('../PipelineEditorWorkspace');

const theme = createTheme({ palette: darkPalette });

const renderWorkspace = (props = {}, initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        <PipelineEditorWorkspace {...props} />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('PipelineEditorWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the create layout without a Test panel', () => {
    renderWorkspace();

    expect(screen.getByTestId('general-form')).toHaveAttribute('data-create', 'true');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute(
      'data-test-disabled-reason',
      'Save the pipeline to test it',
    );
    expect(screen.queryByTestId('test-region')).toBeNull();
  });

  it('keeps the Test panel closed when an existing pipeline opens', () => {
    renderWorkspace({ applicationId: 3 });

    expect(screen.getByTestId('general-form')).toHaveAttribute('data-create', 'false');
    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-panel-open', 'false');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-disabled-reason', '');
  });

  it('opens the Test panel when a Run History conversation restore is pending', () => {
    renderWorkspace({ applicationId: 3 }, [{ pathname: '/', state: { restoredConversationID: 1 } }]);

    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-panel-open', 'true');
  });

  it('ignores a restore request on the create layout', () => {
    renderWorkspace({}, [{ pathname: '/', state: { restoredConversationID: 1 } }]);

    expect(screen.queryByTestId('test-region')).toBeNull();
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-panel-open', 'false');
  });

  it('opens and closes the Test panel without changing the canvas zoom or position', () => {
    renderWorkspace({ applicationId: 3 });

    fireEvent.click(screen.getByTestId('test-pipeline'));
    act(() => vi.runAllTimers());
    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-panel-open', 'true');
    expect(fitView).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('close-test-panel'));
    act(() => vi.runAllTimers());
    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'false');
    expect(fitView).not.toHaveBeenCalled();
  });

  it('stops runs through the Test panel chat', () => {
    renderWorkspace({ applicationId: 3 });

    fireEvent.click(screen.getByTestId('stop-run'));
    expect(stopRun).toHaveBeenCalledTimes(1);
  });
});
