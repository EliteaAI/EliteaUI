import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { AI_CONFIG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/aiConfigurationTourTargets.constants';
import ConfigurationSection from '@/[fsd]/features/settings/ui/ai-providers/ConfigurationSection';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

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
    expandSection = null,
  } = props;
  const styles = getStyles();

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
      'Default model used for most AI activities. The system may switch to the Low-tier or High-tier model when needed.',
    lowTier: 'Model used for simpler tasks where faster responses and lower cost are preferred.',
    highTier: 'Model used for complex tasks that require stronger reasoning or higher-quality responses.',
    embedding:
      'Default embedding model used to convert content into vectors for indexing, semantic search, and retrieval.',
    vectorStorage: 'Default vector storage used to store embeddings for indexing, search, and retrieval.',
    imageGeneration: 'Default image generation model used when creating images in Elitea.',
    asr: 'Default speech recognition model used to convert audio or speech into text.',
    tts: 'Default text-to-speech model used to convert text into spoken audio.',
  };

  return (
    <Box sx={styles.configurationsSection}>
      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.llmModels}
        hasDefaultSetting
        defaultExpanded={!expandSection || expandSection === 'llm'}
        title="LLMs"
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
        defaultExpanded={expandSection === 'embedding'}
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
        defaultExpanded={expandSection === 'vectorstorage'}
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
        defaultExpanded={expandSection === 'image_generation'}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.imageGeneration)}
        defaultSettingValue={projectDefaultImageGenerationModel}
        defaultSettingOptions={imageGenerationOptions}
        onChangeDefaultSetting={onChangeDefaultModel('image_generation')}
      />

      <ConfigurationSection
        title="Speech Recognition (ASR)"
        configurations={configurationsBySections.asr}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultExpanded={expandSection === 'asr'}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.asr)}
        defaultSettingValue={projectDefaultASRModel}
        defaultSettingOptions={asrOptions}
        onChangeDefaultSetting={onChangeDefaultModel('asr')}
      />

      <ConfigurationSection
        title="Text to Speech (TTS)"
        configurations={configurationsBySections.tts}
        isLoading={configurationsLoading}
        hasDefaultSetting={true}
        defaultExpanded={expandSection === 'tts'}
        defaultSettingsLayout="inline"
        defaultSettingLabel={renderInfoLabel('Default', tooltips.tts)}
        defaultSettingValue={projectDefaultTTSModel}
        defaultSettingOptions={ttsOptions}
        onChangeDefaultSetting={onChangeDefaultModel('tts')}
      />

      <ConfigurationSection
        tourTargetId={AI_CONFIG_TOUR_TARGET_IDS.aiCredentials}
        title="AI Credentials"
        configurations={configurationsBySections.ai_credentials}
        isLoading={configurationsLoading}
        defaultExpanded={expandSection === 'ai_credentials'}
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
