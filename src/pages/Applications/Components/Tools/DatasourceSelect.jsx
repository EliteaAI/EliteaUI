import { useMemo, useState } from 'react';

import { useDatasourceDetailsQuery } from '@/api/datasources';
import { isUUID } from '@/common/utils';
import SingleSelectWithSearch from '@/components/SingleSelectWithSearch';
import { useDatasourcesOptions } from '@/hooks/useDatasourcesOptions';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

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

  return (
    <SingleSelectWithSearch
      required={required}
      label="Datasource"
      value={value}
      onValueChange={onValueChange}
      searchString={query}
      onSearch={setQuery}
      options={dataSourceOptions}
      isFetching={isFetching}
      onLoadMore={onLoadMore}
      error={error}
      helperText={helperText}
      {...datasourceProps}
    />
  );
}
