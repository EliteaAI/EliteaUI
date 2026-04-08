import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';

const InputSelect = memo(props => {
  const { id, label = 'Input', inputFieldName = 'input', disabled } = props;

  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const inputOptions = useInputOptions();

  const onChangeInput = useCallback(
    newValue => {
      FlowEditorHelpers.updateYamlNode(id, inputFieldName, newValue, yamlJsonObject, setYamlJsonObject);
    },
    [id, inputFieldName, setYamlJsonObject, yamlJsonObject],
  );

  const inputFromNode = useMemo(
    () => (yamlNode ? yamlNode[inputFieldName] || [] : []),
    [inputFieldName, yamlNode],
  );

  const realInputOptions = useMemo(() => {
    const optionsNotInState = inputFromNode
      .filter(item => !inputOptions.find(option => option.value === item))
      .map(item => ({
        label: item,
        value: item,
        canDelete: true,
      }));
    return [...optionsNotInState, ...inputOptions];
  }, [inputFromNode, inputOptions]);

  const onDeleteOption = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(
        id,
        inputFieldName,
        inputFromNode.filter(item => item !== value),
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, inputFieldName, inputFromNode, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <Select.SingleSelect
      label={label}
      value={inputFromNode}
      onValueChange={onChangeInput}
      options={realInputOptions}
      disabled={disabled}
      multiple
      showBorder
      className="nopan nodrag nowheel"
      onDeleteOption={onDeleteOption}
    />
  );
});

InputSelect.displayName = 'InputSelect';

export default InputSelect;
