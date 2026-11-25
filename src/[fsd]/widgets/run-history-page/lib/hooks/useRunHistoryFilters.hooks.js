import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  RUN_STATUS_STYLES,
  STATUS_FILTER_KEYS,
} from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';
import { toRunStatusLabel } from '@/[fsd]/entities/schedule';

import {
  EXECUTION_TYPE_PARAM,
  FILTER_PARAMS,
  NO_QUERY_PARAMS,
  TRIGGER_OPTIONS,
} from '../constants/runHistoryFilters.constants';

const WHOLE_NUMBER = /^[1-9]\d*$/;

// The Status options of one list: its own status keys, labelled and coloured as the design shows them
const statusOptionsOf = statusKeys =>
  statusKeys.map(value => ({
    label: RUN_STATUS_STYLES[value]?.label ?? toRunStatusLabel(value),
    value,
    color: RUN_STATUS_STYLES[value]?.color,
  }));
const EVENT_OPTIONS = TRIGGER_OPTIONS.map(({ label, value }) => ({ label, value }));

const paramOf = trigger => TRIGGER_OPTIONS.find(option => option.value === trigger)?.param;

// Multi-select values travel as a comma list in the URL. An unknown item is dropped, so a hand-edited link never
// sends a bad filter, and a repeated item counts once.
const readList = (searchParams, name, isValid) =>
  (searchParams.get(name) ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item && isValid(item))
    .filter((item, index, all) => all.indexOf(item) === index);

const isEvent = value => TRIGGER_OPTIONS.some(option => option.value === value);
const isWholeNumber = value => WHOLE_NUMBER.test(value);

export const useRunHistoryFilters = ({
  schedules = [],
  versions = [],
  toolNames = [],
  statusKeys = STATUS_FILTER_KEYS.agent,
} = {}) => {
  const statusOptions = useMemo(() => statusOptionsOf(statusKeys), [statusKeys]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Raw URL values; each is a plain array of strings
  const eventValues = readList(searchParams, FILTER_PARAMS.trigger, isEvent);
  const scheduleIds = readList(searchParams, FILTER_PARAMS.schedule, isWholeNumber);
  const versionIds = readList(searchParams, FILTER_PARAMS.version, isWholeNumber);
  // A status a link names that this list does not offer is dropped, so the filter never shows a hidden value
  const outcomes = readList(searchParams, FILTER_PARAMS.run_outcome, value => statusKeys.includes(value));
  // A tool a shared link names is kept before its runs load: the list only offers names the page has seen, but the
  // URL is the reader's own choice, and the server answers an unknown name
  const tools = readList(searchParams, FILTER_PARAMS.tool, value => value.length > 0);

  // The list API params. An Event value goes to `trigger` (a run trigger) or `execution_type` (Chat, API, MCP).
  // Keyed on the joined strings, so the object keeps its identity until a filter really changes.
  const eventKey = eventValues.join(',');
  const scheduleKey = scheduleIds.join(',');
  const versionKey = versionIds.join(',');
  const outcomeKey = outcomes.join(',');
  const toolKey = tools.join(',');

  const queryParams = useMemo(() => {
    const params = {};
    const runTriggers = eventKey
      .split(',')
      .filter(value => value && paramOf(value) === FILTER_PARAMS.trigger);
    const executionTypes = eventKey
      .split(',')
      .filter(value => value && paramOf(value) === EXECUTION_TYPE_PARAM);

    if (scheduleKey) params[FILTER_PARAMS.schedule] = scheduleKey;
    if (versionKey) params[FILTER_PARAMS.version] = versionKey;
    if (outcomeKey) params[FILTER_PARAMS.run_outcome] = outcomeKey;
    if (toolKey) params[FILTER_PARAMS.tool] = toolKey;
    if (runTriggers.length) params[FILTER_PARAMS.trigger] = runTriggers.join(',');
    if (executionTypes.length) params[EXECUTION_TYPE_PARAM] = executionTypes.join(',');

    return Object.keys(params).length ? params : NO_QUERY_PARAMS;
  }, [eventKey, scheduleKey, versionKey, outcomeKey, toolKey]);

  const scheduleOptions = useMemo(
    () => [
      ...schedules.map(schedule => ({ label: schedule.name, value: String(schedule.id) })),
      // A linked id the caller's list does not hold still shows, so the filter never hides a value in use
      ...scheduleIds
        .filter(id => !schedules.some(schedule => String(schedule.id) === id))
        .map(id => ({ label: `Schedule ${id}`, value: id })),
    ],
    [schedules, scheduleIds],
  );

  const versionOptions = useMemo(
    () => [
      ...versions.map(version => ({ label: version.name, value: String(version.id) })),
      ...versionIds
        .filter(id => !versions.some(version => String(version.id) === id))
        .map(id => ({ label: `Version ${id}`, value: id })),
    ],
    [versions, versionIds],
  );

  const toolOptions = useMemo(() => toolNames.map(name => ({ label: name, value: name })), [toolNames]);

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

  const onScheduleChange = useCallback(values => setList(FILTER_PARAMS.schedule, values), [setList]);
  const onOutcomeChange = useCallback(values => setList(FILTER_PARAMS.run_outcome, values), [setList]);
  const onVersionChange = useCallback(values => setList(FILTER_PARAMS.version, values), [setList]);
  const onToolChange = useCallback(values => setList(FILTER_PARAMS.tool, values), [setList]);
  const onEventChange = useCallback(values => setList(FILTER_PARAMS.trigger, values), [setList]);

  const onClear = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        Object.values(FILTER_PARAMS).forEach(name => next.delete(name));
        next.delete(EXECUTION_TYPE_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const hasFilters = queryParams !== NO_QUERY_PARAMS;

  return {
    // Ticked values per filter, as arrays of strings. The keys match the layout's filter keys.
    values: {
      event: eventValues,
      schedule: scheduleIds,
      status: outcomes,
      version: versionIds,
      tool: tools,
    },
    options: {
      event: EVENT_OPTIONS,
      schedule: scheduleOptions,
      status: statusOptions,
      version: versionOptions,
      tool: toolOptions,
    },
    handlers: {
      event: onEventChange,
      schedule: onScheduleChange,
      status: onOutcomeChange,
      version: onVersionChange,
      tool: onToolChange,
    },
    queryParams,
    hasFilters,
    onClear,
  };
};
