import { useCallback, useMemo } from 'react';

import { useTheme } from '@mui/material';

import { useGetCurrentMCPSchemas, useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';
import { useToolkitAssociateMutation, useToolkitsListQuery } from '@/api/toolkits.js';
import { PAGE_SIZE_TOOLKITS_DROPDOWN_LIST } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { buildErrorMessage } from '@/common/utils';
import usePageQuery from '@/hooks/usePageQuery';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import useToast from '@/hooks/useToast';

import { useSetRefetchDetails } from './useRefetchAgentDetails';

export const useAssociateToolkit = ({ applicationId, versionId, onSelectToolkit, formik, entityType }) => {
  const [associateToolkit, { isLoading: isAssociating, isError: isAssociateError, error: associateError }] =
    useToolkitAssociateMutation();
  const { toastSuccess, toastError } = useToast();
  const projectId = useSelectedProjectId();
  const { setRefetch } = useSetRefetchDetails();

  // Handle toolkit association with application
  const handleAssociateToolkit = useCallback(
    async (toolkit, mcp) => {
      if (!applicationId || !versionId) {
        toastError('Application ID and Version ID are required to associate toolkit');
        return;
      }
      try {
        const result = await associateToolkit({
          projectId,
          toolkitId: toolkit.id,
          entity_version_id: versionId,
          entity_id: applicationId,
          entity_type: 'agent',
          has_relation: true,
          toolkitName: toolkit.toolkit_name || toolkit.name || toolkit.type || 'New Toolkit',
          toolkitType: toolkit.type || 'custom',
          toolkitDescription: toolkit.description || '',
          toolkitSettings: toolkit.settings || {},
        }).unwrap();
        if (!result.error) {
          if (formik?.dirty) {
            if (
              !formik?.values?.version_details.tools.find(
                tool => tool.id === toolkit.id && tool.type === toolkit.type,
              )
            ) {
              // Create a new tool object for the associated toolkit
              const newTool = {
                id: toolkit.id,
                type: toolkit.type || 'custom',
                name: toolkit.name || toolkit.toolkit_name || toolkit.type || 'New Toolkit',
                description: toolkit.description || '',
                settings: {
                  ...(toolkit.settings || {}),
                  available_tools: toolkit.settings?.selected_tools || [],
                },
                toolkit_name: toolkit.toolkit_name || toolkit.name || 'New Toolkit',
                online: toolkit.online,
                meta: {
                  mcp,
                },
                author: toolkit.author || {},
                author_id: toolkit.author?.id,
              };
              formik?.setFieldValue(`version_details.tools`, [
                ...(formik?.values?.version_details?.tools || []),
                newTool,
              ]);
            }
          } else {
            formik?.resetForm({
              values: {
                ...(formik?.values || {}),
                version_details: {
                  ...(formik?.values?.version_details || {}),
                  tools: [
                    ...(formik?.values?.version_details?.tools || []),
                    {
                      id: toolkit.id,
                      type: toolkit.type || 'custom',
                      name: toolkit.name || toolkit.toolkit_name || toolkit.type || 'New Toolkit',
                      description: toolkit.description || '',
                      settings: {
                        ...(toolkit.settings || {}),
                        available_tools: toolkit.settings?.selected_tools || [],
                      },
                      toolkit_name: toolkit.toolkit_name || toolkit.name || 'New Toolkit',
                      online: toolkit.online,
                      meta: {
                        mcp,
                      },
                      author: toolkit.author || {},
                      author_id: toolkit.author?.id,
                    },
                  ],
                },
              },
            });
            setRefetch();
          }
          // Enhanced context-aware success message
          toastSuccess(`The toolkit has been successfully added to the ${entityType}.`);
          // Call the original onSelectToolkit callback if provided
          onSelectToolkit?.(toolkit);
        }

        return result;
      } catch (err) {
        toastError(buildErrorMessage(err));
      }
    },
    [
      applicationId,
      versionId,
      toastError,
      associateToolkit,
      projectId,
      formik,
      toastSuccess,
      entityType,
      onSelectToolkit,
      setRefetch,
    ],
  );

  return {
    handleAssociateToolkit,
    isAssociating,
    isAssociateError,
    associateError,
    setRefetch,
  };
};

/**
 * Custom hook to load available toolkits from the library for selection
 */
export const useLibraryToolkits = (onSelectToolkit = () => {}, applicationId, versionId, formik, isMCP) => {
  const projectId = useSelectedProjectId();
  const theme = useTheme();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas({ skip: isMCP });
  const { mcpSchemas } = useGetCurrentMCPSchemas({ isMCP });
  const realToolkitSchemas = useMemo(
    () => (isMCP ? mcpSchemas : toolkitSchemas),
    [isMCP, mcpSchemas, toolkitSchemas],
  );

  // Get application details to determine if it's an agent or pipeline
  const { data: applicationDetails } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId },
  );

  // Determine entity type for context-aware messaging
  const entityType = applicationDetails?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent';

  const { query, page, setPage } = usePageQuery();
  const { sort_by, sort_order } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'asc',
    defaultSortBy: 'name',
  });

  const {
    data: libraryToolkits,
    error: libraryError,
    isError: isLibraryError,
    isLoading: isLibraryLoading,
    isFetching: isLibraryFetching,
    refetch: refetchLibraryToolkits,
  } = useToolkitsListQuery(
    {
      projectId,
      page,
      page_size: PAGE_SIZE_TOOLKITS_DROPDOWN_LIST,
      params: {
        query,
        sort_by,
        sort_order,
        mcp: isMCP,
      },
    },
    {
      skip: !projectId,
    },
  );

  const onLoadMoreToolkits = useCallback(() => {
    if (!isLibraryFetching && (page + 1) * PAGE_SIZE_TOOLKITS_DROPDOWN_LIST < (libraryToolkits?.total || 0)) {
      setPage(page + 1);
    }
  }, [isLibraryFetching, page, libraryToolkits?.total, setPage]);

  // Handle toolkit association with application
  const { handleAssociateToolkit, isAssociating, isAssociateError, associateError } = useAssociateToolkit({
    applicationId,
    versionId,
    onSelectToolkit,
    formik,
    entityType,
  });
  // Transform toolkit data for menu display
  const menuItems = useMemo(() => {
    if (!libraryToolkits?.rows || !realToolkitSchemas || isLibraryLoading) {
      return [];
    }

    return (
      libraryToolkits?.rows.map(toolkit => {
        const typeInfo = realToolkitSchemas[toolkit.type];
        const iconComponent = getToolIconByType(toolkit.type, theme, { toolSchema: typeInfo, isMCP });

        return {
          key: `library-toolkit-${toolkit.id}`,
          label: toolkit.toolkit_name || toolkit.name || toolkit.type,
          description: toolkit.description,
          type: toolkit.type,
          toolkitId: toolkit.id,
          online: toolkit.online,
          icon: iconComponent,
          onClick: () => {
            // Handle toolkit association with application
            handleAssociateToolkit(toolkit, isMCP);
          },
        };
      }) || []
    );
  }, [libraryToolkits?.rows, realToolkitSchemas, isLibraryLoading, theme, isMCP, handleAssociateToolkit]);

  return {
    menuItems,
    isLoading: isLibraryLoading,
    isFetching: isLibraryFetching,
    isError: isLibraryError,
    error: libraryError,
    refetch: refetchLibraryToolkits,
    onLoadMoreToolkits,
    rawData: libraryToolkits,
    // Association states
    isAssociating,
    isAssociateError,
    associateError,
    // Association function
    handleAssociateToolkit,
  };
};

export const useGetToolkitIconMeta = () => {
  const theme = useTheme();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  const getToolkitIconMeta = useCallback(
    (toolkit, isMCP) => {
      if (toolkit?.icon_meta) {
        // If the toolkit has a custom icon, return it directly
        return toolkit.icon_meta;
      }
      const toolkitType =
        toolkit.type === 'application' && toolkit.agent_type === 'pipeline'
          ? 'pipeline'
          : toolkit?.type || 'custom';
      // Get icon component based on toolkit type
      return {
        component: getToolIconByType(toolkitType, theme, {
          toolSchema: toolkitSchemas?.[toolkitType],
          isMCP,
        }),
      };
    },
    [theme, toolkitSchemas],
  );

  return getToolkitIconMeta;
};
