import { useMemo } from 'react';

import { useGetAvailableConfigurationsTypeQuery as getAvailableConfigurationsType } from '@/api/configurations.js';
import { useSelectedProject } from '@/hooks/useSelectedProject';

/**
 * Custom hook to fetch configurations from multiple sections
 * Makes separate API calls for each section and combines results
 * @param {string[]} sections - Array of section names to fetch
 * @returns {Object} Combined result with data, isLoading, and error states
 */
export const useGetMultiSectionConfigurations = (sections = []) => {
  // Not useSelectedProjectId: that yields '' for a user with no personal project, which
  // would strand the picker empty. Undefined here means no project is resolvable at all,
  // and an unscoped catalogue beats none — the reducer prunes it once a scoped one arrives.
  const projectId = useSelectedProject()?.id;

  // Make separate API calls for each section
  const sectionQueries = sections?.map(section =>
    getAvailableConfigurationsType(
      { section, project_id: projectId },
      {
        // Skip query if section is empty or invalid
        skip: !section || typeof section !== 'string',
      },
    ),
  );

  // Combine all results
  const combinedResult = useMemo(() => {
    // If no sections provided, return empty result
    if (!sections?.length) {
      return {
        data: [],
        isLoading: false,
        isFetching: false,
        error: null,
      };
    }

    const isLoading = sectionQueries?.some(query => query.isFetching);
    const error = sectionQueries?.find(query => query.error)?.error;

    // Combine all successful data results
    const allData = sectionQueries
      ?.filter(query => query.data && !query.error && Array.isArray(query.data))
      // filter out hidden items
      .flatMap(query => query.data.filter(item => !item.config_schema?.properties?.data?.metadata?.hidden));

    // Remove duplicates based on type
    const uniqueData = allData?.reduce((acc, current) => {
      const existing = acc.find(item => item.type === current.type);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    return {
      data: uniqueData || [],
      isLoading,
      isFetching: isLoading,
      error,
    };
  }, [sectionQueries, sections?.length]);

  return combinedResult;
};
