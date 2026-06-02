import { APPLICATIONS_TOUR_TARGETS } from './applicationsTourTargets.constants';
import { APPLICATIONS_TOUR_ID } from './tourIds.constants';

export { APPLICATIONS_TOUR_ID };

export const APPLICATIONS_TOUR_COMPLETION = {
  keepExploring: [],
};

export const applicationsTourSteps = [
  {
    id: 'what-is-applications',
    target: APPLICATIONS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What is Applications?',
    content: `The Applications menu is where you discover, request, and manage purpose-built AI applications that extend ELITEA beyond agents and pipelines. Each application provides a dedicated interface and a ready-to-use set of tools that can also be referenced in agents and pipelines.`,
  },
  {
    id: 'applications-tab',
    tabIndex: 0,
    target: APPLICATIONS_TOUR_TARGETS.applicationsTab,
    placement: 'bottom',
    title: 'Applications Tab',
    content: `The **Applications** tab lists all application instances configured in the current project. Use it to find, open, or manage existing applications.

- Supports **card view** and **table view**, search, and sort
- Use the **Types** panel on the right to filter by application type
- **Pin** frequently used applications to keep them at the top of the list`,
  },
  {
    id: 'app-catalog-tab',
    tabIndex: 1,
    target: APPLICATIONS_TOUR_TARGETS.catalogTab,
    placement: 'bottom',
    title: 'App Catalog Tab',
    content: `The **App Catalog** tab shows all application types available on the platform. This is where you browse what can be added to the current project before creating a configured application instance.`,
  },
  {
    id: 'catalog-actions',
    tabIndex: 1,
    target: APPLICATIONS_TOUR_TARGETS.catalogActions,
    placement: 'bottom',
    title: 'Application Actions',
    content: `Each card displays one primary action depending on your project's access level:

- **Configure** — opens the configuration form to create a new application instance
- **Request Access** — opens the request modal to submit an access request to your administrator
- **Pending approval** — confirms a request has already been submitted and is awaiting review`,
  },
  {
    id: 'documentation-link',
    tabIndex: 1,
    target: APPLICATIONS_TOUR_TARGETS.documentationLink,
    placement: 'bottom',
    title: 'Documentation',
    content: `Every application card includes a **Documentation** link that opens the application's reference documentation in a new tab. Use it to review capabilities, setup details, and usage guidance before configuring the app.`,
  },
  {
    id: 'wikis',
    tabIndex: 1,
    target: APPLICATIONS_TOUR_TARGETS.wikisCard,
    placement: 'bottom',
    title: 'Wikis',
    content: `**Wikis** turns a code repository into navigable documentation. It analyzes the repository structure and generates wiki pages with architecture summaries, source-linked explanations, and project Q&A support.

Use Wikis when your team needs onboarding material, implementation context, or durable knowledge for active repositories.`,
  },
  {
    id: 'inventory',
    tabIndex: 1,
    target: APPLICATIONS_TOUR_TARGETS.inventoryCard,
    placement: 'bottom',
    title: 'Inventory',
    content: `**Inventory** helps teams inspect the code estate, map important components, and understand relationships between services and dependencies before planning changes.

Use Inventory for modernization planning, impact analysis, service discovery, and engineering governance.`,
  },
];
