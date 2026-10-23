export const UNCLASSIFIED_GROUP = 'unclassified';

export const TOOL_GROUP_ORDER = [
  { key: 'read', label: 'Read', tooltip: 'Returns data. Nothing is created, changed or destroyed.' },
  { key: 'write', label: 'Create & update', tooltip: 'Creates or modifies data in the target system.' },
  { key: 'delete', label: 'Delete', tooltip: 'Destroys data. Not reversible from Elitea.' },
  {
    key: 'execute',
    label: 'Execute',
    tooltip:
      'Runs a caller-supplied query, script, pipeline or raw API call. Effect is not bounded by the tool.',
  },
  {
    key: UNCLASSIFIED_GROUP,
    label: 'Unclassified',
    tooltip: 'Not classified yet. Treated as a tool that changes data.',
  },
];

export const KNOWN_GROUPS = new Set(
  TOOL_GROUP_ORDER.map(group => group.key).filter(key => key !== UNCLASSIFIED_GROUP),
);
