// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useIncompleteEdge } from '../useIncompleteEdge.hooks';

const flow = {
  nodes: [],
  edges: [],
};

const reactFlowMock = {
  setNodes: vi.fn(updater => {
    flow.nodes = updater(flow.nodes);
  }),
  setEdges: vi.fn(updater => {
    flow.edges = updater(flow.edges);
  }),
  screenToFlowPosition: vi.fn(position => position),
  getInternalNode: vi.fn(),
  getNodes: () => flow.nodes,
  getEdges: () => flow.edges,
};

vi.mock('@xyflow/react', async importOriginal => ({
  ...(await importOriginal()),
  useReactFlow: () => reactFlowMock,
}));

const sourceNode = { id: 'llm_1', type: 'llm', position: { x: 100, y: 50 }, data: {} };

const renderIncompleteEdge = (props = {}) =>
  renderHook(() =>
    useIncompleteEdge({
      onConnect: vi.fn(),
      onNodeCreateAtPosition: vi.fn(),
      yamlJsonObjectRef: { current: { nodes: [{ id: 'llm_1', type: 'llm' }] } },
      disabled: false,
      ...props,
    }),
  );

describe('useIncompleteEdge.openFromHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flow.nodes = [sourceNode];
    flow.edges = [];
    reactFlowMock.getInternalNode.mockReturnValue({
      ...sourceNode,
      internals: { positionAbsolute: { x: 100, y: 50 } },
      measured: { width: 471, height: 300 },
    });
  });
  afterEach(() => cleanup());

  it('adds a ghost node below the source with a dangling edge and opens the dropdown at the "+"', () => {
    const anchorEl = document.createElement('div');
    const { result } = renderIncompleteEdge();

    act(() => result.current.openFromHandle({ nodeId: 'llm_1', handleId: 'out', anchorEl }));

    const ghost = flow.nodes.find(node => node.type === 'ghost');
    expect(ghost.position).toEqual({ x: 100, y: 50 + 300 + 120 });
    expect(flow.edges).toHaveLength(1);
    expect(flow.edges[0]).toMatchObject({ source: 'llm_1', sourceHandle: 'out', target: ghost.id });
    expect(result.current.showConnectionDropdown).toBe(true);
    expect(result.current.dropdownAnchorEl).toBe(anchorEl);
    expect(result.current.dropdownPosition).toBeNull();
  });

  it('removes the ghost node and edge when the dropdown closes', () => {
    const { result } = renderIncompleteEdge();

    act(() => result.current.openFromHandle({ nodeId: 'llm_1', handleId: null, anchorEl: null }));
    act(() => result.current.handleDropdownClose());

    expect(flow.nodes).toEqual([sourceNode]);
    expect(flow.edges).toEqual([]);
    expect(result.current.showConnectionDropdown).toBe(false);
    expect(result.current.dropdownAnchorEl).toBeNull();
  });

  it('does nothing in read-only mode', () => {
    const { result } = renderIncompleteEdge({ disabled: true });

    act(() => result.current.openFromHandle({ nodeId: 'llm_1', handleId: null, anchorEl: null }));

    expect(flow.nodes).toEqual([sourceNode]);
    expect(result.current.showConnectionDropdown).toBe(false);
  });

  it('ignores a second open while the dropdown is already open', () => {
    const { result } = renderIncompleteEdge();

    act(() => result.current.openFromHandle({ nodeId: 'llm_1', handleId: null, anchorEl: null }));
    act(() => result.current.openFromHandle({ nodeId: 'llm_1', handleId: null, anchorEl: null }));

    expect(flow.nodes.filter(node => node.type === 'ghost')).toHaveLength(1);
  });
});
