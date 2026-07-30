import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CreateIndexForm from './CreateIndexForm';

const mocks = vi.hoisted(() => ({
  getIndexesList: vi.fn(),
  toolkitChatProps: null,
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { type: 'github' } }),
}));

vi.mock('@mui/material', () => ({
  Box: props => <div>{props.children}</div>,
  Button: props => <button onClick={props.onClick}>{props.children}</button>,
  CircularProgress: () => null,
  Typography: props => <span>{props.children}</span>,
}));

vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
  useMcpAuthModal: () => ({
    handleMcpAuthRequired: vi.fn(),
    getModalProps: () => ({}),
  }),
}));

vi.mock('@/[fsd]/features/mcp/ui', () => ({
  McpAuthModal: () => null,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  useLazyGetIndexesListQuery: () => [mocks.getIndexesList],
}));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers', () => ({
  adjustIndexDataSchema: schema => schema,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexNameValidation: () => ({
    clearIndexNameError: vi.fn(),
    indexNameError: null,
    updateIndexNameError: vi.fn(),
    isIndexNameValid: () => true,
  }),
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitChatHelpers: {
    validateToolkitForm: () => true,
  },
}));

vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useToolkitChat: props => {
    mocks.toolkitChatProps = props;
    return { handleIndexData: vi.fn(), isRunning: false };
  },
}));

vi.mock('@/[fsd]/features/toolkits/ui', () => ({
  ToolkitForm: {
    ToolFormContainer: () => null,
  },
}));

vi.mock('@/[fsd]/shared/ui/accordion', () => ({
  BasicAccordion: () => null,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: {
      elitea: 'elitea',
      secondary: 'secondary',
    },
    BaseBtn: props => <button onClick={props.onClick}>{props.children}</button>,
  },
}));

vi.mock('@/hooks/toolkit/useGetSelectedToolSchema', () => ({
  useGetSelectedToolSchema: () => ({
    properties: {
      index_name: { type: 'string' },
    },
  }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 7,
}));

vi.mock('@/pages/Applications/Components/Tools/consts', () => ({
  ToolTypes: {
    custom: { value: 'custom' },
  },
}));

describe('CreateIndexForm active execution routing', () => {
  let container;
  let root;
  let routedLocation;

  const LocationProbe = () => {
    routedLocation = useLocation();
    return <div data-testid="routed-index">{routedLocation.pathname}</div>;
  };

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.getIndexesList.mockReset();
    mocks.toolkitChatProps = null;
    routedLocation = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/toolkits/all/11/index/new']}>
          <Routes>
            <Route
              path="/toolkits/:tab/:toolkitId/index/new"
              element={
                <CreateIndexForm
                  toolkitId={11}
                  tab="all"
                />
              }
            />
            <Route
              path="/toolkits/:tab/:toolkitId/index/:indexName"
              element={<LocationProbe />}
            />
          </Routes>
        </MemoryRouter>,
      );
      await Promise.resolve();
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('refreshes the scoped list and navigates to validated authoritative active metadata', async () => {
    const queryResult = { data: [] };
    mocks.getIndexesList.mockResolvedValue(queryResult);

    await expect(mocks.toolkitChatProps.refetchIndexesList()).resolves.toBe(queryResult);
    expect(mocks.getIndexesList).toHaveBeenCalledWith({ projectId: 7, toolkitId: 11 }, false);

    let accepted;
    await act(async () => {
      accepted = mocks.toolkitChatProps.onActiveIndexReattach({
        metadata: {
          collection: 'Docs & Images',
          state: 'in_progress',
          task_id: '0123456789abcdef0123456789abcdef',
          conversation_id: 88,
        },
      });
      await Promise.resolve();
    });

    expect(accepted).toBe(true);
    expect(routedLocation).toMatchObject({
      pathname: '/toolkits/all/11/index/Docs%20%26%20Images',
      state: {
        reattaching: true,
        collection: 'Docs & Images',
        conversation_id: 88,
        task_id: '0123456789abcdef0123456789abcdef',
      },
    });
    expect(container.querySelector('[data-testid="routed-index"]')).not.toBeNull();
  });

  it('refuses to navigate when server metadata is not an active execution', () => {
    const accepted = mocks.toolkitChatProps.onActiveIndexReattach({
      metadata: {
        collection: 'docs',
        state: 'completed',
        task_id: '0123456789abcdef0123456789abcdef',
        conversation_id: 88,
        conversation_uuid: 'conversation-original',
      },
    });

    expect(accepted).toBe(false);
    expect(routedLocation).toBeNull();
    expect(container.querySelector('[data-testid="routed-index"]')).toBeNull();
  });
});
