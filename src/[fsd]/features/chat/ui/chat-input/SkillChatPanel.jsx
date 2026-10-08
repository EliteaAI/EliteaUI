import { memo, useMemo } from 'react';

import { Box, Button, ButtonGroup, Divider, Tooltip, Typography, useTheme } from '@mui/material';

import { areDetailsOfParticipant } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantEntityIcon } from '@/[fsd]/features/chat/participants/lib/hooks';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { ChatParticipantType } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import useAgentEditorPanelFit from '@/hooks/useAgentEditorPanelFit';

import SwitchToModelButton from './SwitchToModelButton';
import VersionSelector from './VersionSelector';

const NO_VERSIONS = [];

const SkillChatPanel = memo(props => {
  const {
    activeParticipant,
    participantDetails,
    onClickParticipant,
    selectedVersionId,
    onSelectVersion,
    models,
    selectedModel,
    onSelectModel,
    llmSettings,
    onSetLLMSettings,
    isUnavailable,
    disabled,
    onSwitchToModel,
    disableSwitchToModel,
  } = props;

  const theme = useTheme();
  const { containerRef, isSmallView } = useAgentEditorPanelFit();
  const entityIcon = useParticipantEntityIcon(activeParticipant);

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

  const styles = skillChatPanelStyles(isSmallView, theme);

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
              isSmallView={isSmallView}
            />
          </>
        )}
      </ButtonGroup>

      {isUnavailable && (
        <Tooltip
          placement="top"
          title="This skill version is no longer available. Select another version or switch to a model."
        >
          <Box
            sx={styles.attentionIcon}
            data-testid="chat-skill-panel-unavailable"
          >
            <AttentionIcon />
          </Box>
        </Tooltip>
      )}

      <LLMModelSelector
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        models={models}
        disabled={disabled || !onSelectModel}
        llmSettings={llmSettings}
        onSetLLMSettings={onSetLLMSettings}
        showSettingsEntry={!!onSetLLMSettings}
        modelTooltip="Model the skill runs with in this chat"
      />

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
const skillChatPanelStyles = (isSmallView, theme) => ({
  outerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '1.25rem',
    border: `0.0625rem solid ${theme.palette.border.lines}`,
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
