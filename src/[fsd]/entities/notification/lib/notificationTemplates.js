/**
 * Declarative catalog of notification message templates.
 *
 * Each entry maps a NotificationType to a `tpl` template. The same declaration
 * drives:
 *   - rendering (via renderTemplate in NotificationListItemMessage),
 *   - static search (STATIC_SEARCH_INDEX),
 *   - dynamic meta-key search (ALL_VARIABLE_KEYS),
 *   - query classification (buildNotificationQueryFilters).
 *
 * Not every NotificationType is templated yet — types with complex inline
 * structures (AgentUnpublished, ChatUserAdded, Rates, Comments,
 * ContributorRequestForPublishApprove) remain on the legacy parseInformation
 * path in NotificationListItemMessage. Unmapped types fall through cleanly.
 */
import { NotificationType } from '@/common/constants';

import { link, linkText, status, textsOf, tpl, variable as v, varsOf } from './templateDSL';

export const NOTIFICATION_TEMPLATES = {
  [NotificationType.BucketExpirationWarning]: tpl`Bucket ${link('bucket_name', {
    id: 'bucket_name',
    isNewTab: true,
  })} will start deleting files in 24 hours according to its retention policy (files are removed based on each file's creation date; the bucket itself will remain).`,

  [NotificationType.IndexDataChanged]: tpl`Index ${link('index_name', {
    id: 'toolkit_id',
    indexName: 'index_name',
    isNewTab: true,
  })} ${status('_renderState', {
    failed: 'is failed.',
    reindexed_scheduled: 'is successfully reindexed by schedule.',
    reindexed: 'is successfully reindexed.',
    created: 'is successfully created.',
  })}`,

  [NotificationType.PrivateProjectCreated]: tpl`Project was successfully created.`,

  [NotificationType.UserWasAddedToSomeProjectAsTeammate]: tpl`${v('users')} added into ${link(
    'project_name',
  )}.`,

  [NotificationType.RewardNewLevel]: tpl`Congratulations! You've got ${v(
    'new_level',
  )} level of prompt expert!`,

  [NotificationType.TokenExpiring]: tpl`Token ${v(
    'token_name',
  )} will be expired in 5 days. For more details view your ${linkText('Configuration')}.`,
  [NotificationType.TokenIsExpired]: tpl`Token ${v(
    'token_name',
  )} is expired! For more details view your ${linkText('Configuration')}.`,

  [NotificationType.SpendingLimitExpiring]: tpl`Your spending limit is expiring. For more details view your ${linkText(
    'settings section',
  )}.`,
  [NotificationType.SpendingLimitIsExpired]: tpl`Your spending limit is expired. For more details view your ${linkText(
    'settings section',
  )}.`,

  [NotificationType.PersonalAccessTokenExpiring]: tpl`Your personal access token ${v(
    'token_name',
  )} will expire in 24 hours. After expiration, it will no longer work. You can delete and recreate a new token if needed. ${linkText(
    'Manage Personal Access Tokens',
    { isNewTab: true },
  )}`,

  [NotificationType.ModeratorUnpublish]: tpl`${linkText('Configuration')} is unpublished after complaint.`,
  [NotificationType.AuthorApproval]: tpl`${linkText('Configuration')} is approved by ${v(
    'approver',
  )} for publishing.`,
  [NotificationType.AuthorReject]: tpl`${linkText('Configuration')} is rejected by ${v('rejecter')}.`,
  [NotificationType.ModeratorApprovalOfVersion]: tpl`${linkText('Configuration')} is published.`,
  [NotificationType.ModeratorRejectOfVersion]: tpl`${linkText('Configuration')} is rejected.`,
};

/**
 * IndexDataChanged uses a synthetic `_renderState` key because the branch
 * selector depends on multiple real meta fields (error, reindex, initiator),
 * not a single status column. Call this before passing meta to renderTemplate.
 */
export const deriveRenderState = meta => {
  if (!meta) return null;
  if (meta.error && String(meta.error).trim()) return 'failed';
  if (meta.reindex) return meta.initiator === 'schedule' ? 'reindexed_scheduled' : 'reindexed';
  return 'created';
};

/**
 * Synthesise the `users` display string for the
 * UserWasAddedToSomeProjectAsTeammate template.
 * Joins the array with commas and appends the correct verb ('are'/'is').
 * Returns an empty string when the list is empty or meta is absent.
 */
export const formatUsersForTemplate = meta => {
  const users = Array.isArray(meta?.users) ? meta.users : [];
  return users.length ? `${users.join(', ')} ${users.length > 1 ? 'are' : 'is'}` : '';
};

