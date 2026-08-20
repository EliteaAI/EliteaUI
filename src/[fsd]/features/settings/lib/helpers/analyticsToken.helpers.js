export const tokenStats = item => {
  const toNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0);

  const input = toNumber(
    item?.input_tokens ??
      item?.total_input_tokens ??
      item?.input_token ??
      item?.prompt_tokens ??
      item?.total_prompt_tokens ??
      item?.input,
  );
  const output = toNumber(
    item?.output_tokens ??
      item?.total_output_tokens ??
      item?.output_token ??
      item?.completion_tokens ??
      item?.total_completion_tokens ??
      item?.output,
  );
  const cacheRead = toNumber(item?.cache_read_tokens ?? item?.total_cache_read_tokens ?? item?.cacheRead);
  const cacheWrite = toNumber(
    item?.cache_creation_tokens ?? item?.total_cache_creation_tokens ?? item?.cacheWrite,
  );
  const totalCandidate = item?.total_tokens ?? item?.tokens_total ?? item?.total;
  const total = Number.isFinite(Number(totalCandidate))
    ? Number(totalCandidate)
    : input + output + cacheRead + cacheWrite;
  return { total, input, output, cacheRead, cacheWrite };
};
