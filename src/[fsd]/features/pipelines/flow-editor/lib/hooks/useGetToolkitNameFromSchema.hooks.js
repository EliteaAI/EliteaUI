import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';

export const useGetToolkitNameFromSchema = () => {
  const schemaOfTools = useSelector(state => state.applications.toolkitSchemas || {});

  const getToolkitNameFromSchema = useCallback(
    toolkit => ToolkitsHelpers.genToolkitName(toolkit, schemaOfTools),
    [schemaOfTools],
  );

  const getToolkitNamePropFromSchema = useCallback(
    type => {
      const schema = schemaOfTools[type] || {};
      const [key] = Object.entries(schema.properties || {}).find(([, value]) => value.toolkit_name) || [];
      return key;
    },
    [schemaOfTools],
  );

  const getRequiredProperties = useCallback(
    type => {
      const schema = schemaOfTools[type] || {};
      return schema.required || [];
    },
    [schemaOfTools],
  );

  const getSelectedTools = useCallback(
    type => {
      const schema = schemaOfTools[type] || {};
      return Object.keys(schema.properties?.selected_tools?.args_schemas || {}) || [];
    },
    [schemaOfTools],
  );

  const isNameRequired = useCallback(
    type => {
      return schemaOfTools?.[type]?.name_required !== false;
    },
    [schemaOfTools],
  );

  return {
    getToolkitNameFromSchema,
    getToolkitNamePropFromSchema,
    getRequiredProperties,
    schemaOfTools,
    isNameRequired,
    getSelectedTools,
  };
};
