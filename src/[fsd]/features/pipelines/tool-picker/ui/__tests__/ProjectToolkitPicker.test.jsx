// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ProjectToolkitPicker from '../ProjectToolkitPicker';

const mocks = vi.hoisted(() => ({
  list: {},
  openCreatePage: vi.fn(),
  listArgs: vi.fn(),
}));

vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/useProjectToolkitsList.hooks', () => ({
  useProjectToolkitsList: args => {
    mocks.listArgs(args);
    return mocks.list;
  },
}));
vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/useCreateInNewTab.hooks', () => ({
  useCreateInNewTab: () => mocks.openCreatePage,
}));
vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks', async () => {
  const { useFormikContext } = await import('formik');
  return {
    usePipelineAttachments: () => ({
      tools: useFormikContext().values.version_details.tools,
      getToolkitName: tool => tool.toolkit_name || tool.name,
    }),
  };
});
vi.mock('@/[fsd]/features/toolkits/lib/helpers/toolkits.helpers', () => ({
  getToolkitDisplayName: toolkit => toolkit.name,
}));
vi.mock('../PickerEntityIcon', () => ({ default: () => null }));
vi.mock('../PickerMcpStatus', () => ({ default: () => null }));

const theme = createTheme({ palette: darkPalette });
const TEST_ID = 'pipeline-toolkit-node-toolkit-select';

const jira = { id: 1, type: 'jira', name: 'jira', toolkit_name: 'jira' };
const github = { id: 2, type: 'github', name: 'github', toolkit_name: 'github' };

const listState = overrides => ({
  rows: [],
  isFetching: false,
  isError: false,
  hasMore: false,
  onLoadMore: vi.fn(),
  reload: vi.fn(),
  ...overrides,
});

const renderPicker = ({ props = {}, tools = [], status, nodes = [] } = {}) => {
  const onSelect = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ version_details: { tools, status } }}
        onSubmit={vi.fn()}
      >
        <FlowEditorContext.Provider value={{ yamlJsonObject: { nodes } }}>
          <ProjectToolkitPicker
            onSelect={onSelect}
            data-testid={TEST_ID}
            {...props}
          />
        </FlowEditorContext.Provider>
      </Formik>
    </ThemeProvider>,
  );
  return { onSelect };
};

const openMenu = () => fireEvent.click(screen.getByTestId(TEST_ID));

describe('ProjectToolkitPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list = listState();
  });
  afterEach(() => cleanup());

  it('loads the project toolkits only once opened', () => {
    renderPicker();
    expect(mocks.listArgs).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true, mcp: false }));
    openMenu();
    expect(mocks.listArgs).toHaveBeenLastCalledWith(expect.objectContaining({ skip: false }));
  });

  it('lists project toolkits and returns the pick with the name the node binds to', () => {
    mocks.list = listState({ rows: [jira, github] });
    const { onSelect } = renderPicker();
    openMenu();

    const options = screen.getAllByTestId(`${TEST_ID}-option`);
    expect(options).toHaveLength(2);
    fireEvent.click(options[1]);
    expect(onSelect).toHaveBeenCalledWith(github, 'github');
  });

  it('pins toolkits used by nodes on top with an In use tag', () => {
    mocks.list = listState({ rows: [github] });
    renderPicker({
      tools: [jira],
      nodes: [{ id: 'jira_1', type: 'toolkit', toolkit_name: 'jira' }],
    });
    openMenu();

    const [first] = screen.getAllByTestId(`${TEST_ID}-option`);
    expect(first).toHaveTextContent('jira');
    expect(within(first).getByTestId(`${TEST_ID}-option-in-use`)).toBeInTheDocument();
  });

  it('searches on the server with the debounced query', async () => {
    vi.useFakeTimers();
    try {
      renderPicker();
      openMenu();
      fireEvent.change(screen.getByTestId(`${TEST_ID}-menu-search`), { target: { value: 'jir' } });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(mocks.listArgs).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'jir' }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('loads the next page when the list is scrolled to the end', () => {
    mocks.list = listState({ rows: [jira, github], hasMore: true });
    renderPicker();
    openMenu();

    fireEvent.scroll(screen.getByRole('listbox'));
    expect(mocks.list.onLoadMore).toHaveBeenCalled();
  });

  it('shows the empty state and opens Create new in a new tab', () => {
    renderPicker();
    openMenu();

    expect(screen.getByTestId(`${TEST_ID}-menu-empty`)).toHaveTextContent('No toolkits in this project yet');
    fireEvent.click(screen.getByTestId(`${TEST_ID}-create-new`));
    expect(mocks.openCreatePage).toHaveBeenCalledWith('/toolkits/create');
  });

  it('shows the error state with Retry', () => {
    mocks.list = listState({ isError: true });
    renderPicker();
    openMenu();

    fireEvent.click(screen.getByTestId(`${TEST_ID}-menu-retry`));
    expect(mocks.list.reload).toHaveBeenCalled();
  });

  it('cannot be opened on a published version', () => {
    renderPicker({ status: 'published' });
    openMenu();
    expect(screen.queryByTestId(`${TEST_ID}-menu`)).toBeNull();
    expect(screen.getByTestId(TEST_ID)).toHaveAttribute('aria-disabled', 'true');
  });
});
