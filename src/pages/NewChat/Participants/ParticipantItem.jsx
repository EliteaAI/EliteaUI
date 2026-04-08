import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpLogInLink } from '@/[fsd]/features/mcp/ui';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint/lib/hooks/useResolvedSharepointConfig.hooks';
import { SharepointLogInLink } from '@/[fsd]/features/sharepoint/ui';
import AttachIcon from '@/assets/attach-icon.svg?react';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';
import { ChatParticipantType, PUBLIC_PROJECT_ID, SearchParams } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import ParticipantActions from '@/components/ParticipantActions';
import useValidateApplicationVersion, {
  useToolsValidationInfo,
} from '@/hooks/application/useValidateApplicationVersion';
import useValidateToolkit, { useToolkitValidationInfo } from '@/hooks/application/useValidateToolkit';
import { canParticipantBeActiveInChat, isParticipantOKForChat } from '@/hooks/chat/useAddNewParticipants';
import useFetchParticipantDetails from '@/hooks/chat/useFetchParticipantDetails';
import useMCPParticipantStatusMonitor from '@/hooks/chat/useMCPParticipantStatusMonitor';
import useParticipantEntityIcon from '@/hooks/chat/useParticipantEntityIcon';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledTipsContainer } from '@/pages/Common/Components/InputVersionDialog';

