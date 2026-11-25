import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  RUN_STATUS_STYLES,
  STATUS_FILTER_KEYS,
} from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { INDEX_RUN_EVENTS } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexRunHistoryRow.helpers';

// URL params of the toolkit filters (ticket #7682, AC-39, AC-40)
const PARAMS = { event: 'index_event', index: 'index', status: 'run_status' };
const RUN_OUTCOME_PARAM = 'run_outcome';
const NO_QUERY_PARAMS = {};

// The statuses of toolkit and index runs (AC-38), in the design's order; Partial and Stopped are index-only
const STATUS_KEYS = STATUS_FILTER_KEYS.toolkit;
// The statuses a tool-call (conversation) run can have on the server (run_outcome)
const CONVERSATION_OUTCOMES = ['running', 'success', 'failed'];
// The index events an index run carries today. Index created and Search index are not produced by the list yet.
const EVENT_LABELS = [INDEX_RUN_EVENTS.indexing, INDEX_RUN_EVENTS.reindex, INDEX_RUN_EVENTS.scheduledReindex];

const EVENT_OPTIONS = EVENT_LABELS.map(label => ({ label, value: label }));
const STATUS_OPTIONS = STATUS_KEYS.map(value => ({
  label: RUN_STATUS_STYLES[value].label,
  value,
  color: RUN_STATUS_STYLES[value].color,
}));

// A comma list in the URL; unknown items are dropped and a repeated item counts once
const readList = (searchParams, name) =>
  (searchParams.get(name) ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index);

const toSet = key => new Set(key ? key.split(',') : []);

export const useToolkitRunFilters = ({ indexNames = [], enabled = true } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // The Index filter is drawn only when the toolkit has more than one index (AC-40)
  const indexOptions = useMemo(
    () => (enabled && indexNames.length > 1 ? indexNames.map(name => ({ label: name, value: name })) : []),
    [enabled, indexNames],
  );
  const indexChoices = useMemo(() => indexOptions.map(option => option.value), [indexOptions]);

  const eventValues = enabled
    ? readList(searchParams, PARAMS.event).filter(value => EVENT_LABELS.includes(value))
    : [];
  const indexValues = readList(searchParams, PARAMS.index).filter(value => indexChoices.includes(value));
  const statusValues = enabled
    ? readList(searchParams, PARAMS.status).filter(value => STATUS_KEYS.includes(value))
    : [];

  const eventKey = eventValues.join(',');
  const indexKey = indexValues.join(',');
  const statusKey = statusValues.join(',');
  const serverOutcomeKey = statusValues.filter(value => CONVERSATION_OUTCOMES.includes(value)).join(',');

  const eventSet = useMemo(() => toSet(eventKey), [eventKey]);
  const indexSet = useMemo(() => toSet(indexKey), [indexKey]);
  const statusSet = useMemo(() => toSet(statusKey), [statusKey]);

  // An Event or Index tick leaves out the tool-call rows (AC-39, AC-40). A status no conversation can have does too.
  const showConversations = enabled && !eventKey && !indexKey && (!statusKey || Boolean(serverOutcomeKey));

  const queryParams = useMemo(
    () =>
      showConversations && serverOutcomeKey ? { [RUN_OUTCOME_PARAM]: serverOutcomeKey } : NO_QUERY_PARAMS,
    [showConversations, serverOutcomeKey],
  );

  // Index runs are all loaded, so their filter runs here on the rows the page holds
  const filterIndexRows = useCallback(
    rows =>
      rows.filter(
        row =>
          (!eventSet.size || eventSet.has(row.event_label)) &&
          (!indexSet.size || indexSet.has(row.index_name)) &&
          (!statusSet.size || statusSet.has(row.run_status)),
      ),
    [eventSet, indexSet, statusSet],
  );

  // Writes the whole list for one filter; an empty list removes its param
  const setList = useCallback(
    (name, values) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (values.length) next.set(name, values.join(','));
          else next.delete(name);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handlers = useMemo(
    () => ({
      event: values => setList(PARAMS.event, values),
      index: values => setList(PARAMS.index, values),
      status: values => setList(PARAMS.status, values),
    }),
    [setList],
  );

  const onClear = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        Object.values(PARAMS).forEach(name => next.delete(name));
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const values = useMemo(
    () => ({ event: eventValues, index: indexValues, status: statusValues }),
    // The keys stand for the arrays, so the object keeps its identity until a filter really changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventKey, indexKey, statusKey],
  );

  const options = useMemo(
    () => ({ event: EVENT_OPTIONS, index: indexOptions, status: STATUS_OPTIONS }),
    [indexOptions],
  );

  return {
    values,
    options,
    handlers,
    queryParams,
    showConversations,
    filterIndexRows,
    hasFilters: Boolean(eventKey || indexKey || statusKey),
    onClear,
  };
};
