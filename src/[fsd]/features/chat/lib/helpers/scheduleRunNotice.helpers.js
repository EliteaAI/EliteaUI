// The event has no project_id, so the match uses the selected project and the agent id.
// An event that carries a project_id must still agree with the selected project.
export const findNoticeAgent = (event, participants, projectId) => {
  if (event?.project_id != null && event.project_id !== projectId) return undefined;
  return participants?.find(
    ({ entity_name, entity_meta }) =>
      entity_name === 'application' &&
      entity_meta?.id === event?.entity_id &&
      (entity_meta?.project_id ?? projectId) === projectId
  );
};
