// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { rebuildPipelineSettingsFromYaml } from '../pipelineCanvasSync.helpers';

const yamlOf = ids =>
  [
    'entry_point: ' + ids[0],
    'nodes:',
    ...ids.flatMap((id, index) => [
      `  - id: ${id}`,
      '    type: llm',
      `    transition: ${ids[index + 1] ?? 'END'}`,
    ]),
  ].join('\n');

const positionOf = (settings, id) => settings.nodes.find(node => node.id === id)?.position;

describe('rebuildPipelineSettingsFromYaml', () => {
  const stored = rebuildPipelineSettingsFromYaml(yamlOf(['first', 'second']), {
    orientation: 'vertical',
    layout_version: 2,
  });
  // A user moved the first node on the canvas
  const movedFirst = {
    ...stored,
    nodes: stored.nodes.map(node => (node.id === 'first' ? { ...node, position: { x: 900, y: 900 } } : node)),
  };

  it('keeps the position of every node that is still in the YAML', () => {
    const next = rebuildPipelineSettingsFromYaml(yamlOf(['first', 'second', 'third']), movedFirst);
    expect(positionOf(next, 'first')).toEqual({ x: 900, y: 900 });
    expect(positionOf(next, 'second')).toEqual(positionOf(movedFirst, 'second'));
  });

  it('places a new node and keeps the settings that are not nodes or edges', () => {
    const next = rebuildPipelineSettingsFromYaml(yamlOf(['first', 'second', 'third']), movedFirst);
    expect(positionOf(next, 'third')).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    );
    expect(next.layout_version).toBe(2);
    expect(next.orientation).toBe('vertical');
  });

  it('drops a removed node and its edges', () => {
    const next = rebuildPipelineSettingsFromYaml(yamlOf(['first']), movedFirst);
    expect(next.nodes.some(node => node.id === 'second')).toBe(false);
    expect(next.edges.some(edge => edge.source === 'second' || edge.target === 'second')).toBe(false);
  });

  it('places a renamed node as a new one', () => {
    const next = rebuildPipelineSettingsFromYaml(yamlOf(['first', 'renamed']), movedFirst);
    expect(next.nodes.some(node => node.id === 'second')).toBe(false);
    expect(positionOf(next, 'renamed')).toBeDefined();
    expect(positionOf(next, 'first')).toEqual({ x: 900, y: 900 });
  });

  it('keeps the stored canvas when the YAML does not parse', () => {
    expect(rebuildPipelineSettingsFromYaml('nodes: [', movedFirst)).toBeNull();
  });
});
