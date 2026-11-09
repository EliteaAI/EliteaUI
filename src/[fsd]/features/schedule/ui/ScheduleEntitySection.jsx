import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import { TOOLKIT_INDEX_TYPE, useGetToolkitIndexOptionsQuery } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import EntityTypeIcon from '@/[fsd]/shared/ui/icon/EntityTypeIcon';
import LazySelect from '@/[fsd]/shared/ui/select/LazySelect';
import SingleSelect from '@/[fsd]/shared/ui/select/SingleSelect';
import { useApplicationListQuery } from '@/api/applications';
import { useToolkitsListQuery } from '@/api/toolkits';
import { PAGE_SIZE } from '@/common/constants.js';
import { useGetToolkitIconMeta } from '@/hooks/application/useLibraryToolkits';

import ScheduleSegmentedToggle from './ScheduleSegmentedToggle';

const TYPE_ITEMS = [
  { value: 'agent', label: 'Agent' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: TOOLKIT_INDEX_TYPE, label: 'Toolkit Index' },
];
const TYPE_LABEL = {
  agent: 'Agent',
  pipeline: 'Pipeline',
  [TOOLKIT_INDEX_TYPE]: 'Toolkit',
};
const AGENTS_TYPE = { agent: 'classic', pipeline: 'pipeline' };
const NO_TOOLKIT_HINT = 'Select a toolkit first to choose an index.';
const INDEX_SCHEDULED_HINT = 'This index already has a schedule';
const INDEX_NOT_SCHEDULABLE_HINT = 'This index has no saved settings. Run it once first.';

const ScheduleEntitySection = memo(props => {
  const {
    type,
    applicationId,
    toolkitId,
    indexName,
    details,
    lockFailed,
    readOnly,
    error,
    indexError,
    onTypeChange,
    onEntityChange,
    onToolkitChange,
    onIndexChange,
  } = props;

  const projectId = useSelectedProjectId();
  const isIndex = type === TOOLKIT_INDEX_TYPE;
  const getToolkitIconMeta = useGetToolkitIconMeta();
  const [list, setList] = useState({ page: 0, query: '' });

  const applicationList = useApplicationListQuery(
    {
      projectId,
      page: list.page,
      params: { query: list.query, agents_type: AGENTS_TYPE[type] },
    },
    { skip: isIndex },
  );
  // Only toolkits that have an index can be scheduled
  const toolkitList = useToolkitsListQuery(
    {
      projectId,
      page: list.page,
      page_size: PAGE_SIZE,
      params: { query: list.query, has_indexes: true },
    },
    { skip: !isIndex || !projectId },
  );
  const {
    data: listData,
    isFetching,
    isError: isListError,
    originalArgs: listArgs,
  } = isIndex ? toolkitList : applicationList;
  const {
    data: indexData,
    isFetching: isIndexFetching,
    isError: isIndexError,
  } = useGetToolkitIndexOptionsQuery({ projectId, toolkitId }, { skip: !isIndex || !toolkitId });
  // A failed page keeps the loaded items and gives its page back, so the next scroll asks the same offset
  useEffect(() => {
    if (isListError && list.page > 0 && listArgs?.page === list.page)
      setList(prev => ({ ...prev, page: prev.page - 1 }));
  }, [isListError, listArgs, list.page]);

  const options = useMemo(() => {
    const rows = listData?.rows ?? [];
    const withSelected = details && !rows.some(row => row.id === details.id) ? [details, ...rows] : rows;
    const iconStyles = scheduleEntitySectionStyles();
    return withSelected.map(row => ({
      value: row.id,
      label: isIndex ? (row.toolkit_name ?? row.name) : row.name,
      icon: isIndex ? (
        <EntityIcon
          sx={iconStyles.toolkitIcon}
          imageStyle={iconStyles.toolkitImage}
          showBackgroundColor={false}
          icon={getToolkitIconMeta(row)}
          entityType="toolkit"
          projectId=""
          editable={false}
        />
      ) : (
        <EntityTypeIcon
          type={type}
          showBigIcon={false}
        />
      ),
    }));
  }, [listData, details, type, isIndex, getToolkitIconMeta]);

  // A scheduled index, or one with no saved settings, is shown but cannot be chosen
  const indexOptions = useMemo(
    () =>
      (indexData ?? []).map(({ name, scheduled, schedulable }) => ({
        value: name,
        label: name,
        disabled: scheduled || !schedulable,
        description:
          (scheduled && INDEX_SCHEDULED_HINT) || (!schedulable && INDEX_NOT_SCHEDULABLE_HINT) || '',
      })),
    [indexData],
  );

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
      <ScheduleSegmentedToggle
        testId="schedule-type"
        items={TYPE_ITEMS}
        value={type}
        onChange={handleTypeChange}
      />
      <LazySelect
        required
        showOptionIcon
        showEmptyPlaceholder={false}
        data-testid={isIndex ? 'schedule-toolkit' : undefined}
        label={TYPE_LABEL[type]}
        value={isIndex ? toolkitId : applicationId}
        onValueChange={isIndex ? onToolkitChange : onEntityChange}
        options={options}
        total={listData?.total}
        isFetching={isFetching}
        onLoadMore={() => setList(prev => ({ ...prev, page: prev.page + 1 }))}
        searchString={list.query}
        onSearch={query => setList({ page: 0, query })}
        disabled={readOnly}
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
      {isIndex && (
        <>
          <SingleSelect
            required
            showOptionDescription
            showEmptyPlaceholder={false}
            data-testid="schedule-index"
            label="Index"
            value={indexName}
            onValueChange={onIndexChange}
            options={indexOptions}
            isListFetching={isIndexFetching}
            disabled={readOnly || !toolkitId}
            error={!!indexError}
            helperText={indexError}
          />
          {!toolkitId && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid="schedule-index-hint"
            >
              {NO_TOOLKIT_HINT}
            </Typography>
          )}
          {isIndexError && (
            <Typography
              variant="bodySmall"
              color="error"
            >
              The indexes did not load. Choose the toolkit again to retry.
            </Typography>
          )}
          {indexError && (
            <Typography
              variant="bodySmall"
              color="error"
            >
              {indexError}
            </Typography>
          )}
        </>
      )}
    </>
  );
});

ScheduleEntitySection.displayName = 'ScheduleEntitySection';

/** @type {MuiSx} */
const scheduleEntitySectionStyles = () => ({
  toolkitIcon: { minWidth: '1rem !important', width: '1rem !important', height: '1rem !important' },
  toolkitImage: { width: '1rem', height: '1rem', borderRadius: '50%' },
});

export default ScheduleEntitySection;
