export const EVAL_ENGINE = {
  ai: 'ai',
  human: 'human',
  code: 'code',
};

export const EVAL_TIER = {
  project: 'project',
  agent_adhoc: 'agent_adhoc',
  platform: 'platform',
};

export const EVAL_SCALE_TYPE = {
  binary: 'binary',
  ordinal: 'ordinal',
  continuous: 'continuous',
};

export const EVAL_POLARITY = {
  higher_better: 'higher_better',
  lower_better: 'lower_better',
};

export const EVAL_RETURN_CONTRACT = {
  bool: 'bool',
  number: 'number',
};

// Engines an author may toggle in the Library dimension editor. AI and Human may be
// combined on one dimension; Code is mutually exclusive with both (backend:
// allowed_engines == ['code'] cannot also contain ai/human, §2.1/§16.2).
export const DIMENSION_ENGINE_OPTIONS = [
  { value: EVAL_ENGINE.ai, label: 'AI' },
  { value: EVAL_ENGINE.human, label: 'Human' },
  { value: EVAL_ENGINE.code, label: 'Code' },
];

export const SCALE_TYPE_OPTIONS = [
  { value: EVAL_SCALE_TYPE.continuous, label: 'Continuous (e.g. 0–100)' },
  { value: EVAL_SCALE_TYPE.ordinal, label: 'Ordinal (e.g. 1–5)' },
  { value: EVAL_SCALE_TYPE.binary, label: 'Binary (0/1)' },
];

// Tier choice offered per-item in the "Generate with AI" review step (§13.3 follow-up).
// Platform tier is excluded — it's seeded via the admin console, not authorable here.
export const DIMENSION_TIER_OPTIONS = [
  { value: EVAL_TIER.agent_adhoc, label: 'This agent only' },
  { value: EVAL_TIER.project, label: 'Project library' },
];

export const POLARITY_OPTIONS = [
  { value: EVAL_POLARITY.higher_better, label: 'Higher is better' },
  { value: EVAL_POLARITY.lower_better, label: 'Lower is better' },
];

export const RETURN_CONTRACT_OPTIONS = [
  { value: EVAL_RETURN_CONTRACT.bool, label: 'Boolean (pass / fail)' },
  { value: EVAL_RETURN_CONTRACT.number, label: 'Number (score)' },
];

export const TARGET_OPERATOR_OPTIONS = [
  { value: '>=', label: '≥ (at least)' },
  { value: '>', label: '> (greater than)' },
  { value: '<=', label: '≤ (at most)' },
  { value: '<', label: '< (less than)' },
  { value: '==', label: '= (equals)' },
];

// Simplified success criteria for new dimension modal (subset of TARGET_OPERATOR_OPTIONS)
export const SUCCESS_CRITERIA_OPTIONS = [
  { value: '>=', label: 'At least (>=)' },
  { value: '<=', label: 'At most (<=)' },
  { value: '==', label: 'Exactly (=)' },
];

// UI presets for scale type that auto-fill min/max values. Maps to EVAL_SCALE_TYPE.
export const SCALE_TYPE_PRESET = {
  score: 'score',
  rating: 'rating',
  passFail: 'pass_fail',
  custom: 'custom',
};

export const SCALE_TYPE_PRESET_OPTIONS = [
  { value: SCALE_TYPE_PRESET.score, label: 'Score (1-100)' },
  { value: SCALE_TYPE_PRESET.rating, label: 'Rating (1-5)' },
  { value: SCALE_TYPE_PRESET.passFail, label: 'Pass/Fail' },
  { value: SCALE_TYPE_PRESET.custom, label: 'Custom' },
];

export const SCALE_TYPE_PRESET_CONFIG = {
  [SCALE_TYPE_PRESET.score]: { scaleType: EVAL_SCALE_TYPE.continuous, min: 1, max: 100 },
  [SCALE_TYPE_PRESET.rating]: { scaleType: EVAL_SCALE_TYPE.ordinal, min: 1, max: 5 },
  [SCALE_TYPE_PRESET.passFail]: { scaleType: EVAL_SCALE_TYPE.binary, min: 0, max: 1 },
  [SCALE_TYPE_PRESET.custom]: { scaleType: EVAL_SCALE_TYPE.continuous, min: null, max: null },
};

// Importance levels for dimension weighting
export const IMPORTANCE = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
  custom: 'custom',
};

export const IMPORTANCE_OPTIONS = [
  { value: IMPORTANCE.low, label: 'Low' },
  { value: IMPORTANCE.medium, label: 'Medium' },
  { value: IMPORTANCE.high, label: 'High' },
  { value: IMPORTANCE.critical, label: 'Critical' },
  { value: IMPORTANCE.custom, label: 'Custom' },
];

