import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Typography } from '@mui/material';

import { CredentialsSelect } from '@/[fsd]/features/credentials';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import { Schedule } from '@/[fsd]/shared/ui';

const PERSONAL_TOOLKIT_CREDENTIAL_HINT =
  'This toolkit uses a personal credential; schedules in a team project need a project credential.';

const IndexScheduleModal = memo(props => {
  const {
    open,
    onClose,
    onSubmit,
    cron,
    timezone,
    credentials,
    toolkitCredentials,
    credentialsData,
    toolkitSchemaFetching,
    isEdit,
    toolkitName,
  } = props;
  const { isPrivate: isPersonalProject } = useProjectType();
  const styles = indexScheduleModalStyles();

  const [innerCredentials, setInnerCredentials] = useState(null);
  const [credentialsError, setCredentialsError] = useState(false);
  const [isInnerCredentialsListed, setIsInnerCredentialsListed] = useState(null);

  const isToolkitCredentialPersonalInTeam = !isPersonalProject && Boolean(toolkitCredentials?.private);

  const credentialsSeed = useMemo(
    () => (isToolkitCredentialPersonalInTeam ? null : (toolkitCredentials ?? null)),
    [isToolkitCredentialPersonalInTeam, toolkitCredentials],
  );

  const seedOnOpenRef = useRef(credentialsSeed);

  useEffect(() => {
    seedOnOpenRef.current = credentialsSeed;
  }, [credentialsSeed]);

  const hasUserPickedRef = useRef(false);

  useEffect(() => {
    if (open) {
      hasUserPickedRef.current = false;
      setInnerCredentials(credentials ?? seedOnOpenRef.current);
    }

    return () => {
      setCredentialsError(false);
      setIsInnerCredentialsListed(null);
    };
  }, [open, credentials]);

  useEffect(() => {
    if (!open || credentials || hasUserPickedRef.current || !credentialsSeed) return;
    setInnerCredentials(current => current ?? credentialsSeed);
  }, [open, credentials, credentialsSeed]);

  const handleSelectConfiguration = useCallback(value => {
    hasUserPickedRef.current = true;
    setInnerCredentials(value);
  }, []);

  const isInnerCredentialsRejected =
    !innerCredentials ||
    isInnerCredentialsListed === false ||
    (!isPersonalProject && Boolean(innerCredentials.private));

  const handleSubmit = useCallback(
    cronExpression => {
      if (isInnerCredentialsRejected && credentialsData) {
        setCredentialsError(true);
        return;
      }

      onSubmit(cronExpression, innerCredentials);
      onClose();
    },
    [isInnerCredentialsRejected, innerCredentials, credentialsData, onSubmit, onClose],
  );

  return (
    <Schedule.ScheduleModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      cron={cron}
      timezone={timezone}
      isLoading={toolkitSchemaFetching}
      isEdit={isEdit}
      closeOnSubmit={false}
    >
      {credentialsData && (
        <>
          <CredentialsSelect
            isCreationAllowed
            label={`${toolkitName} Credentials`}
            description={credentialsData.description}
            onSelectConfiguration={handleSelectConfiguration}
            value={innerCredentials}
            configurations={credentialsData.options}
            error={credentialsError}
            helperText="Your configuration does not match any available configurations."
            type={credentialsData.configuration_types?.[0] || ''}
            section="credentials"
            disabled={toolkitSchemaFetching}
            onlyPublic={!isPersonalProject}
            fallbackToFirstCredential={false}
            onSelectionListedChange={setIsInnerCredentialsListed}
          />
          {isToolkitCredentialPersonalInTeam && !innerCredentials && (
            <Typography
              data-testid="index-schedule-personal-credential-hint"
              variant="bodySmall"
              sx={styles.hint}
            >
              {PERSONAL_TOOLKIT_CREDENTIAL_HINT}
            </Typography>
          )}
        </>
      )}
    </Schedule.ScheduleModal>
  );
});

IndexScheduleModal.displayName = 'IndexScheduleModal';

/** @type {MuiSx} */
const indexScheduleModalStyles = () => ({
  hint: ({ palette }) => ({
    marginTop: '0.5rem',
    color: palette.text.secondary,
  }),
});

export default IndexScheduleModal;
