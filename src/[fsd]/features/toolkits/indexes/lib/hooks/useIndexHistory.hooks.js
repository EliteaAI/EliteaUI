import { useCallback, useEffect, useMemo, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { useSelector } from 'react-redux';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { selectHistoryItem } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
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

  const allowProgressingIndexHistoryRecovering =
    progressHistoryOptions?.shouldRecover && !progressingIndexHistoryRecovered;

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
    } else reset();
  }, [
    fetchConversationDetails,
    indexHistoryItem?.conversation_id,
    isHistoryMode,
    projectId,
    reset,
    allowProgressingIndexHistoryRecovering,
  ]);

  const getHistoryMockMessage = useCallback(
    showMockMessage => {
      if (!showMockMessage) return [];

      const getFailedTrace = () => {
        if (indexHistoryItem?.error) return indexHistoryItem?.error;

        return 'The system encountered an issue and was unable to complete the scheduled reindexing operation';
      };

      const isFailed = indexHistoryItem?.state === IndexStatuses.fail;
      const isPartlyOk = indexHistoryItem?.state === IndexStatuses.partlyOk;

      const getExecutionSummary = () => {
        if (isFailed)
          return 'The system encountered an issue and was unable to complete the scheduled reindexing operation';
        if (isPartlyOk) return 'Partially indexed by schedule';
        return 'Successfully reindexed by schedule';
      };

      const toolExecutionSummary = getExecutionSummary();
      const content = `{ "reindexed": ${indexHistoryItem.updated}, "indexed": ${indexHistoryItem.indexed} }`;

      return [
        {
          id: WELCOME_MESSAGE_ID,
          role: ROLES.Assistant,
          content: isFailed
            ? `${toolExecutionSummary}`
            : `${toolExecutionSummary}\n\n\`\`\`json\n${content}\n\`\`\``,
          created_at: new Date(fromUnixTime(indexHistoryItem.updated_on)).getTime(),
          participant_id: 'system',
          exception: isFailed ? getFailedTrace() : null,
        },
      ];
    },
    [indexHistoryItem],
  );

  // Use this data fot the indexes history tab
  const { isHistoryLoading, historyMessages, historyConversation } = useMemo(() => {
    const showMockMessage =
      isHistoryMode && (indexHistoryItem?.conversation_id === null || indexHistoryItem?.error);

    const conversation = isHistoryMode ? (conversationDetails ?? null) : null;

    const currentConversationMessages = conversation
      ? convertConversationToChatHistory(conversation)
      : getHistoryMockMessage(showMockMessage);

    return {
      isHistoryLoading: isConversationDetailsFetching,
      historyMessages: showMockMessage
        ? currentConversationMessages
        : ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages),
      historyConversation: conversation,
    };
  }, [
    isHistoryMode,
    isConversationDetailsFetching,
    indexHistoryItem,
    conversationDetails,
    getHistoryMockMessage,
  ]);

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
    setProgressingIndexHistoryRecovered,
  };
};
