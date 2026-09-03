import { useCallback, useEffect, useMemo, useRef } from 'react';

import { buildAttachmentSummary } from '@/[fsd]/entities/attachment/lib';
import { toSpeakableText, translateSpokenPos } from '@/[fsd]/features/chat/lib/helpers';
import {
  getActionOwnerPath,
  normalizeExecutionHierarchy,
} from '@/[fsd]/features/chat/lib/helpers/executionHierarchy.helpers.js';
import { groupToolkitAuthorizationActions } from '@/[fsd]/features/chat/lib/helpers/mcpAuthorization.helpers.js';
import { computeBreadcrumbs } from '@/[fsd]/features/chat/lib/helpers/subAgentGrouping.helpers.js';
import {
  CANVAS_ADMIN_USER,
  CANVAS_SYSTEM_USER,
  TOOL_ACTION_NAMES,
  TOOL_ACTION_TYPES,
  ToolActionStatus,
} from '@/common/constants.js';
import { convertJsonToString, isImageFile } from '@/common/utils';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';

export const itemToSpeakableText = item => {
  if (item.item_type === 'canvas_message') {
    return item.item_details.latest_version?.canvas_content || '';
  }
  if (item.item_type === 'attachment_message') {
    return '';
  }
  return item.item_details.content;
};