/**
 * Flat list of static-text entries derived from the catalog. Each entry
 * records the lower-cased text, the notification type it came from, and —
 * when the text came from a `status(...)` case — which case produced it.
 *
 *   { text: string, type: string, status?: { metaKey, caseKey } }
 *
 * The `status` annotation lets query classification narrow a type to only
 * the branches whose rendered text actually matches the query, fixing
 * false positives like `"success"` returning failed-index rows.
 *
 * Trade-off: this index is built once at module load. With the current
 * catalog (~8 templates, ~15 entries) the cost is negligible vs. app
 * bootstrap and the eager build keeps lookups synchronous and lock-free.
 * If the catalog grows past the low hundreds of templates, consider
 * switching to a lazy (memoised) build on first search instead.
 */
export const STATIC_SEARCH_INDEX = Object.entries(NOTIFICATION_TEMPLATES).flatMap(([type, tplParsed]) =>
  textsOf(tplParsed)
    // Whitespace-only segments (e.g. the single space between two placeholders)
    // carry no search signal and, if indexed, would make any multi-word query
    // spuriously match this type. Drop them here.
    .filter(entry => entry.text.trim())
    .map(entry => ({
      text: entry.text.toLowerCase(),
      type,
      ...(entry.status ? { status: entry.status } : {}),
    })),
);

/**
 * Union of all meta keys referenced by any templated notification. The BE
 * uses this list as a whitelist of JSONB keys to scan for dynamic (value)
 * search matches — avoiding the false-positive leak of casting the entire
 * meta JSON to text.
 */
export const ALL_VARIABLE_KEYS = [...new Set(Object.values(NOTIFICATION_TEMPLATES).flatMap(varsOf))];

/**
 * Translate a free-text search into BE-friendly filters.
 *
 * Strategy: tokenize the query on whitespace and classify each token
 * independently. Each token is projected against three axes:
 *
 *   1. Static (text index): find entries in STATIC_SEARCH_INDEX whose text
 *      contains the token. Entries are partitioned per event_type:
 *        - If any match is *unconstrained* (plain text segment), the type
 *          is emitted in `eventTypes` — BE matches all rows of that type.
 *        - Otherwise, matches are all from specific `status(...)` cases —
 *          emit a narrowed filter in `eventTypeStatuses` carrying the
 *          set of matching case keys, which the BE translates into
 *          per-branch SQL predicates.
 *   2. event_type ILIKE (implicit on BE).
 *   3. Dynamic (meta values): the BE has a hardcoded default whitelist of
 *      meta keys it scans per token, so we do not need to ship one in the
 *      URL. If a future FE template introduces a meta key the BE default
 *      doesn't know about yet, pass `ALL_VARIABLE_KEYS` here as a stopgap
 *      override until the BE catches up.
 *
 * The BE combines axes with OR within a token, and ANDs tokens together —
 * so a multi-word query like "index attach" needs every token to match
 * somewhere in a row (e.g. "index" via the type, "attach" via meta).
 */
export const buildNotificationQueryFilters = rawQuery => {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) {
    return { tokens: [] };
  }

  const rawTokens = q.split(/\s+/).filter(Boolean);
  // Preserve order, drop duplicates — a repeated token adds no selectivity.
  const seen = new Set();
  const uniqueTokens = [];
  for (const t of rawTokens) {
    if (!seen.has(t)) {
      seen.add(t);
      uniqueTokens.push(t);
    }
  }

  const tokens = uniqueTokens.map(token => {
    const matches = STATIC_SEARCH_INDEX.filter(entry => entry.text.includes(token));

    // Partition matches per type, tracking whether any match is unconstrained.
    const perType = new Map();
    for (const m of matches) {
      const bucket = perType.get(m.type) ?? { unconstrained: false, cases: new Map() };
      if (!m.status) {
        bucket.unconstrained = true;
      } else {
        const existing = bucket.cases.get(m.status.metaKey) ?? new Set();
        existing.add(m.status.caseKey);
        bucket.cases.set(m.status.metaKey, existing);
      }
      perType.set(m.type, bucket);
    }

    const eventTypes = [];
    const eventTypeStatuses = [];
    for (const [type, bucket] of perType) {
      if (bucket.unconstrained) {
        eventTypes.push(type);
        continue;
      }
      for (const [metaKey, caseSet] of bucket.cases) {
        eventTypeStatuses.push({ type, metaKey, values: [...caseSet] });
      }
    }

    return { token, eventTypes, eventTypeStatuses };
  });

  return { tokens };
};
