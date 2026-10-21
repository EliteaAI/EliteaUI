import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { buildScheduleFormLink, buildSchedulesListLink, useEntitySchedules } from '@/[fsd]/entities/schedule';
import { Button } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

import EntityScheduleCard from './EntityScheduleCard';

const countText = (total, entityType) =>
  total === 1 ? `1 schedule runs this ${entityType}.` : `${total} schedules run this ${entityType}.`;

// The last section of the agent and pipeline editors; entityType is 'agent' or 'pipeline'
const EntitySchedulesSection = memo(props => {
  const { entityType, entityId, isChatView = false, style } = props;
  const { checkPermission } = useCheckPermission();
  const canCreate = checkPermission(PERMISSIONS.schedules.create);
  const isHidden = isChatView || !entityId || !checkPermission(PERMISSIONS.schedules.list);
  const { rows, total, isError, error, isFetching, refetch, loadMore, hasMore } = useEntitySchedules({
    entityType,
    entityId,
    skip: isHidden,
  });
  const currentUserId = useSelector(state => state.user.id);
  const navigate = useNavigate();
  const { tab } = useParams();
  const { pathname } = useLocation();

  // The form opens nested in the editor and comes back to this editor path (owner CR 2026-10-21)
  const openForm = useCallback(
    scheduleId =>
      navigate(buildScheduleFormLink({ entityType, entityId, tab, scheduleId }), {
        state: { returnTo: pathname },
      }),
    [navigate, entityType, entityId, tab, pathname],
  );
  const onAdd = useCallback(() => openForm(), [openForm]);
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
          <Box sx={styles.header}>
            {canCreate && (
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.secondary}
                onClick={onAdd}
                data-testid={`${testId}-add`}
              >
                + Schedule
              </Button.BaseBtn>
            )}
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.count}
            >
              {total > 0 ? countText(total, entityType) : ''}
            </Typography>
            <Link
              component={RouterLink}
              to={buildSchedulesListLink({ entityType, entityId })}
              variant="bodyMedium"
              data-testid={`${testId}-open-all`}
            >
              Open all in Schedules
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
          {!isError && !isFetching && total === 0 && (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              No schedules yet.
            </Typography>
          )}
          {rows.map(row => (
            <EntityScheduleCard
              key={row.id}
              row={row}
              entityType={entityType}
              currentUserId={currentUserId}
              onOpenForm={openForm}
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

  // A 403 on the list hides the section like a missing list permission (R1.2)
  if (isHidden || error?.status === 403) return null;

  return (
    <BasicAccordion
      accordionSX={styles.accordion}
      style={style}
      items={items}
    />
  );
});

EntitySchedulesSection.displayName = 'EntitySchedulesSection';

/** @type {MuiSx} */
const entitySchedulesSectionStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.default.tertiary} !important`,
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  count: {
    flex: 1,
  },
  showMore: {
    alignSelf: 'flex-start',
  },
});

export default EntitySchedulesSection;
