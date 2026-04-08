import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorSettings } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { capitalizeFirstChar } from '@/common/utils.jsx';
import { useTheme } from '@emotion/react';

const variableSourceOptions = [
  {
    label: 'State',
    value: 'state',
  },
  {
    label: 'Tool',
    value: 'tool',
  },
];

const VariablesMappingItem = memo(props => {
  const { fieldLabel, fieldName, fieldValue, onChangeMapping, disabled } = props;
  const inputOptions = useInputOptions();
  const theme = useTheme();

  const label = useMemo(() => {
    return fieldLabel || capitalizeFirstChar(fieldName.replaceAll('_', ' '));
  }, [fieldLabel, fieldName]);

  const onChangeFieldValue = useCallback(
    (field, newValue) => {
      if (fieldValue.type === 'fixed') {
        try {
          newValue = JSON.parse(newValue);
        } catch {
          // console.log(e)
        }
      }
      onChangeMapping(fieldName, {
        ...fieldValue,
        [field]: newValue,
      });
    },
    [onChangeMapping, fieldName, fieldValue],
  );

  const onInput = useCallback(
    event => {
      event.preventDefault();
      onChangeFieldValue('value', event.target.value);
    },
    [onChangeFieldValue],
  );

  const onChange = field => v => onChangeFieldValue(field, v);

  const showInput = useMemo(() => {
    return (
      ['string', 'fstring', 'fixed'].includes(fieldValue.type) ||
      (fieldValue.source !== 'state' && fieldValue.source !== undefined)
    );
  }, [fieldValue.source, fieldValue.type]);

  const showSource = useMemo(() => {
    return ['variable', 'fstring'].includes(fieldValue.type);
  }, [fieldValue.type]);

  useEffect(() => {
    if (!showSource && fieldValue.source !== undefined) {
      onChangeFieldValue('source', undefined);
    }
  }, [fieldValue.source, onChangeFieldValue, showSource]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      paddingTop="1rem"
    >
      <Typography
        borderRadius=".25rem"
        border={`.0625rem solid ${theme.palette.border.flowNode}`}
        sx={{ background: theme.palette.background.userInputBackground }}
        padding=".25rem .625rem"
        height="1.5rem"
        width="auto"
        component="div"
        variant="subtitle"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Box
        marginTop="1rem"
        display="flex"
        gap="1.1875rem"
        width="100%"
        alignItems="flex-end"
        height="2.8125rem"
      >
        <Box width="7.25rem">
          <SingleSelect
            sx={{ marginBottom: '0rem' }}
            label="Type"
            value={fieldValue.type}
            onValueChange={onChange('type')}
            options={FlowEditorConstants.agentTaskTypeOptions}
            disabled={disabled}
            showBorder
            className="nopan nodrag"
          />
        </Box>
        {showSource && (
          <Box width="7.25rem">
            <SingleSelect
              sx={{ marginBottom: '0rem' }}
              label="Source"
              value={fieldValue.source || 'state'}
              onValueChange={onChange('source')}
              options={variableSourceOptions}
              disabled={disabled}
              showBorder
              className="nopan nodrag"
            />
          </Box>
        )}
        <Box flex={1}>
          {showInput && (
            <Input.StyledInputEnhancer
              autoComplete="off"
              multiline={false}
              disabled={disabled}
              variant="standard"
              fullWidth
              name="value"
              // id='value'
              label={<FlowEditorSettings.LabelWithTooltip tooltip="not tooltips here" />}
              placeholder=""
              value={
                typeof fieldValue.value !== 'string' ? JSON.stringify(fieldValue.value) : fieldValue.value
              }
              onInput={onInput}
              hasActionsToolBar
              showCopyAction={false}
              showExpandAction={false}
              fieldName={'value'}
              containerProps={{
                marginBottom: '0rem !important',
                className: 'nopan nodrag nowheel',
                boxSizing: 'border-box',
              }}
              InputLabelProps={{ style: { pointerEvents: 'auto', zIndex: 500 } }}
            />
          )}
          {!showInput && fieldValue.type === 'variable' && (
            <SingleSelect
              sx={{ marginBottom: '0rem' }}
              label={<FlowEditorSettings.LabelWithTooltip tooltip="no tooltips here" />}
              value={fieldValue.value}
              onValueChange={onChange('value')}
              options={inputOptions}
              disabled={disabled}
              showBorder
              className="nopan nodrag"
              labelSX={{ pointerEvents: 'auto', zIndex: 500 }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
});

VariablesMappingItem.displayName = 'VariablesMappingItem';

const VariablesMapping = memo(props => {
  const { style, variables_mapping, onChangeMapping, onDeleteMapping, disabled } = props;
  {
    (style, variables_mapping, onChangeMapping, onDeleteMapping, disabled);
  }
  const theme = useTheme();

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      summarySX={{
        background: theme.palette.background.userInputBackground,
        borderRadius: '.5rem',
        minHeight: '2rem !important',
      }}
      titleSX={{
        color: 'text.secondary',
      }}
      accordionDetailsSX={{
        paddingLeft: '0rem',
      }}
      items={[
        {
          title: `Variables mapping(${Object.keys(variables_mapping || {}).length})`,
          content: (
            <Box>
              {Object.keys(variables_mapping || {}).map(key => (
                <VariablesMappingItem
                  key={key}
                  fieldName={key}
                  fieldValue={variables_mapping[key]}
                  onChangeMapping={onChangeMapping}
                  onDeleteMapping={onDeleteMapping}
                  disabled={disabled}
                />
              ))}
            </Box>
          ),
        },
      ]}
    />
  );
});

VariablesMapping.displayName = 'VariablesMapping';

export default VariablesMapping;
