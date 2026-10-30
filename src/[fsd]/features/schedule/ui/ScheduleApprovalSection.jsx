import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { useGetScheduleSettingsQuery } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import RadioButtonGroup from '@/[fsd]/shared/ui/checkbox/RadioButtonGroup';
import RouteDefinitions from '@/routes';

import { APPROVAL_RULE, APPROVAL_RULE_INFO } from '../lib/constants';
import FieldError from './FieldError';

export const APPROVAL_RULE_ITEMS = [
  {
    value: APPROVAL_RULE.PAUSE_AND_ASK,
    label: 'Pause and ask me',
    info: APPROVAL_RULE_INFO[APPROVAL_RULE.PAUSE_AND_ASK],
    infoPinnable: true,
    infoLabel: 'More info about Pause and ask me',
  },
  {
    value: APPROVAL_RULE.RUN_WITHOUT_ASKING,
    label: 'Run without asking',
    info: APPROVAL_RULE_INFO[APPROVAL_RULE.RUN_WITHOUT_ASKING],
    infoPinnable: true,
    infoLabel: 'More info about Run without asking',
  },
];
// "21 Oct 2026" for the line of who confirmed "Run without asking"
const CONFIRMED_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// "Confirmed by X on <date>"; a missing or invalid date leaves "Confirmed by X" (format() throws on an invalid date)
const formatConfirmation = (by, at) => {
  const date = at ? new Date(at) : null;
  return date && !Number.isNaN(date.getTime())
    ? `Confirmed by ${by} on ${CONFIRMED_DATE.format(date)}`
    : `Confirmed by ${by}`;
};

const ScheduleApprovalSection = memo(
  ({ rule, ruleChanged, confirmedBy, confirmedAt, canChangeProjectSettings, error, onChange }) => {
    const projectId = useSelectedProjectId();
    const { data: scheduleSettings } = useGetScheduleSettingsQuery({ projectId }, { skip: !projectId });
    // Three states: undefined while loading or on error, then true or false; only an explicit false shows the hint
    const runWithoutAskingAllowed = scheduleSettings?.allow_run_without_asking;
    const showHint = runWithoutAskingAllowed === false || ruleChanged;
    const items = APPROVAL_RULE_ITEMS.map(item => ({
      ...item,
      disabled: item.value === APPROVAL_RULE.RUN_WITHOUT_ASKING && runWithoutAskingAllowed !== true,
    }));

    return (
      <>
        <Typography
          id="schedule-approval-rule-label"
          variant="labelMedium"
        >
          Approval rule
        </Typography>
        <Box
          role="group"
          data-testid="schedule-approval-rule-group"
          aria-describedby={showHint ? 'schedule-approval-rule-hint' : undefined}
        >
          <RadioButtonGroup
            testId="schedule-approval-rule"
            items={items}
            value={rule}
            onChange={onChange}
          />
        </Box>
        {showHint && (
          <Typography
            id="schedule-approval-rule-hint"
            variant="bodySmall"
            color="text.secondary"
          >
            This project does not allow running without asking.
            {canChangeProjectSettings && (
              <>
                {' '}
                <Link
                  component={RouterLink}
                  to={RouteDefinitions.SettingsProjectGeneral}
                >
                  Change it in Settings &gt; Project General
                </Link>
              </>
            )}
          </Typography>
        )}
        {confirmedBy && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {formatConfirmation(confirmedBy, confirmedAt)}
          </Typography>
        )}
        <FieldError message={error} />
      </>
    );
  },
);

ScheduleApprovalSection.displayName = 'ScheduleApprovalSection';

export default ScheduleApprovalSection;
