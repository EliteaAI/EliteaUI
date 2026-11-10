import { memo, useCallback, useEffect } from 'react';

import { Box, Link, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers/runHistory.helpers';
import { useGetScheduleQuery } from '@/[fsd]/entities/schedule/api/scheduleApi.js';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';

import {
  getApprovalRuleLabel,
  getOwnerLabel,
  getRunModeLabel,
  getScheduleStatusLabel,
} from '../../lib/helpers/compareSchedules.helpers';

const NEXT_RUN_FORMAT = 'dd.MM.yyyy HH:mm';

// A read-only schedule of one version; the fields that differ from its pair are highlighted
const CompareScheduleCard = memo(props => {
  const { row, side, changedFields, isUnpaired, currentUserId, onOpenSchedule, onApprovalRuleLoaded } = props;
  const projectId = useSelectedProjectId();

  // The list rows have no approval rule; the details of the schedule carry it
  const { data: details } = useGetScheduleQuery(
    { projectId, scheduleId: row.id },
    { skip: !projectId || !row.id },
  );
  const approvalRule = details?.approval_rule;

  useEffect(() => {
    if (approvalRule) onApprovalRuleLoaded?.(row.id, approvalRule);
  }, [approvalRule, onApprovalRuleLoaded, row.id]);

  const handleOpen = useCallback(
    () => onOpenSchedule?.(row.id, row.version_id),
    [onOpenSchedule, row.id, row.version_id],
  );

  const browserTimezone = ScheduleHelpers.getBrowserTimezone() ?? row.timezone;
  const fields = [
    {
      key: 'cron',
      label: 'When',
      value: row.cron ? ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone) : '—',
      hint: browserTimezone ? `Shown: ${browserTimezone}` : undefined,
    },
    { key: 'timezone', label: 'Timezone', value: row.timezone || '—' },
    { key: 'run_mode', label: 'Runs', value: getRunModeLabel(row.run_mode) },
    { key: 'status', label: 'Status', value: getScheduleStatusLabel(row) },
    {
      key: 'approval_rule',
      label: 'Approval',
      value: approvalRule ? getApprovalRuleLabel(approvalRule) : '…',
    },
    { key: 'owner_id', label: 'Owner', value: getOwnerLabel(row.owner, currentUserId) },
    {
      key: 'next_run',
      label: 'Next run',
      value: row.enabled && row.next_run ? formatRunTimestamp(row.next_run, NEXT_RUN_FORMAT) : '—',
    },
  ];

  const styles = compareScheduleCardStyles(isUnpaired);

  return (
    <Box
      role="group"
      aria-label={row.name}
      sx={styles.card}
      data-testid={`compare-schedule-${side}-${row.id}`}
      data-unpaired={isUnpaired}
    >
      <Box sx={styles.heading}>
        <Typography
          variant="labelMedium"
          sx={styles.name}
        >
          {row.name}
        </Typography>
        <Link
          component="button"
          type="button"
          variant="bodySmall"
          onClick={handleOpen}
          data-testid={`compare-schedule-open-${side}-${row.id}`}
        >
          Open schedule
        </Link>
      </Box>
      {fields.map(field => (
        <Box
          key={field.key}
          sx={[styles.field, changedFields?.has(field.key) && styles.changedField]}
          data-testid={`compare-schedule-${side}-${row.id}-${field.key}`}
          data-changed={Boolean(changedFields?.has(field.key))}
        >
          <Typography
            variant="labelSmall"
            sx={styles.label}
          >
            {field.label}
          </Typography>
          <Box sx={styles.valueBox}>
            <Typography
              variant="bodySmall"
              sx={styles.value}
            >
              {field.value}
            </Typography>
            {field.hint && (
              <Typography
                variant="bodySmall2"
                sx={styles.hint}
              >
                {field.hint}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
});

CompareScheduleCard.displayName = 'CompareScheduleCard';

/** @type {MuiSx} */
const compareScheduleCardStyles = isUnpaired => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: isUnpaired ? palette.diff.added : palette.background.surface.interactive.default,
  }),
  heading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
  },
  changedField: ({ palette }) => ({
    backgroundColor: palette.background.warning,
  }),
  label: ({ palette }) => ({
    color: palette.text.primary,
    flexShrink: 0,
  }),
  valueBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 0,
  },
  value: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'right',
  }),
  hint: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default CompareScheduleCard;
