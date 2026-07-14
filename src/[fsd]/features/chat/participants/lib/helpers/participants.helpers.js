import { ChatParticipantType, DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

export const getChatParticipantUniqueId = participant => {
  if (participant) {
    const entity_name =
      participant.entity_name === ChatParticipantType.Applications &&
      participant.entity_settings?.agent_type === ChatParticipantType.Pipelines
        ? ChatParticipantType.Pipelines
        : participant.entity_name;
    return (
      entity_name +
      '_' +
      (participant.entity_name === ChatParticipantType.Models
        ? participant.entity_meta?.model_name + '-' + participant.entity_meta?.integration_uid
        : participant.entity_meta?.id) +
      '_' +
      (participant.entity_meta?.project_id || '')
    );
  }
  return '';
};

export const getParticipantName = (participant, systemSenderName = DEFAULT_PARTICIPANT_NAME) => {
  switch (participant?.entity_name) {
    case ChatParticipantType.Applications:
      // Prefer entity_meta.name if present (set when adding participants),
      // otherwise fall back to meta.name
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Models:
      return participant?.entity_meta?.model_name || '';
    case ChatParticipantType.Users:
      return participant?.meta?.user_name || '';
    case ChatParticipantType.Pipelines:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Toolkits:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Skills:
      return participant?.entity_meta?.name || participant?.meta?.name || '';
    case ChatParticipantType.Dummy:
      return systemSenderName;
    default:
      return '';
  }
};

/**
 * True when a participant is a "container" agent that CANNOT be bound as a callable tool in adhoc
 * chat because nesting it would exceed the tier budget (issue #5778, relaxing #5680's absolute ban).
 *
 * A non-pipeline container is NO LONGER unconditionally skipped: a container whose own agent-subtree
 * still fits within `max_agent_nesting_tiers` (the participant counted as tier 1) is bindable and
 * must NOT show the skip hint. The gate now mirrors the depth-aware add-guard in
 * useAgentPipelineAssociation.jsx: skip only when the adhoc root plus the candidate subtree exceeds
 * `max_agent_nesting_tiers`.
 *
 * The backend emits `agent_subtree_tiers` + `max_agent_nesting_tiers` on the participant meta
 * (conversation_utils.get_conversation_details, issue #5778). When BOTH tier fields are present we
 * use them; when they are absent (older payloads) we fall back to the pre-#5778 behavior — treat any
 * `is_container` as skipped — so we neither spuriously unblock nor crash on a stale payload.
 *
 * Callers additionally gate on `!isActive` (the hint is only relevant while the agent is NOT the
 * active orchestrator). Pipelines are transparent for counting purposes, but their agent descendants
 * still consume tiers, so they are evaluated by the same formula.
 */
export const isSkippedContainerParticipant = participant => {
  if (!participant || participant.meta?.is_container !== true) return false;
  if (participant.entity_name !== ChatParticipantType.Applications) return false;
  // Depth-aware gate (issue #5778). The adhoc orchestrator is tier A. The candidate subtree starts
  // at tier B, therefore all of its reported agent tiers are added to the host tier. A pipeline is
  // transparent in the backend's subtree count; it is not an exemption from validating descendants.
  const subtreeTiers = participant.meta?.agent_subtree_tiers;
  const maxTiers = participant.meta?.max_agent_nesting_tiers;
  if (typeof subtreeTiers === 'number' && typeof maxTiers === 'number') {
    return 1 + subtreeTiers > maxTiers;
  }
  // Backward-compat: tier fields absent → fall back to the blunt container ban.
  return true;
};

export const isParticipantStillActive = participant => {
  switch (participant?.entity_name) {
    case ChatParticipantType.Applications:
      return !!participant?.meta?.name;
    case ChatParticipantType.Skills:
      return !!participant?.meta?.name;
    case ChatParticipantType.Models:
      return !!participant?.entity_meta?.model_name;
    case ChatParticipantType.Dummy:
      return true;
    default:
      return false;
  }
};
