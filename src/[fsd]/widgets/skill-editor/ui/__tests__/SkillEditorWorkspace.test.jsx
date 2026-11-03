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
      data-has-summary-action={String(Boolean(props.summaryEditAction))}
    />
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
  };
});
vi.mock('@/common/constants', () => ({ ViewMode: { Owner: 'owner' } }));
vi.mock('@/[fsd]/shared/ui', async () => ({
  EditorLayout: await import('@/[fsd]/shared/ui/editor-layout'),
}));
vi.mock('@/[fsd]/widgets/entity-test-panel', () => ({
  EntityTestPanelConstants: { TEST_PANEL_STORAGE_KEYS: { skill: 'skillTestPanelWidth' } },
  EntityTestPanelUI: {
    EntityEditorWorkspace: ({
      renderConfig,
      toolbarActions,
      testButton,
      testPanelControls,
      testPanelContent,
    }) => (
      <>
        <div data-testid="toolbar">
          {toolbarActions}
          {testButton}
        </div>
        {testPanelControls}
        {renderConfig({ isConfigStacked: false })}
        {testPanelContent}
      </>
    ),
    TestEntityButton: ({ label, onClick, testId }) => (
      <button
        data-testid={testId}
        onClick={onClick}
      >
        {label}
      </button>
    ),
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

  it('puts General and Instructions on the left, Run Settings and Information on the right', () => {
    renderWorkspace();

    expect(childTestIds('skill-config-panels-left')).toEqual(['general-and-instructions']);
    expect(screen.getByTestId('general-and-instructions')).toHaveAttribute('data-show-run-settings', 'false');
    expect(childTestIds('skill-config-panels-right')).toEqual(['run-settings', 'information']);
  });

  it('puts Edit with AI before Test Skill in the toolbar, not in General', () => {
    renderWorkspace();

    const buttons = [...screen.getByTestId('toolbar').querySelectorAll('button')].map(
      el => el.dataset.testid,
    );
    expect(buttons).toEqual(['edit-skill-with-ai-button', 'skill-test-button']);
    expect(screen.getByTestId('general-and-instructions')).toHaveAttribute(
      'data-has-summary-action',
      'false',
    );
  });

  it('opens the Test panel from Test Skill', () => {
    const onOpenTestPanel = vi.fn();
    renderWorkspace({ onOpenTestPanel });

    fireEvent.click(screen.getByTestId('skill-test-button'));

    expect(screen.getByTestId('skill-test-button')).toHaveTextContent('Test Skill');
    expect(onOpenTestPanel).toHaveBeenCalledTimes(1);
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
