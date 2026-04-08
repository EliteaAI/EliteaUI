import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { useToolkitAssociateMutation } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const getChangedTools = (currentTools = [], originalTools = []) => {
  const result = [];
  currentTools.forEach((currentTool, index) => {
    const originalTool = originalTools[index];

    if (originalTool) {
      const currentSelectedTools = currentTool.settings?.selected_tools || [];
      const originalSelectedTools = originalTool.settings?.selected_tools || [];

      // Compare selected tools arrays
      const hasChanges =
        currentSelectedTools.length !== originalSelectedTools.length ||
        currentSelectedTools.some(tool => !originalSelectedTools.includes(tool)) ||
        originalSelectedTools.some(tool => !currentSelectedTools.includes(tool));

      if (hasChanges) {
        result.push({
          index,
          toolId: currentTool.id,
          currentSelectedTools,
          originalSelectedTools,
          toolData: currentTool,
        });
      }
    }
  });

  return result;
};

/**
 * Enhanced save version hook that handles tool changes separately
 * @param {Function} resetForm - Formik reset function
 * @returns {Object} Save functions and loading state
 */
const useSaveChangedTools = () => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [updateToolkitRelation, { isLoading: isSavingToolkit }] = useToolkitAssociateMutation();

  const {
    values: { version_details = { tools: [] }, id: applicationId },
    initialValues: { version_details: initial_version_details = { tools: [] } },
  } = useFormikContext();

  // Get the actual version ID from version_details (the currently edited version)
  const actualVersionId = useMemo(() => {
    return version_details?.id;
  }, [version_details?.id]);

  /**
   * Compare selected tools between current and original version
   * @returns {Array} Array of tools that have changed selected_tools
   */
  const changedTools = useMemo(() => {
    const currentTools = version_details?.tools || [];
    const originalTools = initial_version_details?.tools || [];
    return getChangedTools(currentTools, originalTools);
  }, [version_details?.tools, initial_version_details?.tools]);

  /**
   * Save tools with changed selected_tools using PATCH endpoint
   * @param {Array} changedTools - Array of tools that have changed
   * @returns {Promise<boolean>} Success status
   */
  const saveChangedTools = useCallback(
    async (tools, specifiedVersionId) => {
      try {
        // Save each changed toolkit tool using PATCH endpoint
        for (const tool of tools) {
          const { error: toolError } = await updateToolkitRelation({
            projectId,
            toolkitId: tool.toolId,
            entity_version_id: specifiedVersionId || actualVersionId,
            entity_id: applicationId,
            entity_type: 'agent',
            has_relation: true,
            selected_tools: tool.currentSelectedTools,
          });

          if (toolError) {
            toastError(`Failed to save toolkit: ${buildErrorMessage(toolError)}`);
            return false;
          }
        }
        return true;
      } catch {
        toastError('Failed to save toolkit changes');
        return false;
      }
    },
    [projectId, actualVersionId, applicationId, updateToolkitRelation, toastError],
  );

  /**
   * Main save function that handles tools first, then version data
   */
  const onSaveTools = useCallback(
    async specifiedVersionId => {
      try {
        // Step 1: Check and save changed tools first
        if (changedTools.length > 0) {
          return await saveChangedTools(changedTools, specifiedVersionId);
        }
        return true; // No changes, nothing to save
      } catch {
        toastError('An unexpected error occurred while saving');
        return false;
      }
    },
    [changedTools, saveChangedTools, toastError],
  );

  return {
    onSaveTools,
    isSavingToolkit,
  };
};

export default useSaveChangedTools;
