import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import RadioButtonGroup from '@/[fsd]/shared/ui/checkbox/RadioButtonGroup';
import EntityTypeIcon from '@/[fsd]/shared/ui/icon/EntityTypeIcon';
import LazySelect from '@/[fsd]/shared/ui/select/LazySelect';
import { useApplicationListQuery } from '@/api/applications';

const TYPE_ITEMS = [
  { value: 'agent', label: 'Agent' },
  { value: 'pipeline', label: 'Pipeline' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_ITEMS.map(({ value, label }) => [value, label]));
const AGENTS_TYPE = { agent: 'classic', pipeline: 'pipeline' };

const ScheduleEntitySection = memo(
  ({
    type,
    applicationId,
    details,
    lockActive,
    lockFailed,
    readOnly,
    error,
    onTypeChange,
    onEntityChange,
  }) => {
    const projectId = useSelectedProjectId();
    const [list, setList] = useState({ page: 0, query: '' });

    const {
      data: listData,
      isFetching,
      isError: isListError,
      originalArgs: listArgs,
    } = useApplicationListQuery({
      projectId,
      page: list.page,
      params: { query: list.query, agents_type: AGENTS_TYPE[type] },
    });
    // A failed page keeps the loaded items and gives its page back, so the next scroll asks the same offset
    useEffect(() => {
      if (isListError && list.page > 0 && listArgs?.page === list.page)
        setList(prev => ({ ...prev, page: prev.page - 1 }));
    }, [isListError, listArgs, list.page]);

    const options = useMemo(() => {
      const rows = listData?.rows ?? [];
      const withSelected = details && !rows.some(row => row.id === details.id) ? [details, ...rows] : rows;
      return withSelected.map(({ id, name }) => ({
        value: id,
        label: name,
        icon: (
          <EntityTypeIcon
            type={type}
            showBigIcon={false}
          />
        ),
      }));
    }, [listData, details, type]);

    const handleTypeChange = useCallback(
      nextType => {
        onTypeChange(nextType);
        setList({ page: 0, query: '' });
      },
      [onTypeChange],
    );

    return (
      <>
        {lockFailed && (
          <BannerMessage
            message="The entity is not available."
            variant="warning"
          />
        )}
        <RadioButtonGroup
          testId="schedule-type"
          items={TYPE_ITEMS}
          value={type}
          onChange={handleTypeChange}
          disabled={lockActive}
        />
        <LazySelect
          required
          showOptionIcon
          showEmptyPlaceholder={false}
          label={TYPE_LABEL[type]}
          value={applicationId}
          onValueChange={onEntityChange}
          options={options}
          total={listData?.total}
          isFetching={isFetching}
          onLoadMore={() => setList(prev => ({ ...prev, page: prev.page + 1 }))}
          searchString={list.query}
          onSearch={query => setList({ page: 0, query })}
          disabled={lockActive || readOnly}
          error={!!error}
          helperText={error}
        />
        {/* the borderless select shows no helper text itself */}
        {error && (
          <Typography
            variant="bodySmall"
            color="error"
          >
            {error}
          </Typography>
        )}
      </>
    );
  },
);

ScheduleEntitySection.displayName = 'ScheduleEntitySection';

export default ScheduleEntitySection;
