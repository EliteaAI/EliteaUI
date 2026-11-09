import { APPROVAL_RULE } from '@/[fsd]/entities/schedule/lib/constants';

// The values and labels live with the schedule entity, so the compare dialog reads the same ones
export {
  APPROVAL_RULE,
  APPROVAL_RULE_LABELS,
  DEFAULT_APPROVAL_RULE,
} from '@/[fsd]/entities/schedule/lib/constants';

// Help text of the info icon beside each option
export const APPROVAL_RULE_INFO = {
  [APPROVAL_RULE.PAUSE_AND_ASK]:
    'The run stops and asks you only when it uses a sensitive tool, or when a sign-in or credential is missing. With no sensitive tool, it runs without stopping. No answer in 24 hours ends the run as Expired.',
  [APPROVAL_RULE.RUN_WITHOUT_ASKING]:
    'The run uses sensitive tools on its own and never waits. Use it when you do not want to be asked. Only for projects that allow it. You are responsible for what the tools do. A missing sign-in or credential blocks saving.',
};

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
