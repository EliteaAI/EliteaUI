import { useCallback, useEffect, useRef, useState } from 'react';

import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  DeletionOperationsHelpers,
  NodeTypeHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useKeyPress } from '@xyflow/react';

export const useDeleteItems = ({
  display,
  yamlJsonObject,
  flowNodes,
  flowEdges,
  setYamlJsonObject,
  setFlowNodes,
  setFlowEdges,
  disabled,
}) => {
  const isMountedRef = useRef(true);
  const deletePressed = useKeyPress(['Delete'], {
    target: null,
  });
  const [showDeleteConfirmDlg, setShowDeleteConfirmDlg] = useState(false);
  const [confirmContent, setConfirmContent] = useState('Are you sure to delete the selected items?');
  const [nodesToDelete, setNodesToDelete] = useState([]);
  const [edgesToDelete, setEdgesToDelete] = useState([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onDelete = useCallback(
    ({ nodes, edges }) => {
      const filteredNodes = nodes.filter(node => node.type !== FlowEditorConstants.PipelineNodeTypes.End);
      let newYamlJsonObject = deepClone(yamlJsonObject);

      // Process node deletions
      filteredNodes.forEach(node => {
        if (NodeTypeHelpers.isConditionNode(node)) {
          newYamlJsonObject = DeletionOperationsHelpers.handleConditionNodeDeletion(node, newYamlJsonObject);
        } else if (NodeTypeHelpers.isLegacyDecisionNode(node)) {
          newYamlJsonObject = DeletionOperationsHelpers.handleLegacyDecisionNodeDeletion(
            node,
            newYamlJsonObject,
          );
        } else {
          newYamlJsonObject = DeletionOperationsHelpers.handleNormalNodeDeletion(node, newYamlJsonObject);
        }
      });
      // Process flow nodes update
      setFlowNodes(prev => {
        let newFlowNodes = prev.filter(node => !filteredNodes.find(nodeDel => nodeDel.id === node.id));

        // Process edge deletions
        edges.forEach(edge => {
          const result = DeletionOperationsHelpers.processEdgeDeletion(
            edge,
            flowNodes,
            newYamlJsonObject,
            newFlowNodes,
          );
          newYamlJsonObject = result.yamlJsonObject;
          newFlowNodes = result.flowNodes;
        });

        return newFlowNodes;
      });

      setYamlJsonObject(newYamlJsonObject);
      setFlowEdges(prev => prev.filter(edge => !edges.find(edgeDel => edgeDel.id === edge.id)));
      setNodesToDelete([]);
      setEdgesToDelete([]);
    },
    [flowNodes, setFlowEdges, setFlowNodes, setYamlJsonObject, yamlJsonObject],
  );

  const onBeforeDelete = useCallback(
    ({ nodes, edges }) => {
      if (isMountedRef.current && (nodes.length || edges.length) && !disabled) {
        setEdgesToDelete(edges);
        setNodesToDelete(nodes);
        setConfirmContent(
          DeletionOperationsHelpers.getConfirmContent(
            nodes.filter(node => node.selected),
            edges.filter(edge => edge.selected),
          ),
        );
        setShowDeleteConfirmDlg(true);
      }
      return false;
    },
    [disabled],
  );

  const handleDeleteNode = useCallback(
    id => {
      const nodes = flowNodes.filter(node => node.id === id);
      const edges = flowEdges.filter(edge => edge.source === id || edge.target === id);
      setEdgesToDelete(edges);
      setNodesToDelete(nodes);
      setConfirmContent('Are you sure to delete this node?');
      setShowDeleteConfirmDlg(true);
    },
    [flowEdges, flowNodes],
  );

  const onConfirmDelete = useCallback(() => {
    onDelete({ nodes: nodesToDelete, edges: edgesToDelete });
    setShowDeleteConfirmDlg(false);
  }, [edgesToDelete, nodesToDelete, onDelete]);

  const onCancelDelete = useCallback(() => {
    setShowDeleteConfirmDlg(false);
    setNodesToDelete([]);
    setEdgesToDelete([]);
  }, []);

  useEffect(() => {
    if (display !== 'none' && deletePressed) {
      const nodes = flowNodes.filter(node => node.selected);
      const edges = flowEdges.filter(edge => edge.selected);
      if (nodes.length || edges.length) {
        setEdgesToDelete(edges);
        setNodesToDelete(nodes);
        setConfirmContent(DeletionOperationsHelpers.getConfirmContent(nodes, edges));
        setShowDeleteConfirmDlg(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletePressed]);

  return {
    showDeleteConfirmDlg,
    confirmContent,
    onBeforeDelete,
    handleDeleteNode,
    onConfirmDelete,
    onCancelDelete,
  };
};
