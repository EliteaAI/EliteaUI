import RouteDefinitions from '@/routes';

import { CREDENTIALS_TOUR_TARGETS } from './credentialsTourTargets.constants';
import { CREDENTIALS_TOUR_ID, SECRETS_TOUR_ID } from './tourIds.constants';

export { CREDENTIALS_TOUR_ID };

export const CREDENTIALS_TOUR_COMPLETION = {
  keepExploring: [
    {
      label: 'Secrets',
      tourId: SECRETS_TOUR_ID,
      path: RouteDefinitions.SettingsWithTab.replace(':tab', 'secrets'),
    },
  ],
};

export const credentialsTourSteps = [
  {
    id: 'what-is-credentials',
    target: CREDENTIALS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What are ELITEA Credentials?',
    content: `ELITEA Credentials are saved authentication configurations that let agents, pipelines, and toolkits securely connect to external services. Instead of entering API keys or passwords each time you configure a toolkit, you store them once as a credential and reference that credential by name wherever it is needed.

Credentials are reusable across multiple toolkits and projects, and they can be kept private or shared with team members.`,
  },
  {
    id: 'credential-fields',
    target: CREDENTIALS_TOUR_TARGETS.form,
    placement: 'right',
    title: 'Credential Fields',
    content: `Every credential includes these core fields:

- **ID** — a unique internal name used to link this credential to toolkits; auto-generated from the Display Name but can be edited
- **Display Name** — a short, human-friendly label shown in credential lists and toolkit selection dropdowns
- **Type-specific fields** — the actual authentication data required by the chosen service; varies by integration type and may include API keys, server URLs, usernames and passwords, OAuth client IDs and secrets, or discovery endpoints; required fields are marked and must be filled before saving`,
  },
  {
    id: 'test-connection',
    target: CREDENTIALS_TOUR_TARGETS.testConnection,
    placement: 'right',
    title: 'Test Connection',
    content: `For supported credential types, a **Test Connection** button verifies that the provided authentication details are valid before saving. The button is enabled only when all required fields are filled in.

If the test succeeds, a confirmation message appears. If it fails, the error is shown inline next to the relevant field so you can correct it immediately.`,
  },
];
