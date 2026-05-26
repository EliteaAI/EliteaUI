import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { AI_CONFIG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/aiConfigurationTourTargets.constants';
import AddModelButton from '@/[fsd]/features/settings/ui/ai-configuration/Configuration/AddModelButton';
import ConfigurationSection from '@/[fsd]/features/settings/ui/ai-configuration/Configuration/ConfigurationSection';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { ALLOW_PROJECT_OWN_LLMS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const ConfigurationsPanel = memo(props => {
  const {
    configurationsBySections,
    configurationsLoading,
    projectDefaultModel,
    projectLowTierDefaultModel,
    projectHighTierDefaultModel,
    projectDefaultEmbeddingModel,
    projectDefaultVectorStorageModel,
    projectDefaultImageGenerationModel,
    projectDefaultASRModel,
    projectDefaultTTSModel,
    modelOptions,
    lowTierModelOptions,
    highTierModelOptions,
    embeddingModelOptions,
    vectorStorageOptions,
    imageGenerationOptions,
    asrOptions,
    ttsOptions,
    onChangeDefaultModel,
  } = props;
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const canCreateIntegration = useMemo(
    () => ALLOW_PROJECT_OWN_LLMS !== false || projectId == PUBLIC_PROJECT_ID,
    [projectId],
  );

  const renderInfoLabel = useCallback(
    (label, tooltipText) => {
      return (
        <Box sx={styles.inlineDefaultLabel}>
          <Typography
            variant="bodyMedium"
            color="text.primary"
            sx={styles.inlineDefaultLabelText}
          >
            {label}
          </Typography>
          <InfoTooltip
            infoTooltip={tooltipText}
            sx={styles.inlineInfoIconWrapper}
          />
        </Box>
      );
    },
    [styles],
  );

  const tooltips = {
    default:
      'Default: used for most activities by default. Start here; switch to Low-tier or High-tier when needed.',
    lowTier:
      'Low-tier: cheaper/faster models for routine tasks (diagram fixing, formatting, simple edits). Examples: gpt mini from OpenAI, Gemini Flash from google, Anthropic Haiku.',
    highTier:
      'High-tier: more capable (and more expensive) models for complex workflows (multi-step reasoning, heavy tool usage). Examples: Anthropic Sonnet 4.5 / Opus, OpenAI GPT-5.2, Google Gemini 3 Pro.',
    embedding:
      'Default embedding model: generates embeddings (vectors) used for indexing and semantic search (RAG). Affects retrieval quality and performance.',
    vectorStorage:
      'Default vector storage: where embeddings are stored for retrieval/search. Choose based on persistence and scale requirements.',
  };

  return (
    <Box sx={styles.configurationsSection}>
      <Box
        data-tour={AI_CONFIG_TOUR_TARGET_IDS.integrations}
        sx={styles.configurationsHeader}
      >
        <Box sx={styles.configurationsContent}>
          <Typography
            variant="headingMedium"
            sx={styles.sectionTitle}
          >
            Integrations
          </Typography>
          {canCreateIntegration && <AddModelButton />}
        </Box>
      </Box>

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.llmModels}
        hasDefaultSetting
        title="LLM Models"
        configurations={configurationsBySections.llm}
        isLoading={configurationsLoading}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.default)}
        defaultSettingValue={projectDefaultModel}
        defaultSettingOptions={modelOptions}
        onChangeDefaultSetting={onChangeDefaultModel('llm')}
        groupTheModelsByProvider
        additionalDefaultSettings={[
          {
            key: 'high-tier-model',
            label: renderInfoLabel('High-tier', tooltips.highTier),
            labelWidth: 'auto',
            value: projectHighTierDefaultModel,
            options: highTierModelOptions,
            onChange: onChangeDefaultModel('llm_high_tier'),
          },
          {
            key: 'low-tier-model',
            label: renderInfoLabel('Low-tier', tooltips.lowTier),
            labelWidth: 'auto',
            value: projectLowTierDefaultModel,
            options: lowTierModelOptions,
            onChange: onChangeDefaultModel('llm_low_tier'),
          },
        ]}
      />

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.embeddingModels}
        title="Embedding Models"
        configurations={configurationsBySections.embedding}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.embedding)}
        defaultSettingValue={projectDefaultEmbeddingModel}
        defaultSettingOptions={embeddingModelOptions}
        onChangeDefaultSetting={onChangeDefaultModel('embedding')}
      />

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.vectorStorage}
        title="Vector Storage"
        configurations={configurationsBySections.vectorstorage}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.vectorStorage)}
        defaultSettingValue={projectDefaultVectorStorageModel}
        defaultSettingOptions={vectorStorageOptions}
        onChangeDefaultSetting={onChangeDefaultModel('vectorstorage')}
      />

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.imageGeneration}
        title="Image Generation"
        configurations={configurationsBySections.image_generation}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultSettingLabel="Default image generation model:"
        defaultSettingValue={projectDefaultImageGenerationModel}
        defaultSettingOptions={imageGenerationOptions}
        onChangeDefaultSetting={onChangeDefaultModel('image_generation')}
      />

      <ConfigurationSection
        title="Speech Recognition (ASR)"
        configurations={configurationsBySections.asr}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultSettingLabel="Default ASR model:"
        defaultSettingValue={projectDefaultASRModel}
        defaultSettingOptions={asrOptions}
        onChangeDefaultSetting={onChangeDefaultModel('asr')}
      />

      <ConfigurationSection
        title="Text to Speech (TTS)"
        configurations={configurationsBySections.tts}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultSettingLabel="Default TTS model:"
        defaultSettingValue={projectDefaultTTSModel}
        defaultSettingOptions={ttsOptions}
        onChangeDefaultSetting={onChangeDefaultModel('tts')}
      />

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.aiCredentials}
        title="AI Credentials"
        configurations={configurationsBySections.ai_credentials}
        isLoading={configurationsLoading}
      />
    </Box>
  );
});

ConfigurationsPanel.displayName = 'ConfigurationsPanel';

/** @type {MuiSx} */
const getStyles = () => ({
  configurationsSection: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    height: '100%',
  },
  configurationsHeader: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: palette.background.default,
    borderBottom: `0.0625rem solid ${palette.border.sidebarDivider}`,
    zIndex: 1,
    width: '100%',
    height: '3.8125rem',
  }),
  configurationsContent: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: palette.background.settingsPage,
    width: '100%',
    padding: '1rem 1.5rem',
  }),
  sectionTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  inlineDefaultLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  inlineDefaultLabelText: {
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  inlineInfoIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '0.125rem',
  },
});

export default ConfigurationsPanel;
