import { describe, expect, it } from 'vitest';

import {
  agentToolOptions,
  compareTrajectoryNames,
  fromTrajectoryForm,
  isTrajectoryFormChanged,
  newTrajectoryToolRow,
  recordedToolNames,
  summarizeExpectedTrajectory,
  toTrajectoryForm,
} from '../expectedTrajectory.helpers';

const stored = {
  match: 'in_order',
  tools: [{ name: 'jira_search', args: { project: 'EL' }, args_match: 'exact' }, { name: 'ChildWriter' }],
  forbidden: ['delete_branch'],
  allow_repeat: ['get_status'],
  max_tool_calls: 6,
};

describe('agentToolOptions', () => {
  it('uses selected_tools and the cleaned sub-agent name', () => {
    const options = agentToolOptions({
      tools: [
        { type: 'jira', toolkit_name: 'Jira', settings: { selected_tools: ['search', 'create_issue', ''] } },
        { type: 'application', name: 'REPRO900 Child.Writer!' },
        { type: 'mcp', name: 'Remote MCP', settings: {} },
        null,
      ],
    });
    expect(options).toEqual(['create_issue', 'REPRO900Child_Writer', 'search']);
  });

  it('is empty without a version', () => {
    expect(agentToolOptions(undefined)).toEqual([]);
  });
});

describe('form round trip', () => {
  it('an absent reference is a disabled form that saves as null', () => {
    for (const value of [null, undefined, {}]) {
      const form = toTrajectoryForm(value);
      expect(form.enabled).toBe(false);
      expect(fromTrajectoryForm(form)).toEqual({ value: null, error: null });
    }
  });

  it('restores the stored value', () => {
    const form = toTrajectoryForm(stored);
    expect(form.enabled).toBe(true);
    expect(form.forbiddenText).toBe('delete_branch');
    expect(form.maxToolCalls).toBe('6');
    expect(fromTrajectoryForm(form)).toEqual({ value: stored, error: null });
  });

  it('accepts plain-string tools from an import', () => {
    const { value } = fromTrajectoryForm(toTrajectoryForm({ match: 'exact', tools: ['a', 'b'] }));
    expect(value).toEqual({
      match: 'exact',
      tools: [{ name: 'a' }, { name: 'b' }],
      forbidden: [],
      allow_repeat: [],
    });
  });

  it('an enabled empty form is a valid reference', () => {
    const form = { ...toTrajectoryForm(null), enabled: true, match: 'exact' };
    expect(fromTrajectoryForm(form).value).toEqual({
      match: 'exact',
      tools: [],
      forbidden: [],
      allow_repeat: [],
    });
  });

  it('splits and trims the name lists', () => {
    const form = {
      ...toTrajectoryForm(null),
      enabled: true,
      forbiddenText: ' a , ,b ',
      allowRepeatText: 'c',
    };
    const { value } = fromTrajectoryForm(form);
    expect(value.forbidden).toEqual(['a', 'b']);
    expect(value.allow_repeat).toEqual(['c']);
  });
});

describe('validation', () => {
  const withTool = patch => ({
    ...toTrajectoryForm(null),
    enabled: true,
    tools: [{ ...newTrajectoryToolRow('jira'), ...patch }],
  });

  it.each([
    [{ name: '  ' }, 'Expected tool 1: enter a tool name'],
    [{ name: 'x'.repeat(257) }, 'Expected tool 1: longer than 256 characters'],
    [{ argsText: '{bad' }, 'Expected tool 1: arguments are not valid JSON'],
    [{ argsText: '[1]' }, 'Expected tool 1: arguments must be a JSON object'],
  ])('rejects %j', (patch, error) => {
    expect(fromTrajectoryForm(withTool(patch))).toEqual({ value: null, error });
  });

  it.each(['-1', '1.5', 'abc'])('rejects max tool calls %s', budget => {
    const form = { ...toTrajectoryForm(null), enabled: true, maxToolCalls: budget };
    expect(fromTrajectoryForm(form).error).toMatch(/whole number/);
  });

  it('allows a zero budget', () => {
    const form = { ...toTrajectoryForm(null), enabled: true, maxToolCalls: '0' };
    expect(fromTrajectoryForm(form).value.max_tool_calls).toBe(0);
  });

  it('args_match is only sent with args', () => {
    const { value } = fromTrajectoryForm(withTool({ argsMatch: 'exact' }));
    expect(value.tools).toEqual([{ name: 'jira' }]);
  });
});

