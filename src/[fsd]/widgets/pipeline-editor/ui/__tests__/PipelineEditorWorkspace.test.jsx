// @vitest-environment jsdom
import { forwardRef, useImperativeHandle } from 'react';

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

const renderWorkspace = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <PipelineEditorWorkspace {...props} />
    </ThemeProvider>,
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

  it('opens and closes the Test panel and re-fits the canvas each time', () => {
    renderWorkspace({ applicationId: 3 });

    fireEvent.click(screen.getByTestId('test-pipeline'));
    act(() => vi.runAllTimers());
    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('editor-panel')).toHaveAttribute('data-test-panel-open', 'true');
    expect(fitView).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('close-test-panel'));
    act(() => vi.runAllTimers());
    expect(screen.getByTestId('test-region')).toHaveAttribute('data-open', 'false');
    expect(fitView).toHaveBeenCalledTimes(2);
  });

  it('stops runs through the Test panel chat', () => {
    renderWorkspace({ applicationId: 3 });

    fireEvent.click(screen.getByTestId('stop-run'));
    expect(stopRun).toHaveBeenCalledTimes(1);
  });
});
