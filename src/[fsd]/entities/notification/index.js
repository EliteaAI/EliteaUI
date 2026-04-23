// Public API of the notification entity.
//
// Consumers outside this folder MUST import from this barrel only —
// the DSL primitives (tpl, var, link, status, textsOf, varsOf) are
// intentionally not re-exported. They are authoring tools used inside
// notificationTemplates.js and should stay internal so the DSL can
// evolve without breaking external code.

export {
  ALL_VARIABLE_KEYS,
  NOTIFICATION_TEMPLATES,
  STATIC_SEARCH_INDEX,
  buildNotificationQueryFilters,
  deriveRenderState,
  formatUsersForTemplate,
} from './lib/notificationTemplates';
