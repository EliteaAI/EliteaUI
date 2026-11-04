// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// (#7269) what a governed run created through the Elitea MCP shows its request card in the chat, also after a page
// reload, when the action's tool output comes only from the fetched trace detail

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
const trace = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useSelector: selector => selector({ user: { id: 9 }, settings: {}, chat: {} }),
  useDispatch: () => () => {},
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 8,
  useGetComponentWidth: () => ({ componentWidth: 600 }),
}));
vi.mock('@/api', () => ({ useLazyMessageTraceQuery: () => [trace.fetch, { isFetching: false }] }));
vi.mock('@/api/configurations', () => ({ useListModelsQuery: () => ({ data: undefined }) }));
vi.mock('@/[fsd]/features/chat/lib/context/SelectedChatModelContext', () => ({
  useSelectedChatModelContext: () => ({}),
}));
vi.mock('@/[fsd]/features/project-governance', async () => ({
  ProjectGovernanceHelpers:
    await import('@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers'),
  GovernanceReadinessCard: props => (
    <span data-testid="chat-governance-card">{`${props.entityKind}:${props.entityId}`}</span>
  ),
}));
vi.mock('@/components/Chat/ToolModal', () => ({ default: () => null }));
vi.mock('../ToolModal', () => ({ default: () => null }));

const { default: ActionView } = await import('../ActionView');

const OUTPUT = JSON.stringify({
  id: 41,
  governance_requests: { entity_kind: 'version', entity_id: 41, filed: [] },
});
const RELOADED = {
  id: 'a1',
  type: 'tool',
  name: 'create_application',
  status: 'complete',
  toolMeta: { toolkit_name: 'elitea', toolkit_type: 'elitea' },
  traceStepId: 'step-1',
  traceMessageGroupId: 'group-1',
};

const wrap = action =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <ActionView action={action} />
    </ThemeProvider>,
  );

describe('ActionView governed creation card (EL-7269)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the card from a live action that carries the tool output', () => {
    wrap({ ...RELOADED, traceStepId: undefined, toolOutputs: OUTPUT });
    expect(screen.getByTestId('chat-governance-card')).toHaveTextContent('version:41');
  });

  it('shows the card of a reloaded action once its trace detail is fetched', async () => {
    trace.fetch.mockReturnValue(Promise.resolve({ data: { tool_output: OUTPUT } }));
    wrap(RELOADED);
    expect(screen.queryByTestId('chat-governance-card')).toBeNull();
    fireEvent.click(screen.getByTestId('chat-answer-tool-chip'));
    expect(trace.fetch).toHaveBeenCalled();
    expect(await screen.findByTestId('chat-governance-card')).toHaveTextContent('version:41');
  });

  // --- EL-7228 build from chat: one card per created or changed entity, a refused automatic request in words ---

  it('EL-7228 mounts the card of a toolkit a run changed (PUT), one per action', () => {
    const changed = JSON.stringify({
      id: 3,
      governance_requests: {
        entity_kind: 'toolkit',
        entity_id: 3,
        filed: [{ key: 'grant:3:u', kind: 'grant', id: 'g' }],
        next: 'Requested for approval: your use of the credential.',
      },
    });
    wrap({ ...RELOADED, name: 'put_elitea_core_tool', traceStepId: undefined, toolOutputs: changed });
    expect(screen.getAllByTestId('chat-governance-card')).toHaveLength(1);
    expect(screen.getByTestId('chat-governance-card')).toHaveTextContent('toolkit:3');
    expect(screen.queryByTestId('chat-governance-auto-request-refused')).toBeNull();
  });

  it('EL-7228 reads a refused automatic request as a sentence beside the card (no code, no JSON)', () => {
    const refused = JSON.stringify({
      governance_requests: { entity_kind: 'version', entity_id: 41, filed: [], refused: 'STALE_READINESS' },
    });
    wrap({ ...RELOADED, traceStepId: undefined, toolOutputs: refused });
    const line = screen.getByTestId('chat-governance-auto-request-refused');
    expect(line).toHaveTextContent('could not be filed automatically (what it needs changed meanwhile)');
    expect(line.textContent).not.toContain('STALE_READINESS');
    expect(screen.getByTestId('chat-governance-card')).toHaveTextContent('version:41');
  });

  it('EL-7228 shows one card per changed entity: the toolkit and each version using it, once each', () => {
    const linked = JSON.stringify({
      governance_requests: {
        entity_kind: 'toolkit',
        entity_id: 3,
        filed: [],
        versions: [
          { entity_kind: 'version', entity_id: 41, filed: [{ key: 'binding:41', kind: 'binding', id: 'b' }] },
          { entity_kind: 'version', entity_id: 42, filed: [], refused: 'DEPENDENCY_UNAVAILABLE' },
          { entity_kind: 'version', entity_id: 41, filed: [] },
        ],
      },
    });
    wrap({ ...RELOADED, name: 'patch_elitea_core_tool', traceStepId: undefined, toolOutputs: linked });
    expect(screen.getAllByTestId('chat-governance-card').map(card => card.textContent)).toEqual([
      'toolkit:3',
      'version:41',
      'version:42',
    ]);
    const refused = screen.getAllByTestId('chat-governance-auto-request-refused');
    expect(refused).toHaveLength(1);
    expect(refused[0]).toHaveTextContent('the service could not be reached');
  });

  it('EL-7228 says how many agents beyond the cap use a changed toolkit, never dropping them silently', () => {
    const capped = JSON.stringify({
      governance_requests: {
        entity_kind: 'toolkit',
        entity_id: 3,
        filed: [],
        versions: [{ entity_kind: 'version', entity_id: 41, filed: [] }],
        versions_more: 4,
      },
    });
    wrap({ ...RELOADED, name: 'patch_elitea_core_tool', traceStepId: undefined, toolOutputs: capped });
    expect(screen.getAllByTestId('chat-governance-card')).toHaveLength(2);
    expect(screen.getByTestId('chat-governance-versions-more')).toHaveTextContent(
      '4 more agents use this toolkit: open them to request what they need.',
    );
  });
});
