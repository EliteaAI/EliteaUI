import { memo, useCallback, useMemo } from 'react';

import { Box, Button, ButtonGroup, Divider, Tooltip, Typography } from '@mui/material';

import { useAgentEditorPanelFit } from '@/[fsd]/features/chat/lib/hooks';
import { ParticipantConstants } from '@/[fsd]/features/chat/participants/lib/constants';
import { areDetailsOfParticipant, isSameChatEntity } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatParticipantType, PERMISSIONS } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import ParticipantSettingsButton from './ParticipantSettingsButton';
import SwitchToModelButton from './SwitchToModelButton';
import VersionSelector from './VersionSelector';

const NO_VERSIONS = [];

const UNAVAILABLE_MESSAGES = {
  [ParticipantConstants.SkillUnavailableReason.Skill]:
    'This skill is no longer available. Switch to a model or remove it from the chat.',
  [ParticipantConstants.SkillUnavailableReason.Version]:
    'This skill version is no longer available. Select another version or switch to a model.',
};

const SkillChatPanel = memo(props => {
  const {
    activeParticipant,
    participantDetails,
    onClickParticipant,
    selectedVersionId,
    onSelectVersion,
    onShowSkillEditor,
    onCloseSkillEditor,
    editingSkill,
    isEditorDirty,
    onShowVersionChangeAlert,
    unavailableReason,
    disabled,
    onSwitchToModel,
    disableSwitchToModel,
  } = props;

  const { containerRef, isSmallView } = useAgentEditorPanelFit();
  const entityIcon = useParticipantEntityIcon(activeParticipant);
  const { checkPermission } = useCheckPermission();
  const canEdit = checkPermission(PERMISSIONS.skills.update);

  const onClickSettings = useCallback(
    () => onShowSkillEditor?.(activeParticipant),
    [onShowSkillEditor, activeParticipant],
  );

  const hasDetails = areDetailsOfParticipant(participantDetails, activeParticipant);
  const versions = (hasDetails && participantDetails.versions) || NO_VERSIONS;
  const skillName = (hasDetails && participantDetails.name) || activeParticipant?.meta?.name || '';

  const selectedVersion = useMemo(
    () =>
      versions.find(version => version.id === selectedVersionId) || {
        name: activeParticipant?.meta?.version_name || '',
      },
    [versions, selectedVersionId, activeParticipant?.meta?.version_name],
  );

  const styles = skillChatPanelStyles(isSmallView);

  return (
    <Box
      ref={containerRef}
      sx={styles.outerContainer}
      data-testid="chat-skill-panel"
    >
      <ButtonGroup
        variant="elitea"
        disableElevation
        color="secondary"
        disabled={disabled}
        aria-label="Skill Selector Menu"
        sx={styles.buttonGroupContainer}
      >
        <Tooltip
          placement="top"
          title="Switch Skill"
        >
          <Button
            data-testid="chat-switch-participant-button"
            onClick={onClickParticipant}
          >
            <EntityIcon
              icon={entityIcon}
              entityType={ChatParticipantType.Skills}
              editable={false}
              showBackgroundColor={false}
              sx={styles.entityIcon}
              imageStyle={styles.imageStyle}
            />
            {!isSmallView && (
              <Typography
                variant="labelSmall"
                sx={styles.participantName}
                data-testid="chat-skill-panel-name"
              >
                {skillName}
              </Typography>
            )}
          </Button>
        </Tooltip>

        {!!versions.length && (
          <>
            <Divider orientation="vertical" />
            <VersionSelector
              selectedVersion={selectedVersion}
              versions={versions}
              onSelect={onSelectVersion}
              onCloseEditor={onCloseSkillEditor}
              isEditorDirty={isEditorDirty}
              onShowVersionChangeAlert={onShowVersionChangeAlert}
              isSmallView={isSmallView}
            />
          </>
        )}

        <Divider orientation="vertical" />

        <ParticipantSettingsButton
          tooltip={canEdit ? 'Skill settings' : 'View skill settings'}
          isEditing={isSameChatEntity(editingSkill, activeParticipant)}
          canEdit={canEdit}
          disabled={disabled || !onShowSkillEditor}
          onClick={onClickSettings}
          testId="chat-skill-settings-button"
          ariaLabel="skill settings menu"
        />
      </ButtonGroup>

      {unavailableReason && (
        <Tooltip
          placement="top"
          title={UNAVAILABLE_MESSAGES[unavailableReason]}
        >
          <Box
            sx={styles.attentionIcon}
            data-testid="chat-skill-panel-unavailable"
          >
            <AttentionIcon />
          </Box>
        </Tooltip>
      )}

      <SwitchToModelButton
        onClick={onSwitchToModel}
        disabled={disabled || disableSwitchToModel}
        testId="chat-skill-switch-to-model-button"
      />
    </Box>
  );
});

SkillChatPanel.displayName = 'SkillChatPanel';

/** @type {MuiSx} */
const skillChatPanelStyles = isSmallView => ({
  outerContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '1.25rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    minWidth: 0,
    maxWidth: '100%',
  }),
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
  participantName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  attentionIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
});

export default SkillChatPanel;
