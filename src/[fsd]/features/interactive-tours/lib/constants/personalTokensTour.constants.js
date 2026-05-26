import RouteDefinitions from '@/routes';

import { PERSONAL_TOKENS_TOUR_TARGETS } from './personalTokensTourTargets.constants';
import { PERSONAL_TOKENS_TOUR_ID, SECRETS_TOUR_ID } from './tourIds.constants';

export { PERSONAL_TOKENS_TOUR_ID };

export const PERSONAL_TOKENS_TOUR_COMPLETION = {
  keepExploring: [
    {
      label: 'Secrets',
      tourId: SECRETS_TOUR_ID,
      path: RouteDefinitions.SettingsWithTab.replace(':tab', 'secrets'),
    },
  ],
};

export const personalTokensTourSteps = [
  {
    id: 'what-is-personal-tokens',
    target: PERSONAL_TOKENS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What are Personal Tokens?',
    content: `Personal Tokens are authentication credentials that give external tools and IDE integrations secure access to ELITEA on your behalf. Each token is tied to your user account and can be scoped with an expiration period.

Tokens are used primarily to connect ELITEA-compatible IDE extensions (VS Code, JetBrains) and to authenticate API calls made outside the platform.`,
  },
  {
    id: 'creating-a-token',
    target: PERSONAL_TOKENS_TOUR_TARGETS.addButton,
    placement: 'left',
    title: 'Creating a Token',
    content: `Click **+** to open the token creation form. Enter a descriptive name and choose an expiration period:

- **Never** — no expiry; suitable for personal development environments and long-lived integrations
- **Days / Weeks** — standard tokens with a defined rotation schedule
- **Hours / Minutes** — short-lived tokens for temporary access or testing

After clicking **Generate**, the full token value is shown once. Copy and store it immediately — it cannot be retrieved after the dialog is closed.`,
  },
  {
    id: 'token-list',
    target: PERSONAL_TOKENS_TOUR_TARGETS.tokenList,
    placement: 'right',
    title: 'Token List',
    content: `All created tokens are displayed in a table showing each token's name, a masked value (last 4 characters visible), and expiration status. Tokens expiring within 7 days show a warning indicator; expired tokens are marked clearly.

Use the search field to find tokens by name, sort by name or expiration date, and adjust the number of tokens shown per page.`,
  },
  {
    id: 'ide-settings',
    target: PERSONAL_TOKENS_TOUR_TARGETS.ideSettings,
    placement: 'left',
    title: 'IDE Settings',
    content: `Each token can generate pre-configured settings files for supported IDEs, so you can connect your editor to ELITEA without manually entering credentials:

- **VS Code** — downloads \`settings.json\` pre-filled with your server URL, project ID, model, and token
- **JetBrains** — downloads \`alita.xml\` with equivalent settings for JetBrains IDEs

Use the **preview** (eye) icon to view and copy the IDE settings content before downloading.`,
  },
];
