import { SIDEBAR_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/sidebarTourTargets.constants';

import { NOTIFICATIONS_TOUR_TARGETS } from './notificationsTourTargets.constants';

export const NOTIFICATIONS_TOUR_ID = 'notifications';

export const NOTIFICATIONS_TOUR_COMPLETION = {
  keepExploring: [],
};

export const notificationsTourSteps = [
  {
    id: 'what-is-notifications',
    target: NOTIFICATIONS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What is the Notification Center?',
    content: `The Notification Center keeps you informed about platform events — published agents, indexing results, bucket expiration warnings, token expiry alerts, and more. Notifications arrive in real time via a live connection; a dot indicator on the sidebar button signals unread items.`,
  },
  {
    id: 'quick-panel',
    target: SIDEBAR_TOUR_TARGETS.notifications,
    placement: 'right',
    title: 'Quick Panel',
    content: `Click the **Notifications** button in the sidebar to open a popover panel showing your unread notifications at a glance. Each entry displays an icon, message, and relative timestamp. Click any embedded link to navigate directly to the relevant page.

The panel does not mark notifications as read when opened — notifications are marked read only when you visit the full Notification Center page. Click **View all** to open the full page, or click outside the panel to close it.`,
  },
  {
    id: 'notification-center-page',
    target: NOTIFICATIONS_TOUR_TARGETS.toolbar,
    placement: 'bottom',
    title: 'Notification Center Page',
    content: `The full Notification Center page shows all notifications — read and unread — with tools to manage them:

- **Search** — filter notifications by keyword
- **Sort** — order by date
- **Mark as read** — mark individual notifications or all at once
- **Bulk delete** — select multiple notifications and delete them in one action

Notifications are generated automatically by platform events. Current notification types include:

- **Moderator approved version** — an agent version you submitted was approved for publishing
- **Moderator rejected version** — an agent version you submitted was rejected
- **Agent unpublished** — a published agent version was removed from Agents Studio
- **User added to conversation** — you were added to a shared conversation
- **Project created** — a new project was successfully created
- **Index data changed (success)** — a toolkit index was created or reindexed successfully
- **Index data changed (failed)** — an indexing operation failed
- **Bucket expiration warning** — a bucket will begin deleting files within 24 hours
- **Personal access token expiring** — a personal token will expire within 24 hours`,
  },
];
