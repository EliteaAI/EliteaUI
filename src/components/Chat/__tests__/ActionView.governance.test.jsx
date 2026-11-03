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
});
