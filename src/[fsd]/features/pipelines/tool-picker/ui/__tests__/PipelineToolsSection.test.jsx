// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import PipelineToolsSection from '../PipelineToolsSection';

const mocks = vi.hoisted(() => ({ yamlJsonObject: { nodes: [] } }));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({
      pipeline: {
        byKey: { default: { yamlJsonObject: mocks.yamlJsonObject } },
        activePipelineKey: 'default',
      },
      applications: { toolkitSchemas: {} },
    }),
}));
vi.mock('@/[fsd]/features/pipelines/lib/constants', () => ({ DEFAULT_PIPELINE_KEY: 'default' }));
vi.mock('@/[fsd]/features/toolkits/lib/hooks/useAvailableInternalTools.hooks', () => ({
  useAvailableInternalTools: () => [{ name: 'attachments', title: 'Attachments' }],
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/switch/AgentInternalToolSwitch', () => ({
  default: props => <div data-testid={`module-${props.name}`} />,
}));
vi.mock('@/[fsd]/features/toolkits/lib/helpers/toolkits.helpers', () => ({
  genToolkitName: toolkit => toolkit.name,
  getToolkitDisplayName: toolkit => toolkit.name,
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useIsMcpVisible: () => true,
  useToast: () => ({ toastInfo: vi.fn() }),
  useViewMode: () => 'owner',
}));
vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks', async () => {
  const { useFormikContext } = await import('formik');
  return {
    usePipelineAttachments: () => {
      const { values, setFieldValue } = useFormikContext();
      return {
        detach: tool =>
          setFieldValue(
            'version_details.tools',
            values.version_details.tools.filter(item => item.id !== tool.id),
          ),
      };
    },
  };
});
vi.mock('../PickerEntityIcon', () => ({ default: () => null }));
vi.mock('../PickerMcpStatus', () => ({ default: () => null }));
vi.mock('../PipelineToolVersionLabel', () => ({ default: () => null }));

// The conditional name tooltip measures the text
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const theme = createTheme({ palette: darkPalette });

const jira = {
  id: 1,
  type: 'jira',
  name: 'jira',
  toolkit_name: 'jira',
  settings: { selected_tools: ['search'] },
};
const slack = { id: 2, type: 'slack', name: 'slack', toolkit_name: 'slack', settings: {} };
const reviewer = {
  id: 3,
  type: 'application',
  name: 'Reviewer',
  agent_type: 'openai',
  settings: { application_id: 7, application_version_id: 70 },
};

const renderSection = ({ tools = [], onSelectNode, status } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ version_details: { tools, meta: {}, status } }}
        onSubmit={vi.fn()}
      >
        <PipelineToolsSection onSelectNode={onSelectNode} />
      </Formik>
    </ThemeProvider>,
  );

describe('PipelineToolsSection', () => {
  beforeEach(() => {
    mocks.yamlJsonObject = {
      nodes: [
        { id: 'jira_1', type: 'toolkit', toolkit_name: 'jira', tool: 'search' },
        { id: 'agent_1', type: 'agent', tool: 'Reviewer' },
      ],
    };
  });
  afterEach(() => cleanup());

  it('shows the empty state when nothing is attached', () => {
    renderSection();
    expect(screen.getByTestId('pipeline-tools-section-empty')).toHaveTextContent(
      'Tools you select in nodes will appear here.',
    );
    expect(screen.getByTestId('module-attachments')).toBeInTheDocument();
  });

  it('lists toolkits before agents, without group titles or add buttons', () => {
    renderSection({ tools: [reviewer, jira, slack] });
    expect(screen.getAllByTestId('pipeline-tool-card-name').map(name => name.textContent)).toEqual([
      'jira',
      'slack',
      'Reviewer',
    ]);
    expect(screen.queryByText('Toolkits')).toBeNull();
    expect(screen.queryByTestId('agent-add-toolkit-button')).toBeNull();
  });

  it('opens the node panel from Used by and marks unused attachments', () => {
    const onSelectNode = vi.fn();
    renderSection({ tools: [jira, slack], onSelectNode });

    const [jiraCard, slackCard] = within(screen.getByTestId('pipeline-tools-list')).getAllByTestId(
      'pipeline-tool-card',
    );
    fireEvent.click(within(jiraCard).getByText('jira_1'));
    expect(onSelectNode).toHaveBeenCalledWith('jira_1');
    expect(within(slackCard).getByTestId('pipeline-tool-card-not-used')).toHaveTextContent(
      'Not used by any node',
    );
    expect(within(jiraCard).queryByTestId('pipeline-tool-card-not-used')).toBeNull();
  });

  it('removes only attachments no node uses', () => {
    renderSection({ tools: [jira, slack] });
    const [jiraCard, slackCard] = screen.getAllByTestId('pipeline-tool-card');

    expect(within(jiraCard).queryByTestId('pipeline-tool-card-remove')).toBeNull();
    fireEvent.click(within(slackCard).getByTestId('pipeline-tool-card-remove'));
    expect(screen.getAllByTestId('pipeline-tool-card-name').map(name => name.textContent)).toEqual(['jira']);
  });

  it('cannot remove attachments of a published version', () => {
    renderSection({ tools: [slack], status: 'published' });
    expect(screen.queryByTestId('pipeline-tool-card-remove')).toBeNull();
  });

  it('opens every attachment in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderSection({ tools: [jira, reviewer] });

    const [jiraOpen, reviewerOpen] = screen.getAllByTestId('pipeline-tool-card-open');
    fireEvent.click(jiraOpen);
    fireEvent.click(reviewerOpen);
    expect(open.mock.calls[0][0]).toContain('/toolkits/all/1?');
    expect(open.mock.calls[1][0]).toContain('/agents/all/7/70?');
    open.mockRestore();
  });

  it('shows the tools a toolkit exposes on demand', () => {
    renderSection({ tools: [jira] });
    expect(screen.queryByTestId('pipeline-tool-card-tools')).toBeNull();
    fireEvent.click(screen.getByTestId('pipeline-tool-card-show-tools'));
    expect(screen.getByTestId('pipeline-tool-card-tools')).toHaveTextContent('Search');
  });
});
