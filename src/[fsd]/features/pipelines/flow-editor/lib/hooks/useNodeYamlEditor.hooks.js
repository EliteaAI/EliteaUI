import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  renameNodeInEdges,
  renameNodeInFlowNodes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/nodeRename.helpers';
import {
  applyNodeYaml,
  dumpNodeYaml,
  findYamlNode,
  isSameNode,
  parseNodeYaml,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/nodeYaml.helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';

import { useNodeToolNames } from './useNodeToolNames.hooks';

export const useNodeYamlEditor = ({ flowNodeId, onRenamed, isReadOnly }) => {
  const {
    yamlJsonObject,
    setYamlJsonObject,
    setFlowNodes,
    setFlowEdges,
    resyncFlowFromYaml,
    registerNodeLeaveGuard,
  } = useContext(FlowEditorContext);
  const toolNames = useNodeToolNames();

  const yamlNode = useMemo(
    () => findYamlNode(yamlJsonObject?.nodes, flowNodeId),
    [flowNodeId, yamlJsonObject?.nodes],
  );
  const nodeYaml = useMemo(() => dumpNodeYaml(yamlNode), [yamlNode]);

  const [draft, setDraft] = useState(nodeYaml);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const draftRef = useRef(nodeYaml);
  const errorRef = useRef('');
  // The draft holds edits that aren't in the pipeline (pending or invalid)
  const isDirtyRef = useRef(false);
  // The node this editor last wrote, so its echo from the store doesn't re-format the user's text
  const lastAppliedRef = useRef(null);
  const shownNodeIdRef = useRef(yamlNode?.id);
  const latestRef = useRef({});
  latestRef.current = { yamlJsonObject, yamlNode, toolNames, flowNodeId };

  const clearTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const updateError = useCallback(message => {
    errorRef.current = message;
    setError(message);
  }, []);

  const resetDraft = useCallback(
    text => {
      clearTimer();
      isDirtyRef.current = false;
      lastAppliedRef.current = null;
      draftRef.current = text;
      setDraft(text);
      updateError('');
    },
    [clearTimer, updateError],
  );

  // Flow, canvas and main YAML changes reach the draft unless the user has unapplied edits of this node
  useEffect(() => {
    if (!yamlNode) return;
    if (lastAppliedRef.current && isSameNode(lastAppliedRef.current, yamlNode)) return;
    if (isDirtyRef.current && shownNodeIdRef.current === yamlNode.id) return;
    shownNodeIdRef.current = yamlNode.id;
    resetDraft(nodeYaml);
  }, [nodeYaml, resetDraft, yamlNode]);

  // Returns the error that blocks the draft, or '' once it is applied (or there was nothing to apply)
  const applyDraft = useCallback(() => {
    clearTimer();
    const {
      yamlJsonObject: pipeline,
      yamlNode: currentNode,
      toolNames: names,
      flowNodeId: cardId,
    } = latestRef.current;
    if (!currentNode) return '';

    const { node, error: parseError } = parseNodeYaml(draftRef.current, {
      currentNode,
      nodes: pipeline?.nodes,
      toolNames: names,
    });
    if (parseError) {
      updateError(parseError);
      return parseError;
    }

    updateError('');
    isDirtyRef.current = false;
    if (isSameNode(node, currentNode)) return '';

    const previousId = currentNode.id;
    const isRenamed = node.id !== previousId;
    const nextPipeline = applyNodeYaml(pipeline, previousId, node);
    lastAppliedRef.current = node;
    shownNodeIdRef.current = node.id;

    if (isRenamed) {
      setFlowNodes(prevNodes => renameNodeInFlowNodes(prevNodes, previousId, node.id));
      setFlowEdges(prevEdges => renameNodeInEdges(prevEdges, previousId, node.id));
    }
    setYamlJsonObject(nextPipeline);
    resyncFlowFromYaml?.(nextPipeline);
    // A condition or inline-decision card keeps its suffix after its owner is renamed
    if (isRenamed) onRenamed?.(`${node.id}${cardId.slice(previousId.length)}`);
    return '';
  }, [clearTimer, onRenamed, resyncFlowFromYaml, setFlowEdges, setFlowNodes, setYamlJsonObject, updateError]);

  const onChangeCode = useCallback(
    code => {
      if (isReadOnly || code === draftRef.current) return;
      draftRef.current = code;
      setDraft(code);
      isDirtyRef.current = true;
      clearTimer();
      timerRef.current = setTimeout(applyDraft, NodePanelConstants.NODE_YAML_APPLY_DELAY_MS);
    },
    [applyDraft, clearTimer, isReadOnly],
  );

  // Clicking Save blurs the editor first, so a pending edit is in the pipeline before it is saved
  const onEditorBlur = useCallback(() => {
    if (timerRef.current) applyDraft();
  }, [applyDraft]);

  const discard = useCallback(() => {
    resetDraft(dumpNodeYaml(latestRef.current.yamlNode));
  }, [resetDraft]);

  // Leaving applies a pending edit first; only a draft that can't be applied blocks
  const shouldBlockLeave = useCallback(() => {
    if (isReadOnly) return false;
    if (timerRef.current) return Boolean(applyDraft());
    return isDirtyRef.current && Boolean(errorRef.current);
  }, [applyDraft, isReadOnly]);

  useEffect(() => {
    if (!registerNodeLeaveGuard) return undefined;
    return registerNodeLeaveGuard({ shouldBlock: shouldBlockLeave, discard });
  }, [discard, registerNodeLeaveGuard, shouldBlockLeave]);

  useEffect(() => clearTimer, [clearTimer]);

  return { draft, error, onChangeCode, onEditorBlur, discard, shouldBlockLeave };
};
