import { memo, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { eliteaApi } from '@/api/eliteaApi';
import { ViewMode } from '@/common/constants';
import useValidateApplicationVersion from '@/hooks/application/useValidateApplicationVersion';
import useViewMode from '@/hooks/useViewMode';

const ApplicationValidator = props => {
  const { agentId, projectId, isCreateMode = false } = props;
  const { values } = useFormikContext();
  const dispatch = useDispatch();
  const prevToolsRef = useRef();
  const viewMode = useViewMode();

  const isPublished = viewMode === ViewMode.Public;
  const shouldSkip =
    isPublished ||
    isCreateMode ||
    !agentId ||
    !projectId ||
    !values?.version_details?.id ||
    !values?.version_details?.tools?.length;

  // Track tools changes and invalidate specific validation cache when tools change
  useEffect(() => {
    const currentTools = values?.version_details?.tools || [];
    // Create hash of tools to detect changes (tool.id will be the tool_id from API for agent/pipeline tools)
    const currentToolsHash = currentTools.map(tool => `${tool.id}-${tool.type}-${tool.name}`).join(',');

    if (prevToolsRef.current && prevToolsRef.current !== currentToolsHash && !shouldSkip) {
      // Tools have changed - invalidate only the specific validation cache to trigger immediate validation
      dispatch(
        eliteaApi.util.invalidateTags([
          { type: 'ApplicationValidation', id: `${projectId}-${agentId}-${values?.version_details?.id}` },
        ]),
      );
    }

    prevToolsRef.current = currentToolsHash;
  }, [values?.version_details?.tools, values?.version_details?.id, shouldSkip, dispatch, projectId, agentId]);

  // Use validation hook to trigger toolkit validation for the parent agent
  useValidateApplicationVersion({
    applicationId: agentId,
    projectId,
    versionId: values?.version_details?.id,
    forceSkip: shouldSkip,
  });

  // Collect application-type sub-tools (sub-agents/pipelines used as tools)
  const applicationTools = useMemo(() => {
    if (!values?.version_details?.tools?.length || isCreateMode || isPublished) return [];
    return values.version_details.tools.filter(
      tool =>
        tool.type === 'application' && tool.settings?.application_id && tool.settings?.application_version_id,
    );
  }, [values?.version_details?.tools, isCreateMode, isPublished]);

  return (
    <>
      {applicationTools.map(tool => (
        <SubAgentValidator
          key={`${tool.settings.application_id}-${tool.settings.application_version_id}`}
          projectId={projectId}
          applicationId={tool.settings.application_id}
          versionId={tool.settings.application_version_id}
        />
      ))}
    </>
  );
};

/**
 * Validates a single sub-agent/pipeline tool using the same hook as the parent.
 * Rendered once per application-type tool to follow React hooks rules.
 */
const SubAgentValidator = memo(props => {
  const { projectId, applicationId, versionId } = props;

  useValidateApplicationVersion({
    applicationId,
    projectId,
    versionId,
  });

  return null;
});

SubAgentValidator.displayName = 'SubAgentValidator';

export default ApplicationValidator;
