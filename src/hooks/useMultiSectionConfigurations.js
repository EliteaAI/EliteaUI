import { useMemo } from 'react';

import { useGetConfigurationsListQuery } from '@/api/configurations.js';

const AI_CREDENTIAL_TYPES = new Set([
  'azure_open_ai',
  'azureopenai',
  'azure-openai',
  'open_ai_azure',
  'open_ai',
  'openai',
  'vertex_ai',
  'vertexai',
  'hugging_face',
  'huggingface',
]);

/**
 * Custom hook to handle multiple configuration sections and get existing configurations
 * Includes both shared and project-specific configurations
 */
export const useMultiSectionConfigurations = (sections = [], projectId) => {
  const allSections = useMemo(() => {
    const result = [...sections];
    if (sections.includes('embedding') && !result.includes('embedding_model')) {
      result.push('embedding_model');
    }
    if (sections.includes('ai_credentials') && !result.includes('credentials')) {
      result.push('credentials');
    }
    return result;
  }, [sections]);

  const {
    data: queryData,
    isLoading,
    error,
    refetch,
  } = useGetConfigurationsListQuery(
    {
      projectId,
      section: allSections,
      includeShared: true,
      pageSize: 50,
      sharedLimit: 50,
    },
    { skip: !projectId || allSections.length === 0 },
  );

  const combinedData = useMemo(() => {
    if (!queryData) return [];

    const locals = [];
    const shareds = [];

    const normalizeSection = section => (section === 'embedding_model' ? 'embedding' : section);

    if (queryData.items) {
      for (const item of queryData.items) {
        const section = normalizeSection(item.section);
        if (section === 'credentials') {
          if (AI_CREDENTIAL_TYPES.has(String(item.type).toLowerCase())) {
            locals.push({ ...item, section: 'ai_credentials' });
          }
        } else {
          locals.push({ ...item, section });
        }
      }
    }

    if (queryData.shared?.items) {
      for (const item of queryData.shared.items) {
        const section = normalizeSection(item.section);
        if (section === 'credentials') {
          if (AI_CREDENTIAL_TYPES.has(String(item.type).toLowerCase())) {
            shareds.push({ ...item, section: 'ai_credentials', shared: true });
          }
        } else {
          shareds.push({ ...item, section, shared: true });
        }
      }
    }

    const seen = new Set();
    const makeKey = item =>
      [
        item.id || 'no-id',
        item.type || 'no-type',
        item.section || 'no-section',
        item.project_id || 'no-project',
      ].join('|');

    return [...locals, ...shareds].filter(item => {
      const key = makeKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [queryData]);

  return {
    data: combinedData,
    isLoading,
    error,
    refetch,
  };
};
