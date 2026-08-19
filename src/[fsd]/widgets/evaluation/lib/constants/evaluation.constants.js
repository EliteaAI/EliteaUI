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

// Engines an author may toggle in the Library dimension editor. Code-engine
// criteria are authored through the separate code-validation editor, so only
// AI and Human are offered here (§16.2).
export const DIMENSION_ENGINE_OPTIONS = [
  { value: EVAL_ENGINE.ai, label: 'AI' },
  { value: EVAL_ENGINE.human, label: 'Human' },
];

export const SCALE_TYPE_OPTIONS = [
  { value: EVAL_SCALE_TYPE.continuous, label: 'Continuous (e.g. 0–100)' },
  { value: EVAL_SCALE_TYPE.ordinal, label: 'Ordinal (e.g. 1–5)' },
  { value: EVAL_SCALE_TYPE.binary, label: 'Binary (0/1)' },
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

// RBAC permission strings (must match backend check_api decorators, §19.6).
export const EVAL_PERMISSIONS = {
  dimensionCreate: 'models.applications.evaluation.dimension.create',
  dimensionUpdate: 'models.applications.evaluation.dimension.update',
  dimensionDelete: 'models.applications.evaluation.dimension.delete',
  codeValidationCreate: 'models.applications.evaluation.code_validation.create',
  codeValidationUpdate: 'models.applications.evaluation.code_validation.update',
  codeValidationDelete: 'models.applications.evaluation.code_validation.delete',
  suiteCreate: 'models.applications.evaluation.suite.create',
  suiteUpdate: 'models.applications.evaluation.suite.update',
  suiteDelete: 'models.applications.evaluation.suite.delete',
  datasetRead: 'models.applications.evaluation.dataset.read',
  datasetCreate: 'models.applications.evaluation.dataset.create',
  datasetUpdate: 'models.applications.evaluation.dataset.update',
  datasetDelete: 'models.applications.evaluation.dataset.delete',
  runRead: 'models.applications.evaluation.run.read',
  runCreate: 'models.applications.evaluation.run.create',
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
// default; Library preserves the U2 dimension / code-validation editors.
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
// of dimension_id / code_validation_id / platform_key is always set.
export const EVAL_BINDING_KIND = {
  dimension: 'dimension',
  codeValidation: 'code_validation',
  platform: 'platform',
};

// Engine choices offered when editing a single binding (§13.2). Platform
// bindings pin engine to code and are not editable here.
export const BINDING_ENGINE_OPTIONS = [
  { value: EVAL_ENGINE.ai, label: 'AI' },
  { value: EVAL_ENGINE.human, label: 'Human' },
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
  codeValidationLibrary: 'codeValidationLibrary',
  platformCatalog: 'platformCatalog',
  newDimension: 'newDimension',
  newCodeValidation: 'newCodeValidation',
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
};

export const DEFAULT_CODE_VALIDATION_FORM = {
  name: '',
  description: '',
  code: '',
  return_contract: EVAL_RETURN_CONTRACT.bool,
  scale_min: '',
  scale_max: '',
  // Left unset on purpose (same reason as DEFAULT_DIMENSION_FORM): a "lower is better" check
  // (latency, error count) scores inverted if the author never states the direction.
  polarity: '',
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
