import { useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { selectHistoryItem } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useLazyMessageTracesQuery } from '@/api';
import {
  buildTraceListParams,
  convertConversationToChatHistory,
} from '@/common/convertChatConversationMessages';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useIndexHistory = (progressHistoryOptions = null) => {
  const projectId = useSelectedProjectId();

  const indexHistoryItem = useSelector(selectHistoryItem);
  const isHistoryMode = Boolean(indexHistoryItem);

  const [progressingIndexHistoryRecovered, setProgressingIndexHistoryRecovered] = useState(false);

  const [
    fetchConversationDetails,
    { data: conversationDetails, isFetching: isConversationDetailsFetching, reset },
  ] = RunHistoryApi.useLazyGetRunHistoryDetailsQuery();
  const [getMessageTraces] = useLazyMessageTracesQuery();
  const [traceSteps, setTraceSteps] = useState(null);

  const allowProgressingIndexHistoryRecovering =
    progressHistoryOptions?.shouldRecover && !progressingIndexHistoryRecovered;

  // Fetch trace-step pins (TS-4) for a conversation; failure degrades to no pins.
  // Recover conversation history if indexing is in progress
  useEffect(() => {
    if (!allowProgressingIndexHistoryRecovering) return;

    fetchConversationDetails({
      projectId,
      conversationId: progressHistoryOptions.conversationId,
    });
  }, [
    fetchConversationDetails,
    projectId,
    allowProgressingIndexHistoryRecovering,
    progressHistoryOptions?.conversationId,
  ]);

  // Use this effect for the indexes history tab
  useEffect(() => {
    if (allowProgressingIndexHistoryRecovering) return;

    if (isHistoryMode && indexHistoryItem.conversation_id) {
      fetchConversationDetails({
        projectId,
        conversationId: indexHistoryItem.conversation_id,
      });
    } else {
      reset();
      setTraceSteps(null);
    }
  }, [
    fetchConversationDetails,
    indexHistoryItem?.conversation_id,
    isHistoryMode,
    projectId,
    reset,
    allowProgressingIndexHistoryRecovering,
  ]);

  useEffect(() => {
    const conversationId = conversationDetails?.id;
    if (!conversationId) return;
    getMessageTraces({
      projectId,
      conversationId,
      params: buildTraceListParams(conversationDetails.message_groups),
    }).then(result => setTraceSteps(result.data || null));
  }, [conversationDetails, getMessageTraces, projectId]);

  const { isHistoryLoading, historyMessages, historyConversation } = useMemo(() => {
    const conversation = isHistoryMode ? (conversationDetails ?? null) : null;

    const currentConversationMessages = conversation
      ? convertConversationToChatHistory(conversation, traceSteps)
      : [];

    return {
      isHistoryLoading: isConversationDetailsFetching,
      historyMessages: ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages),
      historyConversation: conversation,
    };
  }, [isHistoryMode, isConversationDetailsFetching, conversationDetails, traceSteps]);

  const needGenerateProgressingIndexHistory = useMemo(
    () =>
      allowProgressingIndexHistoryRecovering &&
      conversationDetails &&
      !isConversationDetailsFetching &&
      !progressingIndexHistoryRecovered,
    [
      allowProgressingIndexHistoryRecovering,
      conversationDetails,
      isConversationDetailsFetching,
      progressingIndexHistoryRecovered,
    ],
  );

  return {
    isHistoryMode,
    isHistoryLoading,
    historyMessages,
    historyConversation,
    needGenerateProgressingIndexHistory,
    conversationDetails,
    traceSteps,
    setProgressingIndexHistoryRecovered,
  };
};
