import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { useDatasourceDetailsQuery } from '@/api/datasources';
import { isUUID } from '@/common/utils';
import { useDatasourcesOptions } from '@/hooks/useDatasourcesOptions';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SCROLL_LOAD_MORE_THRESHOLD = 10;
const DEBOUNCE_DELAY_MS = 300;

export default function DatasourceSelect({
  onValueChange = () => {},
  value = '',
  required,
  error,
  helperText,
  datasourceProps = null,
  specifiedProjectId,
  extraDatasourceOption,
}) {
  const [query, setQuery] = useState('');
  const { data = {}, isFetching, onLoadMore } = useDatasourcesOptions({ query, specifiedProjectId });
  const originalOptions = useMemo(
    () => (data.rows || []).map(({ name, id, description }) => ({ label: name, value: id, description })),
    [data],
  );

  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );
  const { data: datasourceDetail = {} } = useDatasourceDetailsQuery(
    { projectId, datasourceId: value },
    { skip: !projectId || !value || isUUID(value) || originalOptions.find(option => option.value === value) },
  );

  const dataSourceOptions = useMemo(() => {
    const currentOptions = extraDatasourceOption
      ? [extraDatasourceOption, ...originalOptions]
      : originalOptions;
    if (datasourceDetail.id && value && !currentOptions.find(option => option.value === value)) {
      return [
        ...currentOptions,
        {
          label: datasourceDetail.name,
          value: datasourceDetail.id,
          description: datasourceDetail.description,
        },
      ];
    }
    return currentOptions;
  }, [datasourceDetail, extraDatasourceOption, originalOptions, value]);

  const loadMoreOnScroll = useMemo(
    () =>
      debounce(e => {
        const containerDom = e.target || {};
        const clientHeight = containerDom.clientHeight;
        const scrollHeight = containerDom.scrollHeight;
        const scrollTop = containerDom.scrollTop;
        const isReachBottom = scrollTop + clientHeight > scrollHeight - SCROLL_LOAD_MORE_THRESHOLD;
        if (isReachBottom && !isFetching) onLoadMore();
      }, DEBOUNCE_DELAY_MS),
    [isFetching, onLoadMore],
  );

  useEffect(
    () => () => {
      loadMoreOnScroll.clear();
    },
    [loadMoreOnScroll],
  );

  const handleValueChange = useCallback(
    selectedValue => {
      const opt = dataSourceOptions.find(o => o.value === selectedValue);
      if (opt) onValueChange(opt);
    },
    [dataSourceOptions, onValueChange],
  );

  return (
    <Select.SingleSelect
      required={required}
      label="Datasource"
      value={value}
      onValueChange={handleValueChange}
      withSearch
      searchFilterMode="remote"
      searchString={query}
      onSearch={setQuery}
      options={dataSourceOptions}
      isListFetching={isFetching}
      onScroll={loadMoreOnScroll}
      error={error}
      helperText={helperText}
      displayEmpty
      emptyPlaceholder="Select"
      showBorder
      showOptionDescription
      {...datasourceProps}
    />
  );
}
