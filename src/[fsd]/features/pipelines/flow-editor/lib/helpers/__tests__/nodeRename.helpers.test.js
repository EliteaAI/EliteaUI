import { describe, expect, it } from 'vitest';

import { getNodeNameError, renameNodeInEdges } from '../nodeRename.helpers';

const nodes = [{ id: 'llm_1' }, { id: 'printer_1' }];

describe('getNodeNameError', () => {
  it('accepts an unchanged or a free name', () => {
    expect(getNodeNameError({ newName: 'llm_1', currentName: 'llm_1', nodes })).toBeNull();
    expect(getNodeNameError({ newName: 'summarize', currentName: 'llm_1', nodes })).toBeNull();
  });

  it('rejects empty names', () => {
    expect(getNodeNameError({ newName: ' ', currentName: 'llm_1', nodes })).toBe('Name is required');
  });

  it('rejects names of other nodes and toolkits, ignoring spaces', () => {
    expect(getNodeNameError({ newName: 'printer_ 1', currentName: 'llm_1', nodes })).toBe(
      'The name has been used by other nodes, please input a new name!',
    );
    expect(getNodeNameError({ newName: 'git hub', currentName: 'llm_1', nodes, toolNames: ['github'] })).toBe(
      'The name conflicts with an existing toolkit name "github", please input a new name!',
    );
  });
});

describe('renameNodeInEdges', () => {
  it('renames sources and targets', () => {
    expect(
      renameNodeInEdges(
        [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'c', target: 'a' },
        ],
        'a',
        'z',
      ),
    ).toEqual([
      { id: 'e1', source: 'z', target: 'b' },
      { id: 'e2', source: 'c', target: 'z' },
    ]);
  });
});
