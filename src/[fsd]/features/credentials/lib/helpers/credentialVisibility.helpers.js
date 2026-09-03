/**
 * Visibility is derived from the project-scoped type catalogue so the policy stays on
 * the server and the UI never needs to know which types are privileged.
 *
 * Filtered here rather than in the configurations list endpoint because the agent
 * runtime reads that endpoint as the invoking user: hiding rows server-side resolves
 * nothing for editors and viewers and silently stops the project's tracing for everyone
 * but admins. This is presentation — the server-side create/edit gate is the control,
 * and anyone querying the API directly still sees the row.
 *
 * Accepted: pagination totals come from the server unadjusted, so a page can render
 * fewer rows than its reported count.
 */

export const getAllowedCredentialTypes = (configurationsAsSchema = []) =>
  new Set((configurationsAsSchema || []).map(config => config?.type).filter(Boolean));

export const isCredentialTypeAllowed = (allowedTypes, type) =>
  !allowedTypes?.size || !type || allowedTypes.has(type);

export const filterCredentialsByAllowedTypes = (credentials = [], allowedTypes) =>
  (credentials || []).filter(credential => isCredentialTypeAllowed(allowedTypes, credential?.type));

export const filterCredentialTagsByAllowedTypes = (tagList = [], allowedTypes) =>
  (tagList || []).filter(tag => isCredentialTypeAllowed(allowedTypes, tag?.data?.type));
