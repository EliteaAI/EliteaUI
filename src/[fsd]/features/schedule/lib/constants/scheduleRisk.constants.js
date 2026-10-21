// States of the dry-run risk check of the schedule form (owner CR 2026-10-21)
export const RISK_CHECK_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  BLOCKED: 'blocked',
  CLEAR: 'clear',
  FAILED: 'failed',
};

// 409 error codes of a schedule save refused by the risk scan
export const RISK_SAVE_ERROR = {
  BLOCKED: 'schedule_blocked',
  CONFIRMATION_REQUIRED: 'risk_confirmation_required',
  CHANGED: 'risk_changed',
};
