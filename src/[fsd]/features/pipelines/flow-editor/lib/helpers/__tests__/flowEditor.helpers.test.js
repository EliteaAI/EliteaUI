// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { findFreeNodePosition, findFreeOffsetPosition } from '../flowEditor.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

const viewRect = { x: 0, y: 0, width: 1600, height: 1200 };
const size = { width: 400, height: 300 };

const makeNode = (id, x, y, width = 400, height = 300, type = PipelineNodeTypes.LLM) => ({
  id,
  type,
  position: { x, y },
  measured: { width, height },
});

const intersects = (position, node, gap = 40) =>
  position.x < node.position.x + node.measured.width + gap &&
  position.x + size.width + gap > node.position.x &&
  position.y < node.position.y + node.measured.height + gap &&
  position.y + size.height + gap > node.position.y;

describe('findFreeNodePosition', () => {
  it('places the node in the centre of an empty view', () => {
    expect(findFreeNodePosition({ viewRect, nodes: [], size })).toEqual({ x: 600, y: 450, isInView: true });
  });

  it('moves away from a node that takes the centre, staying in view', () => {
    const nodes = [makeNode('a', 600, 450)];
    const position = findFreeNodePosition({ viewRect, nodes, size });

    expect(position.isInView).toBe(true);
    expect(intersects(position, nodes[0])).toBe(false);
    expect(position.x).toBeGreaterThanOrEqual(viewRect.x);
    expect(position.y).toBeGreaterThanOrEqual(viewRect.y);
    expect(position.x + size.width).toBeLessThanOrEqual(viewRect.x + viewRect.width);
    expect(position.y + size.height).toBeLessThanOrEqual(viewRect.y + viewRect.height);
  });

  it('ignores ghost and hidden nodes', () => {
    const nodes = [
      { ...makeNode('ghost', 600, 450), type: PipelineNodeTypes.Ghost },
      { ...makeNode('hidden', 600, 450), hidden: true },
    ];

    expect(findFreeNodePosition({ viewRect, nodes, size })).toEqual({ x: 600, y: 450, isInView: true });
  });

  it('falls back to below the lowest node when the view is full', () => {
    const nodes = [makeNode('big', -100, -100, 2000, 1500)];

    expect(findFreeNodePosition({ viewRect, nodes, size })).toEqual({ x: 600, y: 1440, isInView: false });
  });

  it('uses the default card size for nodes that are not measured yet', () => {
    const nodes = [{ id: 'a', type: PipelineNodeTypes.LLM, position: { x: 600, y: 450 } }];
    const position = findFreeNodePosition({ viewRect, nodes, size });

    expect(
      position.x >= 600 + FlowEditorConstants.NODE_CARD_WIDTH + 40 ||
        position.x + size.width + 40 <= 600 ||
        position.y >= 450 + FlowEditorConstants.NodeHeightMap[PipelineNodeTypes.LLM] + 40 ||
        position.y + size.height + 40 <= 450,
    ).toBe(true);
  });
});

describe('findFreeOffsetPosition', () => {
  const origin = { x: 100, y: 100 };

  it('places the node 40 down and right of the origin when that spot is free', () => {
    expect(findFreeOffsetPosition({ origin, nodes: [], size })).toEqual({ x: 140, y: 140 });
  });

  it('steps further down and right past a card in the way', () => {
    const blocker = makeNode('other', 200, 200);
    const position = findFreeOffsetPosition({ origin, nodes: [blocker], size });

    expect(position.x - origin.x).toBe(position.y - origin.y);
    expect(position.x).toBeGreaterThan(140);
    expect(intersects(position, blocker, 0)).toBe(false);
  });

  it('ignores ghost and hidden nodes', () => {
    const nodes = [
      makeNode('ghost', 140, 140, 400, 300, PipelineNodeTypes.Ghost),
      { ...makeNode('hidden', 140, 140), hidden: true },
    ];

    expect(findFreeOffsetPosition({ origin, nodes, size })).toEqual({ x: 140, y: 140 });
  });
});
