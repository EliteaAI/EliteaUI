import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import MultipleSelect from '@/components/MultipleSelect';

const ToolkitsSelect = memo(props => {
  const { id, label = 'Toolkits', disabled, onValueChange, allowApplications = false } = props;

  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);
  const { values } = useFormikContext();
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const toolkitOptions = useMemo(
    () =>
      (values?.version_details?.tools || [])
        .filter(tool => allowApplications || tool.type !== 'application')
        .map(tool => {
          const nameFromSchema = getToolkitNameFromSchema(tool);
          return {
            label: tool.toolkit_name || nameFromSchema,
            value: nameFromSchema,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allowApplications, getToolkitNameFromSchema, values?.version_details?.tools],
  );

  // Get selected toolkits from tool_names keys instead of selected_toolkits
  const selectedToolkits = useMemo(() => {
    const toolNames = yamlNode?.tool_names || {};
    return Object.keys(toolNames);
  }, [yamlNode?.tool_names]);

  const handleToolkitsChange = useCallback(
    newValue => {
      const currentToolNames = yamlNode?.tool_names || {};
      const updatedToolNames = {};

      newValue.forEach(toolkitName => {
        const toolkitObj = (values?.version_details?.tools || []).find(
          tk => (tk.toolkit_name || getToolkitNameFromSchema(tk)) === toolkitName,
        );
        const availableTools = (toolkitObj?.tools || toolkitObj?.settings?.selected_tools || []).map(tool =>
          typeof tool === 'string' ? tool : tool.name,
        );
        if (currentToolNames[toolkitName]) {
          updatedToolNames[toolkitName] = (currentToolNames[toolkitName] || []).filter(tool =>
            availableTools.includes(tool),
          );
        } else {
          updatedToolNames[toolkitName] = availableTools;
        }
      });

      FlowEditorHelpers.updateYamlNode(id, 'tool_names', updatedToolNames, yamlJsonObject, setYamlJsonObject);

      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [
      id,
      onValueChange,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode?.tool_names,
      values?.version_details?.tools,
      getToolkitNameFromSchema,
    ],
  );

  return (
    <MultipleSelect
      sx={{ marginBottom: '.5rem' }}
      emptyPlaceHolder=""
      label={label}
      value={selectedToolkits}
      onValueChange={handleToolkitsChange}
      options={toolkitOptions}
      disabled={disabled || !toolkitOptions?.length}
      showBorder
      className="nopan nodrag"
      labelSX={{
        left: '.75rem',
        '& .Mui-focused': {
          top: '-0.3125rem',
        },
      }}
      MenuProps={{
        PaperProps: { style: { marginTop: '.5rem' } },
      }}
      selectSX={{
        '& .MuiSelect-icon': {
          top: 'calc(50% - .6875rem) !important;',
        },
      }}
    />
  );
});

ToolkitsSelect.displayName = 'ToolkitsSelect';

export default ToolkitsSelect;
