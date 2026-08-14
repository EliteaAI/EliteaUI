import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { CredentialsSelect } from '@/[fsd]/features/credentials';
import { Schedule } from '@/[fsd]/shared/ui';
import { useSelectedProject } from '@/hooks/useSelectedProject';

const IndexScheduleModal = memo(props => {
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

  const isPrivateProject = useMemo(
    () => selectedProject?.id === personal_project_id,
    [personal_project_id, selectedProject?.id],
  );

  const [innerCredentials, setInnerCredentials] = useState(null);
  const [credentialsError, setCredentialsError] = useState(false);

  useEffect(() => {
    if (open) {
      setInnerCredentials(credentials);
    }

    return () => {
      setCredentialsError(false);
    };
  }, [open, credentials]);

  const handleSubmit = useCallback(
    cronExpression => {
      if (!innerCredentials && credentialsData) {
        setCredentialsError(true);
        return;
      }

      onSubmit(cronExpression, innerCredentials);
      onClose();
    },
    [innerCredentials, credentialsData, onSubmit, onClose],
  );

  return (
    <Schedule.ScheduleModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      cron={cron}
      isLoading={toolkitSchemaFetching}
      isEdit={isEdit}
      closeOnSubmit={false}
    >
      {credentialsData && (
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
      )}
    </Schedule.ScheduleModal>
  );
});

IndexScheduleModal.displayName = 'IndexScheduleModal';

export default IndexScheduleModal;
