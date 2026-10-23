export const DEFAULT_PIPELINE_NAME_PREFIX = 'Pipeline';

// Suggests a name from the project's pipeline count. It can collide after deletions or renames;
// the user can edit it and the backend validation error is shown on the Name field.
export const getDefaultPipelineName = (pipelinesTotal = 0) => {
  const total = Number.isInteger(pipelinesTotal) && pipelinesTotal > 0 ? pipelinesTotal : 0;

  return `${DEFAULT_PIPELINE_NAME_PREFIX} ${total + 1}`;
};
