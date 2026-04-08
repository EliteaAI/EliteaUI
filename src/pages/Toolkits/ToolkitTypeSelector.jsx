import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';

import { Link, Typography } from '@mui/material';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Category } from '@/[fsd]/shared/ui';
import { useLazyListModelsQuery } from '@/api/configurations';
import getToolInitialValueBySchema from '@/common/getToolInitialValueBySchema.js';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { getDefaultTools } from '@/common/toolkitUtils';
import useToolMenuItems from '@/hooks/application/useToolMenuItems';
import { useToolkitSearch } from '@/hooks/toolkit/useToolkitSearch';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ToolInitialValues } from '@/pages/Applications/Components/Tools/consts';

const predefinedTools = ['custom'];

const ToolkitTypeSelector = memo(
  ({ onSelectTool, setFormikInitialValues, isMCP, isApplication, disableNavigation = false }) => {
    const [getModels] = useLazyListModelsQuery();
    const projectId = useSelectedProjectId();
    const { personal_project_id } = useSelector(state => state.user);

    const { isNameRequired, getRequiredProperties } = useGetToolkitNameFromSchema();

    const onAddTool = useCallback(
      (toolType, toolSchemas) => () => {
        const nameIsRequired = isNameRequired(toolType);
        const descriptionIsRequired = getRequiredProperties(toolType)?.includes('description');
        const schema = convertToolkitSchema(toolSchemas[toolType] || { properties: {} });
        let defaultVectorStorage = {};
        let defaultEmbeddingModel = '';
        let defaultImageGenerationModel = '';
        const hasVectorStorage = Object.keys(schema?.properties || {}).find(
          key => key === 'pgvector_configuration',
        );
        const hasEmbeddingModel = Object.keys(schema?.properties || {}).find(
          key => schema?.properties[key]?.type === 'embedding_model',
        );
        const hasImageGenerationModel = Object.keys(schema?.properties || {}).find(
          key => schema?.properties[key]?.type === 'image_generation_model',
        );
        const shouldLoadingConfigurations = hasVectorStorage || hasEmbeddingModel || hasImageGenerationModel;
        if (shouldLoadingConfigurations) {
          const getDefaultValues = async () => {
            if (hasVectorStorage) {
              const { data } = await getModels({
                projectId,
                include_shared: true,
                section: 'vectorstorage',
              });
              defaultVectorStorage = {
                elitea_title: data?.default_model_name || '',
                private: data?.default_model_project_id === personal_project_id,
              };
            }
            if (hasEmbeddingModel) {
              const { data } = await getModels({
                projectId,
                include_shared: true,
                section: 'embedding',
              });
              defaultEmbeddingModel = data?.default_model_name || '';
            }
            if (hasImageGenerationModel) {
              const { data } = await getModels({
                projectId,
                include_shared: true,
                section: 'image_generation',
              });
              defaultImageGenerationModel = data?.default_model_name || '';
            }

            const initialValues =
              getToolInitialValueBySchema(
                schema,
                defaultVectorStorage,
                defaultEmbeddingModel,
                defaultImageGenerationModel,
              ) ||
              ToolInitialValues[toolType] ||
              {};
            onSelectTool(prev => ({
              ...(prev || {}),
              settings: {
                ...(prev?.settings || {}),
                ...initialValues?.settings,
              },
              isLoadingConfigurations: undefined,
            }));
            setFormikInitialValues(prev => ({
              ...prev,
              settings: {
                ...(prev?.settings || {}),
                ...initialValues?.settings,
              },
            }));
          };
          getDefaultValues();
        }
        const initialValues = predefinedTools.includes(toolType)
          ? ToolInitialValues[toolType]
          : getToolInitialValueBySchema(
              schema,
              defaultVectorStorage,
              defaultEmbeddingModel,
              defaultImageGenerationModel,
            ) ||
            ToolInitialValues[toolType] ||
            {};
        onSelectTool({
          ...initialValues,
          settings: {
            ...(initialValues.settings || {}),
            selected_tools: getDefaultTools(schema?.properties?.selected_tools),
          },
          type: toolType,
          schema: { required: [''], ...schema },
          meta: schema?.metadata || {},
          isLoadingConfigurations: shouldLoadingConfigurations || undefined,
        });
        setFormikInitialValues({
          settings: {
            ...(initialValues.settings || {}),
            selected_tools: getDefaultTools(schema?.properties?.selected_tools),
          },
          ...(nameIsRequired ? { name: '' } : null),
          ...(descriptionIsRequired ? { description: '' } : null),
          type: toolType,
          meta: schema?.metadata || {},
        });
      },
      [
        isNameRequired,
        getRequiredProperties,
        onSelectTool,
        setFormikInitialValues,
        getModels,
        projectId,
        personal_project_id,
      ],
    );

    const { toolMenuItems, isFetchingToolkitTypes } = useToolMenuItems({ onAddTool, isMCP, isApplication });
    const searchProps = useToolkitSearch({ toolMenuItems, isMCP, isApplication, disableNavigation });

    const renderCategory = useCallback(
      (category, items) => (
        <Category.CategorySection
          category={category}
          items={items || []}
          EmptyPlaceholder={
            isMCP ? (
              <Typography
                variant="bodyMedium"
                color="text.primary"
              >
                {'Still no local MCP available. Follow creation guides in our '}
                <Link
                  href="https://elitea.ai/docs/integrations/mcp/create-and-use-client-stdio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={getStyles().link}
                >
                  Documentation
                </Link>
                {'.'}
              </Typography>
            ) : undefined
          }
        />
      ),
      [isMCP],
    );

    const renderNoResults = useCallback(
      (title, description) => (
        <Category.NoResultsMessage
          title={title}
          description={description}
        />
      ),
      [],
    );

    return (
      <>
        <Category.GroupedCategory
          title={`Choose the ${isApplication ? 'application' : isMCP ? 'MCP' : 'toolkit'} type`}
          searchPlaceholder={
            isApplication ? 'Search applications' : !isMCP ? 'Search toolkits' : 'Search MCPs'
          }
          noResultsTitle={`No ${isApplication ? 'applications' : isMCP ? 'MCPs' : 'toolkits'} found`}
          noResultsDescription="Try adjusting your search terms"
          isLoading={isFetchingToolkitTypes}
          allowEmptyCategory={isMCP}
          renderCategory={renderCategory}
          renderNoResults={renderNoResults}
          {...searchProps}
        />
      </>
    );
  },
);
/** @type {MuiSx} */
const getStyles = () => ({
  link: {
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
});

ToolkitTypeSelector.displayName = 'ToolkitTypeSelector';

export default ToolkitTypeSelector;
