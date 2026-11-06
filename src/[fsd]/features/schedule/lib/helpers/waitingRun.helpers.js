export const WAITING_NEED = { CREDENTIAL: 'credential', SIGN_IN: 'sign_in' };

// Flat patterns without a repeated group, so the run time stays linear on long server text. The global flag
// lets a search start at an index; `matchFrom` resets it on every call.
const CREDENTIAL_PREFIX = /credential\s/gi;
const CREDENTIAL_SUFFIX = /\snot found\./gi;
const SIGN_IN_PREFIX = /a sign-in is needed for\s/gi;
// The toolkit name is the first word after "toolkit": it ends at a space, a quote or a full stop
const TOOLKIT_TEXT = /toolkit\s+["']?([^\s"'.]+)/i;

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

const unquote = value => value?.trim().replace(/^["'`](.*)["'`]$/, '$1') || undefined;

/**
 * What a paused run waits for, read from its paused event: `{ need, toolkit, credential }`.
 * The server sends the structured fields `need`, `toolkit` and `credential`. A run paused before it did
 * has only the text, so the text is parsed as a fallback. `need` is undefined for any other pause.
 */
export const getWaitingRunNeed = pausedEvent => {
  if (!pausedEvent) return {};
  const { need, toolkit, credential, text = '' } = pausedEvent;
  if (need === WAITING_NEED.CREDENTIAL || need === WAITING_NEED.SIGN_IN)
    return { need, toolkit: unquote(toolkit), credential: unquote(credential) };

  const missing = textBetween(text, CREDENTIAL_PREFIX, CREDENTIAL_SUFFIX);
  if (missing)
    return {
      need: WAITING_NEED.CREDENTIAL,
      toolkit: unquote(toolkit) ?? unquote(TOOLKIT_TEXT.exec(text)?.[1]),
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

// The server runs a manual or Test run as the user who started it, any other run as the schedule owner
export const MANUAL_TRIGGERS = ['manual', 'test'];

export const isStartedByUser = run => MANUAL_TRIGGERS.includes(run?.trigger) && run?.requested_by != null;

export const getRunActorId = (run, schedule) =>
  isStartedByUser(run) ? run.requested_by : schedule?.owner?.id;
