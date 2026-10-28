import { useCallback } from 'react';

import { IDEMPOTENT_RELATION_ERRORS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import {
  diffAttachments,
  getAttachmentKey,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentDiff.helpers';
import { isApplicationTool } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useUpdateApplicationRelationMutation } from '@/api/applications';
import { useToolkitAssociateMutation } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';

const MISSING_TOOLKIT_ERROR = 'No such toolkit';

const getErrorText = error => error?.data?.error || error?.message || '';

const isIdempotentError = (error, { isRemoval }) => {
  const text = getErrorText(error);
  if (typeof text !== 'string') return false;
  return (
    IDEMPOTENT_RELATION_ERRORS.some(message => text.includes(message)) ||
    (isRemoval && text.includes(MISSING_TOOLKIT_ERROR))
  );
};

const getSelectedTools = tool => {
  const selectedTools = tool.settings?.selected_tools;
  return Array.isArray(selectedTools) && selectedTools.length ? selectedTools : undefined;
};

/**
 * Applies the attachments picked in nodes to the saved version, before the version itself is saved.
 * Each request is idempotent, so a failed Save can simply be retried.
 */
export const useApplyPipelineAttachments = () => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [associateToolkit, { isLoading: isSavingToolkits }] = useToolkitAssociateMutation();
  const [updateApplicationRelation, { isLoading: isSavingRelations }] =
    useUpdateApplicationRelationMutation();

  /**
   * @returns {Promise<false | { tools: object[] }>} `false` after the first failure (already toasted);
   *   otherwise `tools` with the tool ids the backend gave to new agents and pipelines
   */
  const applyAttachments = useCallback(
    async ({ applicationId, versionId, initialTools = [], tools = [] }) => {
      const { added, removed, selectedToolsChanged, versionChanged, hasChanges } = diffAttachments(
        initialTools,
        tools,
      );
      if (!hasChanges) return { tools };

      const toolIdsByKey = {};

      const setToolkitRelation = (tool, hasRelation) =>
        associateToolkit({
          projectId,
          toolkitId: tool.id,
          entity_version_id: versionId,
          entity_id: applicationId,
          entity_type: 'agent',
          has_relation: hasRelation,
          selected_tools: hasRelation ? getSelectedTools(tool) : undefined,
        }).unwrap();

      const setApplicationRelation = (tool, hasRelation, childVersionId) =>
        updateApplicationRelation({
          projectId,
          selectedApplicationId: tool.settings?.application_id,
          selectedVersionId: childVersionId,
          application_id: applicationId,
          version_id: versionId,
          has_relation: hasRelation,
        }).unwrap();

      const getErrorMessage = (tool, error, action) => {
        if (isApplicationTool(tool)) {
          return mapAssociationError(getErrorText(error) || error, tool.name, {
            action,
            entityLabel: tool.agent_type === 'pipeline' ? 'pipeline' : 'agent',
          });
        }
        const verb = action === 'remove' ? 'remove' : 'save';
        return `Failed to ${verb} toolkit "${tool.toolkit_name || tool.name}": ${buildErrorMessage(error)}`;
      };

      const run = async (tool, request, { action, isRemoval = false }) => {
        try {
          return await request();
        } catch (error) {
          if (isIdempotentError(error, { isRemoval })) return null;
          toastError(getErrorMessage(tool, error, action));
          throw error;
        }
      };

      try {
        for (const tool of added) {
          if (isApplicationTool(tool)) {
            const result = await run(
              tool,
              () => setApplicationRelation(tool, true, tool.settings?.application_version_id),
              { action: 'add' },
            );
            if (result?.tool_id) toolIdsByKey[getAttachmentKey(tool)] = result.tool_id;
          } else {
            await run(tool, () => setToolkitRelation(tool, true), { action: 'add' });
          }
        }
        for (const { tool } of versionChanged) {
          await run(tool, () => setApplicationRelation(tool, true, tool.settings?.application_version_id), {
            action: 'switch',
          });
        }
        for (const tool of selectedToolsChanged) {
          await run(tool, () => setToolkitRelation(tool, true), { action: 'add' });
        }
        for (const tool of removed) {
          await run(
            tool,
            () =>
              isApplicationTool(tool)
                ? setApplicationRelation(tool, false, tool.settings?.application_version_id)
                : setToolkitRelation(tool, false),
            { action: 'remove', isRemoval: true },
          );
        }
      } catch {
        return false;
      }

      return {
        tools: tools.map(tool => {
          const toolId = toolIdsByKey[getAttachmentKey(tool)];
          return toolId && !tool.id ? { ...tool, id: toolId } : tool;
        }),
      };
    },
    [associateToolkit, projectId, toastError, updateApplicationRelation],
  );

  return { applyAttachments, isApplyingAttachments: isSavingToolkits || isSavingRelations };
};
