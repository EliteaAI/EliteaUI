// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { INDEX_DATA_DISABLED_REASON } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { act, cleanup, render, screen } from '@testing-library/react';

/**
 * The panel derives every gate from one helper call and every banner from another.
 * The helpers' own suites cannot police those calls — they pass their own arguments —
 * so a transposed or neutralised input at the call site is invisible to them.
 *
 * This renders the panel and reads what it hands its children, so the assertions are
 * on behaviour rather than on the shape of the source.
 */
// Same shim the toolkit-chat suite uses: modules read localStorage at import time and
// this config's jsdom does not supply a working one.
vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

// Controls the delete mutation's in-flight flag, which is one of indexRunControls'
// inputs and is otherwise always false here.
const deleteInFlight = vi.hoisted(() => ({ current: false }));

// The panel hands traceNewIndex to the chat hook, which calls it when a run starts.
// Capturing it is the only way to drive localMetaOverride, the one gate input that is
// component state rather than a prop.
const traceNewIndex = vi.hoisted(() => ({ current: null }));

// Both default to the value the panel would compute anyway, so a test that cares has to
// say so. Without these, neutralising `isRunning` or `serverSupersedes` at the call site
// is an equivalent mutant here rather than a caught one.
const chatIsRunning = vi.hoisted(() => ({ current: false }));
const chatIsWaitingForTaskStart = vi.hoisted(() => ({ current: false }));
const polling = vi.hoisted(() => ({ current: { startedTimeStamp: 0, fulfilledTimeStamp: 0 } }));

const stub = (testid, keys) =>
  vi.fn(props => (
    <div
      data-testid={testid}
      data-props={JSON.stringify(Object.fromEntries(keys.map(k => [k, props[k] ?? null])))}
    />
  ));

const bannerStub = stub('banner', ['banner']);
const footerStub = vi.fn(props => (
  <button
    type="button"
    data-testid="footer"
    data-props={JSON.stringify({
      isRunActive: props.isRunActive ?? null,
      reindexDisabled: props.reindexDisabled ?? null,
      reindexTooltip: props.reindexTooltip ?? null,
    })}
    onClick={props.onReindex}
  />
));
const deleteStub = stub('delete-action', ['disabled']);
const leftBandStub = stub('left-band', []);

vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  IndexActivityPanel: () => <div />,
  IndexScheduleModal: () => <div />,
  RunIndexBanner: props => bannerStub(props),
}));
vi.mock('../IndexDetailsFooterBand', () => ({ default: props => footerStub(props) }));
vi.mock('../IndexDetailsDeleteAction', () => ({ default: props => deleteStub(props) }));
vi.mock('../IndexDetailsLeftBand', () => ({ default: props => leftBandStub(props) }));
vi.mock('../IndexDetailsTabsBand', () => ({ default: () => <div /> }));
vi.mock('../IndexConfigurationTab', () => ({ default: () => <div /> }));
vi.mock('../RunIndexGeneralSection', () => ({ default: () => <div /> }));
vi.mock('../RunIndexScheduleContent', () => ({ default: () => <div /> }));

