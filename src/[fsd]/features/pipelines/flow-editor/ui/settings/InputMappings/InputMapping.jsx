import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { InputMappingItem } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/InputMappings';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { capitalizeFirstChar } from '@/common/utils';

const getValue = (key, values, mappingInfo, dataType) => {
  if (values[key]?.value !== undefined) {
    return values[key].value;
  } else if (mappingInfo[key]?.value !== undefined) {
    return mappingInfo[key].value;
  } else {
    return dataType === 'array' ? [] : '';
  }
};

const InputMapping = memo(props => {
  const {
    style,
    input_mapping,
    mappingInfo = {},
    defaultValues = {},
    values = {},
    onChangeMapping,
    requiredInputs = [],
    disabled,
  } = props;
  const inputOptions = useInputOptions();

  const renderMappingItem = useCallback(
    (key, keyPrefix) => {
      const mapping = input_mapping[key];
      const type = values[key]?.type || mappingInfo[key]?.type || mapping?.type;
      const enumList = FlowEditorHelpers.getEnumList(type, mappingInfo[key]?.enum, inputOptions);
      const dataType = mappingInfo[key]?.data_type || 'string';
      const value = getValue(key, values, mappingInfo, dataType);
      return (
        <InputMappingItem
          key={`${keyPrefix}-${key}`}
          title={mapping?.title}
          variableName={mapping?.title || capitalizeFirstChar(key.replaceAll('_', ' '))}
          variable={key}
          type={type}
          dataType={dataType}
          value={value}
          enumList={enumList}
          onChangeMapping={onChangeMapping}
          disabled={disabled}
          tooltip={mappingInfo[key]?.tooltip}
          defaultValues={defaultValues}
          mappingInfo={mappingInfo}
        />
      );
    },
    [input_mapping, values, mappingInfo, inputOptions, defaultValues, onChangeMapping, disabled],
  );

  const items = useMemo(() => {
    const keys = Object.keys(input_mapping || {});
    const requiredKeys = keys.filter(key => requiredInputs.includes(key));
    const optionalKeys = keys.filter(key => !requiredInputs.includes(key));
    const accordionItems = [];

    if (requiredKeys.length > 0) {
      accordionItems.push({
        title: `Input mapping (required ${requiredKeys.length})`,
        content: (
          <Box
            className="nowheel"
            sx={styles.requiredContent}
          >
            {requiredKeys.map(key => renderMappingItem(key, 'required'))}
          </Box>
        ),
        itemDefaultExpanded: true,
      });
    }

    if (optionalKeys.length > 0) {
      accordionItems.push({
        title: `Input mapping (optional ${optionalKeys.length})`,
        content: (
          <Box sx={styles.optionalContent}>{optionalKeys.map(key => renderMappingItem(key, 'optional'))}</Box>
        ),
        itemDefaultExpanded: false,
      });
    }

    return accordionItems;
  }, [input_mapping, requiredInputs, renderMappingItem]);

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      summarySX={styles.summary}
      titleSX={styles.title}
      accordionDetailsSX={styles.details}
      items={items}
    />
  );
});

InputMapping.displayName = 'InputMapping';

/** @type {MuiSx} */
const styles = {
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
  summary: ({ palette }) => ({
    background: palette.background.userInputBackground,
    borderRadius: '.5rem',
    minHeight: '2rem !important',
  }),
  title: {
    color: 'text.secondary',
  },
  details: {
    paddingLeft: '0rem',
    gap: '.5rem',
  },
  requiredContent: {
    maxHeight: '13.125rem',
    overflow: 'auto',
  },
  optionalContent: {
    overflow: 'auto',
  },
};

export default InputMapping;
