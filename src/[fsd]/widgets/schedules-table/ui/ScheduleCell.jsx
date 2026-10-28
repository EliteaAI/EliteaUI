import { memo } from 'react';

import { Box, Tooltip as MuiTooltip, Typography } from '@mui/material';

import {
  ScheduleEnabledSwitch,
  ScheduleRunStatusChip,
  formatRunStarted,
  toRunStatusLabel,
} from '@/[fsd]/features/schedule';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { Text, Tooltip } from '@/[fsd]/shared/ui';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';
import AuthorContainer from '@/components/AuthorContainer';
import CalendarIcon from '@/components/Icons/CalendarIcon';

import IconWithLabel from './IconWithLabel';

// The API stores run statuses in lower case (failed, skipped, blocked, ...)
const REASON_STATUSES = ['failed', 'skipped', 'blocked'];

const formatTime = value =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// One date renderer for Next run and Last run. Compact: MMM DD and the time on two lines, with
// `trailing` (the Last run status icon) after the time; regular: one line; comfortable: the calendar icon
const renderRunDate = (value, tier, trailing = null) => {
  const styles = cellStyles;
  const date = timeFormatter(value, TIME_FORMAT.MMMDD);
  const time = formatTime(value);
  if (tier === 'compact') {
    return (
      <Box sx={styles.twoLineDate}>
        <Typography
          variant="bodyMedium"
          component="span"
        >
          {date}
        </Typography>
        <Box sx={styles.timeLine}>
          <Typography
            variant="bodySmall"
            component="span"
            color="text.primary"
          >
            {time}
          </Typography>
          {trailing}
        </Box>
      </Box>
    );
  }
  const text = (
    <Typography
      variant="bodyMedium"
      component="span"
      noWrap
    >
      {`${date} ${time}`}
    </Typography>
  );
  if (tier !== 'comfortable') return text;
  return (
    <Box sx={styles.dateCell}>
      <CalendarIcon sx={styles.calendarIcon} />
      {text}
    </Box>
  );
};

const lastRunTooltip = (row, label, reason) => {
  const text = [label, row.last_run && formatRunStarted(row.last_run)].filter(Boolean).join(' - ');
  return reason ? `${text}. ${reason}` : text;
};

const ScheduleCell = memo(({ column, value, row, tier }) => {
  const styles = cellStyles;
  const isCompact = tier === 'compact';
  switch (column.field) {
    case 'entity_name':
      return (
        <Box sx={styles.entityName}>
          <IconWithLabel
            type={row.entity_type}
            label={row.entity_name}
          />
          {row.version_name && (
            <Tooltip.TypographyWithConditionalTooltip
              title={row.version_name}
              placement="top"
              variant="bodySmall"
              color="text.secondary"
            >
              {row.version_name}
            </Tooltip.TypographyWithConditionalTooltip>
          )}
        </Box>
      );
    case 'schedule': {
      // Every row shows the browser zone, so the compact cell drops it and the tooltip keeps it
      const rule = ScheduleHelpers.getCronSummaryInBrowserTimezone(row.cron, row.timezone);
      const ruleWithZone = `${rule} (${ScheduleHelpers.getBrowserTimezone() ?? row.timezone})`;
      return (
        <MuiTooltip
          title={ruleWithZone}
          placement="top"
        >
          <Typography
            variant="bodyMedium"
            sx={styles.twoLines}
          >
            {isCompact ? rule : ruleWithZone}
          </Typography>
        </MuiTooltip>
      );
    }
    case 'next_run': {
      if (!row.enabled) return 'Paused';
      if (!value) return '-';
      if (tier === 'comfortable') return renderRunDate(value, tier);
      return (
        <MuiTooltip
          title={new Date(value).toLocaleString()}
          placement="top"
        >
          {renderRunDate(value, tier)}
        </MuiTooltip>
      );
    }
    case 'last_run': {
      const status = row.last_run_status;
      if (!row.last_run && !status) return '-';
      const label = status ? toRunStatusLabel(status) : '';
      const reason = REASON_STATUSES.includes(status) ? row.last_run_reason : null;
      const icon = status && (
        <ScheduleRunStatusChip
          status={status}
          variant="icon"
        />
      );
      // Line 1 the run date in the Next run format, line 2 the status icon and word with
      // the reason after it; compact puts the icon after the time and the reason only in the tooltip
      return (
        <MuiTooltip
          title={lastRunTooltip(row, label, reason)}
          placement="top"
        >
          <Box
            component="span"
            tabIndex={isCompact ? 0 : undefined}
            sx={styles.lastRun}
          >
            {row.last_run ? renderRunDate(row.last_run, tier, isCompact ? icon : null) : '-'}
            {!isCompact && status && (
              <Box sx={styles.statusLine}>
                {icon}
                <Typography
                  variant="bodySmall"
                  component="span"
                  sx={styles.statusLabel}
                >
                  {label}
                </Typography>
                {reason && (
                  <Text.EllipsisTypography
                    variant="bodySmall"
                    color="text.secondary"
                  >
                    {reason}
                  </Text.EllipsisTypography>
                )}
              </Box>
            )}
            {isCompact && !row.last_run && icon}
          </Box>
        </MuiTooltip>
      );
    }
    case 'owner': {
      if (!row.owner) return '-';
      const avatar = (
        <AuthorContainer
          disabledNavigation
          showName={false}
          authors={[row.owner]}
        />
      );
      if (isCompact) {
        return (
          <MuiTooltip
            title={row.owner.name ?? ''}
            placement="top"
          >
            <Box
              component="span"
              tabIndex={0}
              sx={styles.owner}
            >
              {avatar}
            </Box>
          </MuiTooltip>
        );
      }
      return (
        <Box sx={styles.owner}>
          {avatar}
          <Tooltip.TypographyWithConditionalTooltip
            title={row.owner.name}
            placement="top"
            variant="bodyMedium"
          >
            {row.owner.name}
          </Tooltip.TypographyWithConditionalTooltip>
        </Box>
      );
    }
    case 'enabled':
      return <ScheduleEnabledSwitch row={row} />;
    default:
      return value ?? '-';
  }
});

ScheduleCell.displayName = 'ScheduleCell';

// The cell styles do not depend on the tier, so the cells share one object instead of building it per row
/** @type {Record<string, import('@mui/material').SxProps>} */
const cellStyles = {
  entityName: { minWidth: 0 },
  twoLines: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  dateCell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  twoLineDate: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  calendarIcon: { width: '1rem', height: '1rem', flexShrink: 0 },
  lastRun: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    maxWidth: '100%',
  },
  timeLine: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 },
  statusLine: { display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0, maxWidth: '100%' },
  statusLabel: { flexShrink: 0, whiteSpace: 'nowrap' },
  owner: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, maxWidth: '100%' },
};

export default ScheduleCell;
