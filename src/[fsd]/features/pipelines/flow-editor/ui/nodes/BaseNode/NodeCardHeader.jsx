import { memo, useCallback, useContext, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import {
  DeprecatedConstants,
  FlowEditorConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { Text } from '@/[fsd]/shared/ui';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import EntrypointIcon from '@/assets/entrypoint-icon.svg?react';
import ExpandIcon from '@/assets/expand-icon.svg?react';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const NodeCardHeader = memo(props => {
  const { name, isEntrypoint, isExpanded, onExpand, type, id, disabled } = props;

  const { toastError } = useToast();
  const theme = useTheme();
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputtedName, setInputtedName] = useState(name);
  const {
    yamlJsonObject,
    setYamlJsonObject,
    setFlowNodes,
    setFlowEdges,
    isRunningPipeline,
    handleDeleteNode,
  } = useContext(FlowEditorContext);
  const { values: { version_details: { tools = [] } = {} } = {} } = useFormikContext();
  const toolNames = useMemo(() => tools?.map(tool => tool.toolkit_name || tool.name) || [], [tools]);
  const onDoubleClickName = useCallback(() => {
    if (type !== FlowEditorConstants.PipelineNodeTypes.Condition && !isRunningPipeline) {
      setIsEditingName(true);
    }
  }, [isRunningPipeline, type]);

  const handleMakeEntrypoint = useCallback(() => {
    setYamlJsonObject({
      ...yamlJsonObject,
      entry_point: name,
    });
  }, [name, setYamlJsonObject, yamlJsonObject]);

  const handleDelete = useCallback(() => {
    handleDeleteNode(id);
  }, [handleDeleteNode, id]);

  const onChange = useCallback(event => {
    setInputtedName(event.target.value);
  }, []);

  const styles = nodeCardHeaderStyles();

  const onBlur = useCallback(() => {
    if (inputtedName !== name) {
      // Check for duplicate names (case-insensitive to spaces)
      // Exclude current node from check to allow minor space changes
      const foundNodeName = yamlJsonObject.nodes?.find(
        node => node.id !== name && node.id.replace(/\s/g, '') === inputtedName.replace(/\s/g, ''),
      );
      const foundToolName = toolNames.find(
        toolName => toolName.replace(/\s/g, '') === inputtedName.replace(/\s/g, ''),
      );
      if (foundNodeName || foundToolName) {
        toastError(
          foundNodeName
            ? 'The name has been used by other nodes, please input a new name!'
            : `The name conflicts with an existing toolkit name "${foundToolName}", please input a new name!`,
        );
        setInputtedName(name);
      } else {
        setYamlJsonObject(prev => {
          const newNodes = [...(prev?.nodes || [])].map(node => {
            const newNode =
              node.id === name
                ? {
                    ...node,
                    id: inputtedName,
                  }
                : {
                    ...node,
                  };
            if (node.condition && node.type !== FlowEditorConstants.PipelineNodeTypes.Router) {
              newNode.condition = {
                ...node.condition,
                condition_definition: node.condition.condition_definition?.replaceAll(name, inputtedName),
                conditional_outputs: node.condition.conditional_outputs?.map(item =>
                  item === name ? inputtedName : item,
                ),
                default_output:
                  node.condition.default_output === name ? inputtedName : node.condition.default_output,
              };
            } else if (node.decision) {
              newNode.decision = {
                ...node.decision,
                nodes: node.decision.nodes?.map(item => (item === name ? inputtedName : item)),
                default_output:
                  node.decision.default_output === name ? inputtedName : node.decision.default_output,
              };
            } else if (node.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
              // Handle new-style Decision nodes
              newNode.nodes = node.nodes?.map(item => (item === name ? inputtedName : item));
              newNode.default_output = node.default_output === name ? inputtedName : node.default_output;
            } else if (node.transition === name) {
              newNode.transition = inputtedName;
            }
            return newNode;
          });
          return {
            ...(prev || {}),
            entry_point: prev.entry_point === name ? inputtedName : prev.entry_point,
            nodes: newNodes,
            interrupt_before: Array.isArray(prev.interrupt_before)
              ? prev.interrupt_before?.map(item => (item === name ? inputtedName : item))
              : prev.interrupt_before,
            interrupt_after: Array.isArray(prev.interrupt_after)
              ? prev.interrupt_after?.map(item => (item === name ? inputtedName : item))
              : prev.interrupt_after,
          };
        });
        setFlowNodes(prevNodes =>
          prevNodes.map(node => {
            const clonedNode = deepClone(node);
            const newNode =
              clonedNode.id === name
                ? {
                    ...clonedNode,
                    id: inputtedName,
                    data: {
                      ...clonedNode.data,
                      label: inputtedName,
                    },
                  }
                : {
                    ...clonedNode,
                  };
            if (clonedNode.data.condition) {
              newNode.data.condition = {
                ...clonedNode.data.condition,
                condition_definition: clonedNode.data.condition.condition_definition?.replaceAll(
                  name,
                  inputtedName,
                ),
                conditional_outputs: clonedNode.data.condition.conditional_outputs?.map(item =>
                  item === name ? inputtedName : item,
                ),
                default_output:
                  clonedNode.data.condition.default_output === name
                    ? inputtedName
                    : clonedNode.data.condition.default_output,
              };
            } else if (newNode.data.decision) {
              newNode.data.decision = {
                ...clonedNode.data.decision,
                nodes: clonedNode.data.decision.nodes?.map(item => (item === name ? inputtedName : item)),
                default_output:
                  clonedNode.data.decision.default_output === name
                    ? inputtedName
                    : clonedNode.data.decision.default_output,
              };
            } else if (clonedNode.data.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
              // Handle new-style Decision nodes
              newNode.data.nodes = clonedNode.data.nodes?.map(item => (item === name ? inputtedName : item));
              newNode.data.default_output =
                clonedNode.data.default_output === name ? inputtedName : clonedNode.data.default_output;
            }
            return newNode;
          }),
        );
        setFlowEdges(prevEdges =>
          prevEdges.map(edge =>
            edge.source === name
              ? { ...edge, source: inputtedName }
              : edge.target === name
                ? { ...edge, target: inputtedName }
                : edge,
          ),
        );
      }
    }
    setIsEditingName(false);
  }, [
    inputtedName,
    name,
    setFlowEdges,
    setFlowNodes,
    setYamlJsonObject,
    toastError,
    toolNames,
    yamlJsonObject.nodes,
  ]);

  const menuItems = useMemo(
    () =>
      !isEntrypoint
        ? type !== FlowEditorConstants.PipelineNodeTypes.Condition &&
          type !== FlowEditorConstants.PipelineNodeTypes.Decision
          ? [
              {
                label: 'Make entrypoint',
                icon: (
                  <Box sx={styles.menuIconWrapper}>
                    <EntrypointIcon style={styles.menuIconStyle} />
                  </Box>
                ),
                disabled,
                onClick: handleMakeEntrypoint,
              },
              {
                label: 'Delete',
                icon: (
                  <Box sx={styles.menuIconWrapper}>
                    <DeleteIcon style={styles.menuIconStyle} />
                  </Box>
                ),
                disabled,
                onClick: handleDelete,
              },
            ]
          : [
              {
                label: 'Delete',
                icon: (
                  <Box sx={styles.menuIconWrapper}>
                    <DeleteIcon style={styles.menuIconStyle} />
                  </Box>
                ),
                disabled,
                onClick: handleDelete,
              },
            ]
        : [
            {
              label: 'Delete',
              icon: (
                <Box sx={styles.menuIconWrapper}>
                  <DeleteIcon style={styles.menuIconStyle} />
                </Box>
              ),
              onClick: handleDelete,
              disabled,
            },
          ],
    [
      isEntrypoint,
      type,
      handleMakeEntrypoint,
      disabled,
      handleDelete,
      styles.menuIconWrapper,
      styles.menuIconStyle,
    ],
  );

  const onClick = useCallback(() => {
    if (!isRunningPipeline) {
      onExpand(!isExpanded);
    }
  }, [isExpanded, onExpand, isRunningPipeline]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.leftSection}>
        {isEntrypoint && (
          <Box sx={styles.entryBox}>
            <EntrypointIcon style={styles.entrypointIconStyle} />
          </Box>
        )}
        <Box sx={styles.iconWrapper}>{NodeHelpers.getNodeIconByType(type, theme)}</Box>
        {!isEditingName ? (
          <Typography
            sx={styles.nameText}
            variant="labelMedium"
            color="text.secondary"
            onDoubleClick={onDoubleClickName}
          >
            {inputtedName}
          </Typography>
        ) : (
          <Box sx={styles.inputWrapper}>
            <TextField
              value={inputtedName}
              autoFocus
              sx={styles.textField}
              fullWidth
              variant="standard"
              label=""
              onChange={onChange}
              onBlur={onBlur}
              className="nopan nodrag"
            />
          </Box>
        )}
      </Box>
      <Box sx={styles.rightSection}>
        {NodeHelpers.isDeprecatedNodeType(type) && (
          <Tooltip
            title={<Text.TextWithLink {...DeprecatedConstants.DeprecatedTips[type]} />}
            placement="top"
          >
            <Box sx={styles.attentionIconWrapper}>
              <AttentionIcon />
              <Typography variant="caption">Deprecated!</Typography>
            </Box>
          </Tooltip>
        )}
        <IconButton
          variant="elitea"
          color="tertiary"
          sx={styles.expandButton}
          onClick={onClick}
        >
          {isExpanded ? (
            <CollapseIcon style={styles.collapseIconStyle} />
          ) : (
            <ExpandIcon style={styles.expandIconStyle} />
          )}
        </IconButton>
        {isExpanded && (
          <DotMenu
            id="node-menu"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              ListItemText: {
                sx: styles.dotMenuItemText,
                primaryTypographyProps: { variant: 'bodyMedium' },
              },
              ListItemIcon: {
                sx: styles.dotMenuItemIcon,
              },
            }}
          >
            {menuItems}
          </DotMenu>
        )}
      </Box>
    </Box>
  );
});

