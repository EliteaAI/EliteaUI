/**
 * Authoring helpers for a case's `expected_trajectory` reference (#6809 item 7). The backend
 * validator (`evaluation_expected_trajectory`) is the source of truth; these mirror its rules so the
 * case editor can flag a bad value before saving. Pure.
 *
 * Shape: `{ match, tools: [{ name, args?, args_match? }], forbidden, allow_repeat, max_tool_calls? }`.
 */

export const TRAJECTORY_MATCH_MODES = ['superset', 'in_order', 'any_order', 'subset', 'exact'];
export const DEFAULT_TRAJECTORY_MATCH = 'superset';
export const DEFAULT_ARGS_MATCH = 'subset';
export const MAX_TRAJECTORY_TOOLS = 200;
export const MAX_TOOL_NAME_CHARS = 256;

export const TRAJECTORY_MATCH_OPTIONS = [
  { value: 'superset', label: 'Superset (default)' },
  { value: 'in_order', label: 'In order' },
  { value: 'any_order', label: 'Any order' },
  { value: 'subset', label: 'Subset' },
  { value: 'exact', label: 'Exact' },
];

export const TRAJECTORY_MATCH_HINTS = {
  superset: 'Every expected call happens; extra calls are fine.',
  in_order: 'The expected calls happen in this order; other calls may sit between them.',
  any_order: 'The same calls in any order, nothing else.',
  subset: 'Every call the agent makes is one of the expected ones; some may be skipped.',
  exact: 'The same calls in the same order, nothing else.',
};

export const ARGS_MATCH_OPTIONS = [
  { value: 'subset', label: 'Args subset' },
  { value: 'exact', label: 'Args exact' },
];

// The backend's `clean_string`: a sub-agent's tool is recorded under its name with everything but
// [a-zA-Z0-9_.-] stripped and dots turned into underscores.
const cleanToolName = name =>
  String(name ?? '')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/\./g, '_');

/**
 * Tool-name suggestions for the agent version: the names its recorded tool calls use. A toolkit
 * without `selected_tools` (MCP and the like) cannot be enumerated, so the editor also takes free text.
 */
export const agentToolOptions = versionDetails => {
  const names = new Set();
  for (const tool of versionDetails?.tools ?? []) {
    if (!tool || typeof tool !== 'object') continue;
    if (tool.type === 'application') {
      const name = cleanToolName(tool.name);
      if (name) names.add(name);
      continue;
    }
    for (const selected of tool.settings?.selected_tools ?? []) {
      if (typeof selected === 'string' && selected.trim()) names.add(selected.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
};

let rowSeq = 0;
const nextRowId = () => {
  rowSeq += 1;
  return `traj-tool-${rowSeq}`;
};

export const newTrajectoryToolRow = (name = '') => ({
  id: nextRowId(),
  name,
  argsText: '',
  argsMatch: DEFAULT_ARGS_MATCH,
});

const splitNames = text =>
  String(text ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const joinNames = names => (Array.isArray(names) ? names.join(', ') : '');

/** The stored value → editor form state. `null`/`{}` is a disabled, empty form. */
export const toTrajectoryForm = expected => {
  const value = expected && typeof expected === 'object' ? expected : null;
  const enabled = !!value && Object.keys(value).length > 0;
  return {
    enabled,
    match: value?.match || DEFAULT_TRAJECTORY_MATCH,
    tools: (value?.tools ?? []).map(tool => {
      const spec = typeof tool === 'string' ? { name: tool } : (tool ?? {});
      return {
        ...newTrajectoryToolRow(spec.name ?? ''),
        argsText: spec.args != null ? JSON.stringify(spec.args, null, 2) : '',
        argsMatch: spec.args_match || DEFAULT_ARGS_MATCH,
      };
    }),
    forbiddenText: joinNames(value?.forbidden),
    allowRepeatText: joinNames(value?.allow_repeat),
    maxToolCalls: value?.max_tool_calls != null ? String(value.max_tool_calls) : '',
  };
};

const checkName = (name, where) => {
  if (!name) return `${where}: enter a tool name`;
  if (name.length > MAX_TOOL_NAME_CHARS) return `${where}: longer than ${MAX_TOOL_NAME_CHARS} characters`;
  return null;
};

/**
 * Editor form state → `{ value, error }`. `value` is `null` when the section is off (the save then
 * clears any stored reference). `error` is the first problem found, phrased for the form.
 */
export const fromTrajectoryForm = form => {
  if (!form?.enabled) return { value: null, error: null };

  const tools = [];
  const rows = form.tools ?? [];
  if (rows.length > MAX_TRAJECTORY_TOOLS) {
    return { value: null, error: `Expected tools: at most ${MAX_TRAJECTORY_TOOLS}` };
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const where = `Expected tool ${i + 1}`;
    const name = String(row.name ?? '').trim();
    const nameError = checkName(name, where);
    if (nameError) return { value: null, error: nameError };
    const tool = { name };
    const argsText = String(row.argsText ?? '').trim();
    if (argsText) {
      let args;
      try {
        args = JSON.parse(argsText);
      } catch {
        return { value: null, error: `${where}: arguments are not valid JSON` };
      }
      if (!args || typeof args !== 'object' || Array.isArray(args)) {
        return { value: null, error: `${where}: arguments must be a JSON object` };
      }
      tool.args = args;
      tool.args_match = row.argsMatch || DEFAULT_ARGS_MATCH;
    }
    tools.push(tool);
  }

  const lists = {};
  for (const [field, text, label] of [
    ['forbidden', form.forbiddenText, 'Forbidden tools'],
    ['allow_repeat', form.allowRepeatText, 'Allowed repeats'],
  ]) {
    const names = splitNames(text);
    if (names.length > MAX_TRAJECTORY_TOOLS) {
      return { value: null, error: `${label}: at most ${MAX_TRAJECTORY_TOOLS}` };
    }
    for (const name of names) {
      const nameError = checkName(name, label);
      if (nameError) return { value: null, error: nameError };
    }
    lists[field] = names;
  }

  const value = {
    match: form.match || DEFAULT_TRAJECTORY_MATCH,
    tools,
    forbidden: lists.forbidden,
    allow_repeat: lists.allow_repeat,
  };
  const budgetText = String(form.maxToolCalls ?? '').trim();
  if (budgetText) {
    if (!/^\d+$/.test(budgetText)) {
      return { value: null, error: 'Max tool calls must be a whole number, 0 or more' };
    }
    value.max_tool_calls = Number(budgetText);
  }
  return { value, error: null };
};

// Key order and the row ids are not part of the value, so compare a canonical rendering.
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, canonical(value[key])]),
    );
  }
  return value;
};

