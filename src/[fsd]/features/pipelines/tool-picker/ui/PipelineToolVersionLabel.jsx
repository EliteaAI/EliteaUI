import { memo, useMemo } from 'react';

import { Typography } from '@mui/material';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';

/** Name of the agent or pipeline version a pipeline runs */
const PipelineToolVersionLabel = memo(props => {
  const { tool } = props;

  const projectId = useSelectedProjectId();
  const applicationId = tool?.settings?.application_id;
  const versionId = tool?.settings?.application_version_id;
  const { data: application } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId },
  );

  const versionName = useMemo(
    () => application?.versions?.find(version => Number(version.id) === Number(versionId))?.name,
    [application?.versions, versionId],
  );

  if (!versionName) return null;

  return (
    <Typography
      variant="bodySmall"
      color="text.primary"
      noWrap
      data-testid="pipeline-tool-card-version"
    >
      {versionName}
    </Typography>
  );
});

PipelineToolVersionLabel.displayName = 'PipelineToolVersionLabel';

export default PipelineToolVersionLabel;
