import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks';
import { APPLICATION_TOOL_TYPE } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { getAttachmentKey } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentDiff.helpers';
import {
  buildApplicationAttachment,
  buildToolkitAttachment,
  withApplicationVersion,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { isApplicationTool } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useLazyApplicationDetailsQuery } from '@/api/applications';
import { useLazyToolkitsDetailsQuery } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';

// The flow-editor hook by file: the flow-editor barrels reach the node components, which import this slice

const SWARM_TOOL_NAME = 'swarm';

/**
 * Attaches toolkits, MCPs, agents and pipelines picked in nodes. Edits the form only: Save applies the
 * relations (`useApplyPipelineAttachments`) and Discard reverts them with the rest of the form.
 */
export const usePipelineAttachments = () => {
  const { values, setFieldValue } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const [fetchToolkitDetails] = useLazyToolkitsDetailsQuery();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();

  const tools = useMemo(() => values?.version_details?.tools || [], [values?.version_details?.tools]);

  // Two writes in one tick must not overwrite each other
  const latestToolsRef = useRef(tools);
  useEffect(() => {
    latestToolsRef.current = tools;
  }, [tools]);

  const writeTools = useCallback(
    nextTools => {
      latestToolsRef.current = nextTools;
      setFieldValue('version_details.tools', nextTools);
    },
    [setFieldValue],
  );

  const findAttached = useCallback(
    key => latestToolsRef.current.find(tool => getAttachmentKey(tool) === key),
    [],
  );

  const addTool = useCallback(
    tool => {
      const attached = findAttached(getAttachmentKey(tool));
      if (attached) return attached;
      writeTools([...latestToolsRef.current, tool]);
      return tool;
    },
    [findAttached, writeTools],
  );

  /**
   * Builds the attachment for a project toolkit or MCP (fetching its details when the list row has no
   * settings) without adding it. Callers that also write the node must call `addTool` in the same tick
   * as that YAML write, or reconcile may drop the attachment before a node references it.
   * @param toolkit a project toolkit list row or details; `toolkitName` is the name the node binds to
   */
  const prepareToolkitAttachment = useCallback(
    async (toolkit, { mcp = false, toolkitName } = {}) => {
      if (!toolkit?.id) return null;
      const attached = findAttached(getAttachmentKey(toolkit));
      if (attached) return attached;

      let source = toolkit;
      if (!toolkit.settings) {
        try {
          source = await fetchToolkitDetails({ projectId, toolkitId: toolkit.id }).unwrap();
        } catch (error) {
          toastError(buildErrorMessage(error));
          return null;
        }
      }
      return buildToolkitAttachment(source, {
        mcp,
        toolkitName: toolkitName || source.toolkit_name || getToolkitNameFromSchema(source),
      });
    },
    [fetchToolkitDetails, findAttached, getToolkitNameFromSchema, projectId, toastError],
  );

  /** For callers that wrote the node YAML already */
  const attachToolkit = useCallback(
    async (toolkit, options) => {
      const tool = await prepareToolkitAttachment(toolkit, options);
      return tool ? addTool(tool) : null;
    },
    [addTool, prepareToolkitAttachment],
  );

  /**
   * Builds the attachment for the default version of an agent or pipeline, without adding it (see
   * `prepareToolkitAttachment`). Resolves to the tool, or `null` after a toasted error.
   */
  const prepareApplicationAttachment = useCallback(
    async application => {
      if (!application?.id) return null;
      let details;
      try {
        details = await fetchApplicationDetails({ projectId, applicationId: application.id }, true).unwrap();
      } catch (error) {
        toastError(buildErrorMessage(error));
        return null;
      }
      if ((details?.version_details?.meta?.internal_tools || []).includes(SWARM_TOOL_NAME)) {
        toastError(
          `"${application.name}" has Swarm Mode enabled and cannot be used in a pipeline. ` +
            'Swarm agents are only supported in direct chat.',
        );
        return null;
      }
      return buildApplicationAttachment(details);
    },
    [fetchApplicationDetails, projectId, toastError],
  );

  const setApplicationVersion = useCallback(
    (applicationId, versionDetails) => {
      const key = getAttachmentKey({
        type: APPLICATION_TOOL_TYPE,
        settings: { application_id: applicationId },
      });
      const attached = findAttached(key);
      if (!attached || attached.settings?.application_version_id === versionDetails?.id) return;
      writeTools(
        latestToolsRef.current.map(tool =>
          getAttachmentKey(tool) === key ? withApplicationVersion(tool, versionDetails) : tool,
        ),
      );
    },
    [findAttached, writeTools],
  );

  /** Removes an attachment from the form; Save detaches it, Discard brings it back */
  const detach = useCallback(
    tool => {
      const key = getAttachmentKey(tool);
      writeTools(latestToolsRef.current.filter(item => getAttachmentKey(item) !== key));
    },
    [writeTools],
  );

  const getAttachedApplication = useCallback(
    name => tools.find(tool => isApplicationTool(tool) && tool.name === name),
    [tools],
  );

  return {
    tools,
    addTool,
    attachToolkit,
    prepareToolkitAttachment,
    prepareApplicationAttachment,
    setApplicationVersion,
    detach,
    getAttachedApplication,
    getToolkitName: getToolkitNameFromSchema,
  };
};
