import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';

const RouteSelect = memo(props => {
  const { id, label = 'Route', fieldName = 'routes', nodesFilter = () => true, addEndNode, disabled } = props;

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

  return (
    <Select.SingleSelect
      label={label}
      value={yamlNode ? yamlNode[fieldName] || [] : []}
      onValueChange={onChangeInput}
      options={realNodeOptions}
      disabled={disabled}
      showBorder
      multiple
      className="nopan nodrag nowheel"
      onDeleteOption={onDeleteOption}
    />
  );
});

RouteSelect.displayName = 'RouteSelect';

export default RouteSelect;
