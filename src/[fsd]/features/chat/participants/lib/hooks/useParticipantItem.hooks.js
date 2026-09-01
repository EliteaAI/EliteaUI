import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useParticipantDetailsContext } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import {
  canParticipantBeActiveInChat,
  isSkippedContainerParticipant,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import { useEliteaAssistantRef } from '@/[fsd]/widgets/support-assistant';
import { ChatParticipantType, SearchParams } from '@/common/constants';
import useNavBlocker from '@/hooks/useNavBlocker';

export const useParticipantItem = ({
  participant,
  disabledEdit,
  isActive,
  onClickItem,
  onEdit,
  editingToolkit,
}) => {
  const assistantRef = useEliteaAssistantRef();
  const nameTextRef = useRef();
  const [searchParams] = useSearchParams();

  const { isEditingAgent, isEditingPipeline, isEditingToolkit } = useNavBlocker();
  const entityIcon = useParticipantEntityIcon(participant);
  const { getDetails, getParticipantStatus } = useParticipantDetailsContext();

  const { entity_meta, entity_name: type, meta = {} } = participant;
  const originalDetails = getDetails(type, entity_meta?.id, entity_meta?.project_id);
  const status = getParticipantStatus(type, entity_meta?.id, entity_meta?.project_id);

  const { user_name: participantName } = meta;

  const [nameIsOverflow, setNameIsOverflow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [versionName, setVersionName] = useState('');

  const editedParticipantId = searchParams.get(SearchParams.EditedParticipantId);
  const agentType = participant.entity_settings?.agent_type;

  const isPipelineParticipant = agentType === 'pipeline' || participant.agent_type === 'pipeline';

  const isSkippedContainer = useMemo(
    () => !isActive && isSkippedContainerParticipant(participant),
    [isActive, participant],
  );

  const isBeingEdited = useMemo(() => {
    if (
      type === ChatParticipantType.Toolkits &&
      isEditingToolkit &&
      editingToolkit?.entity_meta?.id === entity_meta?.id
    )
      return true;

    if (!editedParticipantId) return false;

    const isPipelineAgentType =
      type === ChatParticipantType.Applications && agentType === ChatParticipantType.Pipelines;
    const currentParticipantId = isPipelineAgentType ? participant.entity_meta?.id : participant?.id;
    const isMatchingId = currentParticipantId && String(editedParticipantId) === String(currentParticipantId);

    if (!isMatchingId) return false;

    return isEditingAgent || isEditingPipeline;
  }, [
    type,
    editingToolkit,
    entity_meta?.id,
    isEditingAgent,
    isEditingPipeline,
    isEditingToolkit,
    editedParticipantId,
    participant,
    agentType,
  ]);

  const canBeActiveInChat = useMemo(() => canParticipantBeActiveInChat(participant), [participant]);

  const isToolkitParticipant = useMemo(
    () => participant.entity_name === ChatParticipantType.Toolkits,
    [participant.entity_name],
  );

  const displayName = useMemo(
    () => originalDetails?.name || entity_meta?.name || participantName || 'Participant Name',
    [originalDetails?.name, entity_meta?.name, participantName],
  );

  const showEditButton = useMemo(
    () =>
      participant.entity_name === ChatParticipantType.Toolkits ||
      participant.entity_name === ChatParticipantType.Pipelines ||
      participant.entity_name === ChatParticipantType.Applications,
    [participant.entity_name],
  );

  const maxWidth = useMemo(() => {
    if (!isHovering || isBeingEdited) return 'calc(100% - 2.125rem)';
    if (showEditButton) return status.hasRemoteMcpLoggedIn ? 'calc(100% - 8.375rem)' : 'calc(100% - 6rem)';
    return 'calc(100% - 4.375rem)';
  }, [isHovering, isBeingEdited, showEditButton, status.hasRemoteMcpLoggedIn]);

  const onClickHandler = useCallback(() => {
    if (!disabledEdit && (isActive || canBeActiveInChat)) {
      onClickItem(isActive ? undefined : participant);
    }
  }, [disabledEdit, isActive, onClickItem, participant, canBeActiveInChat]);

  const onMouseEnter = useCallback(() => setIsHovering(true), []);
  const onMouseLeave = useCallback(() => setIsHovering(false), []);

  const handleEditClick = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      onEdit?.(participant);
    },
    [onEdit, participant],
  );

  useEffect(() => {
    if (status.hasMisconfigurationErrors) assistantRef?.current?.showPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.hasMisconfigurationErrors]);

  useEffect(() => {
    if ((status.hasMisconfigurationErrors || status.isPublishedAgentGone) && isActive) {
      onClickItem(undefined);
    }
  }, [isActive, onClickItem, status.hasMisconfigurationErrors, status.isPublishedAgentGone]);

  useEffect(() => {
    if (originalDetails?.versions?.length > 0) {
      setVersionName(
        originalDetails.versions.find(v => v.id === participant.entity_settings?.version_id)?.name || '',
      );
    } else {
      setVersionName('');
    }
  }, [originalDetails?.versions, participant.entity_settings?.version_id]);

  useEffect(() => {
    if (!isHovering && nameTextRef.current) {
      setNameIsOverflow(nameTextRef.current.scrollWidth > nameTextRef.current.clientWidth);
    }
  }, [isHovering]);

  return {
    entity_meta,
    type,
    originalDetails,
    status,
    entityIcon,
    isPipelineParticipant,
    isSkippedContainer,
    isBeingEdited,
    isToolkitParticipant,
    displayName,
    versionName,
    showEditButton,
    maxWidth,
    nameTextRef,
    nameIsOverflow,
    isHovering,
    onClickHandler,
    onMouseEnter,
    onMouseLeave,
    handleEditClick,
  };
};
