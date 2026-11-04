// @vitest-environment jsdom
import { useEffect, useSyncExternalStore } from 'react';

import { Formik, useFormikContext } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { usePipelineAttachments } from '../usePipelineAttachments.hooks';

const mocks = vi.hoisted(() => ({ fetchToolkitDetails: vi.fn(), toastError: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks', () => ({
  useGetToolkitNameFromSchema: () => ({ getToolkitNameFromSchema: tool => tool.name }),
}));
vi.mock('@/api/toolkits', () => ({ useLazyToolkitsDetailsQuery: () => [mocks.fetchToolkitDetails] }));
vi.mock('@/api/applications', () => ({ useLazyApplicationDetailsQuery: () => [vi.fn()] }));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => 'error' }));

const jiraRow = { id: 1, type: 'jira', name: 'jira', settings: { selected_tools: ['search'] } };

const renderAttachments = () =>
  renderHook(() => ({ attachments: usePipelineAttachments(), form: useFormikContext() }), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={{ version_details: { tools: [] } }}
        onSubmit={vi.fn()}
      >
        {children}
      </Formik>
    ),
  });

describe('usePipelineAttachments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prepares an attachment without adding it, so the caller adds it with its YAML write', async () => {
    const { result } = renderAttachments();

    let prepared;
    await act(async () => {
      prepared = await result.current.attachments.prepareToolkitAttachment(jiraRow, { toolkitName: 'jira' });
    });
    expect(prepared).toMatchObject({
      id: 1,
      toolkit_name: 'jira',
      settings: { available_tools: ['search'] },
    });
    expect(result.current.form.values.version_details.tools).toEqual([]);

    act(() => {
      result.current.attachments.addTool(prepared);
      result.current.attachments.addTool(prepared);
    });
    expect(result.current.form.values.version_details.tools).toHaveLength(1);
  });

  it('fetches the toolkit details when the list row has no settings', async () => {
    mocks.fetchToolkitDetails.mockReturnValue({ unwrap: () => Promise.resolve(jiraRow) });
    const { result } = renderAttachments();

    let attached;
    await act(async () => {
      attached = await result.current.attachments.attachToolkit(
        { id: 1, name: 'jira' },
        { toolkitName: 'jira' },
      );
    });
    expect(mocks.fetchToolkitDetails).toHaveBeenCalledWith({ projectId: 406, toolkitId: 1 });
    expect(attached.settings.selected_tools).toEqual(['search']);
    expect(result.current.form.values.version_details.tools).toHaveLength(1);
  });

  it('adds the attachment with its node in one render, so reconcile never writes back stale tools', async () => {
    // A Redux-like store for the node reference: its updates render synchronously, ahead of Formik's
    let boundName = 'old-agent';
    const listeners = new Set();
    const store = {
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => boundName,
      bind: name => {
        boundName = name;
        listeners.forEach(listener => listener());
      },
    };
    const oldAgent = { type: 'application', name: 'old-agent', settings: { application_id: 1 } };
    const newAgent = { type: 'application', name: 'new-agent', settings: { application_id: 2 } };

    const { result } = renderHook(
      () => {
        const attachments = usePipelineAttachments();
        const form = useFormikContext();
        const bound = useSyncExternalStore(store.subscribe, store.getSnapshot);
        const tools = form.values.version_details.tools;
        // Same shape as reconcile: drop what the node no longer references, write the rest back
        useEffect(() => {
          const nextTools = tools.filter(tool => tool.name === bound);
          if (nextTools.length !== tools.length) form.setFieldValue('version_details.tools', nextTools);
        }, [bound, form, tools]);
        return { attachments, form };
      },
      {
        wrapper: ({ children }) => (
          <Formik
            initialValues={{ version_details: { tools: [oldAgent] } }}
            onSubmit={vi.fn()}
          >
            {children}
          </Formik>
        ),
      },
    );

    await act(async () => {
      await Promise.resolve();
      result.current.attachments.addToolWithNode(newAgent, attached => store.bind(attached.name));
    });

    expect(result.current.form.values.version_details.tools).toEqual([newAgent]);
  });
});