NodeCardHeader.displayName = 'NodeCardHeader';

/** @type {MuiSx} */
const nodeCardHeaderStyles = () => ({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '29.4375rem',
    height: '2.75rem',
  },
  leftSection: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '.5rem',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    overflow: 'overflow',
  },
  entryBox: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: palette.primary.main,
    width: '1.5rem',
    height: '1.5rem',
  }),
  attentionIconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.25rem',
    height: '1.5rem',
    padding: '.25rem .5rem',
    borderRadius: '1.3125rem',
    width: '6.75rem',
    color: ({ palette }) => palette.text.deprecated,
    backgroundColor: ({ palette }) => palette.background.deprecated,
    cursor: 'pointer',
  },
  entrypointIconStyle: {
    fontSize: '1.5rem',
  },
  iconWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '1.5rem',
    width: '1.5rem',
    borderRadius: '.25rem',
    padding: '.25rem',
    boxSizing: 'border-box',
    border: `.0625rem solid ${palette.border.flowNode}`,
  }),
  nameText: ({ palette }) => ({
    flex: 1,
    textWrap: 'nowrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    color: palette.text.secondary,
  }),
  inputWrapper: {
    flex: 1,
  },
  textField: {
    '& .MuiFormLabel-root': {
      color: 'text.primary',
    },
  },
  rightSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '.5rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  expandButton: ({ palette }) => ({
    marginLeft: 0,
    color: palette.icon.fill.secondary,
  }),
  // Style objects for SVG icons (use style prop, not sx)
  collapseIconStyle: {
    fontSize: '1rem',
  },
  expandIconStyle: {
    fontSize: '1rem',
  },
  menuIconStyle: {
    fontSize: '1rem',
  },
  // DotMenu styles
  menuIconWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '1rem',
    height: '1rem',
    color: palette.icon.fill.default,
  }),
  dotMenuItemText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  dotMenuItemIcon: {
    minWidth: '1rem !important',
    marginRight: '.75rem',
  },
});

export default NodeCardHeader;