const ParticipantItem = memo(props => {
  const {
    disabledEdit,
    participant = {},
    collapsed,
    isActive,
    onClickItem,
    onDelete,
    onEdit,
    // When true, suppresses the outer Tooltip to avoid clutter (e.g., inside dropdowns)
    disableTooltip = false,
    editingToolkit,
    isAttachement = false,
  } = props;

  const { entity_meta, entity_name: type, meta = {} } = participant;
  const { name: participantName } = meta || {};
  const nameTextRef = useRef();
  const [nameIsOverflow, setNameIsOverflow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const theme = useTheme();
  const { getSelectedTools } = useGetToolkitNameFromSchema();

  // Get Redux state and URL params for checking if this participant is being edited
  const { isEditingAgent, isEditingPipeline, isEditingToolkit } = useNavBlocker();
  const [searchParams] = useSearchParams();
  const editedParticipantId = searchParams.get(SearchParams.EditedParticipantId);

  // Check if this participant is currently being edited
  const agentType = participant.entity_settings?.agent_type;
  const isBeingEdited = useMemo(() => {
    // Handle toolkit editing
    if (
      type === ChatParticipantType.Toolkits &&
      isEditingToolkit &&
      editingToolkit?.entity_meta?.id === entity_meta?.id
    ) {
      return true;
    }

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

  const entityIcon = useParticipantEntityIcon(participant);

  const shouldDisableThisItem = useMemo(() => !isParticipantOKForChat(participant), [participant]);
  const canBeActiveInChat = useMemo(() => canParticipantBeActiveInChat(participant), [participant]);
  const isToolkitParticipant = useMemo(
    () => participant.entity_name === ChatParticipantType.Toolkits,
    [participant.entity_name],
  );
  const [versionName, setVersionName] = useState('');
  const [originalDetails, setOriginalDetails] = useState({});
  const { fetchOriginalDetails } = useFetchParticipantDetails();

  // Monitor MCP token changes for remote MCP toolkits
  const mcpServerUrl = participant.entity_settings?.mcp_server_url || originalDetails?.settings?.url || '';

  // SharePoint delegated OAuth tracking
  // sharepoint_configuration only stores a credential stub { elitea_title, private }.
  // Resolve the full credential via the shared hook.
  const spConfigRef =
    isToolkitParticipant && participant.entity_settings?.toolkit_type === 'sharepoint'
      ? originalDetails?.settings?.sharepoint_configuration
      : null;
  const { spConfig, connectionTokenKey: spConnectionTokenKey } = useResolvedSharepointConfig(
    spConfigRef,
    entity_meta?.project_id,
  );
  const someToolsAreUnavailable = useMemo(() => {
    if (
      participant.entity_name === ChatParticipantType.Applications ||
      participant.entity_name === ChatParticipantType.Pipelines
    ) {
      return !!originalDetails?.version_details?.tools?.find(tool => {
        const availableTools = getSelectedTools(tool?.type);
        return (
          !!availableTools?.length &&
          tool?.settings?.selected_tools?.some(item => !availableTools.includes(item))
        );
      });
    }
    return false;
  }, [getSelectedTools, originalDetails?.version_details?.tools, participant.entity_name]);

  const { isLoggedIn: hasRemoteMcpLoggedIn } = useMcpTokenChange(
    isToolkitParticipant && participant?.entity_settings?.toolkit_type === 'mcp' ? mcpServerUrl : null,
  );

  const { isLoggedIn: spOAuthLoggedIn } = useMcpTokenChange(
    spConnectionTokenKey ? { serverUrl: spConnectionTokenKey } : null,
  );

  const remoteMcpLoggedOut = useMemo(() => {
    if (!isToolkitParticipant || participant?.entity_settings?.toolkit_type !== 'mcp') {
      return false;
    }
    return !hasRemoteMcpLoggedIn;
  }, [isToolkitParticipant, participant?.entity_settings?.toolkit_type, hasRemoteMcpLoggedIn]);

  const spOAuthLoggedOut = useMemo(() => {
    if (!spConfig) return false;
    return !spOAuthLoggedIn;
  }, [spConfig, spOAuthLoggedIn]);

  const displayName = useMemo(() => {
    return originalDetails?.name || entity_meta?.name || participantName || 'Participant Name';
  }, [originalDetails?.name, entity_meta?.name, participantName]);

  useValidateApplicationVersion(
    (participant.entity_name === ChatParticipantType.Applications ||
      participant.entity_name === ChatParticipantType.Pipelines) &&
      originalDetails?.version_details?.tools
      ? {
          applicationId: entity_meta?.id,
          projectId: entity_meta?.project_id,
          versionId: participant.entity_settings?.version_id,
        }
      : {},
  );

  const { totalValidationInfo } = useToolsValidationInfo({
    applicationId: entity_meta?.id,
    projectId: entity_meta?.project_id,
    versionId: participant.entity_settings?.version_id,
    tools: originalDetails?.version_details?.tools || [],
  });

  useValidateToolkit(
    isToolkitParticipant
      ? {
          toolkitId: entity_meta?.id,
          projectId: entity_meta?.project_id,
          forceSkip: !isToolkitParticipant,
        }
      : {},
  );

  const { toolkitValidationInfoList } = useToolkitValidationInfo(
    isToolkitParticipant
      ? {
          projectId: entity_meta?.project_id,
          toolkitId: entity_meta?.id,
        }
      : {},
  );

  const mcpIsDisconnected = useMemo(
    () => isToolkitParticipant && originalDetails?.meta?.mcp && !originalDetails?.online,
    [isToolkitParticipant, originalDetails],
  );

  const handleEditClick = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      onEdit?.(participant);
    },
    [onEdit, participant],
  );

  // Determine if this participant type can show the edit button
  const showEditButton = useMemo(
    () =>
      participant.entity_name === ChatParticipantType.Toolkits ||
      participant.entity_name === ChatParticipantType.Pipelines ||
      participant.entity_name === ChatParticipantType.Applications,
    [participant.entity_name],
  );

  // Calculate maxWidth based on participant type and hover state
  const maxWidth = useMemo(() => {
    if (!isHovering || isBeingEdited) return 'calc(100% - 2.125rem)'; // No buttons visible

    if (showEditButton) {
      return hasRemoteMcpLoggedIn ? 'calc(100% - 8.375rem)' : 'calc(100% - 6rem)'; // Edit + Delete buttons for toolkits and agents and pipelines
    }
    return 'calc(100% - 4.375rem)'; // Only Delete button for other participants
  }, [isHovering, isBeingEdited, showEditButton, hasRemoteMcpLoggedIn]);

  const styles = participantItemStyles({ collapsed, isActive, maxWidth });

  const warningMessage = useMemo(() => {
    if (totalValidationInfo?.length || toolkitValidationInfoList?.length) {
      const isPipelineAgent = participant.entity_settings?.agent_type === 'pipeline';

      const getParticipantTypeText = () => {
        if (participant.entity_name === ChatParticipantType.Applications && !isPipelineAgent) return 'agent';

        return isToolkitParticipant ? 'toolkit' : 'pipeline';
      };

      return (
        <>
          {'Misconfiguration errors found. '}
          <Typography
            component="button"
            variant="bodySmall"
            onClick={handleEditClick}
            sx={styles.misconfigurationError}
          >
            {`Check the ${getParticipantTypeText()}`}
          </Typography>
          .
        </>
      );
    }

    if (shouldDisableThisItem) {
      if (type === ChatParticipantType.Datasources) return 'Please configure datasource chat settings';
      if (type === ChatParticipantType.Applications) return 'Please configure agent chat settings';

      return '';
    }

    if (mcpIsDisconnected) {
      return `The ${originalDetails.name} mcp server is disconnected. Reconnect it to use.`;
    }

    if (someToolsAreUnavailable) {
      return 'Some tools of some toolkit are not available anymore.';
    }
    if (remoteMcpLoggedOut) {
      return (
        <>
          {'Server is disconnected!  Reconnect it to use. '}
          <McpLogInLink values={originalDetails} />
        </>
      );
    }

    if (spOAuthLoggedOut) {
      return (
        <>
          {'SharePoint requires authorization. '}
          <SharepointLogInLink
            projectId={entity_meta?.project_id}
            spConfig={spConfig}
          />
        </>
      );
    }

    return '';
  }, [
    totalValidationInfo?.length,
    toolkitValidationInfoList?.length,
    shouldDisableThisItem,
    mcpIsDisconnected,
    remoteMcpLoggedOut,
    spOAuthLoggedOut,
    participant.entity_settings?.agent_type,
    participant.entity_name,
    handleEditClick,
    styles,
    isToolkitParticipant,
    type,
    originalDetails,
    someToolsAreUnavailable,
    entity_meta?.project_id,
    spConfig,
  ]);

  const onMCPConnectionStatusChange = useCallback(connected => {
    setOriginalDetails(prevDetails => ({
      ...prevDetails,
      online: connected,
    }));
  }, []);

  useMCPParticipantStatusMonitor({
    projectId: entity_meta?.project_id,
    mcpType: originalDetails?.type,
    isMCP: originalDetails?.meta?.mcp,
    onMCPConnectionStatusChange,
  });

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
    if ((totalValidationInfo?.length || toolkitValidationInfoList?.length) && isActive) {
      onClickItem(undefined); // Deselect if active and not matched
    }
  }, [isActive, onClickItem, toolkitValidationInfoList?.length, totalValidationInfo?.length]);

  useEffect(() => {
    const getVersions = async () => {
      if (entity_meta?.id && entity_meta?.project_id) {
        const data = await fetchOriginalDetails(
          participant.entity_name,
          entity_meta.id,
          entity_meta.project_id,
        );
        setOriginalDetails(data);
      }
    };
    // Only fetch original details if we don't have them yet
    if (entity_meta?.id && entity_meta?.project_id && !originalDetails?.versions?.length) {
      getVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity_meta?.id, entity_meta?.project_id, participant.entity_name]);

  // Update version name when version_id changes or when original details are loaded
  useEffect(() => {
    if (originalDetails?.versions && originalDetails.versions.length > 0) {
      setVersionName(
        originalDetails.versions.find(version => version.id === participant.entity_settings?.version_id)
          ?.name || '',
      );
    } else {
      setVersionName('');
    }
  }, [originalDetails?.versions, participant.entity_settings?.version_id]);

  useEffect(() => {
    if (!isHovering && nameTextRef.current) {
      const isOverflowing = nameTextRef.current.scrollWidth > nameTextRef.current.clientWidth;
      setNameIsOverflow(isOverflowing);
    }
  }, [isHovering]);

  const content =
    !shouldDisableThisItem &&
    !toolkitValidationInfoList?.length &&
    !totalValidationInfo?.length &&
    !mcpIsDisconnected &&
    !remoteMcpLoggedOut &&
    !spOAuthLoggedOut &&
    !someToolsAreUnavailable ? (
      <Box
        onClick={onClickHandler}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={styles.contentWrapper}
      >
        <EntityIcon
          icon={entityIcon}
          entityType={
            participant.entity_settings?.agent_type === 'pipeline'
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
        onClick={isActive ? onClickHandler : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          padding: '.5rem 1rem',
          borderWidth: '.0625rem',
          borderStyle: 'solid',
          borderColor: `${theme.palette.border.attention}`,
          borderRadius: '.5rem',
          backgroundColor: `${theme.palette.background.attention}`,
          width: '100%',
          marginTop: '0rem',
          gap: '.5rem',
          cursor: isActive ? 'pointer' : 'default',
        }}
      >
        <Box
          display="flex"
          flexDirection="row"
          gap=".75rem"
          height="1.75rem"
          alignItems="center"
        >
          <EntityIcon
            icon={entityIcon}
            entityType={
              participant.entity_settings?.agent_type === 'pipeline' ? 'pipeline' : participant.entity_name
            }
            editable={false}
            sx={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
            imageStyle={{ width: '1.5rem', height: '1.5rem' }}
            specifiedFontSize="0.875rem"
            isActive={isActive}
          />
          {!collapsed && (
            <Box
              sx={{
                flex: 1,
                maxWidth,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {displayName}
              </Typography>
              {isBeingEdited && (
                <Typography
                  variant="bodyMedium"
                  color="primary.main"
                  sx={{
                    maxWidth: '50%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpaceCollapse: 'preserve',
                  }}
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
              disabledEdit={disabledEdit}
              disabledDeleteButton={disabledEdit}
              showButtons={isHovering}
              showEditButton={showEditButton}
              hasRemoteMcpLoggedIn={hasRemoteMcpLoggedIn}
              serverUrl={originalDetails?.settings?.url}
            />
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: '.75rem',
          }}
        >
          <AttentionIcon
            style={{ width: 24, height: 24 }}
            fill={theme.palette.icon.fill.attention}
          />
          <Typography
            variant="bodySmall"
            color="text.attention"
            sx={{ wordBreak: 'break-word' }}
          >
            {warningMessage}
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
});

export default ParticipantItem;
