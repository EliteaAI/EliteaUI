import { memo, useCallback, useMemo } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import { usePublicProjectAccessCheck } from '@/[fsd]/features/project/lib/hooks';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import SettingIcon from '@/components/Icons/SettingIcon';
import useIsActiveParticipantBeingEdited from '@/hooks/chat/useIsActiveParticipantBeingEdited';
import useAgentEditorPanelFit from '@/hooks/useAgentEditorPanelFit';
import useCheckPermission from '@/hooks/useCheckPermission';

import VariablesEditor from './VariablesEditor';
import VersionSelector from './VersionSelector';

const AgentEditorPanel = memo(props => {
  const {
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
    onSwitchToModel,
    disableSwitchToModel,
  } = props;

  const { checkPermission } = useCheckPermission();
  const theme = useTheme();

  const { containerRef, isSmallView } = useAgentEditorPanelFit();

  const isPipeline = activeParticipant?.entity_settings?.agent_type === 'pipeline';
  const entityIcon = useParticipantEntityIcon(activeParticipant);

  const isDetailsLoading =
    !participantDetails?.name || participantDetails?.id !== activeParticipant?.entity_meta?.id;

  const styles = agentEditorPanelStyles(isSmallView, theme);

  const hasEditPermission = useMemo(
    () => checkPermission(PERMISSIONS.applications.update),
    [checkPermission],
  );

  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  const isActiveParticipantBeingEdited = useIsActiveParticipantBeingEdited(activeParticipant);
  const isPublic = activeParticipant?.entity_meta?.project_id == PUBLIC_PROJECT_ID;
  const canEdit = (!isPublic && hasEditPermission) || (isPublic && hasPublicProjectAccess);

  const onCloseEditor = useCallback(() => {
    if (isPipeline) onClosePipelineEditor?.();
    else onCloseAgentEditor?.();
  }, [isPipeline, onClosePipelineEditor, onCloseAgentEditor]);

  const selectedVersion = useMemo(() => {
    return participantDetails?.versions?.find(version => version.id === selectedVersionId) || {};
  }, [participantDetails?.versions, selectedVersionId]);

  const isSelectedVersionPublished = useMemo(() => {
    return selectedVersion?.status === 'published';
  }, [selectedVersion]);

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
    if (isPipeline) onShowPipelineEditor?.(activeParticipant);
    else onShowAgentEditor?.(activeParticipant);
  }, [onShowAgentEditor, onShowPipelineEditor, activeParticipant, isPipeline]);

  if (isDetailsLoading) {
    return (
      <Box
        ref={containerRef}
        sx={styles.outerContainer}
      >
        <ButtonGroup
          variant="elitea"
          disableElevation
          color="secondary"
          disabled
          aria-label="Model Selector Menu"
          sx={styles.buttonGroupContainer}
        >
          <Button disabled>
            <Skeleton
              animation="wave"
              variant="circular"
              width={16}
              height={16}
              sx={styles.skeleton}
            />
            <Skeleton
              animation="wave"
              variant="rounded"
              width={64}
              height={12}
              sx={styles.skeletonText}
            />
          </Button>

          <Divider orientation="vertical" />

          <Button disabled>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={40}
              height={12}
              sx={styles.skeletonText}
            />
          </Button>

          <Divider orientation="vertical" />

          <Button disabled>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={52}
              height={12}
              sx={styles.skeletonText}
            />
          </Button>

          <Divider orientation="vertical" />

          <Button
            disabled
            size="small"
          >
            <Skeleton
              animation="wave"
              variant="circular"
              width={16}
              height={16}
              sx={styles.skeleton}
            />
          </Button>
        </ButtonGroup>

        <Tooltip
          placement="top"
          title="Switch to model"
        >
          <IconButton
            size="small"
            aria-label="switch to model"
            onClick={onSwitchToModel}
            disabled={disabled || disableSwitchToModel}
            sx={styles.closeButton}
          >
            <CloseIcon
              sx={styles.closeIcon}
              fill={
                disabled || disableSwitchToModel
                  ? theme.palette.icon.fill.disabled
                  : theme.palette.icon.fill.secondary
              }
            />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={styles.outerContainer}
    >
      <ButtonGroup
        variant="elitea"
        disableElevation
        color="secondary"
        disabled={disabled}
        aria-label="Model Selector Menu"
        sx={styles.buttonGroupContainer}
      >
        <Tooltip
          placement="top"
          title="Switch assistant"
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
          <Button
            size="small"
            aria-label="agent settings menu"
            aria-haspopup="settings"
            onClick={onClickAgentEditor}
            disabled={disabled || isEditSettingsDisabled}
            variant="elitea"
            color="secondary"
          >
            {isActiveParticipantBeingEdited ? (
              <Typography
                variant="labelSmall"
                color="primary"
                sx={styles.editingText}
              >
                {canEdit ? 'Editing...' : 'Viewing...'}
              </Typography>
            ) : (
              <SettingIcon
                sx={styles.settingIcon}
                fill={disabled || isEditSettingsDisabled ? theme.palette.icon.fill.disabled : undefined}
              />
            )}
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Tooltip
        placement="top"
        title="Switch to model"
      >
        <IconButton
          size="small"
          aria-label="switch to model"
          onClick={onSwitchToModel}
          disabled={disabled || disableSwitchToModel}
          sx={styles.closeButton}
        >
          <CloseIcon
            sx={styles.closeIcon}
            fill={
              disabled || disableSwitchToModel
                ? theme.palette.icon.fill.disabled
                : theme.palette.icon.fill.secondary
            }
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

AgentEditorPanel.displayName = 'AgentEditorPanel';

/** @type {MuiSx} */
const agentEditorPanelStyles = (isSmallView, theme) => ({
  outerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '1.25rem',
    border: `1px solid ${theme.palette.border.lines}`,
    minWidth: 0,
    maxWidth: '100%',
  },
  buttonGroupContainer: {
    minWidth: 0,
    maxWidth: '100%',
  },
  entityIcon: {
    minWidth: '1rem !important',
    width: '1rem !important',
    height: '1rem',
    borderRadius: '0rem !important',
    marginRight: isSmallView ? '0rem' : '.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStyle: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
  },
  editingText: {
    fontSize: '.75rem',
    fontWeight: 400,
  },
  settingIcon: {
    fontSize: '1rem',
  },
  skeleton: {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
  },
  skeletonText: {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.25rem',
  },
  closeButton: {
    padding: '0.375rem',
    flexShrink: 0,
  },
  closeIcon: {
    fontSize: '1rem',
  },
  participantName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
});

export default AgentEditorPanel;
