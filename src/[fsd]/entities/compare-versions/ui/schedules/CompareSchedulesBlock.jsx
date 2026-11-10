import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Skeleton, Typography } from '@mui/material';

import { TRIGGER_KIND } from '@/[fsd]/entities/schedule/lib/helpers/scheduleLinks.helpers';
import { useEntitySchedules } from '@/[fsd]/entities/schedule/lib/hooks/useEntitySchedules.hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';
import { isApprovalRuleChanged, pairSchedules } from '../../lib/helpers/compareSchedules.helpers';
import CompareLegacyScheduleCard from './CompareLegacyScheduleCard';
import CompareScheduleCard from './CompareScheduleCard';

const SIDES = ['left', 'right'];
// Placeholder cards shown in each column while the first schedules load, as in the editor's Schedules section
const SKELETON_CARDS = [0, 1];

// Each column lists its version's cron schedules by name, 20 at a time
const SCHEDULE_LIST_OPTIONS = { triggerKind: TRIGGER_KIND.cron, sortBy: 'name', sortOrder: 'asc' };

// The Schedules block of "Run settings & Schedules": the schedules of each version, paired by name
const CompareSchedulesBlock = memo(props => {
  const {
    entityType,
    entityId,
    leftVersionId,
    rightVersionId,
    leftData,
    rightData,
    isAdmin,
    onOpenSchedule,
  } = props;
  const currentUserId = useSelector(state => state.user.id);

  const left = useEntitySchedules({
    ...SCHEDULE_LIST_OPTIONS,
    entityType,
    entityId,
    versionId: leftVersionId,
    skip: !leftVersionId,
  });
  const right = useEntitySchedules({
    ...SCHEDULE_LIST_OPTIONS,
    entityType,
    entityId,
    versionId: rightVersionId,
    skip: !rightVersionId,
  });
  const sides = { left, right };

  const [approvalRules, setApprovalRules] = useState({});
  const handleApprovalRuleLoaded = useCallback(
    (scheduleId, rule) =>
      setApprovalRules(prev => (prev[scheduleId] === rule ? prev : { ...prev, [scheduleId]: rule })),
    [],
  );

  // Recalculated after each load, so a pair can form once both rows are in
  const pairs = useMemo(() => pairSchedules(left.rows, right.rows), [left.rows, right.rows]);
  const pairsWithApproval = useMemo(
    () =>
      pairs.map(pair => {
        if (!isApprovalRuleChanged(approvalRules[pair.left?.id], approvalRules[pair.right?.id])) return pair;
        return { ...pair, changedFields: new Set([...pair.changedFields, 'approval_rule']) };
      }),
    [approvalRules, pairs],
  );

  const legacyTriggers = { left: leftData?.legacy_trigger, right: rightData?.legacy_trigger };
  const isError = left.isError || right.isError;
  // useEntitySchedules keeps the shown rows while a bigger page loads; only the first load has no rows yet
  const isRetrying = isError && (left.isFetching || right.isFetching);
  const isLoading =
    (left.isFetching && !left.total && !left.rows.length) ||
    (right.isFetching && !right.total && !right.rows.length);
  const handleRetry = useCallback(() => {
    if (left.isError) left.refetch();
    if (right.isError) right.refetch();
  }, [left, right]);

  const styles = compareSchedulesBlockStyles();

  const renderColumn = side => {
    const state = sides[side];
    const legacyTrigger = legacyTriggers[side];
    const hasRows = state.rows.length > 0;
    return (
      <Box
        key={side}
        sx={styles.column}
        data-testid={`compare-schedules-${side}`}
      >
        {legacyTrigger && (
          <CompareLegacyScheduleCard
            trigger={legacyTrigger}
            side={side}
          />
        )}
        {!hasRows && (
          <Typography
            sx={styles.emptyText}
            data-testid={`compare-schedules-empty-${side}`}
          >
            {COMPARE_MESSAGES.noSchedules}
          </Typography>
        )}
        {pairsWithApproval.length > 0 &&
          pairsWithApproval.map(pair => {
            const row = pair[side];
            const other = pair[side === 'left' ? 'right' : 'left'];
            if (!row) {
              // Only the other version has this schedule: keep its row aligned
              return (
                <Box
                  key={pair.key}
                  sx={styles.emptySlot}
                />
              );
            }
            return (
              <CompareScheduleCard
                key={pair.key}
                row={row}
                side={side}
                changedFields={pair.changedFields}
                isUnpaired={!other}
                currentUserId={currentUserId}
                onOpenSchedule={onOpenSchedule}
                onApprovalRuleLoaded={handleApprovalRuleLoaded}
              />
            );
          })}
        {state.hasMore && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            loading={state.isFetching}
            disabled={state.isFetching}
            onClick={state.loadMore}
            sx={styles.showMore}
            data-testid={`compare-schedules-show-more-${side}`}
          >
            Show more
          </BaseBtn>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={styles.root}
      data-testid="compare-schedules-block"
    >
      <Box sx={styles.header}>
        <Typography sx={styles.title}>Schedules</Typography>
        {!isAdmin && (
          <Typography
            sx={styles.note}
            data-testid="compare-schedules-only-yours"
          >
            {COMPARE_MESSAGES.onlyYourSchedules}
          </Typography>
        )}
      </Box>
      {isError && (
        <Box
          sx={styles.error}
          role="alert"
          data-testid="compare-schedules-error"
        >
          <Typography variant="bodySmall">{COMPARE_MESSAGES.schedulesFailed}</Typography>
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            loading={isRetrying}
            disabled={isRetrying}
            onClick={handleRetry}
            data-testid="compare-schedules-retry"
          >
            Retry
          </BaseBtn>
        </Box>
      )}
      {!isError && isLoading && (
        <Box
          sx={styles.columns}
          role="status"
          aria-label="Loading schedules"
          data-testid="compare-schedules-loading"
        >
          {SIDES.map(side => (
            <Box
              key={side}
              sx={styles.column}
            >
              {SKELETON_CARDS.map(key => (
                <Skeleton
                  key={key}
                  variant="rounded"
                  sx={styles.skeleton}
                  data-testid={`compare-schedules-skeleton-${side}`}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}
      {!isError && !isLoading && <Box sx={styles.columns}>{SIDES.map(renderColumn)}</Box>}
    </Box>
  );
});

CompareSchedulesBlock.displayName = 'CompareSchedulesBlock';

/** @type {MuiSx} */
const compareSchedulesBlockStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    padding: '0 2rem',
  },
  title: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  note: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  error: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '0 2rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    color: palette.text.error,
    backgroundColor: palette.background.error,
  }),
  columns: {
    display: 'flex',
  },
  column: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0 2rem',
  },
  emptyText: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
  emptySlot: ({ palette }) => ({
    minHeight: '12rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${palette.border.lines}`,
  }),
  showMore: {
    alignSelf: 'flex-start',
  },
  skeleton: {
    height: '12rem',
    borderRadius: '0.5rem',
  },
});

export default CompareSchedulesBlock;
