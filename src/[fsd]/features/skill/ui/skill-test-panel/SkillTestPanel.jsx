import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { Box } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { ChatMessageList } from '@/[fsd]/features/chat/ui/chat-box';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useListModelsQuery } from '@/api/configurations.js';
import { useGenerateContentStreamingMutation, useStopLlmTaskMutation } from '@/api/llm';
import { ROLES, SocketMessageType, sioEvents } from '@/common/constants';
import { initializeNewMessages } from '@/common/initializeNewMessages';
import { buildErrorMessage } from '@/common/utils';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents';
import NewChatInput from '@/pages/NewChat/NewChatInput';

const SYNTHETIC_PARTICIPANT_ID = 'skill-test-participant';

// Map local chat_history messages to predict_llm chat_history turns.
const messagesToTurns = messages =>
  (messages || [])
    .filter(msg => !msg.isLoading)
    .map(msg => ({
      role: msg.role,
      content:
        msg.role === ROLES.User
          ? msg.message_items?.find(item => item.item_type === 'text_message')?.item_details?.content ||
            msg.content ||
            ''
          : msg.content || '',
    }))
    .filter(turn => turn.content);

// Pull the plain text out of the edited message_items the editor returns.
const extractEditedText = items => {
  if (!items) return '';
  if (typeof items === 'string') return items;
  if (Array.isArray(items)) {
    const textItem = items.find(i => i.item_type === 'text_message') || items[0];
    return textItem?.item_details?.content || textItem?.content || textItem?.text || '';
  }
  return items?.content || '';
};

/**
 * SkillTestPanel renders the same presentational chat components the agent
 * editor uses — ChatMessageList (bubbles) + NewChatInput (model chip + gear,
 * mic, no paperclip) — but is fully STATELESS.
 *
 * It does NOT use useApplicationChat (which creates a persisted conversation
 * via POST /conversations). Instead the conversation + chat history live in
 * local React state, and sending a message calls the generic, stateless
 * predict_llm endpoint (useGenerateContentStreamingMutation). No conversation,
 * agent, subagent, participant or context fork is ever created on the backend.
 */
