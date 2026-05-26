import RouteDefinitions from '@/routes';

import { AI_CONFIG_TOUR_ID, USERS_TOUR_ID } from './tourIds.constants';
import { USERS_TOUR_TARGETS } from './usersTourTargets.constants';

export { USERS_TOUR_ID };

export const USERS_TOUR_COMPLETION = {
  keepExploring: [
    {
      label: 'AI Configuration',
      tourId: AI_CONFIG_TOUR_ID,
      path: RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration'),
    },
  ],
};

export const usersTourSteps = [
  {
    id: 'what-is-users',
    target: USERS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What is the Users Settings?',
    content: `The Users section is where project administrators manage who has access to a project and what they can do. Each user is assigned one or more roles that control their permissions across agents, pipelines, credentials, and other project resources.

Only users with the **Admin** role can invite or manage other users.`,
  },
  {
    id: 'inviting-users',
    target: USERS_TOUR_TARGETS.inviteButton,
    placement: 'left',
    title: 'Inviting Users',
    content: `Click **+ Invite users** to open the invitation dialog. Enter one or more email addresses (comma-separated), select the role(s) to assign, and send. All addresses in the batch receive the same role assignment. Invited users are added to the project immediately and can log in with their existing ELITEA account.`,
  },
  {
    id: 'user-table',
    target: USERS_TOUR_TARGETS.userList,
    placement: 'right',
    title: 'User Table',
    content: `All project members are listed with their name, email, last login date, and assigned role(s). The table supports search by name, email, or role, sorting by any column, and pagination for large teams.`,
  },
  {
    id: 'managing-users',
    target: USERS_TOUR_TARGETS.userActions,
    placement: 'left',
    title: 'Roles & Managing Users',
    content: `Each user is assigned one or more roles that determine what they can do within the project. Roles can be combined — the user has the union of all their permissions:

- **System** — highest-privilege; includes all Admin capabilities plus platform-level operations
- **Admin** — full project access including user management and all configuration settings
- **Editor** — can create and modify content; cannot delete or access admin settings
- **Viewer** — read-only access; cannot create or modify anything
- **Monitor** — lightweight role for observing activity and usage statistics

Click the **Edit** icon to change a user's roles. For bulk changes, select multiple users and use the batch **Edit** or **Delete** button in the table header.`,
  },
];
