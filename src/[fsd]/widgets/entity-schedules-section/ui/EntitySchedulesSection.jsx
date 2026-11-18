import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { Box, Link, Skeleton, Typography } from '@mui/material';

import {
  TOOLKIT_INDEX_TYPE,
  TRIGGER_KIND,
  buildScheduleFormLink,
  buildScheduleRunsLink,
  buildSchedulesListLink,
  useEntitySchedules,
  useGetToolkitIndexOptionsQuery,
  useOpenScheduleNested,
} from '@/[fsd]/entities/schedule';
import { ScheduleSectionConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

import EntityScheduleCard from './EntityScheduleCard';

const { SCHEDULES_SECTION_ID, WEBHOOKS_SECTION_ID } = ScheduleSectionConstants;

// kind 'webhook' turns the section into the editor Webhooks section
const KINDS = {
  [TRIGGER_KIND.cron]: {
    title: 'Schedules',
    noun: 'schedule',
    add: 'Schedule',
    link: 'Manage Schedules',
    id: SCHEDULES_SECTION_ID,
  },
  [TRIGGER_KIND.webhook]: {
    title: 'Webhooks',
    noun: 'webhook',
    add: 'Webhook',
    link: 'Manage Webhooks',
    id: WEBHOOKS_SECTION_ID,
  },
};

const WIDE = '@container (min-width: 30rem)';
// The name every agent and pipeline gives its first version
const BASE_VERSION_NAME = 'base';
const INDEX_SCHEDULED_HINT = 'This index already has a schedule';

// The last section of the agent and pipeline editors; entityType is 'agent' or 'pipeline'; versionId is the editor version, versionName its label (none or 'base': the base version)
// For entityType 'toolkit_index' the entityId is the toolkit id and indexName names the index; an index has one schedule
const EntitySchedulesSection = memo(props => {
  const {
    entityType,
    entityId,
    entityName,
    versionId,
    versionName,
    indexName,
    isChatView = false,
    style,
    kind = TRIGGER_KIND.cron,
  } = props;
  const config = KINDS[kind];
  // The Webhooks instance gets its own section ids; the shared skeleton keeps the schedules one
  const sectionTestId = `${entityType}-${config.noun}s-section`;
  const triggerKind = kind === TRIGGER_KIND.webhook ? kind : undefined;
  const isIndex = entityType === TOOLKIT_INDEX_TYPE;
  const { checkPermission } = useCheckPermission();
  const currentUserId = useSelector(state => state.user.id);
  const canCreate = checkPermission(PERMISSIONS.schedules.create);
  const isHidden = isChatView || !entityId || !checkPermission(PERMISSIONS.schedules.list);
  const { rows, total, isError, error, isFetching, refetch, loadMore, hasMore } = useEntitySchedules({
    entityType,
    entityId,
    versionId,
    indexName,
    triggerKind,
    skip: isHidden,
  });
  const projectId = useSelectedProjectId();
  // The schedule list keeps the rows the user may see; the index summary tells for every user whether the index has a schedule
  const { data: indexOptions } = useGetToolkitIndexOptionsQuery(
    { projectId, toolkitId: entityId },
    { skip: isHidden || !isIndex || kind !== TRIGGER_KIND.cron || !projectId },
  );
  const { tab } = useParams();
  // The form opens nested in the editor and comes back to this editor location
  const openNested = useOpenScheduleNested();
  // Edit keeps the version of its schedule; "+ Schedule" takes the editor version
  const versionOf = useCallback(
    scheduleId => rows.find(row => row.id === scheduleId)?.version_id ?? versionId,
    [rows, versionId],
  );
  const openForm = useCallback(
    scheduleId =>
      openNested(
        { pathname: buildScheduleFormLink({ entityType, entityId, indexName, tab, scheduleId, kind }) },
        versionOf(scheduleId),
      ),
    [openNested, versionOf, entityType, entityId, indexName, tab, kind],
  );
  const openRunHistory = useCallback(
    scheduleId =>
      openNested(
        buildScheduleRunsLink({ entityType, entityId, indexName, tab, scheduleId, kind }),
        versionOf(scheduleId),
      ),
    [openNested, versionOf, entityType, entityId, indexName, tab, kind],
  );
  const onAdd = useCallback(() => openForm(), [openForm]);
  const version =
    versionName && versionName !== BASE_VERSION_NAME ? `version ${versionName}` : 'the base version';
  const testId = `${entityType}-schedules-section`;
  const emptyText = isIndex ? 'No schedule runs this index yet.' : `No ${config.noun}s run ${version} yet.`;
  const showSkeleton = !isError && isFetching && rows.length === 0;
  // The server keeps one schedule for each index, owned by anyone; until the list loads, the index may already have it
  const hasIndexSchedule =
    total > 0 || !!indexOptions?.some(option => option.name === indexName && option.scheduled);
  const isAddBlocked = isIndex && kind === TRIGGER_KIND.cron && (hasIndexSchedule || showSkeleton);

  const styles = entitySchedulesSectionStyles(entityType === 'agent');

  const items = [
    {
      title: config.title,
      testId: sectionTestId,
      summaryAction: (
        <Link
          component={RouterLink}
          to={buildSchedulesListLink({ entityType, entityId, indexName, kind })}
          // The Schedules page names the entity chip with it when the list has no rows
          state={{ entityName }}
          variant="bodySmall"
          sx={styles.link}
          data-testid={`${sectionTestId}-open-all`}
        >
          {config.link}
        </Link>
      ),
      content: (
        <Box
          role="region"
          aria-label={config.title}
          sx={styles.content}
        >
          {isError && (
            <Box sx={styles.header}>
              <Typography
                variant="bodySmall"
                color="error"
              >
                {buildErrorMessage(error)}
              </Typography>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.text}
                onClick={refetch}
              >
                Retry
              </Button.BaseBtn>
            </Box>
          )}
          {!isError && !isFetching && total === 0 && (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {emptyText}
            </Typography>
          )}
          {(showSkeleton || rows.length > 0) && (
            <Box sx={styles.cards}>
              {showSkeleton &&
                [0, 1].map(key => (
                  <Skeleton
                    key={key}
                    variant="rounded"
                    sx={styles.skeleton}
                    data-testid={`${testId}-skeleton`}
                  />
                ))}
              {rows.map(row => (
                <EntityScheduleCard
                  key={row.id}
                  row={row}
                  entityType={entityType}
                  currentUserId={currentUserId}
                  onOpenForm={openForm}
                  onOpenRunHistory={openRunHistory}
                />
              ))}
            </Box>
          )}
          {canCreate && !isError && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              onClick={onAdd}
              disabled={isAddBlocked}
              sx={styles.add}
              data-testid={`${sectionTestId}-add`}
            >
              {config.add}
            </Button.BaseBtn>
          )}
          {canCreate && !isError && isAddBlocked && hasIndexSchedule && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid={`${sectionTestId}-add-hint`}
            >
              {INDEX_SCHEDULED_HINT}
            </Typography>
          )}
          {hasMore && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.text}
              onClick={loadMore}
              disabled={isFetching}
              sx={styles.showMore}
            >
              Show more
            </Button.BaseBtn>
          )}
        </Box>
      ),
    },
  ];

  // A 403 on the list hides the section like a missing list permission
  if (isHidden || error?.status === 403) return null;

  return (
    // Target of the scroll link in the pipeline Trigger selector hint
    <Box id={config.id}>
      <BasicAccordion
        accordionSX={styles.accordion}
        style={style}
        items={items}
      />
    </Box>
  );
});

EntitySchedulesSection.displayName = 'EntitySchedulesSection';

/** @type {MuiSx} */
const entitySchedulesSectionStyles = isAgent => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.default.tertiary} !important`,
  }),
  // The section and its cards follow the width of the editor column, not of the window
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    containerType: 'inline-size',
  },
  // The wide agent editor column lays the cards out in a grid; the narrow pipeline column stacks them
  cards: isAgent
    ? {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))',
        gap: '0.75rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
  },
  add: {
    alignSelf: 'flex-start',
    whiteSpace: 'nowrap',
  },
  link: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    color: palette.text.secondary,
    textDecoration: 'underline',
    '&:hover': { color: palette.text.secondary },
  }),
  // The heights of the stacked and the one-line card
  skeleton: {
    height: '9rem',
    borderRadius: '0.5rem',
    [WIDE]: {
      height: '4.625rem',
    },
  },
  showMore: {
    alignSelf: 'flex-start',
  },
});

export default EntitySchedulesSection;
