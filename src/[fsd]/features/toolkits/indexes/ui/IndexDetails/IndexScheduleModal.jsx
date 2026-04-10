import { useEffect, useMemo, useState } from 'react';

import { Cron } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import { useSelector } from 'react-redux';

import { Box, Button, GlobalStyles, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { IndexCronDefault } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { validateCronExpression } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexSchedule.helpers.js';
import { Modal } from '@/[fsd]/shared/ui';
import CredentialsSelect from '@/components/CredentialsSelect';
import FormInput from '@/components/FormInput';
import InfoIcon from '@/components/Icons/InfoIcon';
import RadioButtonGroup from '@/components/RadioButtonGroup';
import { useSelectedProject } from '@/hooks/useSelectedProject';

const IndexScheduleModal = props => {
  const { open, onClose, onSubmit, cron, credentials, credentialsData, toolkitSchemaFetching } = props;

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
  const [cronTyoe, setCronType] = useState('default');

  useEffect(() => {
    if (open) {
      if (cron) setCronExpression(cron);

      setInnerCredentials(credentials);
    }

    return () => {
      setCredentialsError(false);
      setCronType('default');
    };
  }, [open, cron, credentials]);

  const cronState = useMemo(() => validateCronExpression(cronExpression), [cronExpression]);

  const applyIsDisabled = useMemo(
    () => !cronState.isValid || toolkitSchemaFetching,
    [cronState.isValid, toolkitSchemaFetching],
  );

  const applyChanges = () => {
    if (!innerCredentials && credentialsData) {
      setCredentialsError(true);
      return;
    }

    onSubmit(cronExpression, innerCredentials);
    onClose();
  };

  return (
    <>
      <GlobalStyles styles={styles.cronContainer} />
      <Modal.BaseModal
        open={open}
        onClose={onClose}
        title="Schedule settings"
        sx={{ '& .MuiDialog-paper': { maxWidth: 'unset !important', width: '43.75rem !important' } }}
        content={
          <Box sx={styles.contentWrapper}>
            <Box sx={styles.cronWrapper}>
              <Typography
                variant="headingSmall"
                sx={[styles.cronExplanation, !cronState.isValid && { color: 'error.main' }]}
              >
                {cronState.message}
              </Typography>

              <Box sx={styles.inputWrapper}>
                <RadioButtonGroup
                  label="Schedule Type"
                  value={cronTyoe}
                  items={[
                    { label: 'Default', value: 'default' },
                    { label: 'Advanced', value: 'advanced' },
                  ]}
                  onChange={setCronType}
                />
              </Box>

              {cronTyoe === 'default' ? (
                <Cron
                  value={cronExpression}
                  setValue={setCronExpression}
                  clearButton={false}
                  clockFormat="24-hour-clock"
                />
              ) : (
                <FormInput
                  value={cronExpression}
                  onChange={event => setCronExpression(event.target.value)}
                  placeholder="* * * * *"
                  error={!cronState.isValid}
                  sx={{ padding: '0' }}
                />
              )}

              <Box sx={styles.descriptionContainer}>
                <Typography
                  variant="bodySmall"
                  sx={styles.cronDescription}
                >
                  minute – hour – day (month) – month – day (week)
                </Typography>
                <Tooltip
                  title="Cron expression help"
                  placement="top"
                  slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] } }}
                >
                  <Box
                    sx={styles.infoIconWrapper}
                    component="a"
                    href="https://crontab.guru/#*_*_*_*"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InfoIcon
                      width={16}
                      height={16}
                    />
                  </Box>
                </Tooltip>
              </Box>

              {credentialsData && (
                <Box mt="1rem">
                  <CredentialsSelect
                    required
                    isCreationAllowed
                    label={credentialsData.description}
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
                </Box>
              )}
            </Box>
          </Box>
        }
        actions={
          <Box sx={styles.actionsWrapper}>
            <Button
              sx={styles.actionBtn}
              variant="elitea"
              color="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              sx={styles.actionBtn}
              variant="elitea"
              color="primary"
              onClick={applyChanges}
              disabled={applyIsDisabled}
            >
              Apply
            </Button>
          </Box>
        }
      />
    </>
  );
};

/** @type {MuiSx} */
const indexScheduleModalStyles = () => ({
  actionBtn: {
    width: '4.25rem',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
    minWidth: '25rem',
    padding: '0',
  },
  actionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    gap: '.75rem',
  },
  cronWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.5rem',

    input: {
      textAlign: 'center',
    },
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cronContainer: ({ palette }) => ({
    '.react-js-cron': {
      alignItems: 'center',
      justifyContent: 'center',

      span: {
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: '1rem',
        color: palette.secondary.main,
      },
    },

    '.react-js-cron-select': {
      background: palette.background.secondary,
      border: `1px solid ${palette.border.lines}`,
      color: palette.secondary.main,
      fontSize: '.75rem',
      minWidth: '8rem !important',

      '.ant-select-clear': {
        display: 'none !important',
      },

      '.ant-select-placeholder,.ant-select-content-value': {
        color: palette.secondary.main,
        fontSize: '.75rem',
      },

      div: {
        color: palette.secondary.main,
        fontSize: '.75rem',
      },
    },

    '.react-js-cron-select-dropdown': {
      zIndex: 1400,
      background: palette.background.secondary,
      border: `1px solid ${palette.border.lines}`,

      div: {
        color: palette.secondary.main,
        fontSize: '.75rem',

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
  cronDescription: ({ palette }) => ({
    color: palette.secondary.main,
    fontSize: '0.75rem',
    textAlign: 'center',
  }),
  cronExplanation: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
  descriptionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '0.25rem',
    gap: '0.25rem',
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
});

export default IndexScheduleModal;
