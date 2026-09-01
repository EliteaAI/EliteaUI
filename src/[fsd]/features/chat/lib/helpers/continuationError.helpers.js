export const OUTPUT_CONTINUATION_EXHAUSTED = 'output_continuation_exhausted';

export const normalizeContinuationError = value => {
  if (!value || value.code !== OUTPUT_CONTINUATION_EXHAUSTED) return undefined;

  return {
    ...value,
    code: OUTPUT_CONTINUATION_EXHAUSTED,
    user_message:
      typeof value.user_message === 'string' && value.user_message.trim()
        ? value.user_message
        : 'Automatic continuation failed. The model response is incomplete.',
    partial_output: typeof value.partial_output === 'string' ? value.partial_output : '',
  };
};
