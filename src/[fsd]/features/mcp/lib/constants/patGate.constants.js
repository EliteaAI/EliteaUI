// PAT states reported by the internal MCP PAT status endpoint. GOVERNED: governance is on and a run's
// internal toolkits act with the run's own identity, so no personal token is asked for.
export const PAT_STATES = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  MISSING: 'MISSING',
  GOVERNED: 'GOVERNED',
};

export const PAT_REQUIRED_ACTION_HINT =
  'A valid Elitea personal access token is required. Create or renew one, then try again.';

export const PAT_GATE_COPY = {
  [PAT_STATES.MISSING]: {
    content:
      'An Elitea personal access token is required to use internal MCP toolkits. Create one, then try again.',
    label: 'Create personal token',
  },
  [PAT_STATES.EXPIRED]: {
    content: 'Your Elitea personal access token has expired. Renew it, then try again.',
    label: 'Renew personal token',
  },
};

export const PAT_GOVERNED_NOTE =
  "In governed runs this toolkit acts with the run's own identity; no personal access token is needed.";
