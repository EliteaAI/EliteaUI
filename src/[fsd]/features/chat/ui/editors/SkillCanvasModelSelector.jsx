import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useSkillChatModel } from '@/[fsd]/features/chat/lib/hooks';
import { PROJECT_DEFAULT_MODEL_LABEL } from '@/[fsd]/features/skill/lib/constants';
import {
  hasSkillChatModelOverride,
  isSkillVersionLocked,
  withPinnedSkillVersion,
  withoutSkillChatModel,
} from '@/[fsd]/features/skill/lib/helpers';
import { useSkillVersionModel } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const VERSION_MODEL_TOOLTIP = 'Model this skill version runs with';
const CHAT_MODEL_TOOLTIP = 'Published versions are locked. The model applies to this chat only';
const LOCKED_MODEL_TOOLTIP = 'Published versions are locked';
const NEW_CHAT_MODEL_TOOLTIP =
  'Published versions are locked. Send the first message to choose a model for this chat';
const CHAT_OVERRIDE_NOTICE = 'This chat runs the skill with its own model instead of the version model.';

const resolveLockedModelTooltip = (canPickChatModel, isNewConversation) => {
  if (canPickChatModel) return CHAT_MODEL_TOOLTIP;
  return isNewConversation ? NEW_CHAT_MODEL_TOOLTIP : LOCKED_MODEL_TOOLTIP;
};

const SkillCanvasModelSelector = memo(props => {
  const { skill, onChangeSkillSettings, isNewConversation } = props;
  const { values } = useFormikContext();
  const versionDetails = values?.version_details;
  const isLocked = isSkillVersionLocked(versionDetails?.status);
  const { checkPermission } = useCheckPermission();
  const canUpdateSkill = checkPermission(PERMISSIONS.skills.update);
  const styles = skillCanvasModelSelectorStyles();

  const {
    llmSettings: versionLLMSettings,
    models,
    isLoadingModels,
    selectedModel: versionModel,
    onSelectModel: onSelectVersionModel,
    onSetLLMSettings: onSetVersionLLMSettings,
    onUseProjectDefault,
  } = useSkillVersionModel();

  const skillDetails = useMemo(
    () => ({ id: values?.id, version_details: versionDetails }),
    [values?.id, versionDetails],
  );
  const pinnedSkill = useMemo(
    () => withPinnedSkillVersion(skill, versionDetails?.id),
    [skill, versionDetails?.id],
  );
  const { skillModel, skillLLMSettings, onSelectSkillModel, onSetSkillLLMSettings } = useSkillChatModel({
    activeParticipant: pinnedSkill,
    participantDetails: skillDetails,
    models,
    onChangeParticipantSettings: onChangeSkillSettings,
  });

  const onUseVersionModel = useCallback(
    () => onChangeSkillSettings(withoutSkillChatModel(skill), true),
    [onChangeSkillSettings, skill],
  );

  const hasChatOverride =
    !isLocked && !!onChangeSkillSettings && hasSkillChatModelOverride(skill?.entity_settings);

  if (isLoadingModels || !versionDetails?.id) return <Box sx={styles.container}>Loading models...</Box>;

  return (
    <Box
      sx={styles.container}
      data-testid="skill-canvas-model-selector"
    >
      {isLocked ? (
        <LLMModelSelector
          selectedModel={skillModel}
          onSelectModel={onSelectSkillModel}
          models={models}
          llmSettings={skillLLMSettings}
          onSetLLMSettings={onSetSkillLLMSettings}
          onResetToDefaults={onSelectSkillModel ? onUseVersionModel : undefined}
          disabled={!onSelectSkillModel}
          modelTooltip={resolveLockedModelTooltip(!!onSelectSkillModel, isNewConversation)}
        />
      ) : (
        <LLMModelSelector
          selectedModel={versionModel}
          onSelectModel={onSelectVersionModel}
          models={models}
          llmSettings={versionLLMSettings}
          onSetLLMSettings={onSetVersionLLMSettings}
          onResetToDefaults={canUpdateSkill ? onUseProjectDefault : undefined}
          disabled={!canUpdateSkill}
          modelTooltip={VERSION_MODEL_TOOLTIP}
          emptyModelLabel={PROJECT_DEFAULT_MODEL_LABEL}
        />
      )}
      {hasChatOverride && (
        <Box
          sx={styles.overrideNotice}
          data-testid="skill-canvas-chat-override"
        >
          <Typography
            variant="bodySmall"
            sx={styles.overrideText}
          >
            {CHAT_OVERRIDE_NOTICE}
          </Typography>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            onClick={onUseVersionModel}
            data-testid="skill-canvas-use-version-model"
          >
            Use version model in this chat
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

SkillCanvasModelSelector.displayName = 'SkillCanvasModelSelector';

/** @type {MuiSx} */
const skillCanvasModelSelectorStyles = () => ({
  container: {
    padding: '1rem 1rem 0',
  },
  overrideNotice: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  overrideText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default SkillCanvasModelSelector;
