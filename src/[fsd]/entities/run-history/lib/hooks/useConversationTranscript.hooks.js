import { useEffect, useMemo, useState } from 'react';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { useLazyMessageTracesQuery } from '@/api';
import {
  buildTraceListParams,
  convertConversationToChatHistory,
} from '@/common/convertChatConversationMessages';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Loads a finished conversation and converts it into chat messages. Trace pins are best-effort: a
 * failed lookup degrades to no pins rather than losing the transcript.
 * @param {{conversationId: string | null, skip?: boolean}} params
 * @returns {{transcript: object[], conversation: object | null, isTranscriptLoading: boolean}}
 */
export const useConversationTranscript = ({ conversationId, skip = false }) => {
  const projectId = useSelectedProjectId();

  const [fetchConversation, { data: conversation, isFetching, reset }] =
    RunHistoryApi.useLazyGetRunHistoryDetailsQuery();
  const [getMessageTraces] = useLazyMessageTracesQuery();
  const [traceSteps, setTraceSteps] = useState(null);

  const shouldLoad = !skip && Boolean(conversationId) && Boolean(projectId);

  useEffect(() => {
    if (!shouldLoad) {
      reset();
      setTraceSteps(null);
      return;
    }
    fetchConversation({ projectId, conversationId });
  }, [shouldLoad, fetchConversation, projectId, conversationId, reset]);

  useEffect(() => {
    if (!conversation?.id) return;
    getMessageTraces({
      projectId,
      conversationId: conversation.id,
      params: buildTraceListParams(conversation.message_groups),
    })
      .then(result => setTraceSteps(result.data || null))
      .catch(() => setTraceSteps(null));
  }, [conversation, getMessageTraces, projectId]);

  return useMemo(() => {
    const loaded = shouldLoad ? (conversation ?? null) : null;
    return {
      transcript: loaded ? convertConversationToChatHistory(loaded, traceSteps) : [],
      conversation: loaded,
      isTranscriptLoading: shouldLoad && isFetching,
    };
  }, [shouldLoad, conversation, traceSteps, isFetching]);
};