vi.mock('formik', () => ({ useFormikContext: () => ({ values: {} }) }));
vi.mock('react-redux', () => ({ useSelector: () => ({}) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/[fsd]/entities/run-history/lib/hooks', () => ({
  useConversationTranscript: () => ({ transcript: [], isTranscriptLoading: false }),
}));
vi.mock('@/[fsd]/features/mcp', () => ({
  McpAuthModal: () => <div />,
  useMcpAuthModal: () => ({ getModalProps: () => ({}), handleAuthRequired: vi.fn() }),
}));
vi.mock('@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader', () => ({
  default: props => <div>{props.extraContent}</div>,
}));
vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  useDeleteIndexItemMutation: () => [vi.fn(), { isLoading: deleteInFlight.current }],
  useSaveIndexConfigurationMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateIndexScheduleMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexesListPolling: () => polling.current,
}));
vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitsHelpers: { prettifyToolkitConversation: m => m },
}));
vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useGetCurrentToolkitSchemas: () => ({ schemas: [] }),
  useToolkitChat: options => {
    traceNewIndex.current = options.traceNewIndex;
    return {
      chatHistory: [],
      isIndexing: false,
      isRunning: chatIsRunning.current,
      isStoppingIndexing: false,
      // Both feed indexRunControls; leaving them undefined would mask the gates under a
      // permanently "starting up" run.
      isWaitingForTaskStart: chatIsWaitingForTaskStart.current,
      canStopIndexing: false,
      handleClearChat: vi.fn(),
      handleClearActiveConversation: vi.fn(),
      handleIndexData: vi.fn(),
      retryLastRun: vi.fn(),
      onCancelIndexing: vi.fn(),
      activeConversation: null,
    };
  },
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Modal: {
    // Only the open one renders, and it confirms through onConfirm.
    DeleteEntityModal: props =>
      props.open ? (
        <button
          type="button"
          data-testid={props.title === 'Reindex confirmation' ? 'reindex-confirm' : 'delete-confirm'}
          onClick={props.onConfirm}
        />
      ) : null,
  },
}));
vi.mock('@/[fsd]/shared/ui/accordion', () => ({ BasicAccordion: () => <div /> }));
vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => <div /> }));
// The legacy slices import the api object from its own module rather than the barrel,
// so both specifiers must resolve to the same stub or their extraReducers see undefined.
const makeApiMock = () => {
  const matcher = Object.assign(() => false, { type: 'noop' });
  const endpoint = {
    matchFulfilled: matcher,
    matchPending: matcher,
    matchRejected: matcher,
    initiate: () => () => Promise.resolve({}),
    select: () => () => ({}),
  };
  const api = {};
  api.injectEndpoints = () => api;
  api.enhanceEndpoints = () => api;
  api.reducerPath = 'eliteaApi';
  // A Proxy so this mock never has to enumerate the api surface.
  api.endpoints = new Proxy({}, { get: () => endpoint });
  return {
    eliteaApi: api,
    middleware: () => next => action => next(action),
    reducer: (state = {}) => state,
    reducerPath: 'eliteaApi',
    useDeleteIndexScheduleMutation: () => [vi.fn(), { isLoading: false }],
  };
};

// One instance, shared: vi.mock runs a factory per specifier, so calling makeApiMock
// twice would hand the barrel and the module two different objects — invisible today
// only because every Proxy key is interchangeable.
const apiMock = makeApiMock();
vi.mock('@/api', () => apiMock);
vi.mock('@/api/eliteaApi.js', () => apiMock);

vi.mock('@/[fsd]/features/toolkits/indexes/model/indexes.slice', () => ({
  selectToolkitScheduler: () => null,
  name: 'indexes',
  actions: {},
  default: (state = {}) => state,
}));
vi.mock('@/common/toolkitSchemaUtils', () => ({ convertToolkitSchema: () => ({}) }));
vi.mock('@/hooks/toolkit/useGetSelectedToolSchema', () => ({ useGetSelectedToolSchema: () => ({}) }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => ({ setBlockNav: vi.fn() }) }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));
vi.mock('@/hooks/useToast.jsx', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));

const { default: RunIndexPanel } = await import('../RunIndexPanel');

// Any palette path resolves to a colour, so adding a style to the panel never breaks
// this suite — it is asserting wiring, not appearance.
const anyColor = new Proxy(
  {},
  {
    get: (_target, key) => (key === Symbol.toPrimitive || key === 'toString' ? () => '#123456' : anyColor),
  },
);
const theme = createTheme();
theme.palette = new Proxy(theme.palette, {
  get: (target, key) => (key in target ? target[key] : anyColor),
});

const propsOf = testid => JSON.parse(screen.getByTestId(testid).dataset.props);

const renderPanel = (over, tools = []) =>
  render(
    <ThemeProvider theme={theme}>
      <RunIndexPanel
        toolkitId={1}
        indexName="docs"
        toolkitName="T1"
        selectedIndexTools={tools}
        refetchIndexesList={vi.fn()}
        tab={null}
        initialConversation={null}
        isCreating={false}
        index={{
          id: 'row-1',
          metadata: { collection: 'docs', state: 'in_progress', task_id: 't1', history: [] },
          ...over,
        }}
      />
    </ThemeProvider>,
  );

afterEach(() => {
  cleanup();
  chatIsRunning.current = false;
  chatIsWaitingForTaskStart.current = false;
  polling.current = { startedTimeStamp: 0, fulfilledTimeStamp: 0 };
  deleteInFlight.current = false;
});

