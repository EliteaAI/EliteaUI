import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import EntityIcon from '@/components/EntityIcon';
import { useGetToolkitIconMeta } from '@/hooks/application/useLibraryToolkits';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const ToolSelect = memo(props => {
  const {
    disabled,
    label = 'Toolkit',
    selectedToolkit,
    onSelectTool,
    filterTypes = () => {
      return true;
    },
  } = props;
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const getToolkitIconMeta = useGetToolkitIconMeta();

  const {
    values: { version_details },
  } = useFormikContext();

  const tools = useMemo(
    () =>
      (version_details?.tools || [])
        .filter(filterTypes)
        .map(tool => ({
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
              sx={styles.entityIcon}
              imageStyle={styles.imageStyle}
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
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [filterTypes, getToolkitIconMeta, getToolkitNameFromSchema, version_details?.tools],
  );

  const onChangeTool = useCallback(
    newValue => {
      onSelectTool?.(tools.find(tool => tool.value === newValue)?.originalTool);
    },
    [onSelectTool, tools],
  );

  const onClear = useCallback(() => {
    onSelectTool?.(null);
  }, [onSelectTool]);

  return (
    <SingleSelect
      showOptionIcon
      showBorder
      sx={styles.select}
      showEmptyPlaceholder={false}
      label={label}
      value={selectedToolkit}
      onValueChange={onChangeTool}
      onClear={onClear}
      options={tools}
      disabled={disabled || !tools?.length}
      menuItemIconSX={styles.menuItemIcon}
      className={'nopan nodrag'}
      maxDisplayValueLength={'100%'}
    />
  );
});

ToolSelect.displayName = 'ToolSelect';

const styles = {
  entityIcon: {
    minWidth: `1rem !important`,
    width: `1rem !important`,
    height: `1rem !important`,
    borderRadius: '0rem',
  },
  imageStyle: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
  },
  select: { marginBottom: '0rem' },
  menuItemIcon: {
    width: '0.875rem !important',
    height: '0.875rem !important',
    fontSize: '0.875rem !important',
    svg: {
      fontSize: '0.875rem !important',
    },
  },
};

export default ToolSelect;
