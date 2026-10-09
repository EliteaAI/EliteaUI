import { useCallback, useMemo } from 'react';

import { areDetailsOfParticipant } from '@/[fsd]/features/chat/participants/lib/helpers';
import {
  isSkillChatModelPending,
  resolveSkillChatLLMSettings,
  resolveSkillChatModel,
} from '@/[fsd]/features/skill/lib/helpers';
import { LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import { cleanLLMSettings, resetLLMSettingsForModel, selectionFields } from '@/[fsd]/shared/lib/utils';
import { ChatParticipantType, PROMPT_PAYLOAD_KEY } from '@/common/constants';

const { DEFAULT_MAX_TOKENS } = LLMSettingsConstants;
const EMPTY_LLM_SETTINGS = Object.freeze({});

export const useSkillChatModel = ({
  activeParticipant,
  participantDetails,
  models,
  onChangeParticipantSettings,
}) => {
  const isActiveSkill = activeParticipant?.entity_name === ChatParticipantType.Skills;

  const pinnedVersionDetails = useMemo(() => {
    if (!isActiveSkill || !areDetailsOfParticipant(participantDetails, activeParticipant)) return undefined;
    const versionDetails = participantDetails.version_details;
    return versionDetails?.id === activeParticipant.entity_settings?.version_id ? versionDetails : undefined;
  }, [isActiveSkill, participantDetails, activeParticipant]);

  const skillLLMSettings = useMemo(
    () =>
      isActiveSkill
        ? resolveSkillChatLLMSettings(activeParticipant.entity_settings, pinnedVersionDetails)
        : EMPTY_LLM_SETTINGS,
    [isActiveSkill, activeParticipant?.entity_settings, pinnedVersionDetails],
  );

  const isPending =
    isActiveSkill && isSkillChatModelPending(activeParticipant.entity_settings, pinnedVersionDetails);

  const skillModel = useMemo(
    () => (isActiveSkill && !isPending ? resolveSkillChatModel(models, skillLLMSettings) : null),
    [isActiveSkill, isPending, models, skillLLMSettings],
  );

  const saveSkillLLMSettings = useCallback(
    llmSettingsOverride =>
      onChangeParticipantSettings(
        {
          ...activeParticipant,
          entity_settings: { ...activeParticipant.entity_settings, llm_settings: llmSettingsOverride },
        },
        true,
      ),
    [activeParticipant, onChangeParticipantSettings],
  );

  const onSelectSkillModel = useCallback(
    newModel => {
      if (newModel.name === skillModel?.name && newModel.project_id === skillModel?.project_id) return;
      saveSkillLLMSettings({
        max_tokens: skillLLMSettings.max_tokens ?? DEFAULT_MAX_TOKENS,
        ...resetLLMSettingsForModel(newModel),
        ...selectionFields(newModel),
      });
    },
    [saveSkillLLMSettings, skillLLMSettings.max_tokens, skillModel?.name, skillModel?.project_id],
  );

  const onSetSkillLLMSettings = useCallback(
    newSettings => {
      // eslint-disable-next-line no-unused-vars
      const { [PROMPT_PAYLOAD_KEY.stepsLimit]: _stepsLimit, ...llmOnlySettings } = newSettings;
      saveSkillLLMSettings(
        cleanLLMSettings(
          { ...skillLLMSettings, ...selectionFields(skillModel), ...llmOnlySettings },
          skillModel,
        ),
      );
    },
    [saveSkillLLMSettings, skillLLMSettings, skillModel],
  );

  const canEditModel = isActiveSkill && !isPending && !!onChangeParticipantSettings;

  return {
    isActiveSkill,
    skillModel,
    skillLLMSettings,
    onSelectSkillModel: canEditModel ? onSelectSkillModel : undefined,
    onSetSkillLLMSettings: canEditModel ? onSetSkillLLMSettings : undefined,
  };
};