/** Whether two forms describe different references; an invalid form counts as changed. */
export const isTrajectoryFormChanged = (form, initialForm) => {
  const current = fromTrajectoryForm(form);
  const initial = fromTrajectoryForm(initialForm);
  if (current.error || initial.error) return JSON.stringify(form) !== JSON.stringify(initialForm);
  return JSON.stringify(canonical(current.value)) !== JSON.stringify(canonical(initial.value));
};

/** A one-line summary for read-only places (case list, expected-vs-actual). */
export const summarizeExpectedTrajectory = expected => {
  if (!expected || typeof expected !== 'object' || !Object.keys(expected).length) return null;
  const parts = [];
  const names = (expected.tools ?? []).map(t => (typeof t === 'string' ? t : t?.name)).filter(Boolean);
  parts.push(
    `${expected.match || DEFAULT_TRAJECTORY_MATCH}: ${names.length ? names.join(' → ') : 'no tools'}`,
  );
  if (expected.forbidden?.length) parts.push(`forbidden: ${expected.forbidden.join(', ')}`);
  if (expected.max_tool_calls != null) parts.push(`max ${expected.max_tool_calls} calls`);
  if (expected.allow_repeat?.length) parts.push(`may repeat: ${expected.allow_repeat.join(', ')}`);
  return parts.join(' · ');
};

/**
 * Expected vs actual, per expected tool and per forbidden tool, by name only (args and the match
 * mode's exact scoring stay with the `trajectory.tool_match` dimension). Display aid, not a score.
 */
export const compareTrajectoryNames = (expected, actualNames) => {
  if (!expected || typeof expected !== 'object' || !Object.keys(expected).length) return null;
  const remaining = new Map();
  for (const name of actualNames ?? []) remaining.set(name, (remaining.get(name) ?? 0) + 1);
  const expectedCalls = (expected.tools ?? []).map(t => (typeof t === 'string' ? { name: t } : t));
  const tools = expectedCalls.map(tool => {
    const left = remaining.get(tool.name) ?? 0;
    if (left) remaining.set(tool.name, left - 1);
    return { name: tool.name, hasArgs: tool.args != null, called: left > 0 };
  });
  const expectedNames = new Set(expectedCalls.map(t => t.name));
  const extra = [...new Set((actualNames ?? []).filter(name => !expectedNames.has(name)))];
  const actualSet = new Set(actualNames ?? []);
  const forbidden = (expected.forbidden ?? []).map(name => ({ name, called: actualSet.has(name) }));
  const budget = expected.max_tool_calls;
  return {
    match: expected.match || DEFAULT_TRAJECTORY_MATCH,
    tools,
    extra,
    forbidden,
    budget:
      budget != null
        ? { max: budget, used: (actualNames ?? []).length, ok: (actualNames ?? []).length <= budget }
        : null,
  };
};

/** The tool names a recorded trajectory called, in order, read the way the built-in checks read them. */
export const recordedToolNames = trajectory => {
  const steps = trajectory?.steps ?? [];
  if (steps.length) return steps.filter(s => s?.kind === 'tool').map(s => s.tool_name);
  return [...(trajectory?.tool_sequence ?? [])];
};