const SkillTestPanel = memo(({ isFullScreenChat, setIsFullScreenChat }) => {
  const projectId = useSelectedProjectId();
  const { values } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const socket = useContext(SocketContext);
  const currentUser = useSelector(state => state.user);

  const skillName = values?.name || 'Skill';
  // Read the selected version's markdown at send time from Formik (kept fresh
  // via a ref so onSend always uses the latest edited instructions).
  const instructionsRef = useRef('');
  instructionsRef.current = values?.version_details?.instructions || '';

  // Synthetic participant so the bubbles resolve a name/icon exactly like the
  // agent chat. It is never sent to the backend.
  const syntheticParticipant = useMemo(
    () => ({
      id: SYNTHETIC_PARTICIPANT_ID,
      entity_name: 'application',
      entity_meta: { id: SYNTHETIC_PARTICIPANT_ID, name: skillName, project_id: projectId },
      entity_settings: {},
      meta: { name: skillName },
    }),
    [skillName, projectId],
  );

  // In-memory, ephemeral conversation. No id/uuid => nothing is persisted.
  const [activeConversation, setActiveConversation] = useState(() => ({
    is_private: true,
    source: 'skill-test',
    participants: [syntheticParticipant],
    chat_history: [],
  }));

  // Keep the synthetic participant name in sync if the skill is renamed.
  useEffect(() => {
    setActiveConversation(prev => ({ ...prev, participants: [syntheticParticipant] }));
  }, [syntheticParticipant]);

  const chat_history = activeConversation.chat_history;

  const setChatHistory = useCallback(updater => {
    setActiveConversation(prev => {
      const next = typeof updater === 'function' ? updater(prev.chat_history || []) : updater;
      return { ...prev, chat_history: next };
    });
  }, []);

  const [isStreaming, setIsStreaming] = useState(false);
  const activeStreamIdRef = useRef(null);
  const activeTaskIdRef = useRef(null);
  const activeMessageIdRef = useRef(null);
  const finalizeTimerRef = useRef(null);
  // True between issuing the POST and latching the backend's stream_id from the
  // first incoming socket event.
  const awaitingStreamRef = useRef(false);

  // Model selector wiring (mirrors ConfigurationTab — local llm_settings only).
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const modelList = modelsData.items;

  const defaultModel = useMemo(
    () => modelList.find(model => model.default) || modelList[0] || null,
    [modelList],
  );

  const [selectedModel, setSelectedModel] = useState(null);
  const [llmSettings, setLlmSettings] = useState({
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
  });

  useEffect(() => {
    if (!selectedModel && defaultModel) {
      setSelectedModel(defaultModel);
    }
  }, [defaultModel, selectedModel]);

  const onSelectModel = useCallback(model => {
    setSelectedModel(model);
  }, []);

  const onSetLLMSettings = useCallback(newSettings => {
    setLlmSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const [generateContent] = useGenerateContentStreamingMutation();
  const [stopLlmTask] = useStopLlmTaskMutation();

  const finishStreaming = useCallback(() => {
    clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;
    setIsStreaming(false);
    setChatHistory(prev =>
      prev.map(msg =>
        msg.internal_id === activeMessageIdRef.current
          ? { ...msg, isLoading: false, isStreaming: false }
          : msg,
      ),
    );
    activeStreamIdRef.current = null;
    activeTaskIdRef.current = null;
    activeMessageIdRef.current = null;
    awaitingStreamRef.current = false;
  }, [setChatHistory]);

  const handleSocketEvent = useCallback(
    message => {
      const { type, stream_id, response_metadata } = message || {};
      // The predict_llm (application_predict) path does NOT echo the
      // client-minted stream_id: the backend tags every event with its own
      // stream_id (the start_task's id). We can't reliably correlate via the
      // POST task_id (the POST resolves after start_task can arrive, and its
      // task_id differs from the socket stream_id). So while a send is pending
      // (awaitingStreamRef), latch the stream_id from the first event we see
      // and match all later events against it.
      if (awaitingStreamRef.current && stream_id) {
        activeStreamIdRef.current = stream_id;
        awaitingStreamRef.current = false;
      }
      if (!activeStreamIdRef.current || stream_id !== activeStreamIdRef.current) return;

      const convertContent = content => {
        if (content == null) return '';
        if (typeof content === 'string') return content;
        return JSON.stringify(content);
      };

      const appendChunk = chunk => {
        if (!chunk) return;
        setChatHistory(prev =>
          prev.map(msg =>
            msg.internal_id === activeMessageIdRef.current
              ? { ...msg, content: (msg.content || '') + chunk, isLoading: false, isStreaming: true }
              : msg,
          ),
        );
      };

      const replaceContent = text => {
        setChatHistory(prev =>
          prev.map(msg =>
            msg.internal_id === activeMessageIdRef.current
              ? { ...msg, content: text, isLoading: false, isStreaming: true }
              : msg,
          ),
        );
      };

      switch (type) {
        case SocketMessageType.StartTask:
          break;
        case SocketMessageType.Chunk:
        case SocketMessageType.AIMessageChunk:
        case SocketMessageType.AgentLlmChunk:
          appendChunk(convertContent(message.content));
          if (response_metadata?.finish_reason) finishStreaming();
          break;
        case SocketMessageType.AgentResponse:
          replaceContent(convertContent(message.content));
          finishStreaming();
          break;
        case SocketMessageType.AgentLlmEnd:
          // Terminal stream event for some flows: chunks are done, and no
          // finish_reason / AgentResponse may follow. Keep the message alive
          // briefly in case an AgentResponse arrives, then finalize so the
          // spinner never hangs (mirrors useAIContentGenerationStreaming).
          clearTimeout(finalizeTimerRef.current);
          finalizeTimerRef.current = setTimeout(() => {
            if (activeStreamIdRef.current) finishStreaming();
          }, 4000);
          break;
        case SocketMessageType.Error:
        case SocketMessageType.LlmError: {
          const err = message.content?.error || message.content || 'Failed to generate response';
          toastError(typeof err === 'string' ? err : JSON.stringify(err));
          finishStreaming();
          break;
        }
        default:
          break;
      }
    },
    [finishStreaming, setChatHistory, toastError],
  );

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.application_predict, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    };
  }, [subscribe, unsubscribe]);

  // Shared stateless predict_llm stream into a given assistant message.
  const streamAnswer = useCallback(
    async ({ userInput, assistantInternalId, priorTurns }) => {
      if (!socket?.id) {
        toastError('Socket connection not available');
        return;
      }
      if (!selectedModel?.name) {
        toastError('No model selected');
        return;
      }
      const stream_id = uuidv4();
      const messageId = uuidv4();
      activeMessageIdRef.current = assistantInternalId;
      // The backend mints its own stream_id (not this client one); latch it
      // from the first incoming event via awaitingStreamRef in the handler.
      activeStreamIdRef.current = null;
      activeTaskIdRef.current = null;
      awaitingStreamRef.current = true;
      setIsStreaming(true);

      try {
        const result = await generateContent({
          projectId,
          sid: socket.id,
          message_id: messageId,
          stream_id,
          instructions: instructionsRef.current,
          user_input: userInput,
          chat_history: priorTurns,
          llm_settings: {
            model_name: selectedModel.name,
            model_project_id: selectedModel.project_id,
            temperature: llmSettings.temperature ?? DEFAULT_TEMPERATURE,
            max_tokens: llmSettings.max_tokens ?? DEFAULT_MAX_TOKENS,
          },
        }).unwrap();
        if (result?.error) throw new Error(result.error);
        if (result?.task_id) activeTaskIdRef.current = result.task_id;
      } catch (err) {
        toastError(buildErrorMessage(err) || 'Failed to generate response');
        finishStreaming();
      }
    },
    [finishStreaming, generateContent, llmSettings, projectId, selectedModel, socket?.id, toastError],
  );

  // Build a user+assistant message pair with the real logged-in user identity.
  const buildMessagePair = useCallback(
    question => {
      const newMessages = initializeNewMessages({
        question,
        question_id: uuidv4(),
        participant: syntheticParticipant,
        userId: currentUser?.id,
        name: currentUser?.name || currentUser?.email || 'You',
        avatar: currentUser?.avatar,
        isSendingToUser: false,
      });
      // Give the assistant message a stable id so per-message buttons work.
      if (newMessages[1] && !newMessages[1].id) newMessages[1].id = newMessages[1].internal_id;
      return newMessages;
    },
    [currentUser, syntheticParticipant],
  );

  const onSend = useCallback(
    async question => {
      const trimmed = (question || '').trim();
      if (!trimmed || isStreaming) return;

      const priorTurns = messagesToTurns(chat_history);
      const newMessages = buildMessagePair(trimmed);
      setChatHistory(prev => [...prev, ...newMessages]);
      await streamAnswer({
        userInput: trimmed,
        assistantInternalId: newMessages[1]?.internal_id,
        priorTurns,
      });
    },
    [buildMessagePair, chat_history, isStreaming, setChatHistory, streamAnswer],
  );

  const onStopGeneration = useCallback(() => {
    const taskId = activeTaskIdRef.current;
    if (taskId) {
      stopLlmTask({ projectId, task_id: taskId })
        .unwrap()
        .catch(() => {});
    }
    finishStreaming();
  }, [finishStreaming, projectId, stopLlmTask]);

  const onClearChat = useCallback(() => {
    setChatHistory([]);
  }, [setChatHistory]);

  // ---- Per-message actions (all stateless / client-side or re-run predict) ----
  const onCopyToClipboard = useCallback(
    async messageId => {
      const msg = (activeConversation.chat_history || []).find(m => m.id === messageId);
      const text =
        msg?.role === ROLES.User
          ? msg?.message_items?.find(i => i.item_type === 'text_message')?.item_details?.content ||
            msg?.content ||
            ''
          : msg?.content || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toastSuccess('Copied to clipboard');
      } catch {
        toastError('Failed to copy');
      }
    },
    [activeConversation.chat_history, toastSuccess, toastError],
  );

  const onDeleteMessage = useCallback(
    messageId => {
      setChatHistory(prev => prev.filter(m => m.id !== messageId));
    },
    [setChatHistory],
  );

  // Regenerate: re-run predict_llm into the same assistant bubble using the
  // linked user question and the turns that preceded it.
  const onRegenerateAnswer = useCallback(
    async messageId => {
      if (isStreaming) return;
      const history = activeConversation.chat_history || [];
      const answerIdx = history.findIndex(m => m.id === messageId);
      if (answerIdx === -1) return;
      const answer = history[answerIdx];
      const userMsg = history.find(m => m.id === answer.question_id) || history[answerIdx - 1];
      const userInput =
        userMsg?.message_items?.find(i => i.item_type === 'text_message')?.item_details?.content ||
        userMsg?.content ||
        '';
      if (!userInput) return;
      const userIdx = history.findIndex(m => m.id === userMsg.id);
      const priorTurns = messagesToTurns(history.slice(0, userIdx));
      setChatHistory(prev =>
        prev.map(m => (m.id === messageId ? { ...m, content: '', isLoading: true, isStreaming: true } : m)),
      );
      await streamAnswer({ userInput, assistantInternalId: answer.internal_id, priorTurns });
    },
    [activeConversation.chat_history, isStreaming, setChatHistory, streamAnswer],
  );

  // Edit a user message + resend: truncate from that turn and re-run.
  const onSubmitEditedMessage = useCallback(
    async (messageId, updatedItems) => {
      if (isStreaming) return;
      const history = activeConversation.chat_history || [];
      const idx = history.findIndex(m => m.id === messageId);
      if (idx === -1) return;
      const newText = extractEditedText(updatedItems).trim();
      if (!newText) return;
      const priorTurns = messagesToTurns(history.slice(0, idx));
      const newMessages = buildMessagePair(newText);
      setChatHistory([...history.slice(0, idx), ...newMessages]);
      await streamAnswer({
        userInput: newText,
        assistantInternalId: newMessages[1]?.internal_id,
        priorTurns,
      });
    },
    [activeConversation.chat_history, buildMessagePair, isStreaming, setChatHistory, streamAnswer],
  );

  // Read-aloud: client-side Web Speech API (no backend).
  const onAutoSpeak = useCallback(text => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(text));
    } catch {
      /* TTS unsupported — ignore */
    }
  }, []);

  const shouldDisableClear = !chat_history.length || isStreaming;

  const styles = useMemo(() => skillTestPanelStyles(isFullScreenChat), [isFullScreenChat]);

  return (
    <ContentContainer sx={styles.container}>
      <Box sx={styles.mainContainer}>
        <Box sx={styles.topBarContainer}>
          <Box sx={styles.controlsContainer}>
            <FullScreenToggle
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={setIsFullScreenChat}
            />
            <ChatButton.ClearChatButton
              disabled={shouldDisableClear}
              onClear={onClearChat}
            />
          </Box>
        </Box>

        <ChatBodyContainer sx={styles.chatBoxContainer}>
          <ChatMessageList
            sx={styles.messageList}
            chat_history={chat_history}
            activeConversation={activeConversation}
            isStreaming={isStreaming}
            userId={currentUser?.id}
            onCopyToClipboard={onCopyToClipboard}
            onDeleteAnswer={onDeleteMessage}
            onRegenerateAnswer={onRegenerateAnswer}
            onSubmitEditedMessage={onSubmitEditedMessage}
            onAutoSpeak={onAutoSpeak}
          />
          <Box sx={styles.inputWrapper}>
            <NewChatInput
              isAgentsPage
              hideAttachments
              placeholder="Type your message..."
              onSend={onSend}
              isStreaming={isStreaming}
              onStopGeneration={onStopGeneration}
              modelList={modelList}
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              llmSettings={llmSettings}
              onSetLLMSettings={onSetLLMSettings}
              projectId={projectId}
            />
          </Box>
        </ChatBodyContainer>
      </Box>
    </ContentContainer>
  );
});

SkillTestPanel.displayName = 'SkillTestPanel';

/** @type {MuiSx} */
const skillTestPanelStyles = isFullScreenChat => ({
  container: {
    height: isFullScreenChat ? 'calc(100vh - 6.5625rem)' : '100% !important',
  },
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.75rem',
  },
  topBarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    width: '100%',
  },
  controlsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  // Reuse ChatBox's ChatBodyContainer (16px rounded border + eliteaDefault bg);
  // just make it fill the column and stretch its children full-width.
  chatBoxContainer: {
    flex: 1,
    minHeight: 0,
    alignItems: 'stretch',
  },
  messageList: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0.5rem 0.5rem 0.5rem',
    gap: '0.5rem',
  },
});

export default SkillTestPanel;
