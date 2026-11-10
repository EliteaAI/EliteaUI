// Why the system paused a schedule (`disabled_reason`); a pause by a person has no reason
export const SYSTEM_PAUSE_LABELS = {
  governance_refused: 'Paused: runs were refused by credential governance',
  version_deleted: 'Paused: version was deleted',
  owner_lost_access: 'Paused: owner lost access',
};

// How a pipeline schedule starts its run (`run_mode`)
export const RUN_MODE = { ENTRY_POINT: 'entry_point', PROMPT: 'prompt' };

// What a run does at a sensitive tool (`approval_rule`)
export const APPROVAL_RULE = { PAUSE_AND_ASK: 'pause_and_ask', RUN_WITHOUT_ASKING: 'run_without_asking' };

export const DEFAULT_APPROVAL_RULE = APPROVAL_RULE.PAUSE_AND_ASK;

export const APPROVAL_RULE_LABELS = {
  [APPROVAL_RULE.PAUSE_AND_ASK]: 'Pause and ask me',
  [APPROVAL_RULE.RUN_WITHOUT_ASKING]: 'Run without asking',
};
