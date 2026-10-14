// Fallback only: the agent's skills endpoint returns the admin-configured max_skills.
export const MAX_ATTACHED_SKILLS = 50;

export const ATTACHED_SKILLS_SEARCH_THRESHOLD = 8;

export const LOCKED_SKILL_VERSION_STATUSES = ['published', 'embedded'];

export const SKILL_RUN_SEARCH_PARAMS = {
  run: 'run',
  focus: 'focus',
};

export const SKILL_RUN_FOCUS_TARGET = 'run';

export const SKILL_RUN_MATCH = {
  sameVersion: 'sameVersion',
  otherVersion: 'otherVersion',
  otherSkill: 'otherSkill',
};

export const SKILL_RUN_START_ERROR = 'Failed to start the skill run';

export const RUN_SETTINGS_FIELD = 'version_details.run_settings';

export const PROJECT_DEFAULT_MODEL_LABEL = 'Project default';
