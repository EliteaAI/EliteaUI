// @vitest-environment jsdom
import { createElement } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { act, cleanup, renderHook } from '@testing-library/react';

import { NODE_CHANGED_ERROR, useApplyNodeDraft } from '../useApplyNodeDraft.hooks';

const { mocks } = vi.hoisted(() => ({
  mocks: {
    context: {},
    formik: {},
    prepareToolkitAttachment: vi.fn(),
    prepareApplicationAttachment: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  },
}));

vi.mock('formik', () => ({ useFormikContext: () => mocks.formik }));
const { flushSyncSpy } = vi.hoisted(() => ({ flushSyncSpy: vi.fn(fn => fn()) }));
vi.mock('react-dom', async importOriginal => ({ ...(await importOriginal()), flushSync: flushSyncSpy }));
vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks', () => ({
  usePipelineAttachments: () => ({
    prepareToolkitAttachment: mocks.prepareToolkitAttachment,
    prepareApplicationAttachment: mocks.prepareApplicationAttachment,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));

const NODE = { id: 'summarize', type: 'llm', transition: 'END' };
const PIPELINE = { entry_point: 'summarize', state: {}, nodes: [NODE] };
const GITHUB = { id: 1, type: 'github', name: 'github_elitea' };
const JIRA_TOOL = { id: 2, type: 'jira', name: 'jira_platform', settings: {} };

const setup = ({ pipeline = PIPELINE } = {}) => {
  mocks.context = { yamlJsonObject: pipeline, setYamlJsonObject: vi.fn(), resyncFlowFromYaml: vi.fn() };
  mocks.formik = { values: { version_details: { tools: [GITHUB] } }, setFieldValue: vi.fn() };
  const wrapper = ({ children }) =>
    createElement(FlowEditorContext.Provider, { value: mocks.context }, children);
  return renderHook(() => useApplyNodeDraft({ snapshot: NODE }), { wrapper });
};

const DRAFT = {
  node: { ...NODE, transition: 'next', output: ['summary'] },
  newState: [{ name: 'summary', type: 'str', checked: true }],
  attachments: [],
};

describe('useApplyNodeDraft', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('writes the node, state and tools in one step and resyncs the canvas (AC-24, AC-28)', async () => {
    const { result } = setup();
    let ok;
    await act(async () => {
      ok = await result.current.apply(DRAFT, null);
    });

    expect(ok).toBe(true);
    const written = mocks.context.setYamlJsonObject.mock.calls[0][0];
    expect(written.nodes).toEqual([DRAFT.node]);
    expect(written.state).toEqual({ summary: { type: 'str' } });
    expect(mocks.context.resyncFlowFromYaml).toHaveBeenCalledWith(written);
    expect(mocks.formik.setFieldValue).toHaveBeenCalledWith('version_details.tools', [GITHUB]);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Node updated with AI. Review and save the pipeline.');
  });

  it('attaches the listed resources through the picker builders', async () => {
    mocks.prepareToolkitAttachment.mockResolvedValue(JIRA_TOOL);
    const { result } = setup();
    await act(async () => {
      await result.current.apply(
        { ...DRAFT, attachments: [{ entity_type: 'mcp', id: 2, name: 'jira_platform' }] },
        null,
      );
    });
    expect(mocks.prepareToolkitAttachment).toHaveBeenCalledWith(
      { id: 2, name: 'jira_platform' },
      { mcp: true, toolkitName: 'jira_platform' },
    );
    expect(mocks.formik.setFieldValue).toHaveBeenCalledWith('version_details.tools', [GITHUB, JIRA_TOOL]);
  });

  it('attaches agents and pipelines as applications', async () => {
    mocks.prepareApplicationAttachment.mockResolvedValue({
      type: 'application',
      settings: { application_id: 12 },
    });
    const { result } = setup();
    await act(async () => {
      await result.current.apply(
        { ...DRAFT, attachments: [{ entity_type: 'agent', id: 12, name: 'Daily Agent' }] },
        null,
      );
    });
    expect(mocks.prepareApplicationAttachment).toHaveBeenCalledWith({ id: 12, name: 'Daily Agent' });
  });

  it('uses the tools picked in the Flow view sandbox', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.apply(DRAFT, [GITHUB, JIRA_TOOL]);
    });
    expect(mocks.formik.setFieldValue).toHaveBeenCalledWith('version_details.tools', [GITHUB, JIRA_TOOL]);
  });

  it('applies nothing when the node changed since the modal opened (AC-29)', async () => {
    const { result } = setup({ pipeline: { ...PIPELINE, nodes: [{ ...NODE, transition: 'other' }] } });
    let ok;
    await act(async () => {
      ok = await result.current.apply(DRAFT, null);
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe(NODE_CHANGED_ERROR);
    expect(NODE_CHANGED_ERROR).toBe('This node changed while you were reviewing. Generate a new draft.');
    expect(mocks.context.setYamlJsonObject).not.toHaveBeenCalled();
    expect(mocks.formik.setFieldValue).not.toHaveBeenCalled();
  });

  it('applies once on a double click (review #5)', async () => {
    let release;
    mocks.prepareToolkitAttachment.mockReturnValue(new Promise(resolve => (release = resolve)));
    const { result } = setup();
    const draft = { ...DRAFT, attachments: [{ entity_type: 'toolkit', id: 2, name: 'jira_platform' }] };
    let first;
    let second;
    await act(async () => {
      first = result.current.apply(draft, null);
      second = result.current.apply(draft, null);
      release(JIRA_TOOL);
      await Promise.all([first, second]);
    });
    expect(await first).toBe(true);
    expect(await second).toBe(false);
    expect(mocks.context.setYamlJsonObject).toHaveBeenCalledTimes(1);
  });

  it('writes tools and the YAML in one render so reconcile sees both (review #2)', async () => {
    const order = [];
    const { result } = setup();
    mocks.formik.setFieldValue.mockImplementation(() => order.push('tools'));
    mocks.context.setYamlJsonObject.mockImplementation(() => order.push('yaml'));
    flushSyncSpy.mockImplementation(fn => {
      order.push('flush:start');
      fn();
      order.push('flush:end');
    });
    await act(async () => {
      await result.current.apply(DRAFT, null);
    });
    expect(order).toEqual(['flush:start', 'tools', 'yaml', 'flush:end']);
    flushSyncSpy.mockImplementation(fn => fn());
  });

  it('applies nothing when an attachment can not be built', async () => {
    mocks.prepareToolkitAttachment.mockResolvedValue(null);
    const { result } = setup();
    let ok;
    await act(async () => {
      ok = await result.current.apply(
        { ...DRAFT, attachments: [{ entity_type: 'toolkit', id: 2, name: 'jira_platform' }] },
        null,
      );
    });
    expect(ok).toBe(false);
    expect(mocks.context.setYamlJsonObject).not.toHaveBeenCalled();
  });
});
