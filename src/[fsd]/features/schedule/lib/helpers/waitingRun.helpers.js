export const WAITING_NEED = { CREDENTIAL: 'credential', SIGN_IN: 'sign_in', TOOLS: 'tools' };

const MORE_TEXT = /\(\+(\d+) more\)$/;

// Flat patterns without a repeated group, so the run time stays linear on long server text. The global flag
// lets a search start at an index; `matchFrom` resets it on every call.
const CREDENTIAL_PREFIX = /credential\s/gi;
const CREDENTIAL_SUFFIX = /\snot found\./gi;
const SIGN_IN_PREFIX = /a sign-in is needed for\s/gi;
// A quoted toolkit name keeps all its words (up to 100 characters, which bounds the scan); an unquoted one is the
// first word after "toolkit" and ends at a space, a quote or a full stop
const TOOLKIT_TEXT = /toolkit\s+(?:["']([^"']{1,100})["']|["']?([^\s"'.]+))/i;
const toolkitFromText = text => {
  const hit = TOOLKIT_TEXT.exec(text);
  return hit?.[1] ?? hit?.[2];
};

const matchFrom = (pattern, text, from) => {
  pattern.lastIndex = from;
  return pattern.exec(text);
};

// The first non-empty text between a `prefix` hit and the next `suffix` hit (the end of the text when there is
// no `suffix`). A hit of `prefix` that is not followed by a `suffix` ends the search: no later hit can have one.
const textBetween = (text, prefix, suffix) => {
  let hit = matchFrom(prefix, text, 0);
  while (hit) {
    const from = hit.index + hit[0].length;
    const tail = suffix ? matchFrom(suffix, text, from) : null;
    if (suffix && !tail) return undefined;
    const value = text.slice(from, tail ? tail.index : undefined).trim();
    if (value) return value;
    hit = matchFrom(prefix, text, from);
  }
  return undefined;
};

// The signed-in server name ends at the first full stop
const signInTarget = text => {
  const target = textBetween(text, SIGN_IN_PREFIX);
  return target?.split('.')[0].trim() || undefined;
};

const TOOL_SEPARATOR = ' · ';

const unquote = value => value?.trim().replace(/^["'`](.*)["'`]$/, '$1') || undefined;

const toToolList = list =>
  Array.isArray(list) ? list.filter(item => item && typeof item === 'object' && item.tool) : [];

/** The sensitive tools a paused event names, as `[{ toolkit, tool }]`. An older event has none. */
export const getPausedTools = pausedEvent => toToolList(pausedEvent?.tools);

/**
 * How many tools the list does not show. The server cuts the text and the `tools` array at different
 * points: the `(+N more)` at the end of the text counts the tools the text does not name, and the text names
 * the labels written as `Toolkit · tool` before it. So the hidden tools are those labels plus N, minus the
 * tools the list holds. 0 when the text has no `(+N more)` or the list holds every tool.
 */
export const getPausedMoreCount = pausedEvent => {
  const text = typeof pausedEvent?.text === 'string' ? pausedEvent.text.trimEnd() : '';
  const match = MORE_TEXT.exec(text);
  if (!match) return 0;
  const namedInText = text.slice(0, match.index).split(TOOL_SEPARATOR).length - 1;
  return Math.max(0, namedInText + Number(match[1]) - getPausedTools(pausedEvent).length);
};

/** One tool as the user reads it: `Toolkit · tool`. */
export const formatTool = ({ toolkit, tool }) => (toolkit ? `${toolkit}${TOOL_SEPARATOR}${tool}` : `${tool}`);

/**
 * What a paused run waits for, read from its paused event: `{ need, toolkit, credential }`, or
 * `{ need, mayAsk }` for a run that waits for the sensitive tools to be approved before it starts.
 * The server sends the structured fields `need`, `toolkit` and `credential`. A run paused before it did
 * has only the text, so the text is parsed as a fallback. `need` is undefined for any other pause.
 */
export const getWaitingRunNeed = pausedEvent => {
  if (!pausedEvent) return {};
  const { need, toolkit, credential, text = '' } = pausedEvent;
  if (need === WAITING_NEED.TOOLS) return { need, mayAsk: toToolList(pausedEvent.may_ask) };
  if (need === WAITING_NEED.CREDENTIAL || need === WAITING_NEED.SIGN_IN)
    return { need, toolkit: unquote(toolkit), credential: unquote(credential) };

  const missing = textBetween(text, CREDENTIAL_PREFIX, CREDENTIAL_SUFFIX);
  if (missing)
    return {
      need: WAITING_NEED.CREDENTIAL,
      toolkit: unquote(toolkit) ?? unquote(toolkitFromText(text)),
      credential: unquote(credential) ?? unquote(missing),
    };
  const signIn = signInTarget(text);
  if (signIn) return { need: WAITING_NEED.SIGN_IN, toolkit: unquote(toolkit) ?? unquote(signIn) };
  return {};
};

// Under "Pause and ask me" the server moves this finding from `blocking` to `notices`, so all three lists count.
// A finding or a call without a toolkit name matches any toolkit.
export const findMissingCredential = (result, toolkit) =>
  [...(result?.blocking ?? []), ...(result?.warnings ?? []), ...(result?.notices ?? [])].find(
    finding =>
      finding.code === 'missing_credential' &&
      (!toolkit || !finding.toolkit || finding.toolkit.toLowerCase() === toolkit.toLowerCase()),
  );

export const hasMissingCredential = (result, toolkit) => !!findMissingCredential(result, toolkit);

export const findWaitingRun = runs => (runs ?? []).find(run => run.status === 'waiting_for_approval');

// Before the server sent `decider_id`, the run acted as the starter of a manual or Test run, else the schedule owner
const MANUAL_TRIGGERS = ['manual', 'test'];

export const isStartedByUser = run => MANUAL_TRIGGERS.includes(run?.trigger) && run?.requested_by != null;

export const getRunActorId = (run, schedule) =>
  isStartedByUser(run) ? run.requested_by : schedule?.owner?.id;

/**
 * The user who may approve, reject or answer a sign-in of a waiting run: `decider_id` of the run detail. For a run
 * of a schedule or webhook it is the owner at the start of the run, also when an admin started it; for a Test run
 * it is the starter. A run detail without the field (an older server) falls back to the earlier rule.
 */
export const getRunDeciderId = (run, schedule) => {
  if (run?.decider_id != null) return run.decider_id;
  if (run?.isDraftRun) return run.requested_by;
  return schedule ? getRunActorId(run, schedule) : undefined;
};

// True when the decider is the user who started the run, not a schedule owner
export const isDeciderStarter = run =>
  Boolean(run?.isDraftRun) || (run?.decider_id == null && isStartedByUser(run));

export const OWNER_ONLY_NOTE = 'Only the owner can approve or reject this run.';
export const TEST_RUN_ONLY_NOTE = 'Only the user who started this Test run can approve or reject it';

// What a viewer who may not decide can do instead, in the order of the note. The server's `allowed_actions`
// decides: a member without rights gets none. Pause and Resume follow the state of the schedule.
export const getRunNoteActions = schedule => {
  const allowed = schedule?.allowed_actions ?? [];
  return [
    schedule?.enabled && allowed.includes('pause') && 'pause',
    !schedule?.enabled && allowed.includes('resume') && 'resume',
    allowed.includes('change_owner') && 'change_owner',
    allowed.includes('run') && 'run',
  ].filter(Boolean);
};

// "You can pause the schedule, change its owner, or start a new run as yourself." for all three actions
export const describeRunNoteActions = (actions, noun) => {
  const phrase = {
    pause: `pause the ${noun}`,
    resume: `resume the ${noun}`,
    change_owner: 'change its owner',
    run: 'start a new run as yourself',
  };
  const phrases = actions.map(action => phrase[action]);
  if (!phrases.length) return '';
  const last = phrases.pop();
  if (!phrases.length) return `You can ${last}.`;
  return `You can ${phrases.join(', ')}${phrases.length > 1 ? ',' : ''} or ${last}.`;
};
