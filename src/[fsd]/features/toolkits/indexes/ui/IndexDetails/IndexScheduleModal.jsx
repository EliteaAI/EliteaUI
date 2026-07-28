import { useCallback, useEffect, useMemo, useState } from 'react';

import { Cron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import { useSelector } from 'react-redux';

import { Box, GlobalStyles, Typography } from '@mui/material';

import { CredentialsSelect } from '@/[fsd]/features/credentials/ui';
import { IndexCronDefault } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  getNextCronRun,
  validateCronExpressionDaily as validateCronExpression,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexSchedule.helpers.js';
import { Button, Modal, Tab } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ErrorIcon from '@/assets/error-icon.svg?react';
import FormInput from '@/components/FormInput';
import { useSelectedProject } from '@/hooks/useSelectedProject';

const viewButtons = [
  { value: 'builder', label: 'Builder' },
  { value: 'cron', label: 'Cron Expression' },
];

const IndexScheduleModal = props => {
  const {
    open,
    onClose,
    onSubmit,
    cron,
    credentials,
    credentialsData,
    toolkitSchemaFetching,
    isEdit,
    toolkitName,
  } = props;
  const { personal_project_id } = useSelector(state => state.user);
  const selectedProject = useSelectedProject();

  const styles = indexScheduleModalStyles();

  const isPrivateProject = useMemo(
    () => selectedProject?.id === personal_project_id,
    [personal_project_id, selectedProject?.id],
  );

  const [innerCredentials, setInnerCredentials] = useState(null);
  const [credentialsError, setCredentialsError] = useState(false);
  const [cronExpression, setCronExpression] = useState(IndexCronDefault);
  const [cronType, setCronType] = useState('builder');

  useEffect(() => {
    if (open) {
      if (cron) setCronExpression(cron);
      setInnerCredentials(credentials);
    }

    return () => {
      setCredentialsError(false);
      setCronType('builder');
    };
  }, [open, cron, credentials]);

  const cronState = useMemo(() => validateCronExpression(cronExpression), [cronExpression]);

  const invalidCronFieldClass = useMemo(() => {
    if (cronState.isValid || !cronState.field) return null;
    return `react-js-cron-${cronState.field}`;
  }, [cronState]);

  const nextRunComputed = useMemo(() => {
    if (!cronState.isValid) return null;
    const date = getNextCronRun(cronExpression);
    if (!date) return null;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [cronExpression, cronState.isValid]);

  const applyIsDisabled = useMemo(
    () => !cronState.isValid || toolkitSchemaFetching,
    [cronState.isValid, toolkitSchemaFetching],
  );

  const applyChanges = useCallback(() => {
    if (!innerCredentials && credentialsData) {
      setCredentialsError(true);
      return;
    }

    onSubmit(cronExpression, innerCredentials);
    onClose();
  }, [innerCredentials, credentialsData, onSubmit, cronExpression, onClose]);

  return (
    <>
      <GlobalStyles styles={styles.cronContainer} />
      <Modal.BaseModal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit Schedule' : 'Create Schedule'}
        sx={styles.dialog}
        content={
          <Box sx={styles.contentWrapper}>
            <Box sx={styles.tabRow}>
              <Tab.TabGroupButton
                arrayBtn={viewButtons}
                value={cronType}
                onChange={(_, newValue) => setCronType(newValue)}
                disableTooltip
              />
            </Box>

            {cronType === 'builder' ? (
              <Box
                sx={[
                  styles.cronWrapper,
                  invalidCronFieldClass && {
                    [`& .${invalidCronFieldClass} .react-js-cron-select`]: {
                      borderColor: ({ palette }) => `${palette.text.error} !important`,
                    },
                  },
                ]}
              >
                <Cron
                  value={cronExpression}
                  setValue={setCronExpression}
                  clearButton={false}
                  clockFormat="24-hour-clock"
                  allowedPeriods={['month', 'week', 'day']}
                  dropdownsConfig={{
                    hours: { mode: 'single' },
                    minutes: { mode: 'single' },
                  }}
                  locale={{
                    emptyMonths: 'Month',
                    emptyMonthDays: 'Day',
                    emptyMonthDaysShort: 'Day',
                    emptyWeekDays: 'Weekday',
                    emptyWeekDaysShort: 'Weekday',
                  }}
                />
              </Box>
            ) : (
              <Box sx={styles.cronWrapper}>
                <FormInput
                  value={cronExpression}
                  onChange={event => setCronExpression(event.target.value)}
                  placeholder="* * * * *"
                  error={!cronState.isValid}
                  sx={styles.cronInput}
                />
                <Box sx={styles.descriptionContainer}>
                  <Typography
                    variant="bodySmall"
                    sx={styles.cronDescription}
                  >
                    minute – hour – day (month) – month – day (week)
                  </Typography>
                  <InfoTooltip
                    infoTooltip="Cron expression help"
                    href="https://crontab.guru/#*_*_*_*"
                    sx={styles.infoIconWrapper}
                  />
                </Box>
              </Box>
            )}

            <Box sx={styles.previewBox}>
              <Typography
                variant="headingSmall"
                sx={styles.previewSummary}
              >
                {cronState.isValid ? `"${cronState.message}"` : '-'}
              </Typography>

              <Box sx={styles.nextRunContainer}>
                <Typography
                  variant="bodySmall"
                  color="text.primary"
                  sx={styles.nextRunLabel}
                >
                  Next run:
                </Typography>
                <Typography variant="labelSmall">{cronState.isValid ? nextRunComputed : '-'}</Typography>
              </Box>
            </Box>
            {!cronState.isValid && (
              <Box sx={styles.errorContainer}>
                <ErrorIcon />
                <Typography
                  variant="labelSmall"
                  sx={styles.previewSummaryError}
                >
                  {cronState.message}
                </Typography>
              </Box>
            )}

            {credentialsData && (
              <>
                <CredentialsSelect
                  isCreationAllowed
                  label={`${toolkitName} Credentials`}
                  description={credentialsData.description}
                  onSelectConfiguration={value => setInnerCredentials(value)}
                  value={innerCredentials}
                  configurations={credentialsData.options}
                  error={credentialsError}
                  helperText="Your configuration does not match any available configurations."
                  type={credentialsData.configuration_types?.[0] || ''}
                  section="credentials"
                  disabled={toolkitSchemaFetching}
                  onlyPublic={!isPrivateProject}
                />
              </>
            )}
          </Box>
        }
        actions={
          <Box sx={styles.actionsWrapper}>
            <Button.BaseBtn
              sx={styles.actionBtn}
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              onClick={onClose}
            >
              Cancel
            </Button.BaseBtn>
            <Button.BaseBtn
              sx={styles.actionBtn}
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              onClick={applyChanges}
              disabled={applyIsDisabled}
            >
              Save
            </Button.BaseBtn>
          </Box>
        }
      />
    </>
  );
};

/** @type {MuiSx} */
const indexScheduleModalStyles = () => ({
  dialog: {
    width: '35.4rem',
    maxWidth: 'none',
  },
  actionBtn: {
    width: '4.25rem',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '0',
    width: '100%',
  },
  tabRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  actionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    gap: '0.75rem',
  },
  previewBox: {
    padding: '1rem',
    borderRadius: '0.5rem',
    background: ({ palette }) => palette.background.userInputBackground,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.625rem',
    width: '100%',
  },
  cronInput: {
    padding: '0',
    width: '100%',
    '& input': {
      textAlign: 'center',
    },
  },
  previewSummary: {
    textAlign: 'center',
    fontWeight: 500,
  },
  previewSummaryError: {
    color: ({ palette }) => palette.text.warningText,
  },
  nextRunContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  nextRunLabel: {
    color: 'text.primary',
  },
  descriptionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cronDescription: ({ palette }) => ({
    color: palette.secondary.main,
    fontSize: '0.75rem',
    textAlign: 'center',
  }),
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    border: ({ palette }) => `1px solid ${palette.border.error}`,
    background: ({ palette }) => palette.background.errorBkg,
    color: ({ palette }) => palette.text.error,
    gap: '0.5rem',
  },
  infoIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  cronWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    '& .react-js-cron': {
      width: '100%',
      flexWrap: 'wrap',
    },
  },
  cronContainer: ({ palette, typography }) => ({
    '.react-js-cron': {
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',

      span: {
        ...typography.bodyMedium,
        color: palette.text.primary,
      },
    },

    ' .react-js-cron-field': {
      marginBottom: '0 !important',
    },

    '.react-js-cron-select': {
      background: palette.background.aiProviderAccordion.default,
      border: `1px solid ${palette.border.lines}`,
      height: '2rem',
      color: palette.text.primary,
      minWidth: '8rem !important',
      ...typography.bodySmall,

      '.ant-select-clear': {
        display: 'none !important',
      },

      ' .ant-select-content-has-value': {
        color: `${palette.text.secondary} !important`,
      },

      '.ant-select-placeholder,.ant-select-content-value': {
        color: `${palette.text.secondary} !important`,
        ...typography.bodySmall,
      },

      div: {
        color: palette.text.secondary,
        ...typography.bodySmall,
        ' .ant-select-placeholder': {
          color: `${palette.text.button.disabled} !important`,
        },
      },
    },
    ' .react-js-cron-hours .react-js-cron-select': {
      // width: '4.25rem !important',
      minWidth: '4.25rem !important',
    },

    ' .react-js-cron-hours .ant-select .ant-select-content': {
      // width: '2rem !important',
      minWidth: '2rem !important',
    },

    ' .react-js-cron-minutes .react-js-cron-select': {
      // width: '4.25rem !important',
      minWidth: '4.25rem !important',
    },

    ' .react-js-cron-minutes .ant-select .ant-select-content': {
      // width: '2rem !important',
      minWidth: '2rem !important',
    },

    '.react-js-cron-select-dropdown': {
      zIndex: 1400,
      background: palette.background.secondary,
      border: `1px solid ${palette.border.lines}`,

      div: {
        color: palette.text.secondary,
        ...typography.bodySmall,

        '.ant-select-item-option': {
          '&:hover': {
            backgroundColor: `${palette.background.userInputBackground} !important`,
          },
        },

        '.ant-select-item-option-selected': {
          backgroundColor: `${palette.background.userInputBackground} !important`,
        },
      },
    },
  }),
});

export default IndexScheduleModal;
