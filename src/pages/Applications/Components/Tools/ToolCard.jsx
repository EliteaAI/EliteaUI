import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { useSaveAgentToolVariables } from '@/[fsd]/features/agent/lib/hooks/useSaveAgentToolVariables.js';
import { useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpLogInButton } from '@/[fsd]/features/mcp/ui';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks.js';
import { useResolvedSharepointConfig } from '@/[fsd]/features/sharepoint/lib/hooks/useResolvedSharepointConfig.hooks';
import { SharepointDelegatedLoginButton } from '@/[fsd]/features/sharepoint/ui';
import { Banner } from '@/[fsd]/shared/ui';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import AttachIcon from '@/assets/attach-icon.svg?react';
import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID, SearchParams, ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import CredentialWarningBanner from '@/components/CredentialWarningBanner';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useDisassociateToolkit from '@/hooks/application/useDisassociateToolkit.js';
import { useGetToolkitIconMeta } from '@/hooks/application/useLibraryToolkits';
import {
  useManualValidateApplicationVersion,
  useToolValidationInfo,
} from '@/hooks/application/useValidateApplicationVersion';
import useCheckPermission from '@/hooks/useCheckPermission';
import useSearchParamValue from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';
import { useTheme } from '@emotion/react';

import AgentPipelineVersionSelector from './AgentPipelineVersionSelector.jsx';
import AgentVariables from './AgentVariables.jsx';
import EnhancedCardToolActions from './CardActions/EnhancedCardToolActions.jsx';
import BaseCardBody from './CardBodies/BaseCardBody.jsx';

