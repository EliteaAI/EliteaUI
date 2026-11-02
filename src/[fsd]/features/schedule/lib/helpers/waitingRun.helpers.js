export const WAITING_NEED = { CREDENTIAL: 'credential', SIGN_IN: 'sign_in' };

const CREDENTIAL_TEXT = /credential\s+(.+?)\s+not found\./i;
const SIGN_IN_TEXT = /a sign-in is needed for\s+(.+?)\s*(?:\.|$)/i;
const TOOLKIT_TEXT = /toolkit\s+["']?([^"'.]+?)["']?(?:\s|\.|$)/i;

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

  const missing = CREDENTIAL_TEXT.exec(text);
  if (missing)
    return {
      need: WAITING_NEED.CREDENTIAL,
      toolkit: unquote(toolkit) ?? unquote(TOOLKIT_TEXT.exec(text)?.[1]),
      credential: unquote(credential) ?? unquote(missing[1]),
    };
  const signIn = SIGN_IN_TEXT.exec(text);
  if (signIn) return { need: WAITING_NEED.SIGN_IN, toolkit: unquote(toolkit) ?? unquote(signIn[1]) };
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