describe('RunIndexPanel — the liveness flags reach the right consumers', () => {
  it('names Stop while the run is only display-stale', () => {
    renderPanel({ stale: true, reclaimable: false });

    expect(propsOf('banner').banner.message).toMatch(/use Stop to end it/i);
  });

  it('names Reindex once the run is reclaimable', () => {
    renderPanel({ stale: true, reclaimable: true });

    expect(propsOf('banner').banner.message).toMatch(/click Reindex to restart it/i);
  });

  it('keeps Delete shut on a run that is merely display-stale', () => {
    // The destructive one: Delete drops every embedding row for the collection.
    renderPanel({ stale: true, reclaimable: false });

    expect(propsOf('delete-action').disabled).toBe(true);
  });

  it('opens Delete once the run can be reclaimed', () => {
    renderPanel({ stale: true, reclaimable: true });

    expect(propsOf('delete-action').disabled).toBe(false);
  });

  it('reports the run live while it is only display-stale', () => {
    renderPanel({ stale: true, reclaimable: false });

    expect(propsOf('footer').isRunActive).toBe(true);
  });

  it('stops reporting the run live once it is reclaimable', () => {
    renderPanel({ stale: true, reclaimable: true });

    expect(propsOf('footer').isRunActive).toBe(false);
  });

  it('keeps Delete shut while a delete of its own is already in flight', () => {
    // isDeleting is otherwise always false here, which would make neutralising it at
    // the call site an equivalent mutant rather than a caught one.
    deleteInFlight.current = true;
    try {
      renderPanel({ stale: true, reclaimable: true });

      expect(propsOf('delete-action').disabled).toBe(true);
    } finally {
      deleteInFlight.current = false;
    }
  });

  it('treats the row as running the moment a new run is traced', () => {
    // Drives localMetaOverride. Handing the helper anything else in its place leaves
    // the card on the terminal state while a run is under way.
    renderPanel({
      stale: false,
      reclaimable: false,
      metadata: { collection: 'docs', state: 'completed', history: [] },
    });
    expect(propsOf('footer').isRunActive).toBe(false);

    act(() => traceNewIndex.current('row-1', { state: 'in_progress', task_id: 'new' }));

    expect(propsOf('footer').isRunActive).toBe(true);
  });

  it('stops offering Delete the moment a reindex of an abandoned run is traced', () => {
    // The override's whole job: the row still carries the dead run's flags, and only
    // localMetaOverride tells the helper a new run now owns it. Without it the user who
    // just clicked Reindex is still offered Delete on the run they started.
    // A terminal row on purpose: the override is dropped again as soon as its state
    // matches the server's, so an already-in_progress row cannot show this.
    renderPanel({
      stale: true,
      reclaimable: true,
      metadata: { collection: 'docs', state: 'failed', history: [] },
    });
    expect(propsOf('delete-action').disabled).toBe(false);

    act(() => traceNewIndex.current('row-1', { state: 'in_progress', task_id: 'new' }));

    expect(propsOf('delete-action').disabled).toBe(true);
  });

  it('refuses Reindex when the toolkit cannot run index_data', () => {
    // buildBlockedReason is null for an empty toolset, so without a restricted one here
    // neutralising it at the call site changes nothing and ships green.
    renderPanel(
      { stale: false, reclaimable: false, metadata: { collection: 'docs', state: 'completed', history: [] } },
      ['search_index'],
    );

    expect(propsOf('footer').reindexDisabled).toBe(true);
    expect(propsOf('footer').reindexTooltip).toBe(INDEX_DATA_DISABLED_REASON);
  });

  it('refuses Reindex while the chat already has a run in flight', () => {
    chatIsRunning.current = true;
    renderPanel({
      stale: false,
      reclaimable: false,
      metadata: { collection: 'docs', state: 'completed', history: [] },
    });

    expect(propsOf('footer').reindexDisabled).toBe(true);
  });

  it('stops waiting for a task once a later server read supersedes the override', () => {
    // The dispatch window holds Delete shut. A row read AFTER the override was observed
    // is the only thing that ends it, so dropping serverSupersedes would strand the row
    // as "starting up" for the rest of the session.
    polling.current = { startedTimeStamp: Date.now() + 60_000, fulfilledTimeStamp: Date.now() + 60_000 };
    chatIsWaitingForTaskStart.current = true;
    renderPanel({
      stale: true,
      reclaimable: true,
      metadata: { collection: 'docs', state: 'failed', history: [] },
    });
    expect(propsOf('footer').isRunActive).toBe(true);

    act(() => traceNewIndex.current('row-1', { state: 'in_progress', task_id: 'new' }));

    expect(propsOf('footer').isRunActive).toBe(false);
  });

  it('offers Reindex only on a run nothing else owns', () => {
    renderPanel({ stale: true, reclaimable: false });
    expect(propsOf('footer').reindexDisabled).toBe(true);

    cleanup();
    renderPanel({ stale: true, reclaimable: true });
    expect(propsOf('footer').reindexDisabled).toBe(false);
  });
});
