import { ADMIN_ROLE_NAME } from '@/[fsd]/features/settings/lib/constants/users.constants.js';

export const hasAdminRole = user =>
  (user?.roles ?? []).some(role => String(role).toLowerCase() === ADMIN_ROLE_NAME);

// An admin must not remove themselves from a project, otherwise nobody may be left to manage it
export const isSelfAdmin = (user, currentUserId) =>
  currentUserId != null && Number(user?.id) === Number(currentUserId) && hasAdminRole(user);
