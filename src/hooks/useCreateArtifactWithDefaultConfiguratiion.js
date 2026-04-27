import { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { ATTACHMENT_ALLOWED_TOOLS } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useLazyListModelsQuery } from '@/api/configurations';
import { useToolkitCreateMutation } from '@/api/toolkits';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';

import { useSelectedProjectId } from './useSelectedProject';

export function useCreateArtifactWithDefaultConfiguration({ bucketName }) {
  const [createRequest, { data, error, isLoading, isError }] = useToolkitCreateMutation();
  const projectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);
  const [getModels] = useLazyListModelsQuery();
  const [defaultEmbeddingModel, setDefaultEmbeddingModel] = useState('');
  const [defaultVectorStorage, setDefaultVectorStorage] = useState(null);
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const schema = convertToolkitSchema(toolkitSchemas?.artifact || { properties: {} });

  useEffect(() => {
    const fetchDefaultConfigurations = async () => {
      try {
        const { data: embeddingData } = await getModels({
          projectId,
          include_shared: true,
          section: 'embedding',
        });
        setDefaultEmbeddingModel(embeddingData?.default_model_name || '');
        const { data: vectorData } = await getModels({
          projectId,
          include_shared: true,
          section: 'vectorstorage',
        });
        setDefaultVectorStorage({
          alita_title: vectorData?.default_model_name || '',
          private: vectorData?.default_model_project_id === personal_project_id, // Replace with actual personal project ID if available
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching default configurations:', err);
      }
    };
    fetchDefaultConfigurations();
  }, [getModels, personal_project_id, projectId]);

  const createArtifact = useCallback(async () => {
    try {
      return await createRequest({
        projectId,
        name: bucketName,
        settings: {
          pgvector_configuration: {
            ...(defaultVectorStorage || {}),
          },
          embedding_model: defaultEmbeddingModel,
          bucket: bucketName,
          selected_tools: (schema?.properties?.selected_tools?.items.enum || ATTACHMENT_ALLOWED_TOOLS).filter(
            tool => ATTACHMENT_ALLOWED_TOOLS.includes(tool),
          ),
        },
        type: 'artifact',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating artifact:', err);
      throw err;
    }
  }, [
    createRequest,
    projectId,
    defaultVectorStorage,
    defaultEmbeddingModel,
    bucketName,
    schema?.properties?.selected_tools?.items.enum,
  ]);

  return {
    createArtifact,
    data,
    error,
    isLoading,
    isError,
  };
}
