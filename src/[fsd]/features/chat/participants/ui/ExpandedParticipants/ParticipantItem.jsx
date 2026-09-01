import { memo } from 'react';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useParticipantItem } from '@/[fsd]/features/chat/participants/lib/hooks';

import {
  default as ParticipantAttentionCard,
  participantAttentionCardStyles,
} from './ParticipantAttentionCard';
import { default as ParticipantNormalCard, participantNormalCardStyles } from './ParticipantNormalCard';

const ParticipantItem = memo(props => {
  const {
    disabledEdit,
    collapsed,
    isActive,
    onClickItem,
    onDelete,
    onEdit,
    editingToolkit,
    participant = {},
    disableTooltip = false,
    isAttachement = false,
  } = props;

  const derived = useParticipantItem({
    participant,
    disabledEdit,
    isActive,
    onClickItem,
    onEdit,
    editingToolkit,
  });

  const {
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
  } = derived;

  const {
    shouldDisableThisItem,
    hasMisconfigurationErrors,
    mcpIsDisconnected,
    remoteMcpLoggedOut,
    spOAuthLoggedOut,
    openApiOAuthLoggedOut,
    someToolsAreUnavailable,
    isVersionUnavailable,
    isPublishedAgentGone,
  } = status;

  const isNormal =
    !shouldDisableThisItem &&
    !hasMisconfigurationErrors &&
    !mcpIsDisconnected &&
    !remoteMcpLoggedOut &&
    !spOAuthLoggedOut &&
    !openApiOAuthLoggedOut &&
    !someToolsAreUnavailable &&
    !isVersionUnavailable &&
    !isPublishedAgentGone;

  const sharedCardProps = {
    participant,
    collapsed,
    isActive,
    isBeingEdited,
    isSkippedContainer,
    isPipelineParticipant,
    displayName,
    entityIcon,
    status,
    originalDetails,
    entity_meta,
    onClickHandler,
    onMouseEnter,
    onMouseLeave,
    onEdit,
    onDelete,
    disabledEdit,
    showEditButton,
    isHovering,
  };

  const content = isNormal ? (
    <ParticipantNormalCard
      {...sharedCardProps}
      isAttachement={isAttachement}
      versionName={versionName}
      nameTextRef={nameTextRef}
      styles={participantNormalCardStyles({ collapsed, isActive, maxWidth })}
    />
  ) : (
    <ParticipantAttentionCard
      {...sharedCardProps}
      isToolkitParticipant={isToolkitParticipant}
      type={type}
      handleEditClick={handleEditClick}
      styles={participantAttentionCardStyles({ isActive, maxWidth })}
    />
  );

  return disableTooltip ? (
    content
  ) : (
    <Tooltip
      title={collapsed || nameIsOverflow ? `${displayName} - ${versionName}` : ''}
      placement="left"
      enterDelay={1000}
    >
      {content}
    </Tooltip>
  );
});

ParticipantItem.displayName = 'ParticipantItem';

export default ParticipantItem;
