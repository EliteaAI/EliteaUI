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
        data-read-only={String(Boolean(props.readOnly))}
        data-right-note={props.rightNote ?? ''}
        data-nested-rows={props.nestedRows ? String(props.nestedRows.length) : ''}
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
    CompareNestedAgentsStep: stub('sub-agents'),
    ComparePipelineYamlStep: stub('pipeline-yaml'),
    CompareRunSettingsSchedulesStep: stub('run-settings-schedules'),
    CompareRunSettingsStep: stub('run-settings'),
    CompareToolsSkillsStep: stub('tools'),
    CompareUserInteractionStep: stub('user-interaction'),
  };
});
vi.mock('../CompareVersionSelector', () => ({ default: () => <div data-testid="selector" /> }));
vi.mock('../ComparePublicVersionSelector', () => ({
  default: props => (
    <div
      data-testid="public-selector"
      data-left={String(props.leftVersionId)}
      data-right={String(props.rightVersionId)}
      data-loading={String(props.isLoading)}
      data-error={props.loadError}
      data-count={String(props.publicVersions.length)}
    >
      <button
        type="button"
        onClick={() => props.onLeftVersionChange(1)}
      >
        pick-local-1
      </button>
      <button
        type="button"
        onClick={() => props.onRightVersionChange(501)}
      >
        pick-public-501
      </button>
    </div>
  ),
}));
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

describe('CompareVersionsModal comparing with a public version', () => {
  const PUBLIC_VERSIONS = [
    { id: 501, name: 'v1', created_at: '2026-03-01' },
    { id: 502, name: 'v2', created_at: '2026-04-01' },
  ];
  const publicLoaded = {
    leftData: { instructions: 'mine' },
    rightData: { instructions: 'theirs' },
    leftVersionMeta: VERSIONS[1],
    rightVersionMeta: PUBLIC_VERSIONS[1],
    nestedRows: [],
  };

  const renderPublic = props =>
    renderModal({
      entityType: 'agent',
      mode: 'public',
      leftVersionId: 2,
      publicVersions: PUBLIC_VERSIONS,
      onLoadVersions: vi.fn().mockResolvedValue(publicLoaded),
      ...props,
    });

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('is titled for the public comparison and uses the public selector', () => {
    renderPublic();
    expect(screen.getByText('Compare with public version')).toBeInTheDocument();
    expect(screen.getByTestId('public-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('selector')).not.toBeInTheDocument();
  });

  it('keeps the normal title and selector for two versions of the agent', () => {
    renderModal({ entityType: 'agent' });
    expect(screen.getByText('Compare versions')).toBeInTheDocument();
    expect(screen.getByTestId('selector')).toBeInTheDocument();
    expect(screen.queryByTestId('public-selector')).not.toBeInTheDocument();
  });

  it('starts from the open version and the newest public version', async () => {
    renderPublic();
    await waitFor(() => expect(screen.getByTestId('public-selector')).toHaveAttribute('data-right', '502'));
    expect(screen.getByTestId('public-selector')).toHaveAttribute('data-left', '2');
  });

  it('waits for the public versions to arrive before choosing one', async () => {
    const view = renderPublic({ publicVersions: [], isLoadingPublicVersions: true });
    expect(screen.getByTestId('public-selector')).toHaveAttribute('data-right', 'null');
    expect(screen.getByRole('button', { name: 'Compare' })).toBeDisabled();
    view.unmount();
    renderPublic();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Compare' })).toBeEnabled());
  });

  it('passes the loading and error state of the public versions to the selector', () => {
    renderPublic({
      isLoadingPublicVersions: true,
      publicLoadError: 'The public versions could not be loaded.',
    });
    expect(screen.getByTestId('public-selector')).toHaveAttribute('data-loading', 'true');
    expect(screen.getByTestId('public-selector')).toHaveAttribute(
      'data-error',
      'The public versions could not be loaded.',
    );
  });

  it('compares the version of the agent the user picks with the public version they pick', async () => {
    const onLoadVersions = vi.fn().mockResolvedValue(publicLoaded);
    renderPublic({ onLoadVersions });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Compare' })).toBeEnabled());
    fireEvent.click(screen.getByText('pick-local-1'));
    fireEvent.click(screen.getByText('pick-public-501'));
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
    await waitFor(() => expect(onLoadVersions).toHaveBeenCalledWith(1, 501));
  });

  it('cannot compare until both versions are chosen', async () => {
    renderPublic({ publicVersions: [] });
    expect(screen.getByRole('button', { name: 'Compare' })).toBeDisabled();
  });

  it('shows the agent steps with a Tools step instead of Tools & Skills', async () => {
    renderPublic();
    await openWizard();
    expect(stepLabels()).toEqual(['Step 1: Instructions', 'Step 2: User Interaction', 'Step 3: Tools']);
  });

  it('adds a Sub-agents step when either version has sub-agents', async () => {
    renderPublic({
      onLoadVersions: vi.fn().mockResolvedValue({ ...publicLoaded, nestedRows: [{ key: 'agent:Helper' }] }),
    });
    await openWizard();
    expect(stepLabels()).toEqual([
      'Step 1: Instructions',
      'Step 2: User Interaction',
      'Step 3: Tools',
      'Step 4: Sub-agents',
    ]);
    fireEvent.click(screen.getByTestId('compare-step-sub-agents'));
    expect(screen.getByTestId('stub-sub-agents')).toHaveAttribute('data-nested-rows', '1');
  });

  it('makes both sides read only, so nothing can be saved', async () => {
    renderPublic();
    await openWizard();
    expect(screen.getByTestId('stub-instructions')).toHaveAttribute('data-read-only', 'true');
    fireEvent.click(screen.getByTestId('compare-step-user-interaction'));
    expect(screen.getByTestId('stub-user-interaction')).toHaveAttribute('data-read-only', 'true');
  });

  it('keeps the two version comparison editable', async () => {
    renderModal({ entityType: 'agent' });
    await openWizard();
    expect(screen.getByTestId('stub-instructions')).toHaveAttribute('data-read-only', 'false');
  });

  it('says on the Tools step that skills are not compared', async () => {
    renderPublic();
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-tools-skills'));
    expect(screen.getByTestId('stub-tools')).toHaveAttribute(
      'data-right-note',
      'Attached skills are not compared.',
    );
  });

  it('does not add that note to the two version comparison', async () => {
    renderModal({ entityType: 'agent' });
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-tools-skills'));
    expect(screen.getByTestId('stub-tools')).toHaveAttribute('data-right-note', '');
  });

  it('closes without asking, as there is nothing to discard', async () => {
    const onClose = vi.fn();
    renderPublic({ onClose });
    await openWizard();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('starts on the first step again after the versions are changed', async () => {
    renderPublic();
    await openWizard();
    fireEvent.click(screen.getByTestId('compare-step-user-interaction'));
    fireEvent.click(screen.getByRole('button', { name: 'Change versions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compare' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument());
    expect(screen.getByTestId('stub-instructions')).toBeVisible();
  });
});