describe('isTrajectoryFormChanged', () => {
  it('ignores row ids and formatting of args', () => {
    const initial = toTrajectoryForm(stored);
    const again = toTrajectoryForm(stored);
    again.tools[0].argsText = '{"project":"EL"}';
    expect(isTrajectoryFormChanged(again, initial)).toBe(false);
  });

  it('sees a real change', () => {
    const initial = toTrajectoryForm(stored);
    expect(isTrajectoryFormChanged({ ...initial, match: 'exact' }, initial)).toBe(true);
    expect(isTrajectoryFormChanged({ ...initial, enabled: false }, initial)).toBe(true);
  });

  it('an invalid edit counts as a change', () => {
    const initial = toTrajectoryForm(stored);
    expect(isTrajectoryFormChanged({ ...initial, maxToolCalls: 'x' }, initial)).toBe(true);
  });
});

describe('summaries', () => {
  it('summarizes a reference in one line', () => {
    expect(summarizeExpectedTrajectory(stored)).toBe(
      'in_order: jira_search → ChildWriter · forbidden: delete_branch · max 6 calls · may repeat: get_status',
    );
    expect(summarizeExpectedTrajectory({})).toBeNull();
  });

  it('compares expected and actual by name', () => {
    const diff = compareTrajectoryNames(stored, ['jira_search', 'other', 'delete_branch']);
    expect(diff.tools).toEqual([
      { name: 'jira_search', hasArgs: true, called: true },
      { name: 'ChildWriter', hasArgs: false, called: false },
    ]);
    expect(diff.extra).toEqual(['other', 'delete_branch']);
    expect(diff.forbidden).toEqual([{ name: 'delete_branch', called: true }]);
    expect(diff.budget).toEqual({ max: 6, used: 3, ok: true });
  });

  it('one call satisfies one expectation', () => {
    const diff = compareTrajectoryNames({ tools: ['a', 'a'] }, ['a']);
    expect(diff.tools.map(t => t.called)).toEqual([true, false]);
    expect(diff.budget).toBeNull();
    expect(compareTrajectoryNames(null, ['a'])).toBeNull();
  });
});

describe('recordedToolNames', () => {
  it('reads tool steps, then the sequence', () => {
    expect(
      recordedToolNames({ steps: [{ kind: 'llm' }, { kind: 'tool', tool_name: 'a' }], tool_sequence: ['z'] }),
    ).toEqual(['a']);
    expect(recordedToolNames({ steps: [], tool_sequence: ['z'] })).toEqual(['z']);
    expect(recordedToolNames(undefined)).toEqual([]);
  });
});

describe('sub-agent calls (#7015 P3)', () => {
  const trajectory = {
    steps: [
      { kind: 'llm' },
      { kind: 'tool', tool_name: 'read_file', parent_agent: 'RD-OrderReader' },
      { kind: 'tool', tool_name: 'RD-OrderReader' },
      { kind: 'tool', tool_name: 'list_files', parent_agent: 'RD-DecisionReader' },
      { kind: 'tool', tool_name: 'RD-DecisionReader' },
    ],
  };

  it("leaves a sub-agent's own calls out when asked for the agent's calls only", () => {
    expect(recordedToolNames(trajectory, { ownOnly: true })).toEqual(['RD-OrderReader', 'RD-DecisionReader']);
    expect(recordedToolNames(trajectory)).toHaveLength(4);
  });

  it("matches the agent's calls, while forbidden tools and the budget count every call", () => {
    const diff = compareTrajectoryNames(
      { tools: ['RD-OrderReader', 'RD-DecisionReader'], forbidden: ['list_files'], max_tool_calls: 3 },
      recordedToolNames(trajectory, { ownOnly: true }),
      recordedToolNames(trajectory),
    );
    expect(diff.tools.every(t => t.called)).toBe(true);
    expect(diff.extra).toEqual([]);
    expect(diff.forbidden).toEqual([{ name: 'list_files', called: true }]);
    expect(diff.budget).toEqual({ max: 3, used: 4, ok: false });
  });
});

describe('calls (#7015 P3)', () => {
  it('a form without calls compares every call, and saves without the key', () => {
    const form = toTrajectoryForm({ tools: ['a'] });
    expect(form.calls).toBe('all');
    expect(fromTrajectoryForm(form).value).not.toHaveProperty('calls');
  });

  it("keeps calls: 'own' through the form", () => {
    const own = { match: 'superset', calls: 'own', tools: [{ name: 'a' }], forbidden: [], allow_repeat: [] };
    expect(fromTrajectoryForm(toTrajectoryForm(own))).toEqual({ value: own, error: null });
  });

  it('switching calls is a change', () => {
    const initial = toTrajectoryForm({ tools: ['a'] });
    expect(isTrajectoryFormChanged({ ...initial, calls: 'own' }, initial)).toBe(true);
  });

  it("the summary and the comparison say when only the agent's own calls count", () => {
    expect(summarizeExpectedTrajectory({ calls: 'own', tools: ['a'] })).toBe(
      "superset: a · agent's own calls",
    );
    expect(compareTrajectoryNames({ calls: 'own', tools: ['a'] }, ['a']).calls).toBe('own');
    expect(compareTrajectoryNames({ tools: ['a'] }, ['a']).calls).toBe('all');
  });
});
