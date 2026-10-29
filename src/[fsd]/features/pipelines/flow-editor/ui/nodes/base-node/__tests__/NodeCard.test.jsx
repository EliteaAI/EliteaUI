// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';

import NodeCard from '../NodeCard';

vi.mock('@/[fsd]/features/pipelines/flow-editor/ui/settings', () => ({
  TriggerTypeSelector: () => <div data-testid="trigger-type-selector" />,
}));

const { PipelineNodeTypes } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });

const renderCard = ({ yamlNode, panelContext = null, cardProps = {}, context = {} } = {}) => {
  const contextValue = {
    yamlJsonObject: { entry_point: 'agent_1', nodes: yamlNode ? [yamlNode] : [] },
    isRunningPipeline: false,
    disabled: false,
    reportNodeIssues: vi.fn(),
    ...context,
  };
  const utils = render(
    <ThemeProvider theme={theme}>
      <ReactFlowProvider>
        <FlowEditorContext.Provider value={contextValue}>
          <NodeConfigPanelContext.Provider value={panelContext}>
            <NodeCard
              id={yamlNode?.id || 'agent_1'}
              name={yamlNode?.id || 'agent_1'}
              type={yamlNode?.type || PipelineNodeTypes.Agent}
              {...cardProps}
            >
              <div data-testid="node-fields" />
            </NodeCard>
          </NodeConfigPanelContext.Provider>
        </FlowEditorContext.Provider>
      </ReactFlowProvider>
    </ThemeProvider>,
  );
  return { ...utils, contextValue };
};

const agentNode = {
  id: 'agent_1',
  type: PipelineNodeTypes.Agent,
  tool: 'Researcher',
  input_mapping: { task: { type: 'fixed', value: 'Find sources' } },
};

describe('NodeCard', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('is view-only on the canvas: summary, no fields', () => {
    renderCard({ yamlNode: agentNode });

    expect(screen.getByTestId('pipeline-node-summary-primary')).toHaveTextContent('Researcher');
    expect(screen.getByTestId('pipeline-node-summary-secondary')).toHaveTextContent('Find sources');
    expect(screen.queryByTestId('node-fields')).toBeNull();
    expect(screen.queryByTestId('trigger-type-selector')).toBeNull();
  });

  it('shows Not configured instead of the summary and reports the issues', () => {
    const { contextValue } = renderCard({ yamlNode: { id: 'agent_1', type: PipelineNodeTypes.Agent } });

    expect(screen.getByTestId('pipeline-node-not-configured')).toHaveTextContent('Not configured');
    expect(screen.queryByTestId('pipeline-node-summary-primary')).toBeNull();
    expect(contextValue.reportNodeIssues).toHaveBeenCalledWith('agent_1', ['Select an agent']);
  });

  it('clears its reported issues when it unmounts', () => {
    const { contextValue, unmount } = renderCard({
      yamlNode: { id: 'agent_1', type: PipelineNodeTypes.Agent },
    });

    unmount();

    expect(contextValue.reportNodeIssues).toHaveBeenLastCalledWith('agent_1', []);
  });

  it('renders the fields instead of the card inside the panel, without reporting issues', () => {
    const { contextValue } = renderCard({
      yamlNode: { id: 'agent_1', type: PipelineNodeTypes.Agent },
      panelContext: { isEntrypoint: false, isLegacyLayout: false },
    });

    expect(screen.getByTestId('node-fields')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-node-card-agent_1')).toBeNull();
    expect(contextValue.reportNodeIssues).not.toHaveBeenCalled();
  });

  it('wraps legacy node fields in the Basic section, with Trigger first on the entry node', () => {
    renderCard({
      yamlNode: { id: 'agent_1', type: PipelineNodeTypes.Loop },
      panelContext: { isEntrypoint: true, isLegacyLayout: true },
    });

    expect(screen.getByTestId('pipeline-node-panel-basic-section')).toBeInTheDocument();
    const trigger = screen.getByTestId('trigger-type-selector');
    const fields = screen.getByTestId('node-fields');
    expect(trigger.compareDocumentPosition(fields) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
