import { memo, useCallback, useMemo } from 'react';

import { format } from 'date-fns';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useIsVersionLocked } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useIsVersionLocked.hooks';
import { usePipelineAttachments } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useApplicationDetailsQuery } from '@/api/applications';

const formatVersionLabel = version => {
  if (version.name === LATEST_VERSION_NAME) return LATEST_VERSION_NAME;
  const name = version.name || 'Unnamed version';
  const createdAt = version.created_at ? new Date(version.created_at) : null;
  return createdAt && !Number.isNaN(createdAt.getTime())
    ? `${name} – ${format(createdAt, 'dd.MM.yyyy')}`
    : name;
};

/** Version of the agent or pipeline an Agent node runs. Changing it is applied on Save. */
const AgentVersionSelect = memo(props => {
  const { tool, disabled = false, 'data-testid': testId } = props;

  const projectId = useSelectedProjectId();
  const isVersionLocked = useIsVersionLocked();
  const { setApplicationVersion } = usePipelineAttachments();
  const applicationId = tool?.settings?.application_id;
  const versionId = tool?.settings?.application_version_id;

  const { data: application, isFetching } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId },
  );

  const options = useMemo(
    () =>
      [...(application?.versions || [])]
        .filter(version => Number(version.id) > 0)
        .sort((a, b) => {
          if (a.name === LATEST_VERSION_NAME) return -1;
          if (b.name === LATEST_VERSION_NAME) return 1;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        })
        .map(version => ({ value: Number(version.id), label: formatVersionLabel(version), version })),
    [application?.versions],
  );

  const isMissingVersion =
    Boolean(versionId) && options.length > 0 && !options.some(o => o.value === versionId);

  const handleChange = useCallback(
    newVersionId => {
      const option = options.find(item => item.value === newVersionId);
      if (option)
        setApplicationVersion(applicationId, { id: option.value, icon_meta: option.version.icon_meta });
    },
    [applicationId, options, setApplicationVersion],
  );

  return (
    <SingleSelect
      label="Version"
      value={versionId}
      options={options}
      onValueChange={handleChange}
      disabled={disabled || isVersionLocked || !applicationId}
      showBorder
      showEmptyPlaceholder={false}
      isListFetching={isFetching}
      error={isMissingVersion}
      helperText={isMissingVersion ? 'This version no longer exists. Select another one.' : ''}
      className="nopan nodrag"
      maxDisplayValueLength="100%"
      data-testid={testId}
    />
  );
});

AgentVersionSelect.displayName = 'AgentVersionSelect';

export default AgentVersionSelect;
