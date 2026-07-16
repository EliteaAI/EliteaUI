import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useSetRefetchDetails } from '@/[fsd]/features/agent/lib/hooks';
import { useLazyApplicationDetailsQuery, useUpdateApplicationRelationMutation } from '@/api/applications';
import FlowIcon from '@/assets/flow-icon.svg?react';
import { buildErrorMessage } from '@/common/utils';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Map a backend sub-agent validation error (issue #5680 cycle / leaf-rule rejections and others)
 * to a clear, actionable toast message. This is the SINGLE source of truth for phrasing these
 * errors — every flow that binds/switches an agent-or-pipeline tool (add flow, version switch,
 * AI-generate) must route through here so the user never sees a raw backend string or bare IDs.
 *
 * Falls back to the generic builder for unrelated errors.
 *
 * @param {string|object} rawError - backend error string or an error object.
 * @param {string} entityName - the agent/pipeline name to name in the message.
 * @param {object} [opts] - contextual phrasing.
 * @param {'add'|'switch'|'status'} [opts.action='add'] - "add" (bind a new tool), "switch" (change
 *   an existing tool's version), or "status" (an already-attached tool whose sub-agent state has
 *   since drifted into an invalid config — shown on the tool card, not as an action rejection).
 *   Controls the verb and the actionable suffix.
 * @param {string} [opts.versionLabel] - human-readable target version (switch action only), e.g.
 *   "base – 06.07.2026", so the message names the exact version being rejected.
 * @param {'agent'|'pipeline'} [opts.entityLabel='agent'] - noun for the rejected entity.
 */
export const mapAssociationError = (rawError, entityName, opts = {}) => {
  const { action = 'add', versionLabel, entityLabel = 'agent' } = opts;
  const message = typeof rawError === 'string' ? rawError : buildErrorMessage(rawError);
  const lower = (message || '').toLowerCase();

  const isSwitch = action === 'switch';
  const isStatus = action === 'status';
  // "…to version X" only when we actually have a label; keep the phrase clean otherwise.
  const target = isSwitch
    ? `switch "${entityName}"${versionLabel ? ` to version ${versionLabel}` : ''}`
    : isStatus
      ? `use "${entityName}"`
      : `add "${entityName}"`;

  if (lower.includes('circular') || lower.includes('cycle')) {
    if (isSwitch)
      return (
        `Cannot ${target}: this ${entityLabel} version is already in the chain and would create a ` +
        `circular reference. Choose a different version or remove the circular reference first.`
      );
    if (isStatus)
      return (
        `Cannot ${target}: this ${entityLabel} is now part of a circular reference in the agent ` +
        `chain. Point it to a version that isn't already in the chain, or remove it.`
      );
    return `Cannot ${target}: this would create a circular agent reference. Remove the circular dependency first.`;
  }
  if (
    lower.includes('uses other agents') ||
    lower.includes('cannot be nested') ||
    lower.includes('sub-agent') ||
    lower.includes('tiers') ||
    lower.includes('nested too deeply')
  ) {
    // #5778: nesting is now allowed up to 3 tiers (orchestrator → sub-orchestrator → leaf).
    // The message reflects a DEPTH limit, not an absolute ban on container agents.
    if (isSwitch)
      return (
        `Cannot ${target}: that version's sub-agent chain is too deep — agent nesting is limited ` +
        `to 3 tiers (orchestrator → sub-orchestrator → leaf). Choose a version with a shallower chain.`
      );
    if (isStatus)
      return (
        `Cannot ${target}: it now nests agents too deeply — agent nesting is limited to 3 tiers ` +
        `(orchestrator → sub-orchestrator → leaf). Point it to a version with a shallower chain.`
      );
    // Add path binds the child's DEFAULT version, so the actionable fix is to make a shallower
    // version (one whose own sub-agents are leaves) the default — then it fits within the budget.
    return (
      `Cannot ${target}: its sub-agent chain is too deep. Agent nesting is limited to 3 tiers ` +
      `(orchestrator → sub-orchestrator → leaf). Tip: make a shallower version its default, then add it.`
    );
  }
  if (lower.includes('bind') && lower.includes('itself')) {
    if (isSwitch) return `Cannot ${target}: a version cannot reference itself.`;
    if (isStatus) return `Cannot ${target}: a ${entityLabel} cannot reference itself.`;
    return `Cannot ${target} to itself.`;
  }
  return message;
};

export const wouldExceedAgentNestingDepth = (candidateSubtreeTiers, maxTiers, hostTier = 1) =>
  typeof candidateSubtreeTiers === 'number' &&
  typeof maxTiers === 'number' &&
  hostTier + candidateSubtreeTiers > maxTiers;

/**
 * Custom hook to handle association of agents and pipelines as "toolkits"
 */
export const useAgentPipelineAssociation = (applicationId, versionId) => {
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const { values, setFieldValue, resetForm, dirty } = useFormikContext();
  const { setRefetch } = useSetRefetchDetails();

  // Get current application details to determine context for success messages
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();

  // New API mutation for application relation
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();

  // Handle agent association - adds agent as a "toolkit" to the application
  const handleAssociateAgent = useCallback(
    async (agent, isPipeline = false) => {
      if (!applicationId || !versionId) {
        toastError('Application ID and Version ID are required to associate agent');
        return;
      }

      const { data: selectedApplication } = await fetchApplicationDetails({
        projectId,
        applicationId: agent.id,
      });

      // Block swarm agents from being added as tools
      const internalTools = selectedApplication?.version_details?.meta?.internal_tools || [];
      if (internalTools.includes('swarm')) {
        toastError(
          `"${agent.name}" has Swarm Mode enabled and cannot be added as a tool. ` +
            `Swarm agents are only supported in direct chat.`,
        );
        return;
      }

      // Depth-aware nesting guard (issue #5778, relaxing #5680's absolute ban). A non-pipeline
      // "container" agent (one that itself uses other agents) MAY now be nested, as long as the
      // combined tree stays within the tier budget. The host being edited is the tier-1 root, so
      // the candidate lands at tier 2; it is legal iff its own agent-subtree depth leaves room:
      //   1 host tier + candidate_subtree_tiers <= max. The backend computes
      // agent_subtree_tiers with pipelines transparent, so a pipeline does not consume a tier but
      // its agent descendants still do. Best-effort UI guidance — the backend
      // validator is authoritative (see the catch/error handling).
      const candidateSubtreeTiers = selectedApplication?.version_details?.agent_subtree_tiers;
      const maxTiers = selectedApplication?.version_details?.max_agent_nesting_tiers;
      // Only enforce when the backend supplied both fields; otherwise defer entirely to the
      // backend (older payloads without the fields must not be spuriously blocked or allowed).
      const hostTier = 1; // the agent being edited is the top-level/root of its own chain
      const wouldExceed = wouldExceedAgentNestingDepth(candidateSubtreeTiers, maxTiers, hostTier);
      if (wouldExceed) {
        // Route the pre-attach guard through the shared mapper so it carries the same friendly
        // phrasing as the backend rejection — this guard fires before the request is sent.
        toastError(
          mapAssociationError('uses other agents and cannot be added as a sub-agent', agent.name, {
            action: 'add',
            entityLabel: isPipeline ? 'pipeline' : 'agent',
          }),
        );
        return;
      }

      try {
        const currentTools = values?.version_details?.tools || [];

        // Check if agent/pipeline is already added to prevent duplicates
        const existingTool = currentTools.find(
          tool => tool.type === 'application' && tool.settings?.application_id === selectedApplication.id,
        );

        if (!existingTool) {
          // Use the new API to create the relation
          const result = await updateApplicationRelation({
            projectId,
            selectedApplicationId: selectedApplication.id,
            selectedVersionId: selectedApplication.version_details?.id,
            application_id: applicationId,
            version_id: versionId,
            has_relation: true,
          }).unwrap();
          if (!result.error) {
            // Update the local form state to reflect the new tool
            if (dirty) {
              setFieldValue(`version_details.tools`, [
                ...currentTools,
                {
                  id: result.tool_id, // Store the tool_id returned from API
                  type: 'application', // Use 'application' as the type for agents/pipelines
                  name: selectedApplication.name,
                  description: selectedApplication.description || '',
                  agent_type: selectedApplication.version_details?.agent_type,
                  icon_meta: selectedApplication.version_details?.icon_meta || {},
                  settings: {
                    application_id: selectedApplication.id, // Use agent ID for application_id
                    application_version_id: selectedApplication.version_details?.id,
                  },
                  author: selectedApplication.version_details?.author || {},
                  author_id: selectedApplication.version_details?.author?.id,
                  variables: (selectedApplication.version_details?.variables || []).map(
                    ({ name, value }) => ({
                      name,
                      value,
                    }),
                  ),
                },
              ]);
            } else {
              resetForm({
                values: {
                  ...(values || {}),
                  version_details: {
                    ...(values.version_details || {}),
                    tools: [
                      ...(values.version_details.tools || []),
                      {
                        id: result.tool_id, // Store the tool_id returned from API
                        type: 'application',
                        name: selectedApplication.name,
                        description: selectedApplication.description || '',
                        agent_type: selectedApplication.version_details?.agent_type,
                        icon_meta: selectedApplication.version_details?.icon_meta || {},
                        settings: {
                          application_id: selectedApplication.id,
                          application_version_id: selectedApplication.version_details?.id,
                        },
                        author: selectedApplication.version_details?.author || {},
                        author_id: selectedApplication.version_details?.author?.id,
                        variables: (selectedApplication.version_details?.variables || []).map(
                          ({ name, value }) => ({
                            name,
                            value,
                          }),
                        ),
                      },
                    ],
                  },
                },
              });
              setRefetch();
            }
            // Create context-aware success message
            toastSuccess(
              `The "${agent.name}" ${isPipeline ? 'pipeline' : 'agent'} is successfully added to the ${values?.name || 'application'} ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'}.`,
            );
          } else {
            toastError(mapAssociationError(result.error?.data?.error || result.error, agent.name));
          }
        } else {
          toastError(
            `The "${agent.name}" ${isPipeline ? 'pipeline' : 'agent'} is already added to this ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'}.`,
          );
        }
      } catch (error) {
        const backendMsg = error?.data?.error || error?.message;
        toastError(
          mapAssociationError(backendMsg, agent.name) ||
            `Failed to add agent: ${error.message || 'Unknown error'}`,
        );
      }
    },
    [
      applicationId,
      dirty,
      fetchApplicationDetails,
      projectId,
      resetForm,
      setFieldValue,
      setRefetch,
      toastError,
      toastSuccess,
      updateApplicationRelation,
      values,
      versionId,
    ],
  );

  // Get icon for agent/pipeline tools
  const getToolIcon = useCallback((toolType, size = '16px') => {
    if (toolType === 'agent') {
      return (
        <ApplicationsIcon
          style={{ width: size, height: size }}
          fill="#FFFFFF"
        />
      );
    } else if (toolType === 'pipeline') {
      return (
        <FlowIcon
          style={{ width: size, height: size }}
          fill="#FFFFFF"
        />
      );
    }
    return null;
  }, []);

  return {
    handleAssociateAgent,
    getToolIcon,
  };
};
