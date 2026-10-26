// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import NodeConfigSection from '../NodeConfigSection';

vi.mock('@/[fsd]/features/pipelines/flow-editor/ui/settings', () => ({
  TriggerTypeSelector: ({ disabled }) => (
    <div
      data-testid="trigger-type-selector"
      data-disabled={String(Boolean(disabled))}
    />
  ),
}));

const theme = createTheme({ palette: darkPalette });
const { NODE_CONFIG_SECTIONS } = NodePanelConstants;

const renderSection = ({ section, children, isEntrypoint = false, context = {} }) =>
  render(
    <ThemeProvider theme={theme}>
      <FlowEditorContext.Provider value={{ isRunningPipeline: false, disabled: false, ...context }}>
        <NodeConfigPanelContext.Provider value={{ isEntrypoint }}>
          <NodeConfigSection section={section}>{children}</NodeConfigSection>
        </NodeConfigPanelContext.Provider>
      </FlowEditorContext.Provider>
    </ThemeProvider>,
  );

describe('NodeConfigSection', () => {
  afterEach(() => cleanup());

  it('renders Basic expanded', () => {
    renderSection({ section: NODE_CONFIG_SECTIONS.basic, children: <div data-testid="field" /> });

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-node-panel-basic-section-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.queryByTestId('trigger-type-selector')).toBeNull();
  });

  it('renders Advanced collapsed', () => {
    renderSection({ section: NODE_CONFIG_SECTIONS.advanced, children: <div data-testid="field" /> });

    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-node-panel-advanced-section-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('puts Trigger first in Basic on the entry node, disabled while running', () => {
    renderSection({
      section: NODE_CONFIG_SECTIONS.basic,
      isEntrypoint: true,
      context: { isRunningPipeline: true },
      children: <div data-testid="field" />,
    });

    expect(screen.getByTestId('trigger-type-selector')).toHaveAttribute('data-disabled', 'true');
  });

  it('renders nothing for an empty section', () => {
    renderSection({ section: NODE_CONFIG_SECTIONS.advanced, children: false });

    expect(screen.queryByText('Advanced')).toBeNull();
  });
});
