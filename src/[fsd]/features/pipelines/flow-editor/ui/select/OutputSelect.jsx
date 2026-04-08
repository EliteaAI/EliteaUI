import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';

const OutputSelect = memo(props => {
  const { id, label = 'Output', outputFieldName = 'output', disabled } = props;

  const { setYamlJsonObject, yamlJsonObject, isRunningPipeline } = useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const selectedValue = useMemo(
    () => (yamlNode ? yamlNode[outputFieldName] || [] : []),
    [outputFieldName, yamlNode],
  );
  const outputOptions = useInputOptions();

  const onChangeInput = useCallback(
    newValue => {
      FlowEditorHelpers.updateYamlNode(id, outputFieldName, newValue, yamlJsonObject, setYamlJsonObject);
    },
    [id, outputFieldName, setYamlJsonObject, yamlJsonObject],
  );

  const outputFromNode = useMemo(
    () => (yamlNode ? yamlNode[outputFieldName] || [] : []),
    [outputFieldName, yamlNode],
  );

  const realInputOptions = useMemo(() => {
    const optionsNotInState = outputFromNode
      .filter(item => !outputOptions.find(option => option.value === item))
      .map(item => ({
        label: item,
        value: item,
        canDelete: true,
        tooltip: 'Not in state',
      }));
    return [...optionsNotInState, ...outputOptions];
  }, [outputFromNode, outputOptions]);

  const onDeleteOption = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(
        id,
        outputFieldName,
        outputFromNode.filter(item => item !== value),
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, outputFieldName, outputFromNode, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <Select.SingleSelect
      label={label}
      value={selectedValue}
      onValueChange={onChangeInput}
      options={realInputOptions}
      disabled={disabled || isRunningPipeline}
      multiple
      showBorder
      className="nopan nodrag nowheel"
      onDeleteOption={onDeleteOption}
    />
  );
});

OutputSelect.displayName = 'OutputSelect';

export default OutputSelect;
