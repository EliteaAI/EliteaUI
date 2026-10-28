import { describe, expect, it } from 'vitest';

import { hasLayoutChanged } from '../pipelineLayout.helpers';

const node = (id, x, y) => ({ id, position: { x, y } });

describe('hasLayoutChanged', () => {
  it('is false while every node keeps its opening position', () => {
    expect(
      hasLayoutChanged([node('a', 0, 0), node('END', 0, 300)], [node('a', 0, 0), node('END', 0, 300)]),
    ).toBe(false);
  });

  it('is true once a node moves', () => {
    expect(hasLayoutChanged([node('a', 40, 0)], [node('a', 0, 0)])).toBe(true);
  });

  it('ignores sub-pixel noise', () => {
    expect(hasLayoutChanged([node('a', 10.2, 19.8)], [node('a', 10, 20)])).toBe(false);
  });

  it('leaves added and removed nodes to the YAML check', () => {
    expect(hasLayoutChanged([node('a', 0, 0), node('b', 500, 500)], [node('a', 0, 0), node('c', 0, 0)])).toBe(
      false,
    );
  });

  it('is false before the canvas has synced its nodes', () => {
    expect(hasLayoutChanged([], [node('a', 0, 0)])).toBe(false);
  });
});
