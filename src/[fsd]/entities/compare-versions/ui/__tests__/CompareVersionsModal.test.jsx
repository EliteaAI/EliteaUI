// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// The steps are covered by their own tests; here each one only reports what it received
vi.mock('../steps', () => {
  const stub = name => {
    const StepStub = props => (
      <div
        data-testid={`stub-${name}`}
        data-left-save-reason={props.leftSaveDisabledReason ?? ''}
        data-empty-text={props.emptyText ?? ''}
        data-always-show-starters={String(Boolean(props.alwaysShowStarters))}
      >
        <button
          type="button"
          onClick={() => props.onLeftEdit?.('instructions', 'edited')}
        >
          {`edit-${name}`}
        </button>
        {props.onOpenSchedule && (
          <button
            type="button"
            onClick={() => props.onOpenSchedule(77, 2)}
          >
            open-schedule
          </button>
        )}
      </div>
    );
    StepStub.displayName = `StepStub(${name})`;
    return StepStub;
  };
  return {
    CompareInstructionsStep: stub('instructions'),
    ComparePipelineYamlStep: stub('pipeline-yaml'),
    CompareRunSettingsSchedulesStep: stub('run-settings-schedules'),
    CompareRunSettingsStep: stub('run-settings'),
    CompareToolsSkillsStep: stub('tools'),
    CompareUserInteractionStep: stub('user-interaction'),
  };
});
vi.mock('../CompareVersionSelector', () => ({ default: () => <div data-testid="selector" /> }));
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));

const { default: CompareVersionsModal } = await import('../CompareVersionsModal');

const theme = createTheme({ palette: darkPalette });
const VERSIONS = [
  { id: 1, name: 'base', created_at: '2026-01-01' },
  { id: 2, name: 'v2', created_at: '2026-02-01' },
];
const loaded = {
  leftData: { instructions: 'a: 1\n' },
  rightData: { instructions: 'a: 2\n' },
  leftVersionMeta: VERSIONS[0],
  rightVersionMeta: VERSIONS[1],
};

const renderModal = props =>
  render(
    <ThemeProvider theme={theme}>
      <CompareVersionsModal
        open
        onClose={vi.fn()}
        entityType="pipeline"
        leftVersionId={1}
        versions={VERSIONS}
        onLoadVersions={vi.fn().mockResolvedValue(loaded)}
        {...props}
      />
    </ThemeProvider>,
  );

const openWizard = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument());
};

const stepLabels = () =>
  screen.getAllByRole('button', { name: /^Step \d+:/ }).map(button => button.getAttribute('aria-label'));

describe('CompareVersionsModal', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the 4 pipeline steps in order, starting with the YAML', async () => {
    renderModal();
    await openWizard();
    expect(stepLabels()).toEqual([
      'Step 1: Pipeline YAML',
      'Step 2: User Interaction',
      'Step 3: Tools',
      'Step 4: Run settings & Schedules',
    ]);
    expect(screen.getByTestId('stub-pipeline-yaml')).toBeVisible();
  });

  it('keeps the agent and skill steps unchanged', async () => {
    renderModal({ entityType: 'agent' });
    await openWizard();
    expect(stepLabels()).toEqual([
      'Step 1: Instructions',
      'Step 2: User Interaction',
      'Step 3: Tools & Skills',
    ]);
    cleanup();

    renderModal({ entityType: 'skill' });
    await openWizard();
    expect(stepLabels()).toEqual(['Step 1: Instructions', 'Step 2: Run settings']);
  });

  it('gives the pipeline Tools step its own empty text', async () => {
    renderModal();
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-tools'));
    expect(screen.getByTestId('stub-tools')).toHaveAttribute(
      'data-empty-text',
      'No toolkits, MCPs, agents or pipelines attached',
    );
  });

  it('warns about unsaved editor changes and blocks saving the open version', async () => {
    renderModal({ isEditorDirty: true });
    expect(screen.getByTestId('compare-editor-dirty-banner')).toHaveTextContent(
      'You have unsaved changes in the editor. Compare uses the saved versions.',
    );
    await openWizard();
    expect(screen.getByTestId('stub-pipeline-yaml')).toHaveAttribute(
      'data-left-save-reason',
      'Save or discard your changes in the editor first.',
    );
  });

  it('shows no banner and allows saving when the editor is clean', async () => {
    renderModal();
    expect(screen.queryByTestId('compare-editor-dirty-banner')).not.toBeInTheDocument();
    await openWizard();
    expect(screen.getByTestId('stub-pipeline-yaml')).toHaveAttribute('data-left-save-reason', '');
  });

  it('keeps the YAML step mounted while another step shows', async () => {
    renderModal();
    await openWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('stub-user-interaction')).toBeVisible();
    expect(screen.getByTestId('stub-pipeline-yaml')).not.toBeVisible();
  });

  it('shows the load error and stays on the selection', async () => {
    renderModal({ onLoadVersions: vi.fn().mockRejectedValue(new Error('boom')) });
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
    expect(await screen.findByText('Failed to load version details. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it.each([
    ['Esc', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
    ['the close icon', () => fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0])],
    ['Change versions', () => fireEvent.click(screen.getByRole('button', { name: 'Change versions' }))],
  ])('asks before discarding edits on %s', async (_, act) => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await openWizard();
    fireEvent.click(screen.getByText('edit-pipeline-yaml'));
    act();
    expect(await screen.findByText('Discard unsaved changes?')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
  });

  it('opens a schedule directly without edits, and after the confirm with edits', async () => {
    const onClose = vi.fn();
    const onOpenSchedule = vi.fn();
    renderModal({ onClose, onOpenSchedule });
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-run-settings-schedules'));
    fireEvent.click(screen.getByText('open-schedule'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenSchedule).toHaveBeenCalledWith(77, 2);
    cleanup();
    vi.clearAllMocks();

    renderModal({ onClose, onOpenSchedule });
    await openWizard();
    fireEvent.click(screen.getByText('edit-pipeline-yaml'));
    fireEvent.click(screen.getByTestId('compare-step-run-settings-schedules'));
    fireEvent.click(screen.getByText('open-schedule'));
    expect(await screen.findByText('Discard unsaved changes?')).toBeInTheDocument();
    expect(onOpenSchedule).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard and continue' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenSchedule).toHaveBeenCalledWith(77, 2);
  });

  it('asks for the Chat Starters block only for a pipeline, not for an agent', async () => {
    renderModal();
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-user-interaction'));
    expect(screen.getByTestId('stub-user-interaction')).toHaveAttribute('data-always-show-starters', 'true');
    cleanup();

    renderModal({ entityType: 'agent' });
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-user-interaction'));
    expect(screen.getByTestId('stub-user-interaction')).toHaveAttribute('data-always-show-starters', 'false');
  });
});
