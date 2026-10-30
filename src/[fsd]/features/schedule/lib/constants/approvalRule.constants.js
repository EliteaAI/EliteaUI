export const APPROVAL_RULE = { PAUSE_AND_ASK: 'pause_and_ask', RUN_WITHOUT_ASKING: 'run_without_asking' };

export const DEFAULT_APPROVAL_RULE = APPROVAL_RULE.PAUSE_AND_ASK;

// Labels of the warning codes the schedule API returns on save
export const WARNING_LABELS = {
  human_input_step: 'Waits for a person',
  missing_credential: 'Missing credential',
  personal_signin_required: 'Sign-in needed',
  token_may_expire: 'Token may expire',
  sensitive_action: 'Sensitive action',
  scan_incomplete: 'Scan incomplete',
};

export const UNKNOWN_WARNING_LABEL = 'Warning';
