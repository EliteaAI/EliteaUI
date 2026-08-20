import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button, Switch } from '@/[fsd]/shared/ui';
import InfoIcon from '@/assets/info.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

import RunIndexBanner from '../RunIndexBanner';

const RunIndexScheduleContent = memo(props => {
  const {
    enabled,
    scheduleSummary,
    timezoneHint,
    credentialsTitle,
    nextRun,
    onAddSchedule,
    onEdit,
    onDelete,
    onToggle,
    disabledReason,
  } = props;
  const styles = runIndexScheduleContentStyles();
  if (!scheduleSummary)
    return (
      <Box sx={styles.placeholderBlock}>
        <Typography
          variant="bodyMedium"
          color="text.button.disabled"
        >
          No schedule configured yet.
        </Typography>
        <Tooltip
          title={disabledReason || ''}
          placement="top"
        >
          <Box
            component="span"
            sx={styles.addScheduleBtn}
          >
            <Button.BaseBtn
              variant={Button.BUTTON_VARIANTS.iconLabel}
              color="secondary"
              onClick={onAddSchedule}
              disabled={Boolean(disabledReason)}
            >
              + Schedule
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    );

  return (
    <>
      <Box sx={styles.scheduleCard}>
        <Box sx={styles.cardBody}>
          <Typography
            variant="labelMedium"
            color={enabled ? 'text.secondary' : 'text.primary'}
          >
            {scheduleSummary}
          </Typography>
          {timezoneHint && (
            <Typography
              component="span"
              sx={styles.timezoneHint}
            >
              {timezoneHint}
            </Typography>
          )}
          {nextRun && (
            <Typography
              variant="bodySmall2"
              color={enabled ? 'text.secondary' : 'text.primary'}
            >
              <Typography
                variant="bodySmall2"
                component="span"
                color="text.primary"
                sx={styles.nextRunLabel}
              >
                Next run:
              </Typography>
              {nextRun}
            </Typography>
          )}
          {credentialsTitle && (
            <Typography
              variant="bodySmall2"
              color="text.secondary"
            >
              <Typography
                variant="bodySmall2"
                component="span"
                color="text.primary"
                sx={styles.nextRunLabel}
              >
                Use credentials:
              </Typography>
              {credentialsTitle}
            </Typography>
          )}
        </Box>
        <Box sx={styles.cardActions}>
          <Tooltip title="Edit schedule">
            <Box component="span">
              <Button.BaseBtn
                variant={Button.BUTTON_VARIANTS.tertiary}
                size="small"
                startIcon={<EditIcon fill={styles.iconFill} />}
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
              />
            </Box>
          </Tooltip>
          <Tooltip title="Delete schedule">
            <Box component="span">
              <Button.BaseBtn
                variant={Button.BUTTON_VARIANTS.tertiary}
                size="small"
                startIcon={<DeleteIcon fill={styles.iconFill} />}
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
              />
            </Box>
          </Tooltip>
          <Tooltip title={disabledReason || ''}>
            <Box component="span">
              <Switch.BaseSwitch
                checked={enabled}
                onChange={e => {
                  e.stopPropagation();
                  onToggle();
                }}
                disabled={Boolean(disabledReason)}
              />
            </Box>
          </Tooltip>
        </Box>
      </Box>
      {!enabled && (
        <RunIndexBanner
          banner={{
            severity: 'info',
            label: 'Schedule is turned off.',
            message: '',
          }}
          CustomIcon={() => <InfoIcon />}
          sx={styles.banner}
          contentSX={styles.bannerContent}
        />
      )}
    </>
  );
});

RunIndexScheduleContent.displayName = 'RunIndexScheduleContent';

/** @type {MuiSx} */
const runIndexScheduleContentStyles = () => ({
  placeholderBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  addScheduleBtn: {
    width: 'fit-content',
    display: 'inline-flex',
  },
  scheduleCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    background: ({ palette }) => palette.background.userInputBackground,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  nextRunLabel: { marginRight: '0.5rem' },
  timezoneHint: ({ palette }) => ({
    fontStyle: 'italic',
    fontSize: '0.675rem',
    color: palette.icon.secondary,
    whiteSpace: 'pre-line',
  }),
  iconFill: ({ palette }) => palette.icon.secondary,
  banner: {
    marginTop: '0.5rem',
    padding: '0rem !important',
  },
  bannerContent: {
    padding: '0.5rem',
    borderRadius: '0.5rem',
  },
});

export default RunIndexScheduleContent;