export const useApplicationAnswerState = props => {
  const {
    answer,
    message_items,
    toolActions = [],
    exception,
    messageId,
    speakingMessageId,
    spokenRange,
    speakingSegments,
    isStreaming,
    isRegenerating,
    isLoading,
    isSpeakingMode,
    isLastMessage,
    onAutoSpeak,
    onCopy,
    onEdit,
    onContinueMcpExecution,
    onContinueTokenLimitExecution,
    requiresConfirmation,
    hitlInterrupt,
    hitlInterrupts,
    selectedCodeBlockInfo,
    subAgentTypeByName,
  } = props;

  const headerRef = useRef(null);

  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

  const authRequiredActions = useMemo(
    () => toolActions.filter(action => action.status === ToolActionStatus.actionRequired),
    [toolActions],
  );
  const authorizationBuckets = useMemo(
    () => groupToolkitAuthorizationActions(authRequiredActions, toolActions),
    [authRequiredActions, toolActions],
  );

  const onContinueWithoutAuth = useCallback(
    authRequiredAction => {
      onContinueMcpExecution?.(
        messageId,
        true,
        authRequiredAction.authorizationRequestId || authRequiredAction.id,
        authRequiredAction,
      );
    },
    [onContinueMcpExecution, messageId],
  );

  const onAuthSuccess = useCallback(
    authRequiredAction => {
      onContinueMcpExecution?.(
        messageId,
        false,
        authRequiredAction.authorizationRequestId || authRequiredAction.id,
        authRequiredAction,
      );
    },
    [onContinueMcpExecution, messageId],
  );

  const resolveAuthorizationAgentType = useCallback(
    bucket => {
      const participantType = subAgentTypeByName?.[bucket.name];
      if (participantType === 'pipeline') return 'pipeline';
      if (participantType) return 'application';
      const action = bucket.actions.find(item => item?.agent_type || item?.toolMeta?.agent_type);
      const agentType = action?.agent_type || action?.toolMeta?.agent_type;
      if (agentType === 'pipeline') return 'pipeline';
      return agentType ? 'application' : '';
    },
    [subAgentTypeByName],
  );

  const onContinueWithConfirmation = useCallback(() => {
    if (onContinueTokenLimitExecution && requiresConfirmation) {
      onContinueTokenLimitExecution(messageId);
      setTimeout(() => {
        headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [onContinueTokenLimitExecution, messageId, requiresConfirmation]);

  const rawAnswer = useMemo(() => {
    if (answer) return answer;
    if (!message_items) return undefined;
    const attachmentItems = message_items.filter(item => item.item_type === 'attachment_message');
    const parts = message_items
      .filter(item => item.item_type !== 'attachment_message')
      .map(itemToSpeakableText);
    const summary = buildAttachmentSummary(attachmentItems);
    if (summary) parts.push(summary);
    return parts.join('\n');
  }, [answer, message_items]);

  const realAnswer = useMemo(() => convertJsonToString(rawAnswer || '', true), [rawAnswer]);
  const hasSpeakableText = useMemo(() => !!toSpeakableText(realAnswer).text, [realAnswer]);

  const activeSpokenRange = useMemo(() => {
    if (messageId !== speakingMessageId || !spokenRange) return null;
    if (!speakingSegments?.length) return spokenRange;
    const start = translateSpokenPos(spokenRange.start, speakingSegments);
    const end = translateSpokenPos(spokenRange.end, speakingSegments);
    if (end <= start) return null;
    return { start, end };
  }, [messageId, speakingMessageId, spokenRange, speakingSegments]);

  const messageItemOffsets = useMemo(() => {
    if (!message_items?.length) return {};
    const offsets = {};
    let pos = 0;
    message_items.forEach((item, idx) => {
      const str = String(itemToSpeakableText(item) ?? '');
      if (item.item_type === 'text_message') {
        offsets[item.uuid] = pos;
      }
      pos += str.length;
      if (idx < message_items.length - 1) pos += 1;
    });
    return offsets;
  }, [message_items]);

  useEffect(() => {
    if (isSpeakingMode && isLastMessage && !isStreaming && !isLoading && hasSpeakableText) {
      onAutoSpeak?.(realAnswer, messageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, isLoading]);

  const filteredToolActions = useMemo(() => {
    if (!toolActions?.length || !realAnswer?.trim()) return toolActions;
    const lastActionIndex = toolActions.length - 1;
    return toolActions.map((action, index) => {
      if (index !== lastActionIndex) return action;
      if (
        action?.type === TOOL_ACTION_TYPES.Llm &&
        action?.name === TOOL_ACTION_NAMES.Llm &&
        !action?.parent_agent_name &&
        !action?.toolMeta?.parent_agent_name &&
        !(action?.parent_agent_path || action?.toolMeta?.parent_agent_path)?.length &&
        !isStreaming &&
        !isRegenerating
      ) {
        const lastActionContent = action?.content?.trim() || '';
        const lastActionOutput = action?.toolOutputs?.trim() || '';
        const trimmedRealAnswer = realAnswer.trim();
        if (
          lastActionContent === trimmedRealAnswer ||
          lastActionOutput === trimmedRealAnswer ||
          (trimmedRealAnswer.length > 50 && lastActionContent.includes(trimmedRealAnswer)) ||
          (trimmedRealAnswer.length > 50 && lastActionOutput.includes(trimmedRealAnswer))
        ) {
          return { ...action, content: '', toolOutputs: '', originalContent: action.content };
        }
      }
      return action;
    });
  }, [toolActions, realAnswer, isStreaming, isRegenerating]);

  const isProcessing = isLoading || isRegenerating || isStreaming;

  const { swarmChildActions, nonSwarmChildActions } = useMemo(() => {
    if (isProcessing) {
      return { swarmChildActions: [], nonSwarmChildActions: filteredToolActions };
    }
    return {
      swarmChildActions: filteredToolActions.filter(a => a.type === TOOL_ACTION_TYPES.SwarmChild),
      nonSwarmChildActions: filteredToolActions.filter(a => a.type !== TOOL_ACTION_TYPES.SwarmChild),
    };
  }, [filteredToolActions, isProcessing]);

  const isEditing = useMemo(
    () =>
      selectedCodeBlockInfo?.selectedMessage?.id === messageId &&
      messageId &&
      !selectedCodeBlockInfo?.isBlock,
    [messageId, selectedCodeBlockInfo?.isBlock, selectedCodeBlockInfo?.selectedMessage?.id],
  );

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: rawAnswer,
      codeBlock: realAnswer,
      language: 'markdown',
      isBlock: false,
      startPos: 0,
      endPos: realAnswer.length,
      canvasId: null,
      blockId: messageId,
    });
  }, [messageId, onEdit, rawAnswer, realAnswer]);

  const hasCanvasBeingEdited = useMemo(
    () =>
      !!message_items?.find(
        item =>
          item.item_type === 'canvas_message' &&
          item.item_details.editors.filter(
            editor => editor.user_name !== CANVAS_ADMIN_USER && editor.user_name !== CANVAS_SYSTEM_USER,
          ).length,
      ),
    [message_items],
  );

  const { imageAttachments, normalAttachments, nonAttachmentItems } = useMemo(() => {
    const defaultState = { imageAttachments: [], normalAttachments: [], nonAttachmentItems: [] };
    return (
      message_items?.reduce((acc, item) => {
        if (item.item_type !== 'attachment_message') {
          acc.nonAttachmentItems.push(item);
        } else if (isImageFile(item)) {
          acc.imageAttachments.push(item);
        } else {
          acc.normalAttachments.push(item);
        }
        return acc;
      }, defaultState) || defaultState
    );
  }, [message_items]);

  const hasAttachments = useMemo(
    () => imageAttachments.length > 0 || normalAttachments.length > 0,
    [imageAttachments.length, normalAttachments.length],
  );

  const canRenderContent = !exception && !(isLoading || isRegenerating);

  const effectiveHitlInterrupts = useMemo(() => {
    if (Array.isArray(hitlInterrupts) && hitlInterrupts.length) return hitlInterrupts;
    return hitlInterrupt ? [hitlInterrupt] : [];
  }, [hitlInterrupts, hitlInterrupt]);

  const visibleHitlInterrupts = useMemo(
    () => effectiveHitlInterrupts.filter(interrupt => !interrupt?.hidden),
    [effectiveHitlInterrupts],
  );

  const pendingAgentPaths = useMemo(
    () =>
      effectiveHitlInterrupts
        .filter(interrupt => !interrupt?.decided)
        .map(getActionOwnerPath)
        .filter(path => path.length),
    [effectiveHitlInterrupts],
  );

  const hitlBuckets = useMemo(() => {
    const coordinator = [];
    const order = [];
    const byInvocation = new Map();
    visibleHitlInterrupts.forEach((interrupt, index) => {
      const hierarchy = normalizeExecutionHierarchy(interrupt);
      const name = hierarchy.parent_agent_name;
      const entry = { interrupt, index };
      if (!name) {
        coordinator.push(entry);
        return;
      }
      const key =
        hierarchy.parent_agent_call_id ||
        interrupt?.child_thread_id ||
        interrupt?.thread_id ||
        (hierarchy.parent_agent_path.length ? JSON.stringify(hierarchy.parent_agent_path) : name);
      if (!byInvocation.has(key)) {
        const path = hierarchy.parent_agent_path.length
          ? hierarchy.parent_agent_path
          : [{ name, call_id: key, sibling_ordinal: interrupt?.sibling_ordinal }];
        byInvocation.set(key, { name, entries: [], agentPath: path });
        order.push(key);
      }
      byInvocation.get(key).entries.push(entry);
    });
    const resolveType = (name, entries) => {
      const participantType = subAgentTypeByName?.[name];
      if (participantType === 'pipeline') return 'pipeline';
      if (participantType) return 'application';
      const fromInterrupt = entries.find(e => e?.interrupt?.agent_type || e?.interrupt?.toolMeta?.agent_type);
      const at = fromInterrupt?.interrupt?.agent_type || fromInterrupt?.interrupt?.toolMeta?.agent_type;
      if (at === 'pipeline') return 'pipeline';
      if (at) return 'application';
      return '';
    };
    const breadcrumbEntries = order.map(key => ({
      instanceKey: key,
      agentPath: byInvocation.get(key).agentPath,
    }));
    const breadcrumbContext = (toolActions || [])
      .map((action, index) => ({
        instanceKey: `trace-${index}`,
        agentPath: getActionOwnerPath(action),
      }))
      .filter(entry => entry.agentPath.length);
    const breadcrumbLabels = computeBreadcrumbs(breadcrumbEntries, breadcrumbContext);
    return {
      coordinator,
      subAgents: order.map(key => {
        const bucket = byInvocation.get(key);
        return {
          ...bucket,
          instanceKey: key,
          label: breadcrumbLabels.get(key),
          agentType: resolveType(bucket.name, bucket.entries),
        };
      }),
      hasSubAgents: order.length > 0,
    };
  }, [visibleHitlInterrupts, subAgentTypeByName, toolActions]);

  const shouldRenderAnswerBlock = useMemo(() => {
    const hasRenderableMessageItems =
      message_items?.length && canRenderContent && (!!nonAttachmentItems?.length || hasAttachments);
    return (
      !!answer ||
      hasRenderableMessageItems ||
      !!exception ||
      (authRequiredActions.length > 0 && !!onContinueMcpExecution) ||
      (requiresConfirmation && !!onContinueTokenLimitExecution) ||
      visibleHitlInterrupts.length > 0
    );
  }, [
    answer,
    message_items?.length,
    nonAttachmentItems?.length,
    hasAttachments,
    canRenderContent,
    exception,
    authRequiredActions.length,
    onContinueMcpExecution,
    requiresConfirmation,
    onContinueTokenLimitExecution,
    visibleHitlInterrupts.length,
  ]);

  return {
    headerRef,
    realAnswer,
    hasSpeakableText,
    activeSpokenRange,
    messageItemOffsets,
    authorizationBuckets,
    filteredToolActions,
    swarmChildActions,
    nonSwarmChildActions,
    isEditing,
    isProcessing,
    effectiveHitlInterrupts,
    visibleHitlInterrupts,
    pendingAgentPaths,
    hitlBuckets,
    hasCanvasBeingEdited,
    imageAttachments,
    normalAttachments,
    nonAttachmentItems,
    hasAttachments,
    canRenderContent,
    shouldRenderAnswerBlock,
    onContinueWithoutAuth,
    onAuthSuccess,
    resolveAuthorizationAgentType,
    onContinueWithConfirmation,
    onClickEdit,
    onClickCopy,
  };
};
