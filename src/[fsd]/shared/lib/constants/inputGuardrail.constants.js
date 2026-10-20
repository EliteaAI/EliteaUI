// Input guardrail (#6886). The backend sets `input_guardrail` on the socket event and
// the stored message meta; only rule ids and categories travel, never the detected value.
export const INPUT_GUARDRAIL_ACTIONS = {
  BLOCK: 'block',
  REDACT: 'redact',
  WARN: 'warn',
  RECORD: 'record',
};

// Keyed by the backend's message_key, so wording can change here without a server change.
// An unknown key falls back to the server-provided message.
export const INPUT_GUARDRAIL_BLOCK_MESSAGES = {
  'input_guardrail.blocked.credentials':
    'Your message appears to contain a credential. It was not sent to the model. Remove it, or store it as a project secret and reference it instead.',
  'input_guardrail.blocked.personal_data':
    'Your message appears to contain personal data. It was not sent to the model. Remove it and send again.',
  'input_guardrail.blocked.instructions':
    "This agent's instructions appear to contain a credential or personal data, so the turn was not sent to the model. Ask the agent's owner to remove it or store it as a project secret.",
  'input_guardrail.blocked.error':
    'Your message could not be checked by the input guardrail, so it was not sent to the model.',
};

export const INPUT_GUARDRAIL_REDACT_MESSAGE =
  'Part of your message looked like a credential or personal data and was masked before it was stored or sent to the model.';

export const INPUT_GUARDRAIL_WARN_MESSAGE =
  'Your message appears to contain a credential or personal data. It was sent as typed.';