const ToolCard = memo(props => {
  const { tool, index, applicationId, disabled, isDuplicate, onDeleteAttachmentTool } = props;
  const theme = useTheme();
  const [openAlert, setOpenAlert] = useState(false);
  const { toastError } = useToast();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const viewModeFromUrl = useSearchParamValue('ViewMode');
  const [showActions, setShowActions] = useState(false);
  const { showVariables, onToggleVariables, variables, onChangeVariable } = useSaveAgentToolVariables({
    tool,
    projectId,
  });
  const isMcp = tool.meta?.mcp || tool.type === 'mcp';
  const { personal_project_id } = useSelector(state => state.user);

  // Monitor MCP token changes for remote MCP toolkits
  const mcpServerUrl = tool?.settings?.url || '';
  const { isLoggedIn: hasRemoteMcpLoggedIn } = useMcpTokenChange(tool.type === 'mcp' ? mcpServerUrl : null);

  // SharePoint delegated OAuth: sharepoint_configuration only stores a stub
  // { elitea_title, private }. Resolve the full credential via the shared hook.
  const spConfigRef = tool.type === 'sharepoint' ? tool?.settings?.sharepoint_configuration : null;
  const { spConfig, oauthEndpoint: spOauthEndpoint } = useResolvedSharepointConfig(spConfigRef, projectId);

  const mcpDisconnectedTip = useMemo(
    () =>
      `The ${tool.name} mcp server is ${tool.online || hasRemoteMcpLoggedIn ? 'connected.' : 'disconnected. Reconnect it to use.'}`,
    [hasRemoteMcpLoggedIn, tool.name, tool.online],
  );

  // If no viewMode in URL, determine view mode based on permissions
  const getPermissionBasedViewMode = useMemo(() => {
    // If on public project, always use public view mode
    if (projectId === PUBLIC_PROJECT_ID) {
      return ViewMode.Public;
    }

    // Determine the entity type for permission checking
    // Both agents and pipelines use applications permissions, everything else is toolkits
    const entityType = tool?.type === 'application' ? 'applications' : 'toolkits';

    // Check if user has update permissions - this grants Owner access
    if (checkPermission(PERMISSIONS[entityType]?.update)) {
      return ViewMode.Owner;
    }

    // Default to public view mode if no update permissions
    return ViewMode.Public;
  }, [projectId, checkPermission, tool]);

  // Use viewMode from URL if it exists, otherwise use permission-based view mode
  const viewMode = viewModeFromUrl || getPermissionBasedViewMode;

  const { values } = useFormikContext();
  const versionId = values?.version_details?.id;
  const { getToolkitNameFromSchema, getSelectedTools } = useGetToolkitNameFromSchema();
  const validationInfo = useToolValidationInfo({
    projectId,
    applicationId,
    versionId,
    toolId: tool.id,
    tool,
  });
  const { doValidateVersion } = useManualValidateApplicationVersion({ applicationId, projectId, versionId });

  const isAttachmentToolkit = useMemo(
    () => tool.id && values?.version_details?.meta?.attachment_toolkit_id === tool.id,
    [values?.version_details?.meta?.attachment_toolkit_id, tool.id],
  );
  const { onDisassociateTool, isLoading, isDisassociateError, disassociateError } = useDisassociateToolkit({
    applicationId,
    versionId,
    tool,
    onDeleteAttachmentTool,
    index,
  });

  const onDelete = useCallback(async () => {
    setOpenAlert(true);
  }, []);

  const onConfirmAlert = useCallback(async () => {
    setOpenAlert(false);
    await onDisassociateTool({ tool, isAttachmentToolkit });
  }, [onDisassociateTool, tool, isAttachmentToolkit]);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
  }, []);

  const toolkitName = useMemo(() => {
    // For agents and pipelines, use their name directly
    if (tool?.type === 'application') {
      return tool.name || 'Unnamed';
    }
    // For regular toolkits, use existing logic, but guard against undefined type
    const safeType = typeof tool.type === 'string' ? tool.type : '';
    return (
      tool.elitea_title ||
      tool.name ||
      tool.toolkit_name ||
      tool.settings?.configuration_title ||
      (safeType ? safeType.charAt(0).toUpperCase() + safeType.slice(1) : 'Toolkit') ||
      getToolkitNameFromSchema(tool)
    );
  }, [getToolkitNameFromSchema, tool]);

  const availableTools = useMemo(() => {
    if (tool?.type === 'application') {
      return [];
    }
    return getSelectedTools(tool?.type);
  }, [getSelectedTools, tool?.type]);

  const someToolsAreUnavailable = useMemo(
    () =>
      !!availableTools?.length &&
      tool?.settings?.selected_tools?.some(item => !availableTools.includes(item)),
    [availableTools, tool?.settings?.selected_tools],
  );

  // Function to open agent/pipeline in new tab
  const onOpenInNewTab = useCallback(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();

    if (tool?.type === 'application') {
      // For agents and pipelines with specific version
      const entityId = tool.settings?.application_id;
      const toolVersionId = tool.settings?.application_version_id;
      const entityType = tool?.agent_type !== 'pipeline' ? 'agents' : 'pipelines';
      if (entityId && projectId) {
        // Build URL with specific version if available
        let url = `${baseUrl}${basename}/${entityType}/all/${entityId}`;
        if (toolVersionId) {
          url += `/${toolVersionId}`;
        }
        url += `?${SearchParams.ViewMode}=${viewMode}&name=${toolkitName}`;
        window.open(url, '_blank');
      }
    } else if (tool?.id) {
      // For regular toolkits
      const url = `${baseUrl}${basename}/${!isMcp ? 'toolkits' : 'mcps'}/all/${tool.id}?${SearchParams.ViewMode}=${viewMode}&name=${toolkitName}`;
      window.open(url, '_blank');
    }
  }, [tool, projectId, toolkitName, viewMode, isMcp]);

  const onClickShowActions = useCallback(event => {
    event.stopPropagation();
    setShowActions(prev => !prev);
  }, []);

  useEffect(() => {
    if (isDisassociateError) {
      toastError(buildErrorMessage(disassociateError));
    }
  }, [disassociateError, isDisassociateError, toastError]);

  const ToolCardComponent = useMemo(() => {
    switch (tool?.type) {
      default:
        return BaseCardBody;
    }
  }, [tool?.type]);

  const ToolActionsComponent = useMemo(() => {
    switch (tool?.type) {
      default:
        // Use enhanced actions for regular toolkits that allow tool selection
        return EnhancedCardToolActions;
    }
  }, [tool?.type]);

  const toolOptions = useMemo(() => {
    return (tool?.settings?.available_tools || [])
      .map(item => {
        if (typeof item === 'string') {
          return {
            label: (item.charAt(0).toUpperCase() + item.slice(1)).replaceAll('_', ' '),
            value: item,
          };
        }

        if (item && typeof item === 'object') {
          const name = item.value || item.name || item.label;
          if (typeof name !== 'string' || !name.trim()) return null;

          return {
            label: item.label || (name.charAt(0).toUpperCase() + name.slice(1)).replaceAll('_', ' '),
            value: name,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [tool?.settings?.available_tools]);

  // Check if this tool is an agent or pipeline (added via association)
  const isAgentOrPipeline = useMemo(() => {
    return tool?.type === 'application';
  }, [tool?.type]);

  // Determine entity type for tooltips
  const entityType = useMemo(() => {
    if (tool?.type === 'application') {
      if (tool?.agent_type === 'pipeline') return 'pipeline';
      return 'agent';
    }
    return 'toolkit';
  }, [tool?.agent_type, tool?.type]);

  // Generate tooltip texts
  const openTooltipText = `Open ${entityType === 'toolkit' && isMcp ? 'mcp' : entityType} in new tab`;
  const removeTooltipText = `Remove ${entityType}`;

  const toolValidationMessage = useMemo(() => {
    if (!validationInfo) return null;

    if (tool?.type === 'application') {
      return `Misconfiguration error found. Check the ${entityType}.`;
    }

    return validationInfo;
  }, [validationInfo, tool, entityType]);

  // Generate dialog texts based on entity type
  const dialogTitle = useMemo(() => {
    switch (entityType) {
      case 'agent':
        return 'Remove agent?';
      case 'pipeline':
        return 'Remove pipeline?';
      case 'toolkit':
      default:
        return 'Remove toolkit?';
    }
  }, [entityType]);

  const dialogContent = useMemo(() => {
    const styledEntityName = (
      <Typography
        component="span"
        variant="headingSmall"
        color={theme.palette.text.deleteAlertEntityName}
      >
        {toolkitName}
      </Typography>
    );

    switch (entityType) {
      case 'agent':
        return <>Are you sure to remove the {styledEntityName} agent?</>;
      case 'pipeline':
        return <>Are you sure to remove the {styledEntityName} pipeline?</>;
      case 'toolkit':
      default:
        return !isAttachmentToolkit ? (
          <>Are you sure to remove the {styledEntityName} toolkit?</>
        ) : (
          <>Are you sure to remove the {styledEntityName} toolkit, which is used to keep attached files?</>
        );
    }
  }, [theme.palette.text.deleteAlertEntityName, toolkitName, entityType, isAttachmentToolkit]);

  const getToolkitIconMeta = useGetToolkitIconMeta();

  const hasVariables = variables?.length > 0;
  const styles = toolCardStyles(showActions, isDuplicate, showVariables, hasVariables);

  return (
    <Tooltip
      title={
        isDuplicate
          ? 'There are other tools of the same name and type, they may result in duplication and unpredictable results from agent.'
          : ''
      }
      placement="top"
    >
      <Box sx={styles.cardContainer}>
        <Box sx={styles.cardHeader}>
          <EntityIcon
            sx={styles.entityIcon}
            imageStyle={styles.entityIconImage}
            icon={getToolkitIconMeta(tool, isMcp)}
            entityType={entityType}
            projectId={projectId}
            editable={false}
          />
          <Box sx={styles.contentBox(isAgentOrPipeline)}>
            <Box sx={styles.titleRow}>
              <TypographyWithConditionalTooltip
                title={toolkitName}
                placement="right"
                variant="bodyMedium"
                component="div"
                color="text.secondary"
                sx={styles.toolkitName}
              >
                {toolkitName}
              </TypographyWithConditionalTooltip>
              {isAttachmentToolkit && (
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
            </Box>

            {/* Version Selector for Agents and Pipelines */}
            {isAgentOrPipeline && (
              <AgentPipelineVersionSelector
                tool={tool}
                index={index}
                applicationId={applicationId}
              />
            )}

            {/* Variables Toggle for Agents/Pipelines with variables */}
            {hasVariables && (
              <Box
                sx={styles.variablesToggle}
                onClick={onToggleVariables}
              >
                <Typography
                  component="span"
                  variant="bodySmall2"
                  sx={styles.variablesToggleLabel}
                >
                  {showVariables ? 'Hide variables' : 'Show variables'}
                </Typography>
                <Typography
                  component="span"
                  variant="bodySmall2"
                  sx={styles.variablesToggleCount}
                >
                  ({tool.variables?.length})
                </Typography>
              </Box>
            )}

            {/* Regular Tool Card Body for non-agent/pipeline tools */}
            {!isAgentOrPipeline && ToolCardComponent && (
              <ToolCardComponent
                tool={tool}
                onClickShowActions={onClickShowActions}
                showActions={showActions}
              />
            )}
          </Box>
          <Box sx={styles.buttonsContainer}>
            {validationInfo && (
              <>
                <Tooltip
                  title="Refresh toolkit"
                  placement="top"
                >
                  <IconButton
                    id={'RefreshButton'}
                    variant="elitea"
                    color="tertiary"
                    aria-label="refresh toolkit"
                    onClick={doValidateVersion}
                    sx={styles.actionButton}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Box
                  component={AttentionIcon}
                  sx={styles.attentionIcon}
                />
              </>
            )}
            {(!tool.meta?.mcp || tool.online || tool.type === 'mcp') && (
              <Tooltip
                title={openTooltipText}
                placement="top"
              >
                <IconButton
                  id={'OpenInNewTabButton'}
                  variant="elitea"
                  color="tertiary"
                  aria-label="open in new tab"
                  onClick={onOpenInNewTab}
                  disabled={disabled || (!tool?.id && !tool?.settings?.application_id)}
                  sx={styles.actionButton}
                >
                  <OpenInNewIcon
                    sx={styles.actionIcon}
                    fill={!disabled ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
                  />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip
              title={removeTooltipText}
              placement="top"
            >
              <IconButton
                id={'DeleteButton'}
                variant="elitea"
                color="tertiary"
                aria-label="delete tool"
                onClick={onDelete}
                disabled={disabled}
                sx={styles.actionButton}
              >
                <DeleteIcon
                  sx={styles.actionIcon}
                  fill={!disabled ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
                />
                {isLoading && <StyledCircleProgress size={20} />}
              </IconButton>
            </Tooltip>
            {tool.type === 'mcp' && <McpLogInButton values={tool} />}
            {tool.type === 'sharepoint' && spOauthEndpoint && (
              <SharepointDelegatedLoginButton
                projectId={projectId}
                spConfig={spConfig}
                toolName={tool.name}
              />
            )}
            {isMcp && (
              <Tooltip
                title={mcpDisconnectedTip}
                placement="top"
              >
                <Box sx={styles.statusIconBox(tool.online || hasRemoteMcpLoggedIn)}>
                  {tool.online || hasRemoteMcpLoggedIn ? (
                    <OnlineIcon style={styles.statusIconOnline} />
                  ) : (
                    <OfflineIcon style={styles.statusIconOffline} />
                  )}
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
        {someToolsAreUnavailable && !validationInfo && !showActions && (
          <Banner.BannerMessage message="Some tools are not available anymore." />
        )}
        {showVariables && (
          <AgentVariables
            variables={variables}
            onChangeVariable={onChangeVariable}
          />
        )}
        {/* Move ToolActionsComponent inside the main card container */}
        <ToolActionsComponent
          toolOptions={toolOptions}
          selectedTools={tool?.settings?.selected_tools}
          availableTools={availableTools}
          showActions={showActions}
          tool={tool}
          index={index}
          type={tool?.type}
          disabled={disabled}
        />
        <AlertDialog
          title={dialogTitle}
          alertContent={dialogContent}
          open={openAlert}
          alarm
          onClose={onCloseAlert}
          onCancel={onCloseAlert}
          onConfirm={onConfirmAlert}
          confirmButtonText="Remove"
        />
        {validationInfo &&
          (typeof toolValidationMessage === 'object' &&
          toolValidationMessage?.error_type === 'private_credential_not_found' &&
          personal_project_id !== projectId ? (
            <CredentialWarningBanner
              credentialId={toolValidationMessage.credential_id}
              credentialType={tool?.type}
              section="credentials"
            />
          ) : (
            <Banner.BannerMessage
              message={
                typeof toolValidationMessage === 'string'
                  ? toolValidationMessage
                  : toolValidationMessage?.message || JSON.stringify(toolValidationMessage)
              }
            />
          ))}
      </Box>
    </Tooltip>
  );
});

ToolCard.displayName = 'ToolCard';

/** @type {MuiSx} */
const toolCardStyles = (showActions, isDuplicate, showVariables, hasVariables) => ({
  cardContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    backgroundColor: showActions || showVariables ? palette.background.userInputBackground : 'transparent',
    border:
      showActions || showVariables
        ? `0.0625rem solid ${palette.border.lines}`
        : `0.0625rem solid ${palette.border.table}`,
    boxSize: 'border-box',
    ...(isDuplicate && {
      border: `0.0625rem solid ${palette.border.attention}`,
      backgroundColor: palette.background.attention,
    }),
  }),
  cardHeader: ({ palette }) => ({
    borderRadius: showActions || showVariables ? '0.5rem 0.5rem 0 0' : '0.5rem',
    height: hasVariables ? '4.25rem' : '3.75rem',
    minHeight: hasVariables ? '4.25rem' : '3.75rem',
    boxSizing: 'border-box',
    display: 'flex',
    padding: '0.5rem 1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    backgroundColor: showActions || showVariables ? 'transparent' : palette.background.userInputBackground,
    '&:hover': {
      backgroundColor: showActions || showVariables ? 'transparent' : palette.background.toolCard.hover,
      border: showActions || showVariables ? 'none' : `0.0625rem solid ${palette.border.lines}`,
      '#DeleteButton': {
        display: 'flex',
      },
      '#OpenInNewTabButton': {
        display: 'flex',
      },
      '#RefreshButton': {
        display: 'flex',
      },
    },
  }),
  entityIcon: {
    minWidth: '2.125rem !important',
    width: '2.125rem !important',
    height: '2.125rem !important',
  },
  entityIconImage: {
    width: '2.125rem',
    height: '2.125rem',
    borderRadius: '50%',
  },
  contentBox: isAgent => ({
    display: 'flex',
    flexDirection: 'column',
    cursor: 'default',
    flex: '1 1 0',
    minWidth: 0,
    height: isAgent ? 'auto' : '2.75rem',
    minHeight: '2.75rem',
    gap: isAgent ? '0.125rem' : '0rem',
  }),
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  toolkitName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  attachmentButton: ({ palette }) => ({
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
  buttonsContainer: {
    alignSelf: 'center',
    marginTop: '0rem',
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    display: 'none',
  },
  actionIcon: {
    fontSize: '1rem',
  },
  statusIconBox:
    online =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      marginLeft: '0.25rem',
      color: online ? palette.icon.fill.default : palette.icon.fill.attention,
    }),
  statusIcon: {
    width: '1rem',
    height: '1rem',
  },
  statusIconOnline: {
    width: '1rem',
    height: '1rem',
  },
  statusIconOffline: {
    width: '1rem',
    height: '1rem',
  },
  variablesToggle: ({ palette }) => ({
    marginTop: '0rem',
    marginBottom: '0rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    cursor: 'pointer',
    color: palette.text.primary,
    '&:hover': {
      color: palette.primary.main,
    },
  }),
  variablesToggleLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  variablesToggleCount: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  attentionIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '1rem',
    height: '1rem',
    marginTop: '0.125rem',
    fill: palette.icon.fill.attention,
  }),
});

export default ToolCard;
