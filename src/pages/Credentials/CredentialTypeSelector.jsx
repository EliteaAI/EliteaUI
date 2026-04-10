import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Category } from '@/[fsd]/shared/ui';
import getToolInitialValueBySchema from '@/common/getToolInitialValueBySchema.js';
import { getToolIconByType } from '@/common/toolkitUtils';
import { useCredentialSearch } from '@/hooks/credentials/useCredentialSearch';
import { useTheme } from '@emotion/react';

const CredentialTypeSelector = memo(
  ({ onSelectTool, configurationsData, isFetching, typeSelectorTitle, searchPlaceholder, showCategory }) => {
    const theme = useTheme();
    const { resetForm } = useFormikContext();

    const onAddTool = useCallback(
      selectedTool => () => {
        const toolType = selectedTool?.type;
        const schema = selectedTool?.config_schema;
        const initialValue = getToolInitialValueBySchema(schema);

        onSelectTool({
          ...initialValue,
          type: toolType,
          schema: { required: [], ...schema },
          section: selectedTool?.section,
          has_test_connection: selectedTool?.has_test_connection,
          check_connection_label: selectedTool?.check_connection_label,
        });

        resetForm();
      },
      [onSelectTool, resetForm],
    );

    const credentialsMenuItems = useMemo(() => {
      if (!isFetching && configurationsData) {
        // Filter out hidden items
        const configurationsAsSchemaFiltered = configurationsData?.filter(
          item => !item?.config_schema?.metadata?.hidden,
        );

        return configurationsAsSchemaFiltered
          ?.map(item => {
            const key = item?.type;
            const label = item?.config_schema?.metadata?.label || item?.config_schema?.title || item?.type;
            return {
              key,
              label,
              icon: getToolIconByType(key, theme, { toolSchema: item.config_schema.properties.data }),
              onClick: onAddTool(item),
              section: item?.section,
              category: item?.config_schema?.properties?.data.metadata?.categories?.[0] || 'Other',
            };
          })
          .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
      }
      return [];
    }, [theme, onAddTool, configurationsData, isFetching]);

    const searchProps = useCredentialSearch({ credentialsMenuItems });

    const renderCategory = useCallback(
      (category, items) => (
        <Category.CategorySection
          category={category}
          items={items}
          showCategory={showCategory}
        />
      ),
      [showCategory],
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
          title={typeSelectorTitle || 'Choose the credentials type'}
          searchPlaceholder={searchPlaceholder || 'Search credentials'}
          noResultsTitle="No credentials found"
          noResultsDescription="Try adjusting your search terms or category filters"
          isLoading={isFetching}
          renderCategory={renderCategory}
          renderNoResults={renderNoResults}
          {...searchProps}
        />
      </>
    );
  },
);

CredentialTypeSelector.displayName = 'CredentialTypeSelector';

export default CredentialTypeSelector;
