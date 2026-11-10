import { SYSTEM_PAUSE_LABELS } from '@/[fsd]/entities/schedule/lib/constants';

// Read by screen readers only; the same rule as the MUI utils visuallyHidden, which @mui/material does not export
export const VISUALLY_HIDDEN = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

// Why the system paused a schedule (`disabled_reason`), where the row says it (#7254)
export const DISABLED_REASON_LABELS = {
  governance_refused: SYSTEM_PAUSE_LABELS.governance_refused,
  prerun_refused: 'Paused: runs could not start, fix the agent or pipeline and resume',
  credential_expired: 'Paused: a saved login stopped working, sign in again and re-enable',
  connections_changed: 'Paused: the agent now uses a toolkit that needs a person to sign in',
};
