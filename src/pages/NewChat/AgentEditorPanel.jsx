import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { usePublicProjectAccessCheck } from '@/[fsd]/features/project/lib/hooks';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import VariablesIcon from '@/assets/variables-icon.svg?react';
import VersionIcon from '@/assets/version-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import SettingIcon from '@/components/Icons/SettingIcon';
import VariableDialog from '@/components/VariableDialog.jsx';
import useIsActiveParticipantBeingEdited from '@/hooks/chat/useIsActiveParticipantBeingEdited';
import useParticipantEntityIcon from '@/hooks/chat/useParticipantEntityIcon';
import useAgentEditorPanelFit from '@/hooks/useAgentEditorPanelFit';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';

const VersionSelector = ({
  versions,
  selectedVersion,
  onSelect,
  onCloseEditor,
  isEditorDirty,
  onShowVersionChangeAlert,
  isSmallView,
  onRefresh,
}) => {
  const theme = useTheme();
  const [versionSelectAnchorEl, setVersionSelectAnchorEl] = useState(null);
  const versionSelectMenuOpen = Boolean(versionSelectAnchorEl);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(
    async event => {
      event?.stopPropagation();
      if (!onRefresh) return;

      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Small delay to ensure the UI reflects the loading state
        setTimeout(() => setIsRefreshing(false), 500);
      }
    },
    [onRefresh],
  );

  // Get editing state from Redux to check if any editor is open with unsaved changes
  const { isEditingAgent, isEditingPipeline } = useNavBlocker();
  const isAnyEditorOpen = isEditingAgent || isEditingPipeline;

  // TODO: Confirm with Hawk START
  const handleVersionSelect = index => {
    // When we're editing (agent or pipeline) and changes are not saved
    if (isAnyEditorOpen && isEditorDirty) {
      return onShowVersionChangeAlert(() => {
        // Close the editor first to discard changes
        if (onCloseEditor) onCloseEditor();
        // Then change the version
        onSelect(versions[index]);
        handleClose();
      });
    }

    // Close editor if open (no unsaved changes)
    if (onCloseEditor) onCloseEditor();
    // No unsaved changes or not editing, proceed normally
    onSelect(versions[index]);
    handleClose();
  };
  // TODO: Confirm with Hawk END

  const handleVersionMenuClick = event => {
    setVersionSelectAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setVersionSelectAnchorEl(null);
  };

  return (
    <>
      <Tooltip
        placement="top"
        title={'Version selector'}
      >
        <Button
          size="small"
          aria-expanded={versionSelectMenuOpen ? 'true' : undefined}
          aria-label="version selector menu"
          aria-haspopup="menu"
          onClick={handleVersionMenuClick}
        >
          {isSmallView ? <VersionIcon style={{ fontSize: '16px' }} /> : selectedVersion?.name}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={versionSelectAnchorEl}
        open={versionSelectMenuOpen}
        onClose={handleClose}
      >
        {/* Version Header with Refresh Button - Using Box instead of disabled MenuItem to allow button clicks */}
        {onRefresh && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.border.lines}`,
              minHeight: '28px',
              padding: '4px 12px',
            }}
          >
            <Typography
              variant="labelTiny"
              sx={{
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
              }}
            >
              Versions
            </Typography>
            <Tooltip
              title="Refresh versions"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="tertiary"
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{ padding: '2px', minWidth: '20px', width: '20px', height: '20px' }}
              >
                {isRefreshing ? (
                  <CircularProgress size={12} />
                ) : (
                  <RefreshIcon style={{ fontSize: '12px', width: '12px', height: '12px' }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {versions.map((item, index) => (
          <MenuItem
            key={index}
            selected={item.id === selectedVersion?.id}
            onClick={() => handleVersionSelect(index)}
          >
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const VariablesEditor = ({ variables, onChange, isSmallView }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const variableDialogOpen = Boolean(anchorEl);

  const handleOpenDialogClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeVariables = newVariables => {
    onChange(newVariables);
    handleClose();
  };

  return (
    <>
      <Tooltip
        placement="top"
        title={'Set variables'}
      >
        <Button
          size="small"
          aria-expanded={variableDialogOpen ? 'true' : undefined}
          aria-label="variables selector menu"
          aria-haspopup="menu"
          onClick={handleOpenDialogClick}
        >
          {isSmallView ? <VariablesIcon style={{ fontSize: '16px' }} /> : 'Variables'}
        </Button>
      </Tooltip>
      <VariableDialog
        variables={variables}
        open={variableDialogOpen}
        onOK={handleChangeVariables}
        onCancel={handleClose}
      />
    </>
  );
};

/**
 * AgentEditorPanel - Displays participant info with version, variables, and settings controls
 *
 * Features:
 * - Automatically switches to icon-only view when space is limited to prevent overlapping
 * - Uses ResizeObserver to detect available width in real-time
 * - Displays participant name, version selector, variables editor, and settings
 */
const AgentEditorPanel = ({
  activeParticipant,
  participantDetails,
  onClickParticipant,

  selectedVersionId,
  onSelectVersion,

  variables,
  onChangeVariables,

  disabled,
  onShowAgentEditor,
  onShowPipelineEditor,
  onCloseAgentEditor,
  onClosePipelineEditor,
  isEditorDirty,
  onShowVersionChangeAlert,
}) => {
  // console.log('AgentEditorPanel', {activeParticipant, participantDetails, selectedVersionId, variables, disabled});
  const anchorRef = useRef(null);
  const { checkPermission } = useCheckPermission();
  const theme = useTheme();

  // Auto-detect if panel needs to switch to icon view based on available width
  // This prevents UI overlapping when the container becomes too narrow
  // Note: The panel is in a flex container that shrinks based on available space
  const { containerRef, isSmallView } = useAgentEditorPanelFit();

  const isPipeline = activeParticipant?.entity_settings?.agent_type === 'pipeline';
  const entityIcon = useParticipantEntityIcon(activeParticipant);
  const styles = agentEditorPanelStyles(isSmallView);

  const hasEditPermission = useMemo(() => {
    return checkPermission(PERMISSIONS.applications.update);
  }, [checkPermission]);
  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  // Check if active participant is being edited
  const isActiveParticipantBeingEdited = useIsActiveParticipantBeingEdited(activeParticipant);
  const isPublic = activeParticipant?.entity_meta?.project_id == PUBLIC_PROJECT_ID;
  const canEdit = (!isPublic && hasEditPermission) || (isPublic && hasPublicProjectAccess);

  // Determine which close handler to use based on participant type
  const onCloseEditor = useCallback(() => {
    if (isPipeline) {
      onClosePipelineEditor?.();
    } else {
      onCloseAgentEditor?.();
    }
  }, [isPipeline, onClosePipelineEditor, onCloseAgentEditor]);

  const selectedVersion = useMemo(() => {
    return (
      participantDetails?.versions?.find(version => version.id === selectedVersionId) ||
      participantDetails?.versions?.[0] ||
      {}
    );
  }, [participantDetails?.versions, selectedVersionId]);

  const isSelectedVersionPublished = useMemo(() => {
    return selectedVersion?.status === 'published';
  }, [selectedVersion]);
  // Should be used to determine if the settings button should be disabled
  const isEditSettingsDisabled = useMemo(() => {
    if (isSelectedVersionPublished && !isPublic) return true;
    return false;
  }, [isPublic, isSelectedVersionPublished]);

  const settingsTooltipTitle = useMemo(() => {
    if (isPipeline) return canEdit ? 'Pipeline settings' : 'View pipeline settings';
    if (isSelectedVersionPublished) return 'Published versions are not editable';

    return canEdit ? 'Agent Settings' : 'View agent Settings';
  }, [canEdit, isPipeline, isSelectedVersionPublished]);

  const onClickAgentEditor = useCallback(() => {
    // Call the appropriate editor based on participant type
    if (isPipeline) {
      onShowPipelineEditor?.(activeParticipant);
    } else {
      onShowAgentEditor?.(activeParticipant);
    }
  }, [onShowAgentEditor, onShowPipelineEditor, activeParticipant, isPipeline]);

  return (
    <ButtonGroup
      variant="alita"
      disableElevation
      color="secondary"
      disabled={disabled}
      ref={node => {
        anchorRef.current = node;
        containerRef.current = node;
      }}
      aria-label="Model Selector Menu"
      sx={styles.buttonGroupContainer}
    >
      <Tooltip
        placement="top"
        title={'Switch assistant'}
      >
        <Button onClick={onClickParticipant}>
          <EntityIcon
            icon={entityIcon}
            entityType={isPipeline ? 'pipeline' : 'application'}
            editable={false}
            showBackgroundColor={false}
            sx={styles.entityIcon}
            imageStyle={styles.imageStyle}
          />
          {!isSmallView && (
            <Typography
              variant="labelSmall"
              sx={styles.participantName}
            >
              {participantDetails?.name}
            </Typography>
          )}
        </Button>
      </Tooltip>

      {/*<Divider orientation={'vertical'} />*/}

      {/*{showSettings && onClickSettings && (*/}
      {!!participantDetails?.versions?.length && (
        <>
          <Divider orientation="vertical" />
          <VersionSelector
            selectedVersion={selectedVersion}
            versions={participantDetails.versions}
            onSelect={onSelectVersion}
            onCloseEditor={onCloseEditor}
            isEditorDirty={isEditorDirty}
            onShowVersionChangeAlert={onShowVersionChangeAlert}
            isSmallView={isSmallView}
          />
        </>
      )}

      {!!variables?.length && (
        <>
          <Divider orientation="vertical" />
          <VariablesEditor
            variables={variables}
            onChange={onChangeVariables}
            isSmallView={isSmallView}
          />
        </>
      )}

      <Divider orientation="vertical" />

      <Tooltip
        placement="top"
        title={settingsTooltipTitle}
      >
        {/* span wrapper was added to give opportunity to show tooltip for disabled button but affected to it appearance */}
        {/* <span> */}
        <Button
          size="small"
          aria-label="agent settings menu"
          aria-haspopup="settings"
          onClick={onClickAgentEditor}
          disabled={disabled || isEditSettingsDisabled}
          variant="alita"
          color="secondary"
        >
          {isActiveParticipantBeingEdited ? (
            <Typography
              variant="labelSmall"
              color="primary"
              sx={styles.editingText}
            >
              {`${canEdit ? 'Editing...' : 'Viewing...'}`}
            </Typography>
          ) : (
            <SettingIcon
              sx={styles.settingIcon}
              fill={disabled || isEditSettingsDisabled ? theme.palette.icon.fill.disabled : undefined}
            />
          )}
        </Button>
        {/* </span> */}
      </Tooltip>
    </ButtonGroup>
  );
};

const agentEditorPanelStyles = isSmallView => ({
  buttonGroupContainer: {
    minWidth: 0,
    maxWidth: '100%',
  },
  entityIcon: {
    minWidth: '16px !important',
    width: '16px !important',
    height: '16px',
    borderRadius: '0px !important',
    marginRight: isSmallView ? '0px' : '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStyle: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
  editingText: {
    fontSize: '12px',
    fontWeight: 400,
  },
  settingIcon: {
    fontSize: '16px',
  },
  participantName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
});

export default AgentEditorPanel;
