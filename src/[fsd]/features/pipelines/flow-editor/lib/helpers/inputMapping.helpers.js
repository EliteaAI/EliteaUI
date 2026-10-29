import { capitalizeFirstChar } from '@/common/utils';

import { getEnumList } from './flowEditor.helpers';
import { getInputMappingFieldInfo } from './nodeFieldInfo.helpers';

const getMappingValue = (key, values, mappingInfo, dataType) => {
  if (values[key]?.value !== undefined) {
    return values[key].value;
  } else if (mappingInfo[key]?.value !== undefined) {
    return mappingInfo[key].value;
  } else {
    return dataType === 'array' ? [] : '';
  }
};

// Props of one InputMappingItem, shared by the accordion (InputMapping) and the panel fields (InputMappingFields)
export const getInputMappingItemProps = (
  key,
  { inputMapping = {}, values = {}, mappingInfo = {}, inputOptions, nodeType },
) => {
  const mapping = inputMapping[key];
  const type = values[key]?.type || mappingInfo[key]?.type || mapping?.type;
  const dataType = mappingInfo[key]?.data_type || 'string';
  return {
    title: mapping?.title,
    variableName: mapping?.title || capitalizeFirstChar(key.replaceAll('_', ' ')),
    variable: key,
    type,
    dataType,
    value: getMappingValue(key, values, mappingInfo, dataType),
    enumList: getEnumList(type, mappingInfo[key]?.enum, inputOptions),
    tooltip: getInputMappingFieldInfo(nodeType, key, mappingInfo[key]?.tooltip),
  };
};
