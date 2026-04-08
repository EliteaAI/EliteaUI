import { useMemo } from 'react';

import { useFormikContext } from 'formik';

/**
 * Custom hook to filter out already-added items from dropdown menus
 * This prevents duplicates by excluding items that are already associated with the application
 */
export const useFilterAddedItems = () => {
  const { values } = useFormikContext();

  // Get current tools from application
  const currentTools = useMemo(() => values?.version_details?.tools || [], [values?.version_details?.tools]);

  // Extract IDs of already-added toolkits
  const addedToolkitIds = useMemo(() => {
    return new Set(
      currentTools
        .filter(tool => tool.type !== 'agent' && tool.type !== 'pipeline') // Only regular toolkits
        .map(tool => tool.id)
        .filter(id => id), // Filter out undefined/null IDs
    );
  }, [currentTools]);

  // Extract IDs of already-added agents
  const addedAgentIds = useMemo(() => {
    return new Set(
      currentTools
        .filter(tool => tool.type === 'application') // Agents/pipelines use type 'application'
        .map(tool => tool.settings?.application_id)
        .filter(id => id), // Filter out undefined/null IDs
    );
  }, [currentTools]);

  // Extract IDs of already-added pipelines (same as agents since they both use type 'application')
  const addedPipelineIds = useMemo(() => {
    return new Set(
      currentTools
        .filter(tool => tool.type === 'application') // Agents/pipelines use type 'application'
        .map(tool => tool.settings?.application_id)
        .filter(id => id), // Filter out undefined/null IDs
    );
  }, [currentTools]);

  // Function to filter toolkit menu items
  const filterToolkits = useMemo(() => {
    return toolkits => {
      if (!toolkits) return [];
      return toolkits.filter(toolkit => !addedToolkitIds.has(toolkit.toolkitId));
    };
  }, [addedToolkitIds]);

  // Function to filter agent menu items
  const filterAgents = useMemo(() => {
    return agents => {
      if (!agents) return [];
      return agents.filter(agent => !addedAgentIds.has(agent.data?.id));
    };
  }, [addedAgentIds]);

  // Function to filter pipeline menu items
  const filterPipelines = useMemo(() => {
    return pipelines => {
      if (!pipelines) return [];
      return pipelines.filter(pipeline => !addedPipelineIds.has(pipeline.data?.id));
    };
  }, [addedPipelineIds]);

  return {
    filterToolkits,
    filterAgents,
    filterPipelines,
    addedToolkitIds,
    addedAgentIds,
    addedPipelineIds,
    currentTools,
  };
};
