import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ModelConfigurationHelpers } from '@/[fsd]/features/settings/lib/helpers';
import {
  useCopyConfiguration,
  useModelConfiguration,
  useModelOptions,
} from '@/[fsd]/features/settings/lib/hooks';
import { useListModelsQuery, useSetProjectDefaultModelMutation } from '@/api/configurations.js';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import CopyIcon from '@/components/Icons/CopyIcon';
import { useMultiSectionConfigurations } from '@/hooks/useMultiSectionConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ConfigurationsPanel from './ConfigurationsPanel';
import ModelCapabilitiesSection from './ModelCapabilitiesSection';
import ProjectConfiguration from './ProjectAIConfiguration';

const ModelConfiguration = memo(() => {
  const projectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const [setProjectDefaultModel] = useSetProjectDefaultModelMutation();
  const styles = getStyles();

  // Fetch all model data
  const {
    data: modelsData = {
      items: [],
      total: 0,
      default_model_name: '',
      default_model_project_id: '',
      low_tier_default_model_name: '',
      low_tier_default_model_project_id: '',
      high_tier_default_model_name: '',
      high_tier_default_model_project_id: '',
    },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'llm' },
    { skip: !projectId },
  );

  const {
    data: embeddingModelsData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'embedding' },
    { skip: !projectId },
  );

  const {
    data: vectorStorageData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'vectorstorage' },
    { skip: !projectId },
  );

  const {
    data: imageGenerationData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'image_generation' },
    { skip: !projectId },
  );

  // Get multi-section configurations
  const { data: availableConfigurations, isLoading: configurationsLoading } = useMultiSectionConfigurations(
    ['llm', 'embedding', 'vectorstorage', 'ai_credentials', 'image_generation'],
    projectId,
  );

  // Use custom hooks for state management
  const {
    uniqueConfigurations,
    modelOptions,
    lowTierModelOptions,
    highTierModelOptions,
    embeddingModelOptions,
    vectorStorageOptions,
    imageGenerationOptions,
  } = useModelOptions({
    configurations: modelsData.items,
    embeddingModelsData,
    vectorStorageData,
    imageGenerationData,
  });

  const { model } = useModelConfiguration({
    projectId,
    uniqueConfigurations,
  });

  // Group configurations by section
  const configurationsBySections = useMemo(() => {
    if (!availableConfigurations)
      return { llm: [], embedding: [], vectorstorage: [], ai_credentials: [], image_generation: [] };
    return {
      llm: availableConfigurations
        .filter(config => config.section === 'llm')
        .map(config => ({
          ...config,
          default:
            config.data?.name === modelsData.default_model_name &&
            (!modelsData.default_model_project_id ||
              modelsData.default_model_project_id === config.project_id),
        })),
      embedding: availableConfigurations.filter(config => config.section === 'embedding'),
      vectorstorage: availableConfigurations.filter(config => config.section === 'vectorstorage'),
      ai_credentials: availableConfigurations.filter(config => config.section === 'ai_credentials'),
      image_generation: availableConfigurations.filter(config => config.section === 'image_generation'),
    };
  }, [availableConfigurations, modelsData.default_model_name, modelsData.default_model_project_id]);

  // Use copy configuration hook
  const { handleCopyCardInformation } = useCopyConfiguration({
    model,
    projectId,
    uniqueConfigurations,
    userApiUrl: user.api_url,
    configurationsBySections,
  });

  // Calculate options and capabilities
  const options = useMemo(
    () => ModelConfigurationHelpers.getConfigurationOptions(uniqueConfigurations),
    [uniqueConfigurations],
  );

  const modelCapabilities = useMemo(
    () => ModelConfigurationHelpers.getModelCapabilities(options, model.configuration_uid, model.model_name),
    [options, model.configuration_uid, model.model_name],
  );

  // Default model values for dropdowns
  const projectDefaultModel = useMemo(
    () => `${modelsData.default_model_name}<<>>${modelsData.default_model_project_id}`,
    [modelsData.default_model_name, modelsData.default_model_project_id],
  );

  const projectLowTierDefaultModel = useMemo(() => {
    if (!modelsData.low_tier_default_model_name || !modelsData.low_tier_default_model_project_id) {
      return '';
    }
    return `${modelsData.low_tier_default_model_name}<<>>${modelsData.low_tier_default_model_project_id}`;
  }, [modelsData.low_tier_default_model_name, modelsData.low_tier_default_model_project_id]);

  const projectHighTierDefaultModel = useMemo(() => {
    if (!modelsData.high_tier_default_model_name || !modelsData.high_tier_default_model_project_id) {
      return '';
    }
    return `${modelsData.high_tier_default_model_name}<<>>${modelsData.high_tier_default_model_project_id}`;
  }, [modelsData.high_tier_default_model_name, modelsData.high_tier_default_model_project_id]);

  const projectDefaultEmbeddingModel = useMemo(
    () => `${embeddingModelsData?.default_model_name}<<>>${embeddingModelsData?.default_model_project_id}`,
    [embeddingModelsData?.default_model_name, embeddingModelsData?.default_model_project_id],
  );

  const projectDefaultVectorStorageModel = useMemo(
    () => `${vectorStorageData?.default_model_name}<<>>${vectorStorageData?.default_model_project_id}`,
    [vectorStorageData?.default_model_name, vectorStorageData?.default_model_project_id],
  );

  const projectDefaultImageGenerationModel = useMemo(
    () => `${imageGenerationData?.default_model_name}<<>>${imageGenerationData?.default_model_project_id}`,
    [imageGenerationData?.default_model_name, imageGenerationData?.default_model_project_id],
  );

  // Handle changing default model
  const onChangeDefaultModel = useCallback(
    (section = 'llm') =>
      async value => {
        const [modelName, project_id] = value.split('<<>>');
        await setProjectDefaultModel({ projectId, name: modelName, target_project_id: +project_id, section })
          .unwrap()
          .catch(error => {
            // eslint-disable-next-line no-console
            console.error('Error setting default model:', error);
          });
      },
    [projectId, setProjectDefaultModel],
  );

  // Placeholder token for code examples

  return (
    <Box sx={styles.container}>
      <Box sx={styles.mainContainer}>
        <Tooltip
          title="Copy to clipboard"
          placement="top"
        >
          <IconButton
            onClick={handleCopyCardInformation}
            variant="elitea"
            color="secondary"
            sx={styles.copyButton}
          >
            <CopyIcon sx={styles.copyIcon} />
          </IconButton>
        </Tooltip>

        {/* Content Wrapper */}
        <Box sx={styles.contentWrapper}>
          <ProjectConfiguration
            userApiUrl={user.api_url}
            projectId={projectId}
            modelProjectId={model.project_id}
          />

          <ConfigurationsPanel
            configurationsBySections={configurationsBySections}
            configurationsLoading={configurationsLoading}
            projectDefaultModel={projectDefaultModel}
            projectLowTierDefaultModel={projectLowTierDefaultModel}
            projectHighTierDefaultModel={projectHighTierDefaultModel}
            projectDefaultEmbeddingModel={projectDefaultEmbeddingModel}
            projectDefaultVectorStorageModel={projectDefaultVectorStorageModel}
            projectDefaultImageGenerationModel={projectDefaultImageGenerationModel}
            modelOptions={modelOptions}
            lowTierModelOptions={lowTierModelOptions}
            highTierModelOptions={highTierModelOptions}
            embeddingModelOptions={embeddingModelOptions}
            vectorStorageOptions={vectorStorageOptions}
            imageGenerationOptions={imageGenerationOptions}
            onChangeDefaultModel={onChangeDefaultModel}
          />

          {!!modelCapabilities?.length && <ModelCapabilitiesSection capabilities={modelCapabilities} />}
        </Box>
      </Box>
    </Box>
  );
});

ModelConfiguration.displayName = 'ModelConfiguration';

/**@type {MuiSx} */
const getStyles = () => ({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mainContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  copyButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
  },
  copyIcon: {
    width: '1rem',
    height: '1rem',
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
    width: '100%',
  },
});

export default ModelConfiguration;
