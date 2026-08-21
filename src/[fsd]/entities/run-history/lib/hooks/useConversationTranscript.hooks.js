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

  const wanted = !skip && Boolean(conversationId) && Boolean(projectId);

  useEffect(() => {
    if (!wanted) {
      reset();
      setTraceSteps(null);
      return;
    }
    fetchConversation({ projectId, conversationId });
  }, [wanted, fetchConversation, projectId, conversationId, reset]);

  useEffect(() => {
    if (!wanted || !conversation?.id) return;
    getMessageTraces({
      projectId,
      conversationId: conversation.id,
      params: buildTraceListParams(conversation.message_groups),
    })
      .then(result => setTraceSteps(result.data || null))
      .catch(() => setTraceSteps(null));
  }, [wanted, conversation, getMessageTraces, projectId]);

  return useMemo(() => {
    const loaded = wanted ? (conversation ?? null) : null;
    return {
      transcript: loaded ? convertConversationToChatHistory(loaded, traceSteps) : [],
      conversation: loaded,
      isTranscriptLoading: wanted && isFetching,
    };
  }, [wanted, conversation, traceSteps, isFetching]);
};
