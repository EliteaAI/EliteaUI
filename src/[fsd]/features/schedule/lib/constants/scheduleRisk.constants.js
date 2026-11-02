// States of the dry-run risk check of the schedule form
export const RISK_CHECK_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  BLOCKED: 'blocked',
  CLEAR: 'clear',
  FAILED: 'failed',
};

// 409 `code` values of a schedule save refused by the risk scan (the `error` field is human text)
export const RISK_SAVE_ERROR = {
  BLOCKED: 'schedule_blocked',
  CONFIRMATION_REQUIRED: 'risk_confirmation_required',
  CHANGED: 'risk_changed',
};

// 400 `code` of a typed name that differs from the schedule name (field risk_ack)
export const RISK_NAME_MISMATCH = 'risk_name_mismatch';

// Findings that stop a save only under "Run without asking"; under "Pause and ask me" the run waits for the owner
export const WAIT_FOR_OWNER_CODES = ['missing_credential', 'personal_signin_required'];
