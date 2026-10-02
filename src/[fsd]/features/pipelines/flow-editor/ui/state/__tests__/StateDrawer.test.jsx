// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import StateDrawer from '../StateDrawer';
import StateVariableList from '../StateVariableList';

const flowEditorUi = vi.hoisted(() => ({ StateVariableList: null }));

vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal()),
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Typography: ({ children }) => <span>{children}</span>,
  useTheme: () => ({ palette: { icon: {} } }),
}));

vi.mock('@/assets/clipboard-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/CloseIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/PlusIcon', () => ({ default: () => null }));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/helpers', async () => ({
  StateHelpers: await vi.importActual('@/[fsd]/features/pipelines/flow-editor/lib/helpers/state.helpers'),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/hooks', () => ({
  useResizableDrawer: () => ({
    drawerWidth: 400,
    setIsHoveringHandle: () => {},
    handleResizeStart: () => {},
  }),
  useStateValidation: () => ({ validateVariable: () => null, clearValidationError: () => {} }),
}));

vi.mock('@/[fsd]/features/pipelines/flow-editor/ui', () => ({
  FlowEditorState: {
    get StateVariableList() {
      return flowEditorUi.StateVariableList;
    },
    StateVariableItem: ({ name, enabled, onToggle }) => (
      <button
        data-testid={`state-variable-${name}`}
        data-enabled={String(!!enabled)}
        onClick={() => onToggle(name, !enabled)}
      />
    ),
  },
}));

flowEditorUi.StateVariableList = StateVariableList;

const TOOL_OUTCOME_VARIABLES = [
  FlowEditorConstants.STATE_TOOL_OUTCOMES,
  FlowEditorConstants.STATE_LAST_TOOL_OUTCOME,
];

const renderDrawer = yamlJsonObject => {
  const setYamlJsonObject = vi.fn();
  render(
    <StateDrawer
      isOpen
      onClose={() => {}}
      yamlJsonObject={yamlJsonObject}
      setYamlJsonObject={setYamlJsonObject}
    />,
  );
  return setYamlJsonObject;
};

const isEnabled = name => screen.getByTestId(`state-variable-${name}`).dataset.enabled === 'true';

describe('StateDrawer default variables', () => {
  afterEach(cleanup);

  describe.each([
    ['seeded with the new-pipeline state', { state: FlowEditorConstants.DefaultState }],
    ['without any state', {}],
  ])('for a new pipeline %s', (_, yamlJsonObject) => {
    it('enables input and messages', () => {
      renderDrawer(yamlJsonObject);

      expect(isEnabled(FlowEditorConstants.STATE_INPUT)).toBe(true);
      expect(isEnabled(FlowEditorConstants.STATE_MESSAGES)).toBe(true);
    });

    it.each(TOOL_OUTCOME_VARIABLES)('leaves %s disabled', name => {
      renderDrawer(yamlJsonObject);

      expect(isEnabled(name)).toBe(false);
    });

    it.each(TOOL_OUTCOME_VARIABLES)('writes %s to the state as JSON when toggled on', name => {
      const setYamlJsonObject = renderDrawer(yamlJsonObject);

      fireEvent.click(screen.getByTestId(`state-variable-${name}`));

      const { state } = setYamlJsonObject.mock.calls[0][0];
      expect(state[name]).toEqual({ type: FlowEditorConstants.StateVariableTypes.Json });
      expect(Object.keys(state)).toEqual([
        FlowEditorConstants.STATE_INPUT,
        FlowEditorConstants.STATE_MESSAGES,
        name,
      ]);
    });
  });

  it.each(TOOL_OUTCOME_VARIABLES)('shows %s enabled when the saved pipeline declares it', name => {
    renderDrawer({ state: { ...FlowEditorConstants.DefaultState, [name]: { type: 'dict' } } });

    expect(isEnabled(name)).toBe(true);
  });
});
