// The event has no project_id, so the match uses the selected project and the agent id.
// An event that carries a project_id must still agree with the selected project.
// Ids are compared as strings: the socket and the route can give a number or a string.
const sameId = (a, b) => String(a) === String(b);

export const findNoticeAgent = (event, participants, projectId) => {
  if (event?.entity_id == null) return undefined;
  if (event.project_id != null && !sameId(event.project_id, projectId)) return undefined;
  return participants?.find(
    ({ entity_name, entity_meta }) =>
      entity_name === 'application' &&
      sameId(entity_meta?.id, event.entity_id) &&
      sameId(entity_meta?.project_id ?? projectId, projectId),
  );
};
