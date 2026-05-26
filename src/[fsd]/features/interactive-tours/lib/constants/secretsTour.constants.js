import RouteDefinitions from '@/routes';

import { SECRETS_TOUR_TARGETS } from './secretsTourTargets.constants';
import { SECRETS_TOUR_ID, USERS_TOUR_ID } from './tourIds.constants';

export { SECRETS_TOUR_ID };

export const SECRETS_TOUR_COMPLETION = {
  keepExploring: [
    {
      label: 'Users',
      tourId: USERS_TOUR_ID,
      path: RouteDefinitions.SettingsWithTab.replace(':tab', 'users'),
    },
  ],
};

export const secretsTourSteps = [
  {
    id: 'what-is-secrets',
    target: SECRETS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What are ELITEA Secrets?',
    content: `Secrets are a secure store for sensitive values — passwords, API keys, tokens, and other credentials — managed at the project level. Instead of entering sensitive data directly into toolkit credentials, you store the value as a secret and reference it by name. The actual value is never exposed in the credential form.

Secrets are project-specific. Access requires an Editor, Admin, or System role — Viewer and Monitor roles cannot access this section.`,
  },
  {
    id: 'creating-a-secret',
    target: SECRETS_TOUR_TARGETS.addButton,
    placement: 'left',
    title: 'Creating a Secret',
    content: `Click **+** to add a new row to the secrets table. Enter a **Name** (letters, numbers, and underscores only — cannot be changed after creation) and a **Value**, then confirm with the checkmark. Secret names must be unique within the project and serve as the reference handle used in credential forms.`,
  },
  {
    id: 'secrets-table',
    target: SECRETS_TOUR_TARGETS.secretList,
    placement: 'right',
    title: 'Secrets Table',
    content: `All created secrets are displayed in a table showing each secret's name and a masked value. Click the masked value directly to copy it to the clipboard without revealing it, or click the **eye** icon in the Actions column to reveal a value inline.

Use the search field to find secrets by name and sort by name column.`,
  },
  {
    id: 'managing-secrets',
    target: SECRETS_TOUR_TARGETS.secretActions,
    placement: 'left',
    title: 'Managing Secrets',
    content: `Use the **three-dot menu** on any row to manage a secret:

- **Edit value** — update the stored value (the name is locked after creation)
- **Hide** — removes the secret from the table and selector without deleting it; existing integrations continue to work
- **Delete** — permanently removes the secret; any credentials referencing it will fail immediately

Use **Hide** instead of **Delete** if you want to preserve the value for existing integrations.`,
  },
];
