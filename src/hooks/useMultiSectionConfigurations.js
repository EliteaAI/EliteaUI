import { useMemo } from 'react';

import { useGetConfigurationsListQuery } from '@/api/configurations.js';

/**
 * Custom hook to handle multiple configuration sections and get existing configurations
 * Includes both shared and project-specific configurations
 */
export const useMultiSectionConfigurations = (sections = [], projectId) => {
  // Get existing configurations (including shared) for each section
  const llmQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'llm',
      includeShared: true, // Include both shared and project-specific configurations
      pageSize: 50,
      sharedLimit: 50,
    },
    { skip: !sections.includes('llm') || !projectId },
  );

  const vectorStorageQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'vectorstorage',
      includeShared: true,
    },
    { skip: !sections.includes('vectorstorage') || !projectId },
  );

  const embeddingModelQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'embedding',
      includeShared: true,
    },
    { skip: !sections.includes('embedding') || !projectId },
  );
  // Fallback for backends that use `embedding_model` instead of `embedding`
  const embeddingAltQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'embedding_model',
      includeShared: true,
    },
    { skip: !sections.includes('embedding') || !projectId },
  );

  const aiCredentialsQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'ai_credentials',
      includeShared: true,
    },
    { skip: !sections.includes('ai_credentials') || !projectId },
  );
  // Fallback: some backends may surface AI creds under generic `credentials`
  const credentialsAltQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'credentials',
      includeShared: true,
    },
    { skip: !sections.includes('ai_credentials') || !projectId },
  );

  // Image generation models
  const imageGenerationQuery = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'image_generation',
      includeShared: true,
    },
    { skip: !sections.includes('image_generation') || !projectId },
  );

  // Combine results and loading states
  const combinedData = useMemo(() => {
    const locals = [];
    const shareds = [];

    const pushItems = (res, sectionName) => {
      if (res?.items) locals.push(...res.items.map(item => ({ ...item, section: sectionName })));
      if (res?.shared?.items)
        shareds.push(...res.shared.items.map(item => ({ ...item, section: sectionName, shared: true })));
    };

    // LLM models
    pushItems(llmQuery.data, 'llm');

    // Vector storages
    pushItems(vectorStorageQuery.data, 'vectorstorage');

    // Embedding models (primary and alias)
    pushItems(embeddingModelQuery.data, 'embedding');
    pushItems(embeddingAltQuery.data, 'embedding');

    // AI credentials (primary)
    pushItems(aiCredentialsQuery.data, 'ai_credentials');

    // Image generation models
    pushItems(imageGenerationQuery.data, 'image_generation');

    // AI credentials from generic credentials
    const aiTypes = new Set([
      'azure_open_ai',
      'azureopenai',
      'azure-openai',
      'azure_open_ai',
      'open_ai_azure',
      'open_ai',
      'openai',
      'vertex_ai',
      'vertexai',
      'hugging_face',
      'huggingface',
    ]);
    if (credentialsAltQuery.data?.items) {
      locals.push(
        ...credentialsAltQuery.data.items
          .filter(item => aiTypes.has(String(item.type).toLowerCase()))
          .map(item => ({ ...item, section: 'ai_credentials' })),
      );
    }
    if (credentialsAltQuery.data?.shared?.items) {
      shareds.push(
        ...credentialsAltQuery.data.shared.items
          .filter(item => aiTypes.has(String(item.type).toLowerCase()))
          .map(item => ({ ...item, section: 'ai_credentials', shared: true })),
      );
    }

    // Deduplicate within locals and within shareds separately
    const seenLocal = new Set();
    const seenShared = new Set();

    const makeKey = item =>
      [
        item.id || 'no-id',
        item.type || 'no-type',
        item.section || 'no-section',
        item.project_id || 'no-project',
      ].join('|');

    const uniqueLocals = locals.filter(item => {
      const key = makeKey(item);
      if (seenLocal.has(key)) return false;
      seenLocal.add(key);
      return true;
    });

    const uniqueShareds = shareds.filter(item => {
      const key = makeKey(item);
      if (seenShared.has(key)) return false;
      seenShared.add(key);
      return true;
    });

    // Return locals first, then shared to ensure both appear
    return [...uniqueLocals, ...uniqueShareds];
  }, [
    llmQuery.data,
    vectorStorageQuery.data,
    embeddingModelQuery.data,
    embeddingAltQuery.data,
    aiCredentialsQuery.data,
    credentialsAltQuery.data,
    imageGenerationQuery.data,
  ]);

  const isLoading =
    llmQuery.isLoading ||
    vectorStorageQuery.isLoading ||
    embeddingModelQuery.isLoading ||
    embeddingAltQuery.isLoading ||
    aiCredentialsQuery.isLoading ||
    credentialsAltQuery.isLoading ||
    imageGenerationQuery.isLoading;

  const error =
    llmQuery.error ||
    vectorStorageQuery.error ||
    embeddingModelQuery.error ||
    embeddingAltQuery.error ||
    aiCredentialsQuery.error ||
    credentialsAltQuery.error ||
    imageGenerationQuery.error;

  return {
    data: combinedData,
    isLoading,
    error,
    refetch: () => {
      if (sections.includes('llm')) llmQuery.refetch();
      if (sections.includes('vectorstorage')) vectorStorageQuery.refetch();
      if (sections.includes('embedding')) {
        embeddingModelQuery.refetch();
        embeddingAltQuery.refetch();
      }
      if (sections.includes('ai_credentials')) {
        aiCredentialsQuery.refetch();
        credentialsAltQuery.refetch();
      }
      if (sections.includes('image_generation')) imageGenerationQuery.refetch();
    },
  };
};
