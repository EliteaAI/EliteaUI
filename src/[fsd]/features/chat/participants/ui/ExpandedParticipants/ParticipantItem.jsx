import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useParticipantDetailsContext } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import { canParticipantBeActiveInChat } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import { useEliteaAssistantRef } from '@/[fsd]/widgets/support-assistant';
import AttachIcon from '@/assets/attach-icon.svg?react';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';
import { ChatParticipantType, PUBLIC_PROJECT_ID, SearchParams } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledTipsContainer } from '@/pages/Common/Components/InputVersionDialog';

import ParticipantActions from '../ParticipantActions/ParticipantActions';
import ParticipantWarning from './ParticipantWarning';

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

  const theme = useTheme();

  const assistantRef = useEliteaAssistantRef();
  const nameTextRef = useRef();

  const [searchParams] = useSearchParams();

  const { isEditingAgent, isEditingPipeline, isEditingToolkit } = useNavBlocker();
  const entityIcon = useParticipantEntityIcon(participant);

  const { getDetails, getParticipantStatus } = useParticipantDetailsContext();

  const { entity_meta, entity_name: type, meta = {} } = participant;

  const originalDetails = getDetails(type, entity_meta?.id, entity_meta?.project_id);
  const status = getParticipantStatus(type, entity_meta?.id, entity_meta?.project_id);

  const {
    shouldDisableThisItem,
    hasMisconfigurationErrors,
    someToolsAreUnavailable,
    isPublishedAgentGone,
    isVersionUnavailable,
    mcpIsDisconnected,
    remoteMcpLoggedOut,
    hasRemoteMcpLoggedIn,
    spOAuthLoggedOut,
    spOAuthLoggedIn,
    spConfig,
  } = status;

  const { user_name: participantName } = meta || {};

  const [nameIsOverflow, setNameIsOverflow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const [versionName, setVersionName] = useState('');

  const editedParticipantId = searchParams.get(SearchParams.EditedParticipantId);
  const agentType = participant.entity_settings?.agent_type;

  // A pipeline participant may carry its kind on either entity_settings.agent_type
  // OR the top-level agent_type (the section grouping in Participants.jsx accepts
  // both). The icon's entityType previously only read entity_settings.agent_type,
  // so a pipeline grouped via the top-level field rendered the generic agent grid
  // icon instead of the flow icon (#4993).
  const isPipelineParticipant = agentType === 'pipeline' || participant.agent_type === 'pipeline';

  // Get Redux state and URL params for checking if this participant is being edited
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

    const currentParticipantId = isPipelineAgentType
      ? participant.entity_meta?.id // For pipelines
      : participant?.id; // For regular agents and other types

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

  const displayName = useMemo(() => {
    return originalDetails?.name || entity_meta?.name || participantName || 'Participant Name';
  }, [originalDetails?.name, entity_meta?.name, participantName]);

  useEffect(() => {
    if (hasMisconfigurationErrors) assistantRef?.current?.showPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMisconfigurationErrors]);

  const handleEditClick = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      onEdit?.(participant);
    },
    [onEdit, participant],
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

    if (showEditButton) {
      return hasRemoteMcpLoggedIn ? 'calc(100% - 8.375rem)' : 'calc(100% - 6rem)';
    }
    return 'calc(100% - 4.375rem)';
  }, [isHovering, isBeingEdited, showEditButton, hasRemoteMcpLoggedIn]);

  const styles = participantItemStyles({ collapsed, isActive, maxWidth });

  const onClickHandler = useCallback(() => {
    // Allow deselecting (isActive=true) even if canBeActiveInChat is false
    // This enables users to switch away from misconfigured participants
    if (!disabledEdit && (isActive || canBeActiveInChat)) {
      onClickItem(isActive ? undefined : participant);
    }
  }, [disabledEdit, isActive, onClickItem, participant, canBeActiveInChat]);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    if ((hasMisconfigurationErrors || isPublishedAgentGone) && isActive) {
      onClickItem(undefined);
    }
  }, [isActive, onClickItem, hasMisconfigurationErrors, isPublishedAgentGone]);

  // Update version name when version_id changes or when original details are loaded
  useEffect(() => {
    if (originalDetails?.versions && originalDetails.versions.length > 0)
      setVersionName(
        originalDetails.versions.find(version => version.id === participant.entity_settings?.version_id)
          ?.name || '',
      );
    else setVersionName('');
  }, [originalDetails?.versions, participant.entity_settings?.version_id]);

  useEffect(() => {
    if (!isHovering && nameTextRef.current) {
      const isOverflowing = nameTextRef.current.scrollWidth > nameTextRef.current.clientWidth;
      setNameIsOverflow(isOverflowing);
    }
  }, [isHovering]);

  const content =
    !shouldDisableThisItem &&
    !hasMisconfigurationErrors &&
    !mcpIsDisconnected &&
    !remoteMcpLoggedOut &&
    !spOAuthLoggedOut &&
    !someToolsAreUnavailable &&
    !isVersionUnavailable &&
    !isPublishedAgentGone ? (
      <Box
        onClick={onClickHandler}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={styles.contentWrapper}
      >
        <EntityIcon
          icon={entityIcon}
          entityType={
            isPipelineParticipant
              ? 'pipeline'
              : participant.entity_name !== ChatParticipantType.Toolkits
                ? participant.entity_name
                : participant.meta?.mcp
                  ? 'mcp'
                  : participant.entity_name
          }
          editable={false}
          sx={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
          imageStyle={{ width: '1.5rem', height: '1.5rem' }}
          specifiedFontSize="0.875rem"
          isActive={isActive}
        />
        {!collapsed && (
          <Box sx={styles.nameWrapper}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              ref={nameTextRef}
              sx={styles.nameContent}
            >
              {displayName}
              {isAttachement && (
                <IconButton
                  variant="elitea"
                  color="tertiary"
                  size="small"
                  disabled
                  sx={styles.attachmentButton}
                >
                  <AttachIcon style={styles.attachIcon} />
                </IconButton>
              )}
              {originalDetails?.meta?.mcp && (
                <>
                  {originalDetails?.online ? (
                    <OnlineIcon
                      width={14}
                      style={{
                        marginLeft: '.5rem',
                        width: '1rem !important',
                        height: '1rem',
                        color: theme.palette.icon.fill.default,
                      }}
                    />
                  ) : (
                    <OfflineIcon
                      style={{
                        marginLeft: '.5rem',
                        width: '.875rem',
                        height: '.875rem',
                        color: theme.palette.icon.fill.attention,
                      }}
                    />
                  )}
                </>
              )}
              {spConfig && (
                <>
                  {spOAuthLoggedIn ? (
                    <OnlineIcon
                      style={{
                        marginLeft: '.5rem',
                        width: '1rem',
                        height: '1rem',
                        color: theme.palette.icon.fill.default,
                      }}
                    />
                  ) : (
                    <OfflineIcon
                      style={{
                        marginLeft: '.5rem',
                        width: '.875rem',
                        height: '.875rem',
                        color: theme.palette.icon.fill.attention,
                      }}
                    />
                  )}
                </>
              )}
            </Typography>
            <Typography
              variant="bodyMedium"
              color={isBeingEdited ? 'primary.main' : 'text.primary'}
              sx={{
                flexShrink: 0,
                maxWidth: isBeingEdited ? 'none' : '50%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpaceCollapse: 'preserve',
              }}
            >
              {isBeingEdited
                ? participant.entity_meta?.project_id != PUBLIC_PROJECT_ID
                  ? 'Editing...'
                  : 'Viewing...'
                : versionName}
            </Typography>
          </Box>
        )}
        {!collapsed && !isBeingEdited && (
          <ParticipantActions
            participant={participant}
            onEdit={onEdit}
            onDelete={onDelete}
            disabledEdit={disabledEdit}
            disabledDeleteButton={disabledEdit}
            showButtons={isHovering}
            showEditButton={showEditButton}
            hasRemoteMcpLoggedIn={hasRemoteMcpLoggedIn}
            serverUrl={originalDetails?.settings?.url}
          />
        )}
      </Box>
    ) : (
      <StyledTipsContainer
        onClick={isActive || isVersionUnavailable ? onClickHandler : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={styles.attentionWrapper}
      >
        <Box sx={styles.attentionHeader}>
          <EntityIcon
            icon={entityIcon}
            entityType={isPipelineParticipant ? 'pipeline' : participant.entity_name}
            editable={false}
            sx={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
            imageStyle={{ width: '1.5rem', height: '1.5rem' }}
            specifiedFontSize="0.875rem"
            isActive={isActive}
          />
          {!collapsed && (
            <Box sx={styles.attentionNameBox}>
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={styles.attentionDisplayName}
              >
                {displayName}
              </Typography>
              {isBeingEdited && (
                <Typography
                  variant="bodyMedium"
                  color="primary.main"
                  sx={styles.attentionEditingText}
                >
                  {participant.entity_meta?.project_id != PUBLIC_PROJECT_ID ? 'Editing...' : 'Viewing...'}
                </Typography>
              )}
            </Box>
          )}
          {!collapsed && !isBeingEdited && (
            <ParticipantActions
              participant={participant}
              onEdit={onEdit}
              onDelete={onDelete}
              disabledEdit={disabledEdit || isPublishedAgentGone || isVersionUnavailable}
              disabledDeleteButton={disabledEdit}
              showButtons={isHovering}
              showEditButton={showEditButton}
              hasRemoteMcpLoggedIn={hasRemoteMcpLoggedIn}
              serverUrl={originalDetails?.settings?.url}
            />
          )}
        </Box>
        <Box sx={styles.attentionMessageRow}>
          <Box sx={styles.attentionIcon}>
            <AttentionIcon />
          </Box>
          <Typography
            variant="bodySmall"
            color="text.attention"
            sx={styles.attentionMessage}
          >
            <ParticipantWarning
              isPublishedAgentGone={isPublishedAgentGone}
              isVersionUnavailable={isVersionUnavailable}
              hasMisconfigurationErrors={hasMisconfigurationErrors}
              shouldDisableThisItem={shouldDisableThisItem}
              mcpIsDisconnected={mcpIsDisconnected}
              someToolsAreUnavailable={someToolsAreUnavailable}
              remoteMcpLoggedOut={remoteMcpLoggedOut}
              spOAuthLoggedOut={spOAuthLoggedOut}
              participant={participant}
              handleEditClick={handleEditClick}
              isToolkitParticipant={isToolkitParticipant}
              type={type}
              originalDetails={originalDetails}
              entityMeta={entity_meta}
              spConfig={spConfig}
            />
          </Typography>
        </Box>
      </StyledTipsContainer>
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

/** @type {MuiSx} */
const participantItemStyles = ({ collapsed, isActive, maxWidth }) => ({
  misconfigurationError: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'primary.main',
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    display: 'inline',

    '&:hover': {
      color: 'primary.dark',
    },
  },
  contentWrapper: ({ palette }) => ({
    cursor: 'pointer',
    padding: collapsed ? '0 0' : '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    gap: '0.5rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    width: '100%',
    height: '2.5rem',
    boxSizing: 'border-box',
    background: isActive ? palette.background.participant.active : palette.background.participant.default,
    border: isActive ? `0.0625rem solid ${palette.split.hover}` : undefined,
    ':hover': {
      background: palette.background.participant.hover,
    },
  }),
  nameWrapper: {
    flex: 1,
    maxWidth,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '.5rem',
  },
  nameContent: {
    flex: 1,
    minWidth: '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: ({ palette }) => ({
    marginTop: '0.15rem',
    marginLeft: '0.35rem',
    minWidth: '1.25rem !important',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '1.3125rem',
    padding: '0rem !important',
    border: `0.0625rem solid ${palette.border.lines}`,
    '&:disabled': {
      color: palette.text.metrics,
    },
  }),
  attachIcon: {
    width: '0.75rem',
    height: '0.75rem',
  },

  attentionWrapper: ({ palette }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    padding: '.5rem 1rem',
    borderWidth: '.0625rem',
    borderStyle: 'solid',
    borderColor: palette.border.attention,
    borderRadius: '.5rem',
    backgroundColor: palette.background.attention,
    width: '100%',
    marginTop: '0rem',
    gap: '.5rem',
    cursor: isActive ? 'pointer' : 'default',
  }),
  attentionHeader: {
    display: 'flex',
    flexDirection: 'row',
    gap: '.75rem',
    height: '1.75rem',
    alignItems: 'center',
  },
  attentionNameBox: {
    flex: 1,
    maxWidth,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  attentionDisplayName: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attentionEditingText: {
    maxWidth: '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
  },
  attentionMessageRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.9rem',
  },
  attentionIcon: ({ palette }) => ({
    paddingLeft: '0.25rem',
    width: '1rem',
    height: '1rem',
    '& svg': {
      fill: palette.icon.fill.attention,
    },
  }),
  attentionMessage: {
    wordBreak: 'break-word',
  },
});

export default ParticipantItem;
