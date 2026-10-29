import { memo } from 'react';

import { InputMappingHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { InputMappingItem } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/input-mappings';

// The same items InputMapping shows in its accordion, for a chosen set of keys and without the accordion
const InputMappingFields = memo(props => {
  const {
    keys = [],
    input_mapping = {},
    mappingInfo = {},
    defaultValues = {},
    values = {},
    onChangeMapping,
    disabled,
    nodeType,
    valueTestIdPrefix,
    typeTestIdPrefix,
  } = props;
  const inputOptions = useInputOptions();

  return keys
    .filter(key => key in input_mapping)
    .map(key => (
      <InputMappingItem
        key={key}
        {...InputMappingHelpers.getInputMappingItemProps(key, {
          inputMapping: input_mapping,
          values,
          mappingInfo,
          inputOptions,
          nodeType,
        })}
        onChangeMapping={onChangeMapping}
        disabled={disabled}
        defaultValues={defaultValues}
        mappingInfo={mappingInfo}
        valueTestId={valueTestIdPrefix ? `${valueTestIdPrefix}-${key}` : undefined}
        typeTestId={typeTestIdPrefix ? `${typeTestIdPrefix}-${key}` : undefined}
      />
    ));
});

InputMappingFields.displayName = 'InputMappingFields';

export default InputMappingFields;
