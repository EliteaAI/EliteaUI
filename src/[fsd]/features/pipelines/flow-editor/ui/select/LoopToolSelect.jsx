import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import EntityIcon from '@/components/EntityIcon';
import { useGetToolkitIconMeta } from '@/hooks/application/useLibraryToolkits';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts.js';

const LoopToolSelect = memo(props => {
  const {
    yamlNode,
    disabled,
    label = 'Toolkit',
    toolkitField = 'toolkit_name',
    toolField = 'tool',
    onChangeToolkit = () => {},
    onChangeTool = () => {},
  } = props;
  const {
    values: { version_details },
  } = useFormikContext();
  const selectedTool = useMemo(() => (yamlNode ? yamlNode[toolField] : ''), [toolField, yamlNode]);
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const getToolkitIconMeta = useGetToolkitIconMeta();
  const projectId = useSelectedProjectId();

  const toolkits = useMemo(
    () =>
      (version_details?.tools || []).map(tool => ({
        label:
          tool.type === ToolTypes.application.value
            ? tool.name
            : tool.toolkit_name || getToolkitNameFromSchema(tool),
        value:
          tool.type === ToolTypes.application.value
            ? tool.name
            : tool.toolkit_name || getToolkitNameFromSchema(tool),
        icon: (
          <EntityIcon
            sx={{
              minWidth: `1rem !important`,
              width: `1rem !important`,
              height: `1rem !important`,
              borderRadius: '0rem',
            }}
            imageStyle={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
            }}
            showBackgroundColor={false}
            icon={getToolkitIconMeta(tool, tool.meta?.mcp)}
            entityType={
              tool.type === ToolTypes.application.value
                ? tool.agent_type === 'pipeline'
                  ? 'pipeline'
                  : 'application'
                : 'toolkit'
            }
            projectId=""
            editable={false}
          />
        ),
        originalTool: tool,
      })),
    [getToolkitIconMeta, getToolkitNameFromSchema, version_details?.tools],
  );

  const toolkit = useMemo(() => {
    return yamlNode && (yamlNode[toolkitField] || yamlNode[toolField] || yamlNode.id);
  }, [yamlNode, toolField, toolkitField]);

  const selectedToolkit = useMemo(() => {
    return (version_details?.tools || []).find(
      tool =>
        tool.toolkit_name === toolkit || tool.name === toolkit || toolkit === getToolkitNameFromSchema(tool),
    );
  }, [getToolkitNameFromSchema, toolkit, version_details?.tools]);

  const shouldFetchDynamicTools = useMemo(() => {
    const explicitSelected = selectedToolkit?.settings?.selected_tools;
    const hasExplicitSelection = Array.isArray(explicitSelected) && explicitSelected.length > 0;
    if (hasExplicitSelection) return false;
    if (!projectId) return false;
    if (!selectedToolkit?.id) return false;
    return true;
  }, [projectId, selectedToolkit?.id, selectedToolkit?.settings?.selected_tools]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId: selectedToolkit?.id },
    { skip: !shouldFetchDynamicTools },
  );

  const dynamicToolNames = useMemo(() => {
    const tools = toolkitAvailableToolsData?.tools || [];
    return tools.map(t => t?.name).filter(name => typeof name === 'string' && name.trim());
  }, [toolkitAvailableToolsData?.tools]);

  const functionOptions = useMemo(() => {
    const explicitSelected = selectedToolkit?.settings?.selected_tools;
    const hasExplicitSelection = Array.isArray(explicitSelected) && explicitSelected.length > 0;
    const enabledTools = hasExplicitSelection ? explicitSelected : dynamicToolNames;

    return (enabledTools || []).map(item => ({
      label: FlowEditorHelpers.getToolName(item),
      value: FlowEditorHelpers.getToolName(item),
    }));
  }, [dynamicToolNames, selectedToolkit?.settings?.selected_tools]);

  const onClear = useCallback(() => {
    onChangeToolkit?.(null);
  }, [onChangeToolkit]);

  return (
    <>
      <SingleSelect
        showBorder
        showOptionIcon
        sx={{ marginBottom: '0rem' }}
        showEmptyPlaceholder={false}
        label={label}
        value={toolkit}
        onValueChange={onChangeToolkit}
        onClear={onClear}
        options={toolkits}
        disabled={disabled || toolkits.length === 0}
        menuItemIconSX={{
          width: '.875rem !important',
          height: '.875rem !important',
          fontSize: '.875rem !important',
          svg: {
            fontSize: '.875rem !important',
          },
        }}
        className="nopan nodrag"
        maxDisplayValueLength="100%"
      />
      {functionOptions.length > 0 && (
        <SingleSelect
          sx={{ marginBottom: '0rem' }}
          label={toolField === 'tool' ? 'Tool' : 'Loop tool'}
          value={selectedTool}
          onValueChange={onChangeTool}
          options={functionOptions}
          disabled={disabled}
          showBorder
          className="nopan nodrag"
        />
      )}
    </>
  );
});

LoopToolSelect.displayName = 'LoopToolSelect';

export default LoopToolSelect;
