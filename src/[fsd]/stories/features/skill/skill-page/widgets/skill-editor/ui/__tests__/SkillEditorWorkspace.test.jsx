// @vitest-environment jsdom
import { forwardRef, useImperativeHandle } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { section, clearRun, controlsProps } = vi.hoisted(() => ({
  section: name => props => (
    <div
      data-testid={name}
      data-default-expanded="true"
      data-show-run-settings={String(props.showRunSettings ?? '')}
      data-show-instructions={String(props.showInstructions ?? '')}
      data-has-summary-action={String(Boolean(props.summaryEditAction))}
      data-default-expanded-prop={String(props.defaultExpanded ?? '')}
    >
      {props.summaryEditAction}
    </div>
  ),
  clearRun: vi.fn(),
  controlsProps: { current: null },
}));

vi.mock('@/[fsd]/features/skill', async () => {
  const SkillRunPane = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({ clear: clearRun }));
    return (
      <button
        data-testid="report-clearable"
        onClick={() => props.onClearStateChange(false)}
      />
    );
  });
  SkillRunPane.displayName = 'SkillRunPaneMock';
  return {
    AIEditSkillButton: () => <button data-testid="edit-skill-with-ai-button" />,
    CreateSkillForm: section('general-and-instructions'),
    SkillInformation: section('information'),
    SkillRunSettings: section('run-settings'),
    SkillRunPane,
    // The Figma layout: Settings / Files, the instructions, and the Test column with the page's controls
    SkillSplitEditor: ({
      settings,
      settingsActions,
      files,
      onOpenTestPanel,
      renderTestPanelControls,
      testPanelContent,
    }) => (
      <div
        data-testid="skill-split-editor"
        data-files={String(files.length)}
      >
        <div data-testid="skill-settings-actions">{settingsActions}</div>
        <div data-testid="skill-settings-view">{settings}</div>
        <button
          data-testid="skill-test-button"
          onClick={onOpenTestPanel}
        />
        <div data-testid="skill-test-header">{renderTestPanelControls({ onClose: () => {} })}</div>
        {testPanelContent}
      </div>
    ),
    useSkillVersionFilesQuery: () => ({ data: [{ path: 'scripts/fill.py' }] }),
  };
});
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 42 }));
vi.mock('@/common/constants', () => ({ ViewMode: { Owner: 'owner' } }));
vi.mock('@/[fsd]/shared/ui', async () => ({
  EditorLayout: await import('@/[fsd]/shared/ui/editor-layout'),
}));
vi.mock('@/[fsd]/widgets/entity-test-panel', () => ({
  EntityTestPanelUI: {
    EntityTestPanelControls: props => {
      controlsProps.current = props;
      return (
        <button
          data-testid="clear"
          onClick={props.onClear}
        />
      );
    },
  },
}));

const { default: SkillEditorWorkspace } = await import('../SkillEditorWorkspace');

const theme = createTheme({ palette: darkPalette });

const renderWorkspace = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SkillEditorWorkspace
        skillId={10}
        versionId={22}
        onOpenTestPanel={vi.fn()}
        onCloseTestPanel={vi.fn()}
        onShowHistory={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const childTestIds = columnTestId =>
  [...screen.getByTestId(columnTestId).querySelectorAll('[data-default-expanded]')].map(
    el => el.dataset.testid,
  );

describe('SkillEditorWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controlsProps.current = null;
  });
  afterEach(() => cleanup());

  it('puts General, Run Settings and Information in Settings, without the instructions', () => {
    renderWorkspace();

    expect(childTestIds('skill-settings-view')).toEqual([
      'general-and-instructions',
      'run-settings',
      'information',
    ]);
    expect(screen.getByTestId('general-and-instructions')).toHaveAttribute('data-show-run-settings', 'false');
    expect(screen.getByTestId('general-and-instructions')).toHaveAttribute('data-show-instructions', 'false');
  });

  it('puts Edit with AI in the header of the Settings | Files switch, not in General', () => {
    renderWorkspace();

    expect(screen.getByTestId('skill-settings-actions')).toContainElement(
      screen.getByTestId('edit-skill-with-ai-button'),
    );
    expect(screen.getByTestId('general-and-instructions')).toHaveAttribute(
      'data-has-summary-action',
      'false',
    );
  });

  it("gives the split editor the version's files", () => {
    renderWorkspace();

    expect(screen.getByTestId('skill-split-editor')).toHaveAttribute('data-files', '1');
  });

  it('opens Settings with General open and Run settings and Information collapsed, as in Figma', () => {
    renderWorkspace();

    expect(screen.getByTestId('run-settings')).toHaveAttribute('data-default-expanded-prop', 'false');
    expect(screen.getByTestId('information')).toHaveAttribute('data-default-expanded-prop', 'false');
  });

  it('opens the Test panel from Test', () => {
    const onOpenTestPanel = vi.fn();
    renderWorkspace({ onOpenTestPanel });

    fireEvent.click(screen.getByTestId('skill-test-button'));

    expect(onOpenTestPanel).toHaveBeenCalledTimes(1);
  });

  it('puts the Test panel controls in the Test column header', () => {
    renderWorkspace();

    expect(screen.getByTestId('skill-test-header')).toContainElement(screen.getByTestId('clear'));
  });

  it('clears the shown chat from the panel toolbar once it reports it can be cleared', () => {
    renderWorkspace();
    expect(controlsProps.current.isClearDisabled).toBe(true);

    fireEvent.click(screen.getByTestId('report-clearable'));
    expect(controlsProps.current.isClearDisabled).toBe(false);

    fireEvent.click(screen.getByTestId('clear'));
    expect(clearRun).toHaveBeenCalledTimes(1);
  });
});
