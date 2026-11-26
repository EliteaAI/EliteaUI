import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  RUN_STATUS_STYLES,
  STATUS_FILTER_KEYS,
} from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { INDEX_RUN_EVENTS } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexRunHistoryRow.helpers';

const PARAMS = { event: 'index_event', index: 'index', status: 'run_status' };
const RUN_OUTCOME_PARAM = 'run_outcome';
const NO_QUERY_PARAMS = {};

const STATUS_KEYS = STATUS_FILTER_KEYS.toolkit;
// Statuses a tool-call run can have (sent as run_outcome)
const CONVERSATION_OUTCOMES = ['running', 'success', 'failed'];
// Index created and Search index are not produced by the index list yet
const EVENT_LABELS = [INDEX_RUN_EVENTS.indexing, INDEX_RUN_EVENTS.reindex, INDEX_RUN_EVENTS.scheduledReindex];

const EVENT_OPTIONS = EVENT_LABELS.map(label => ({ label, value: label }));
const STATUS_OPTIONS = STATUS_KEYS.map(value => ({
  label: RUN_STATUS_STYLES[value].label,
  value,
  color: RUN_STATUS_STYLES[value].color,
}));

const readList = (searchParams, name) =>
  (searchParams.get(name) ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index);

const toSet = key => new Set(key ? key.split(',') : []);

export const useToolkitRunFilters = ({ indexNames = [], enabled = true } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Only drawn when the toolkit has more than one index
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

  // Event or Index ticks, or an index-only status, leave out the tool-call rows
  const showConversations = enabled && !eventKey && !indexKey && (!statusKey || Boolean(serverOutcomeKey));

  const queryParams = useMemo(
    () =>
      showConversations && serverOutcomeKey ? { [RUN_OUTCOME_PARAM]: serverOutcomeKey } : NO_QUERY_PARAMS,
    [showConversations, serverOutcomeKey],
  );

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
    // The joined keys stand in for the arrays
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
