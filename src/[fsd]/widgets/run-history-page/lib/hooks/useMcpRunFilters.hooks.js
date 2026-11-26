import { useCallback, useMemo, useState } from 'react';

import { STATUS_FILTER_KEYS } from '@/[fsd]/entities/run-history/lib/constants/runHistory.constants';

import { useRunHistoryFilters } from './useRunHistoryFilters.hooks';

const NO_SCHEDULES = [];
const NO_VERSIONS = [];

export const useMcpRunFilters = () => {
  const [toolNames, setToolNames] = useState([]);

  // Only grows, so ticking one tool never drops the others from the Event options
  const handleRowsChange = useCallback(rows => {
    const seen = rows.flatMap(row => row.tool_names ?? []);
    setToolNames(previous => {
      const merged = [...new Set([...previous, ...seen])].sort();
      return merged.length === previous.length ? previous : merged;
    });
  }, []);

  const { values, options, handlers, queryParams, hasFilters, onClear } = useRunHistoryFilters({
    schedules: NO_SCHEDULES,
    versions: NO_VERSIONS,
    toolNames,
    statusKeys: STATUS_FILTER_KEYS.mcp,
  });

  const mcpOptions = useMemo(
    () => ({ event: options.tool, status: options.status }),
    [options.tool, options.status],
  );
  const mcpHandlers = useMemo(
    () => ({ event: handlers.tool, status: handlers.status }),
    [handlers.tool, handlers.status],
  );

  return {
    values: { event: values.tool, status: values.status },
    options: mcpOptions,
    handlers: mcpHandlers,
    queryParams,
    hasFilters,
    onClear,
    handleRowsChange,
  };
};
