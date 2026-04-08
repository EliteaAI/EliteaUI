import { useCallback, useEffect, useMemo, useState } from 'react';

import { ModelConfigurationHelpers } from '@/[fsd]/features/settings/lib/helpers';
import ShareIcon from '@/assets/share-icon.svg?react';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';

export const useModelConfiguration = ({ projectId, uniqueConfigurations }) => {
  const [model, setModel] = useState({
    configuration_uid: '',
    model_name: '',
    configuration_name: '',
    project_id: '',
    integration_name: '',
  });

  const [previousProjectId, setPreviousProjectId] = useState(projectId);

  // Reset model when project changes
  useEffect(() => {
    if (projectId && previousProjectId && previousProjectId !== projectId) {
      setModel({
        configuration_uid: '',
        model_name: '',
        configuration_name: '',
        project_id: '',
        integration_name: '',
      });
    }
    setPreviousProjectId(projectId);
  }, [projectId, previousProjectId]);

  // Find the selected model from configurations
  const selectedModelFromConfigurations = useMemo(() => {
    if (!model.model_name) {
      return uniqueConfigurations?.find(config => config.default) || uniqueConfigurations?.[0] || null;
    }

    let foundModel = uniqueConfigurations.find(
      config =>
        (config.name === model.model_name || config.id === model.model_name) &&
        config.project_id === model.project_id,
    );

    if (!foundModel && model.model_name) {
      foundModel = uniqueConfigurations.find(
        config => config.name === model.model_name || config.id === model.model_name,
      );
    }

    if (!foundModel && model.id) {
      foundModel = uniqueConfigurations.find(config => config.id === model.id || config.name === model.id);
    }

    if (foundModel && !foundModel.model_name) {
      return {
        ...foundModel,
        model_name: foundModel.name || foundModel.id,
      };
    }

    return foundModel;
  }, [model.model_name, model.id, model.project_id, uniqueConfigurations]);

  // Set initial default model
  useEffect(() => {
    if (!selectedModelFromConfigurations) return;

    if (!model.model_name) {
      setModel({
        configuration_uid: selectedModelFromConfigurations?.project_id || 'default',
        model_name: selectedModelFromConfigurations?.name || selectedModelFromConfigurations.id,
        configuration_name: `Project ${selectedModelFromConfigurations?.project_id || 'Default'}`,
        project_id: selectedModelFromConfigurations?.project_id,
        integration_name:
          selectedModelFromConfigurations?.integration_name ||
          selectedModelFromConfigurations?.provider ||
          'OpenAI',
        ...selectedModelFromConfigurations,
      });
    }
  }, [model.model_name, selectedModelFromConfigurations]);

  // Auto-select default model on initial load
  useEffect(() => {
    if (!uniqueConfigurations || uniqueConfigurations.length === 0 || !projectId) {
      return;
    }

    const hasAnyModelData = model.model_name || model.configuration_uid || model.integration_name;
    if (hasAnyModelData) {
      return;
    }

    let defaultModel = null;

    const defaultModelFromProject = uniqueConfigurations.find(
      m => m.default === true && m.project_id === projectId,
    );

    if (defaultModelFromProject) {
      defaultModel = defaultModelFromProject;
    } else {
      const projectModel =
        uniqueConfigurations.find(m => m.project_id === projectId) ||
        uniqueConfigurations.find(m => m.default === true) ||
        uniqueConfigurations[0];

      if (projectModel) {
        defaultModel = projectModel;
      }
    }

    if (defaultModel) {
      setModel({
        configuration_uid: defaultModel.project_id || 'default',
        model_name: defaultModel.name || defaultModel.id,
        configuration_name: `Project ${defaultModel.project_id || 'Default'}`,
        project_id: defaultModel.project_id,
        integration_name: defaultModel.integration_name || defaultModel.provider || 'OpenAI',
        ...defaultModel,
      });
    }
  }, [uniqueConfigurations, projectId, model.model_name, model.configuration_uid, model.integration_name]);

  const onChangeModel = useCallback(selectedModel => {
    const updatedModel = {
      configuration_uid: selectedModel.project_id || 'default',
      model_name: selectedModel.name || selectedModel.id,
      configuration_name: `Project ${selectedModel.project_id || 'Default'}`,
      project_id: selectedModel.project_id,
      integration_name: selectedModel.integration_name || selectedModel.provider || 'OpenAI',
      ...selectedModel,
    };

    setModel(updatedModel);
  }, []);

  return {
    model,
    selectedModelFromConfigurations,
    onChangeModel,
  };
};

export const useModelOptions = ({
  configurations,
  embeddingModelsData,
  vectorStorageData,
  imageGenerationData,
}) => {
  const uniqueConfigurations = useMemo(
    () => ModelConfigurationHelpers.removeDuplicateModels(configurations),
    [configurations],
  );

  const createOptions = useCallback(items => {
    return (
      ModelConfigurationHelpers.removeDuplicateModels(items || [])?.map(config => ({
        value: `${config.name}<<>>${config.project_id}`,
        label: config.display_name || config.name,
        icon:
          config.project_id !== PUBLIC_PROJECT_ID ? (
            <BriefcaseIcon
              key="person-icon"
              fontSize="14px"
            />
          ) : (
            <ShareIcon
              status={CollectionStatus.Published}
              key="briefcase-icon"
              fontSize="14px"
            />
          ),
      })) || []
    );
  }, []);

  const modelOptions = useMemo(
    () => createOptions(uniqueConfigurations),
    [uniqueConfigurations, createOptions],
  );

  const lowTierModelOptions = useMemo(
    () => createOptions(uniqueConfigurations?.filter(config => config.low_tier === true)),
    [uniqueConfigurations, createOptions],
  );

  const highTierModelOptions = useMemo(
    () => createOptions(uniqueConfigurations?.filter(config => config.high_tier === true)),
    [uniqueConfigurations, createOptions],
  );

  const embeddingModelOptions = useMemo(
    () => createOptions(embeddingModelsData?.items),
    [embeddingModelsData, createOptions],
  );

  const vectorStorageOptions = useMemo(
    () => createOptions(vectorStorageData?.items),
    [vectorStorageData, createOptions],
  );

  const imageGenerationOptions = useMemo(
    () => createOptions(imageGenerationData?.items),
    [imageGenerationData, createOptions],
  );

  return {
    uniqueConfigurations,
    modelOptions,
    lowTierModelOptions,
    highTierModelOptions,
    embeddingModelOptions,
    vectorStorageOptions,
    imageGenerationOptions,
  };
};

export const useCopyConfiguration = ({
  model,
  projectId,
  uniqueConfigurations,
  userApiUrl,
  configurationsBySections,
}) => {
  const handleCopyCardInformation = useCallback(async () => {
    try {
      const informationData = ModelConfigurationHelpers.buildConfigurationData({
        userApiUrl,
        projectId,
        model,
        configurationsBySections,
        uniqueConfigurations,
      });

      const jsonString = JSON.stringify(informationData, null, 2);
      await navigator.clipboard.writeText(jsonString);
    } catch {
      // Silent error handling
    }
  }, [model, projectId, uniqueConfigurations, userApiUrl, configurationsBySections]);

  return { handleCopyCardInformation };
};
