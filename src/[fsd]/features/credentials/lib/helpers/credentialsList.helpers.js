export const credentialsListQueryArgs = ({ projectId, section, type }) => ({
  projectId,
  page: 0,
  pageSize: 500,
  sharedOffset: 0,
  sharedLimit: 500,
  includeShared: true,
  section,
  type,
});
