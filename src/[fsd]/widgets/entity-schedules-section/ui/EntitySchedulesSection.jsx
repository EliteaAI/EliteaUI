import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Link, Skeleton, Typography } from '@mui/material';

import {
  buildScheduleFormLink,
  buildScheduleRunsLink,
  buildSchedulesListLink,
  useEntitySchedules,
} from '@/[fsd]/entities/schedule';
import { ScheduleSectionConstants, TextLinkConstants } from '@/[fsd]/shared/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { PERMISSIONS, SearchParams } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

import EntityScheduleCard from './EntityScheduleCard';

const { SCHEDULES_SECTION_ID } = ScheduleSectionConstants;

const WIDE = '@container (min-width: 30rem)';
// The name every agent and pipeline gives its first version
const BASE_VERSION_NAME = 'base';

const countText = (total, version) =>
  total === 1 ? `1 schedule runs ${version}` : `${total} schedules run ${version}`;

// The last section of the agent and pipeline editors; entityType is 'agent' or 'pipeline'; versionId is the editor version, versionName its label (none or 'base': the base version)
const EntitySchedulesSection = memo(props => {
  const { entityType, entityId, entityName, versionId, versionName, isChatView = false, style } = props;
  const { checkPermission } = useCheckPermission();
  const canCreate = checkPermission(PERMISSIONS.schedules.create);
  const isHidden = isChatView || !entityId || !checkPermission(PERMISSIONS.schedules.list);
  const { rows, total, isError, error, isFetching, refetch, loadMore, hasMore } = useEntitySchedules({
    entityType,
    entityId,
    versionId,
    skip: isHidden,
  });
  const currentUserId = useSelector(state => state.user.id);
  const navigate = useNavigate();
  const { tab } = useParams();
  const { pathname, search } = useLocation();

  // The form opens nested in the editor and comes back to this editor location.
  // The form URL keeps the editor search (viewMode), so the entity crumb opens the editor too.
  const openNested = useCallback(
    (to, formVersionId) => {
      const params = new URLSearchParams(search);
      if (formVersionId) params.set(SearchParams.VersionId, formVersionId);
      const formSearch = params.toString();
      navigate({ ...to, search: formSearch && `?${formSearch}` }, { state: { returnTo: pathname + search } });
    },
    [navigate, pathname, search],
  );
  // Edit keeps the version of its schedule; "+ Schedule" takes the editor version
  const versionOf = useCallback(
    scheduleId => rows.find(row => row.id === scheduleId)?.version_id ?? versionId,
    [rows, versionId],
  );
  const openForm = useCallback(
    scheduleId =>
      openNested(
        { pathname: buildScheduleFormLink({ entityType, entityId, tab, scheduleId }) },
        versionOf(scheduleId),
      ),
    [openNested, versionOf, entityType, entityId, tab],
  );
  const openRunHistory = useCallback(
    scheduleId =>
      openNested(buildScheduleRunsLink({ entityType, entityId, tab, scheduleId }), versionOf(scheduleId)),
    [openNested, versionOf, entityType, entityId, tab],
  );
  const onAdd = useCallback(() => openForm(), [openForm]);
  const version =
    versionName && versionName !== BASE_VERSION_NAME ? `version ${versionName}` : 'the base version';
  const testId = `${entityType}-schedules-section`;

  const styles = entitySchedulesSectionStyles();

  const items = [
    {
      title: 'Schedules',
      testId,
      content: (
        <Box
          role="region"
          aria-label="Schedules"
          sx={styles.content}
        >
          <Box
            sx={styles.header}
            data-testid={`${testId}-header`}
          >
            {canCreate && (
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.iconLabel}
                startIcon={<PlusIcon />}
                onClick={onAdd}
                sx={styles.noWrap}
                data-testid={`${testId}-add`}
              >
                Schedule
              </Button.BaseBtn>
            )}
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.count}
            >
              {total > 0 ? countText(total, version) : ''}
            </Typography>
            <Link
              component={RouterLink}
              to={buildSchedulesListLink({ entityType, entityId })}
              // The Schedules page names the entity chip with it when the list has no rows
              state={{ entityName }}
              variant="bodyMedium"
              sx={[TextLinkConstants.TEXT_LINK_SX, styles.link]}
              data-testid={`${testId}-open-all`}
            >
              Manage Schedules
            </Link>
          </Box>
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
          {!isError &&
            isFetching &&
            rows.length === 0 &&
            [0, 1].map(key => (
              <Skeleton
                key={key}
                variant="rounded"
                sx={styles.skeleton}
                data-testid={`${testId}-skeleton`}
              />
            ))}
          {!isError && !isFetching && total === 0 && (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              No schedules run {version} yet.
            </Typography>
          )}
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
    <Box id={SCHEDULES_SECTION_ID}>
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
const entitySchedulesSectionStyles = () => ({
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
  // Below 30 rem: the button and the link on row 1, the count on row 2; from 30 rem: one row
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
  },
  // The count wraps and never truncates
  count: {
    flexBasis: '100%',
    order: 1,
    [WIDE]: {
      flex: '1 1 0',
      order: 0,
    },
  },
  noWrap: {
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
  },
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