export const IMPORTANCE_WEIGHT_MAP = {
  [IMPORTANCE.low]: 1,
  [IMPORTANCE.medium]: 2,
  [IMPORTANCE.high]: 3,
  [IMPORTANCE.critical]: 4,
};

// RBAC permission strings (must match backend check_api decorators, §19.6).
export const EVAL_PERMISSIONS = {
  dimensionRead: 'models.applications.evaluation.dimension.read',
  dimensionCreate: 'models.applications.evaluation.dimension.create',
  dimensionUpdate: 'models.applications.evaluation.dimension.update',
  dimensionDelete: 'models.applications.evaluation.dimension.delete',
  suiteRead: 'models.applications.evaluation.suite.read',
  suiteCreate: 'models.applications.evaluation.suite.create',
  suiteUpdate: 'models.applications.evaluation.suite.update',
  suiteDelete: 'models.applications.evaluation.suite.delete',
  datasetRead: 'models.applications.evaluation.dataset.read',
  datasetCreate: 'models.applications.evaluation.dataset.create',
  datasetUpdate: 'models.applications.evaluation.dataset.update',
  datasetDelete: 'models.applications.evaluation.dataset.delete',
  runRead: 'models.applications.evaluation.run.read',
  runCreate: 'models.applications.evaluation.run.create',
  runDelete: 'models.applications.evaluation.run.delete',
  humanScoreRead: 'models.applications.evaluation.human_score.read',
  humanScoreCreate: 'models.applications.evaluation.human_score.create',
};

// Eval run lifecycle (§14.2). Backend EvalRunStatus: a run is created, moves to
// running, then reaches finished, errored, or cancelled. The progress screen (#6)
// polls until a terminal status is reached. `cancelled` is kept distinct from
// `errored` so a deliberate stop is not read as a failure of the agent or rubric.
export const EVAL_RUN_STATUS = {
  created: 'created',
  running: 'running',
  finished: 'finished',
  errored: 'errored',
  cancelled: 'cancelled',
};

export const EVAL_RUN_TRIGGER = {
  offline_batch: 'offline_batch',
  on_demand: 'on_demand',
};

// Per-result status (§17.5). Distinct from EVAL_RUN_STATUS: an individual
// eval_result row is 'ok', 'error' (scorer/sandbox failed), 'pending_human'
// (awaiting a manual score), or 'skipped' (e.g. reference-based validation with
// no expected_output). Backend: STATUS_* in evaluation_run_orchestration.py.
export const EVAL_RESULT_STATUS = {
  ok: 'ok',
  error: 'error',
  pending_human: 'pending_human',
  skipped: 'skipped',
};

// Sub-navigation views on the agent Evaluation tab (§13). Suite config is the
// default; Library preserves the U2 dimension editor.
export const EVAL_TAB_VIEW = {
  suite: 'suite',
  library: 'library',
  datasets: 'datasets',
};

// Conversation stores the promote picker can browse. Both live in the single
// `Conversation` table and are told apart by its `source` column: chat sessions
// are 'elitea', while run history is written as 'agent' (agent runs) or
// 'pipeline' (pipeline / scheduled / webhook runs). The list endpoint accepts a
// comma-separated set, so run history asks for both.
export const PROMOTE_CONVERSATION_SOURCE = {
  chat: 'elitea',
  runHistory: 'agent,pipeline',
};

export const PROMOTE_CONVERSATION_SOURCE_OPTIONS = [
  { value: PROMOTE_CONVERSATION_SOURCE.chat, label: 'Chat' },
  { value: PROMOTE_CONVERSATION_SOURCE.runHistory, label: 'Run history' },
];

// Binding "kind" derived from which reference column is populated (§13.1). One
// of dimension_id / platform_key is always set.
export const EVAL_BINDING_KIND = {
  dimension: 'dimension',
  platform: 'platform',
};

// Engine choices offered when editing a single binding (§13.2). Platform bindings and
// Code-engine dimension bindings pin engine to code and are not editable here.
export const BINDING_ENGINE_OPTIONS = [
  { value: EVAL_ENGINE.ai, label: 'AI' },
  { value: EVAL_ENGINE.human, label: 'Human' },
  { value: EVAL_ENGINE.code, label: 'Code' },
];

