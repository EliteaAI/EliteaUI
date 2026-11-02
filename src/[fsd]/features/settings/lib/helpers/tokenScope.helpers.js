// Scoped, expiring API tokens (C-1009, #7336). The server checks the same rules again (auth_core add_token).
export const TOKEN_OPERATIONS = ['run', 'build', 'admin'];
export const DEFAULT_TOKEN_OPERATIONS = ['run'];
export const SCOPED_TOKEN_MAX_TTL_DAYS = 90;

const DAYS_PER = { days: 1, weeks: 7, hours: 1 / 24, minutes: 1 / 1440 };

export const OPERATION_LABELS = {
  run: 'Run agents and tools',
  build: 'Create and change entities',
  admin: 'Administer',
};

// How many days an expiry of `value` `measure` is; Infinity for "never"
export const expiryDays = (measure, value) => {
  const per = DAYS_PER[measure];
  return per === undefined ? Infinity : Number(value) * per;
};

// Why a scope cannot be used, or '' when it can
export const scopeError = ({ projects, operations, measure, expiration }) => {
  if (!projects?.length) return 'Select at least one project';
  if (!operations?.length) return 'Select at least one operation';
  if (expiryDays(measure, expiration) > SCOPED_TOKEN_MAX_TTL_DAYS)
    return `A restricted token expires within ${SCOPED_TOKEN_MAX_TTL_DAYS} days`;
  return '';
};

// The request fields of a scope: nothing for an unrestricted token
export const scopePayload = ({ restricted, projects, operations }) =>
  restricted
    ? {
        scope_projects: [...projects],
        scope_operations: TOKEN_OPERATIONS.filter(op => operations.includes(op)),
      }
    : {};

// What the token list shows in its Scope column
export const scopeLabel = token => {
  const projects = token?.scope_projects;
  const operations = token?.scope_operations;
  if (
    !token?.expires ||
    !Array.isArray(projects) ||
    !projects.length ||
    !Array.isArray(operations) ||
    !operations.length
  )
    return 'All projects · legacy';
  return `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · ${operations.join(', ')}`;
};
