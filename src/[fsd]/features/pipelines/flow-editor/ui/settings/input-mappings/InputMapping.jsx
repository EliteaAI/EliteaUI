import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { NodeFieldInfoConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  InputMappingHelpers,
  NodeFieldInfoHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { InputMappingItem } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/input-mappings';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

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
    nodeType,
    valueTestIdPrefix,
    typeTestIdPrefix,
    requiredHeadingTestId,
    optionalHeadingTestId,
  } = props;
  const inputOptions = useInputOptions();

  const renderMappingItem = useCallback(
    (key, keyPrefix) => {
      const itemProps = InputMappingHelpers.getInputMappingItemProps(key, {
        inputMapping: input_mapping,
        values,
        mappingInfo,
        inputOptions,
        nodeType,
      });
      return (
        <InputMappingItem
          key={`${keyPrefix}-${key}`}
          {...itemProps}
          onChangeMapping={onChangeMapping}
          disabled={disabled}
          defaultValues={defaultValues}
          mappingInfo={mappingInfo}
          valueTestId={valueTestIdPrefix ? `${valueTestIdPrefix}-${key}` : undefined}
          typeTestId={typeTestIdPrefix ? `${typeTestIdPrefix}-${key}` : undefined}
        />
      );
    },
    [
      input_mapping,
      values,
      mappingInfo,
      inputOptions,
      nodeType,
      defaultValues,
      onChangeMapping,
      disabled,
      valueTestIdPrefix,
      typeTestIdPrefix,
    ],
  );

  const items = useMemo(() => {
    const inputMappingInfo = NodeFieldInfoHelpers.getNodeFieldInfo(
      nodeType,
      NodeFieldInfoConstants.NODE_FIELD_KEYS.inputMapping,
    );
    const withInfo = title =>
      inputMappingInfo ? (
        <Box
          component="span"
          sx={styles.titleRow}
        >
          {title}
          <InfoTooltip
            infoTooltip={inputMappingInfo}
            pinnable
          />
        </Box>
      ) : (
        title
      );
    const keys = Object.keys(input_mapping || {});
    const requiredKeys = keys.filter(key => requiredInputs.includes(key));
    const optionalKeys = keys.filter(key => !requiredInputs.includes(key));
    const accordionItems = [];

    if (requiredKeys.length > 0) {
      accordionItems.push({
        title: withInfo(`Input mapping (required ${requiredKeys.length})`),
        content: (
          <Box
            className="nowheel"
            sx={styles.requiredContent}
          >
            {requiredKeys.map(key => renderMappingItem(key, 'required'))}
          </Box>
        ),
        itemDefaultExpanded: true,
        testId: requiredHeadingTestId,
      });
    }

    if (optionalKeys.length > 0) {
      accordionItems.push({
        title: withInfo(`Input mapping (optional ${optionalKeys.length})`),
        content: (
          <Box sx={styles.optionalContent}>{optionalKeys.map(key => renderMappingItem(key, 'optional'))}</Box>
        ),
        itemDefaultExpanded: false,
        testId: optionalHeadingTestId,
      });
    }

    return accordionItems;
  }, [
    nodeType,
    input_mapping,
    requiredInputs,
    renderMappingItem,
    requiredHeadingTestId,
    optionalHeadingTestId,
  ]);

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
    background: `${palette.background.default.tertiary} !important`,
  }),
  summary: ({ palette }) => ({
    background: palette.background.surface.interactive.default,
    borderRadius: '.5rem',
    minHeight: '2rem !important',
  }),
  title: {
    color: 'text.secondary',
  },
  titleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.5rem',
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
