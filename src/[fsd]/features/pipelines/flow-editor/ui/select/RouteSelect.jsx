import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import MultipleSelect from '@/components/MultipleSelect';
import { useTheme } from '@emotion/react';

const RouteSelect = memo(props => {
  const { id, label = 'Route', fieldName = 'routes', nodesFilter = () => true, addEndNode, disabled } = props;

  const theme = useTheme();
  const styles = routerSelectStyles();
  const { setFlowEdges, setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const nodeOptions = useNodeOptions(nodesFilter, addEndNode);
  const onChangeInput = useCallback(
    newValue => {
      FlowEditorHelpers.updateYamlNode(id, fieldName, newValue, yamlJsonObject, setYamlJsonObject);
      setFlowEdges(prevEdges => {
        if (!newValue.length) {
          return prevEdges.filter(
            edge =>
              edge.source != id ||
              edge.sourceHandle !== `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_${fieldName}`,
          );
        } else {
          const filteredEdges = prevEdges.filter(
            edge =>
              edge.source != id ||
              edge.sourceHandle !== `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_${fieldName}` ||
              newValue.includes(edge.target),
          );
          const routesEdges = filteredEdges.filter(
            edge =>
              edge.source === id &&
              edge.sourceHandle === `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_${fieldName}`,
          );
          if (routesEdges.length !== newValue.length) {
            // If the number of edges is not equal to the number of new values, we need to add edges for the new values
            const newEdges = newValue
              .filter(value => !routesEdges.some(edge => edge.target === value))
              .map(value => ({
                id: `${FlowEditorConstants.EDGE_PREFIX}${id}---${value}`,
                source: id,
                sourceHandle: `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_${fieldName}`,
                target: value,
                type: 'custom',
                data: {
                  label: yamlJsonObject.interrupt_before?.includes(value) ? 'interrupt' : undefined,
                },
              }));
            return [...filteredEdges, ...newEdges];
          }
          return filteredEdges;
        }
      });
    },
    [id, fieldName, setFlowEdges, setYamlJsonObject, yamlJsonObject],
  );
  const routesFromNode = useMemo(() => (yamlNode ? yamlNode[fieldName] || [] : []), [fieldName, yamlNode]);
  const realNodeOptions = useMemo(() => {
    const optionsNotInState = routesFromNode
      .filter(item => !nodeOptions.find(option => option.value === item))
      .map(item => ({
        label: item,
        value: item,
        canDelete: true,
        tooltip: 'Not in state',
      }));
    return [...optionsNotInState, ...nodeOptions];
  }, [routesFromNode, nodeOptions]);

  const onDeleteOption = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(
        id,
        fieldName,
        routesFromNode.filter(item => item !== value),
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, fieldName, routesFromNode, setYamlJsonObject, yamlJsonObject],
  );

  const renderValue = useCallback(
    values => {
      return values.map(value => {
        const canDelete = realNodeOptions.find(option => option.value === value)?.canDelete;
        return (
          <Box
            key={value}
            sx={styles.getValueBox(canDelete)}
          >
            <StyledTooltip
              placement="top"
              title={canDelete ? 'Non-existing node' : ''}
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
    [onDeleteOption, realNodeOptions, styles, theme.palette.icon.fill.secondary],
  );

  return (
    <MultipleSelect
      sx={styles.multipleSelect}
      label={label}
      value={yamlNode ? yamlNode[fieldName] || [] : []}
      onValueChange={onChangeInput}
      options={realNodeOptions}
      disabled={disabled}
      showBorder
      emptyPlaceHolder=""
      labelSX={styles.labelSX}
      MenuProps={styles.menuProps}
      selectSX={styles.selectSX}
      className="nopan nodrag nowheel"
      valueItemSX={styles.valueItemSX}
      onDeleteOption={onDeleteOption}
      customRenderValue={renderValue}
    />
  );
});

RouteSelect.displayName = 'RouteSelect';

/** @type {MuiSx} */
const routerSelectStyles = () => ({
  multipleSelect: {
    marginBottom: '0rem',
  },
  labelSX: {
    left: '.75rem',
    '& .Mui-focused': {
      top: '-0.3125rem',
    },
  },
  menuProps: {
    PaperProps: { style: { marginTop: '.5rem' } },
  },
  selectSX: {
    '& .MuiSelect-icon': {
      top: 'calc(50% - .6875rem) !important',
    },
  },
  valueItemSX: {
    maxWidth: '100% !important',
    overflow: 'scroll !important',
    gap: '.75rem',
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: '.25rem',
  },
  getValueBox:
    canDelete =>
    ({ palette }) => ({
      height: '1.5rem',
      padding: '.25rem .75rem',
      flexDirection: 'row',
      display: 'flex',
      gap: '.25rem',
      borderRadius: '1.25rem',
      alignItems: 'center',
      boxSizing: 'border-box',
      background: canDelete ? palette.background.wrongBkg : palette.background.dataGrid.main,
    }),
  deleteIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    cursor: 'pointer',
  },
});

export default RouteSelect;
