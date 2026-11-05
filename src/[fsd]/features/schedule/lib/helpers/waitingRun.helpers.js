export const WAITING_NEED = { CREDENTIAL: 'credential', SIGN_IN: 'sign_in' };

const CREDENTIAL_PREFIX = 'credential';
const CREDENTIAL_SUFFIX = 'not found.';
const SIGN_IN_PREFIX = 'a sign-in is needed for';
const TOOLKIT_TEXT = /toolkit\s+["']?([^"'.]+?)["']?(?:\s|\.|$)/i;

const isSpace = char => char !== undefined && char.trim() === '';

// The text between `prefix` and the first `suffix` after it (the end of the text when `suffix` is empty), both
// separated by whitespace and trimmed. Plain string search keeps the run time linear on long server text.
const textBetween = (text, prefix, suffix) => {
  const lower = text.toLowerCase();
  const start = lower.indexOf(prefix);
  if (start < 0 || !isSpace(text[start + prefix.length])) return undefined;
  const from = start + prefix.length;
  if (!suffix) return text.slice(from).trim() || undefined;
  const end = lower.indexOf(suffix, from);
  if (end < 0 || !isSpace(text[end - 1])) return undefined;
  return text.slice(from, end).trim() || undefined;
};

// The signed-in server name ends at the first full stop
const signInTarget = text => {
  const target = textBetween(text, SIGN_IN_PREFIX, '');
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
