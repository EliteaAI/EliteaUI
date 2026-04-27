import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import MultipleSelect from '@/components/MultipleSelect';

const InputSelect = memo(props => {
  const { id, label = 'Input', inputFieldName = 'input', disabled } = props;

  const theme = useTheme();
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
        tooltip: 'Not in state',
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

  const renderValue = useCallback(
    values => {
      return values.map(value => {
        const canDelete = realInputOptions.find(option => option.value === value)?.canDelete;
        return (
          <Box
            key={value}
            sx={canDelete ? styles.deletableValueItem : styles.valueItem}
          >
            <StyledTooltip
              placement="top"
              title={canDelete ? 'Not in state' : ''}
            >
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {value}
              </Typography>
            </StyledTooltip>
            {canDelete && (
              <StyledTooltip
                placement="top"
                title="Delete"
              >
                <Box sx={styles.deleteIconContainer}>
                  <RemoveIcon
                    fill={theme.palette.icon.fill.secondary}
                    sx={styles.deleteIcon}
                    onClick={() => onDeleteOption(value)}
                  />
                </Box>
              </StyledTooltip>
            )}
          </Box>
        );
      });
    },
    [onDeleteOption, realInputOptions, theme.palette.icon.fill.secondary],
  );

  return (
    <MultipleSelect
      sx={styles.multipleSelect}
      label={label}
      value={yamlNode ? yamlNode[inputFieldName] || [] : []}
      onValueChange={onChangeInput}
      options={realInputOptions}
      disabled={disabled}
      showBorder
      emptyPlaceHolder={''}
      labelSX={styles.labelSX}
      MenuProps={styles.menuProps}
      selectSX={styles.selectSX}
      className={'nopan nodrag nowheel'}
      valueItemSX={styles.valueItemSX}
      onDeleteOption={onDeleteOption}
      customRenderValue={renderValue}
    />
  );
});

InputSelect.displayName = 'InputSelect';

export default InputSelect;

const styles = {
  multipleSelect: {
    marginBottom: '0px',
  },
  labelSX: {
    left: '0.75rem',
    '& .Mui-focused': {
      top: '-0.3125rem',
    },
  },
  menuProps: {
    PaperProps: {
      style: {
        marginTop: '0.5rem',
      },
    },
  },
  selectSX: {
    '& .MuiSelect-icon': {
      top: 'calc(50% - 0.6875rem) !important',
    },
  },
  valueItemSX: {
    maxWidth: '100% !important',
    overflow: 'scroll !important',
    gap: '0.75rem',

    display: 'flex',
    flexDirection: 'row',
    paddingBottom: '0.25rem',
  },
  valueItem: ({ palette }) => ({
    height: '1.5rem',
    padding: '0.25rem 0.75rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '0.25rem',
    borderRadius: '1.25rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    background: palette.background.dataGrid.main,
  }),
  deletableValueItem: ({ palette }) => ({
    height: '1.5rem',
    padding: '0.25rem 0.75rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '0.25rem',
    borderRadius: '1.25rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    background: palette.background.wrongBkg,
  }),
  deleteIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    cursor: 'pointer',
  },
};