// Evidence-scope toggles for a binding (§13.2). Keys match the backend
// evidence_scope JSON shape { structure, input, output }. When `output` is in
// scope and the dataset case has an expected_output, it's attached to the
// judge automatically — there's no separate toggle for it.
export const EVIDENCE_SCOPE_OPTIONS = [
  { key: 'output', label: 'Output' },
  { key: 'input', label: 'Input' },
  { key: 'structure', label: 'Agent structure' },
];

export const DEFAULT_EVIDENCE_SCOPE = {
  structure: false,
  input: true,
  output: true,
};

// Scope a freshly created dimension / code validation starts with. Distinct from
// DEFAULT_EVIDENCE_SCOPE, which mirrors the backend fallback used when a stored
// binding's scope omits keys.
export const NEW_ITEM_EVIDENCE_SCOPE = {
  structure: false,
  input: false,
  output: true,
};

// Items in the "+ Add" menu on the Suite config screen (§13.3).
export const ADD_VALIDATION_MENU = {
  dimensionLibrary: 'dimensionLibrary',
  platformCatalog: 'platformCatalog',
  newDimension: 'newDimension',
  generateWithAi: 'generateWithAi',
};

export const DEFAULT_BINDING_FORM = {
  engine: EVAL_ENGINE.ai,
  evidence_scope: DEFAULT_EVIDENCE_SCOPE,
  weight: 1,
  target: '',
  target_operator: '',
};

export const DEFAULT_DIMENSION_FORM = {
  name: '',
  description: '',
  allowed_engines: [EVAL_ENGINE.ai],
  scale_type: EVAL_SCALE_TYPE.continuous,
  scale_min: 0,
  scale_max: 100,
  // Left unset on purpose: polarity is applied last in normalization, so an inverse metric
  // (toxicity, latency) silently scores a good answer 0 if the author never states it.
  polarity: '',
  default_weight: 1,
  default_target: '',
  default_target_operator: '',
  // Code-engine authoring only (§2.1): a script + its return shape, required together and only
  // when allowed_engines is exactly ['code'].
  code: '',
  return_contract: EVAL_RETURN_CONTRACT.bool,
};

// Dataset case provenance (§17). Set by the backend; the UI only displays it.
export const EVAL_CASE_SOURCE = {
  manual: 'manual',
  import: 'import',
  conversation: 'conversation',
};

export const EVAL_CASE_SOURCE_LABEL = {
  [EVAL_CASE_SOURCE.manual]: 'Manual',
  [EVAL_CASE_SOURCE.import]: 'Import',
  [EVAL_CASE_SOURCE.conversation]: 'Conversation',
};

// Formats accepted by the dataset import endpoint (§17.3).
export const IMPORT_FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
];

// Items in the "+ New dataset" menu on the Datasets screen (§17.1).
export const NEW_DATASET_MENU = {
  blank: 'blank',
  import: 'import',
  fromConversations: 'fromConversations',
};

export const DEFAULT_DATASET_FORM = {
  name: '',
  description: '',
  isShared: false,
};

export const DEFAULT_CASE_FORM = {
  input: '',
  variables: {},
  expected_output: '',
};

export const DEFAULT_IMPORT_FORM = {
  format: 'csv',
  content: '',
};

export const DEFAULT_PROMOTE_FORM = {
  conversation_id: null,
  include_expected: true,
};

// Socket events carrying live run progress. Backend: SioEvents in
// elitea_core/utils/sio_utils.py — the room is keyed by run id alone.
export const EVAL_SIO_EVENTS = {
  eval_run_progress: 'eval_run_progress',
  eval_run_enter_room: 'eval_run_enter_room',
  eval_run_leave_room: 'eval_run_leave_room',
  eval_run_room_joined: 'eval_run_room_joined',
};

// Fallback poll used while progress is not being pushed. Push is the normal path, so this is a
// degraded mode — but "connected" is not the same as "receiving", so it stays armed until the
// server confirms the room join (see useEvalRunLiveProgress).
export const EVAL_RUN_FALLBACK_POLL_MS = 10000;

// Server-side page caps the UI must opt into, or reads silently truncate. Backend:
// DEFAULT/MAX_CASE_LIMIT in evaluation_dataset_utils.py (200/1000) and
// DEFAULT/MAX_RESULT_LIMIT in evaluation_result_utils.py (500/2000). The scorecard asks for the
// maximum in one shot because it renders a whole run at once; the dataset view pages instead.
export const EVAL_DATASET_CASE_PAGE_SIZE = 200;
export const EVAL_RESULT_MAX_LIMIT = 2000;

// P1 hard cap on cases per dataset (#6349). Backend: MAX_CASES_PER_DATASET in
// evaluation_dataset_utils.py — keep this in sync with the server-side constant.
export const MAX_CASES_PER_DATASET = 10;
