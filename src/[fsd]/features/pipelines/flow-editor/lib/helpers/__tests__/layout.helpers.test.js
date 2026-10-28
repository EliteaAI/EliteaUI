// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '../../constants';
import { doLayout, mergeCanvasPositions } from '../layout.helpers';
import { parseYaml } from '../parsePipeline.helpers';

const { ORIENTATION } = FlowEditorConstants;

const PIPELINE = {
  entry_point: 'start',
  nodes: [
    { id: 'start', type: 'llm', transition: 'route' },
    {
      id: 'route',
      type: 'router',
      condition: 'x',
      routes: ['first', 'second', 'third'],
      default_output: 'fallback',
    },
    { id: 'first', type: 'printer', transition: 'END' },
    { id: 'second', type: 'printer', transition: 'END' },
    { id: 'third', type: 'printer', transition: 'END' },
    { id: 'fallback', type: 'printer', transition: 'END' },
  ],
};

const arrange = orientation => {
  const { nodes, edges } = parseYaml(PIPELINE, orientation);
  return doLayout({ nodes, edges, flowNodes: [], orientation }).nodes;
};

const getRect = node => ({ ...node.position, ...node.measured });

const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const byId = (nodes, id) => nodes.find(node => node.id === id);

describe('doLayout', () => {
  it.each([ORIENTATION.vertical, ORIENTATION.horizontal])(
    'lays out every node with no overlap (%s)',
    orientation => {
      const nodes = arrange(orientation);
      const rects = nodes.map(getRect);

      expect(nodes.map(node => node.id).sort()).toEqual(
        ['END', 'fallback', 'first', 'route', 'second', 'start', 'third'].sort(),
      );
      rects.forEach((rect, index) => {
        rects.slice(index + 1).forEach(other => expect(overlaps(rect, other)).toBe(false));
      });
    },
  );

  it('flows down top to bottom and right left to right', () => {
    const vertical = arrange(ORIENTATION.vertical);
    expect(byId(vertical, 'start').position.y).toBeLessThan(byId(vertical, 'route').position.y);
    expect(byId(vertical, 'route').position.y).toBeLessThan(byId(vertical, 'END').position.y);

    const horizontal = arrange(ORIENTATION.horizontal);
    expect(byId(horizontal, 'start').position.x).toBeLessThan(byId(horizontal, 'route').position.x);
    expect(byId(horizontal, 'route').position.x).toBeLessThan(byId(horizontal, 'END').position.x);
  });

  it('keeps branches in route order', () => {
    const branchIds = ['first', 'second', 'third', 'fallback'];

    const vertical = arrange(ORIENTATION.vertical);
    const xs = branchIds.map(id => byId(vertical, id).position.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));

    const horizontal = arrange(ORIENTATION.horizontal);
    const ys = branchIds.map(id => byId(horizontal, id).position.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
  });

  it('sizes cards for the 320px card and End for its pill', () => {
    const nodes = arrange(ORIENTATION.vertical);

    expect(byId(nodes, 'start').measured.width).toBe(FlowEditorConstants.NODE_CARD_WIDTH);
    expect(byId(nodes, 'END').measured.width).toBe(FlowEditorConstants.END_NODE_WIDTH);
  });

  it('uses measured sizes from the canvas', () => {
    const { nodes, edges } = parseYaml(PIPELINE);
    const flowNodes = [{ id: 'start', measured: { width: 320, height: 210 } }];

    expect(byId(doLayout({ nodes, edges, flowNodes }).nodes, 'start').measured.height).toBe(210);
  });
});

describe('mergeCanvasPositions', () => {
  const parsed = parseYaml(PIPELINE);
  const canvasNodes = arrange(ORIENTATION.vertical).map(node => ({
    ...node,
    position: { x: node.position.x + 37, y: node.position.y - 11 },
  }));

  it('keeps every canvas position and size', () => {
    const { nodes } = mergeCanvasPositions({ ...parsed, flowNodes: canvasNodes });

    nodes.forEach(node => {
      const canvasNode = byId(canvasNodes, node.id);
      expect(node.position).toEqual(canvasNode.position);
      expect(node.measured).toEqual(canvasNode.measured);
    });
  });

  it('places a node the canvas has not placed next to its placed neighbour', () => {
    const withoutFallback = canvasNodes.filter(node => node.id !== 'fallback');
    const { nodes } = mergeCanvasPositions({ ...parsed, flowNodes: withoutFallback });
    const arrangedFallback = byId(arrange(ORIENTATION.vertical), 'fallback').position;

    expect(byId(nodes, 'start').position).toEqual(byId(canvasNodes, 'start').position);
    expect(byId(nodes, 'fallback').position).toEqual({
      x: arrangedFallback.x + 37,
      y: arrangedFallback.y - 11,
    });
  });

  it.each([ORIENTATION.vertical, ORIENTATION.horizontal])(
    'moves a new node off the cards the user moved (%s)',
    orientation => {
      const orientedParsed = parseYaml(PIPELINE, orientation);
      const arranged = arrange(orientation);
      const fallback = byId(arranged, 'fallback');
      // "third" was dragged to where the new "fallback" would land
      const moved = arranged
        .filter(node => node.id !== 'fallback')
        .map(node => (node.id === 'third' ? { ...node, position: { ...fallback.position } } : node));
      const { nodes } = mergeCanvasPositions({ ...orientedParsed, flowNodes: moved, orientation });

      const newRect = getRect(byId(nodes, 'fallback'));
      nodes
        .filter(node => node.id !== 'fallback')
        .forEach(node => expect(overlaps(newRect, getRect(node))).toBe(false));
    },
  );

  it('arranges the whole pipeline when the canvas has no positions', () => {
    const { nodes } = mergeCanvasPositions({ ...parsed, flowNodes: [] });

    expect(nodes.map(node => node.position)).toEqual(
      arrange(ORIENTATION.vertical).map(node => node.position),
    );
  });

  it('ignores a canvas node of another type with the same id', () => {
    const stalePosition = { x: 5000, y: 5000 };
    const renamedType = canvasNodes.map(node =>
      node.id === 'start' ? { ...node, type: 'code', position: stalePosition } : node,
    );
    const { nodes } = mergeCanvasPositions({ ...parsed, flowNodes: renamedType });

    expect(byId(nodes, 'start').position).not.toEqual(stalePosition);
  });
});
