import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import {
  ChatParticipantType,
  ROLES,
  TOOL_ACTION_NAMES,
  TOOL_ACTION_TYPES,
  ToolActionStatus,
} from '@/common/constants';
import { convertJsonToString } from '@/common/utils';

export const isUserMessage = (author_participant_id, sent_to_id, userIds, reply_to_id, sent_to) => {
  return (
    userIds.includes(author_participant_id) ||
    userIds.includes(sent_to_id) ||
    (!sent_to_id && !reply_to_id) ||
    sent_to
  );
};

export const convertTime = time => {
  const timeStrings = time.split(' ');
  if (timeStrings.length > 1) {
    return timeStrings[0] + 'T' + timeStrings[1] + 'Z';
  }
  if (time.at(-1) === 'Z') {
    return time;
  }
  if (time.includes('+')) {
    return time;
  }
  return time + 'Z';
};

export const convertToUserQuestion = (message_group, users, participants) => {
  const {
    author_participant_id,
    content,
    message_items,
    created_at,
    uuid,
    sent_to_id,
    sent_to,
    likes,
    meta: { interaction_uuid },
  } = message_group;
  const foundUser = users.find(user => user.id === author_participant_id);
  const foundParticipant = participants.find(participant => participant.id === sent_to_id);

  // Improved logic for determining user availability
  // Only show "User No Longer Available" if the user is truly not found in participants
  // or if their entity_meta indicates they're inactive
  const getUserName = user => {
    if (!user) return 'User No Longer Available';
    // If user exists and has a name, return it
    if (user.meta?.user_name) return user.meta.user_name;
    // If user exists but no name, try to get it from entity_meta or use a generic name
    if (user.entity_meta?.email) return user.entity_meta.email;
    if (user.entity_meta?.id) return `User ${user.entity_meta.id}`;
    // Only show "User No Longer Available" as last resort
    return 'User No Longer Available';
  };

  return {
    id: uuid,
    role: ROLES.User,
    name: getUserName(foundUser),
    avatar: foundUser?.meta.user_avatar || '',
    content,
    message_items,
    created_at: new Date(convertTime(created_at)).getTime(),
    user_id: foundUser?.entity_meta.id,
    participant_id: sent_to_id,
    sentTo:
      foundParticipant ||
      (sent_to?.entity_name === ChatParticipantType.Users
        ? { entity_name: sent_to.entity_name, meta: { user_name: 'User No Longer Available' } }
        : undefined),
    likes,
    interaction_uuid,
  };
};

export const convertToPlayerQuestion = (message_group, playerInfo, participants) => {
  const { content, message_items, created_at, uuid, sent_to_id, author_participant_id, likes } =
    message_group;
  const sentToParticipant = participants.find(participant => participant.id === sent_to_id);
  const authorParticipant = participants.find(participant => participant.id === author_participant_id);
  const { user, firstUserMessage } = playerInfo;
  let name = authorParticipant?.meta.user_name || 'You';
  let avatar = authorParticipant?.meta.user_avatar || '';
  if (firstUserMessage?.author_participant_id === authorParticipant?.id) {
    name = user.name;
    avatar = user.avatar;
  }
  return {
    id: uuid,
    role: ROLES.User,
    name,
    avatar,
    content,
    message_items: [...message_items].sort((a, b) => a.id - b.id),
    created_at: new Date(convertTime(created_at)).getTime(),
    user_id: authorParticipant.id,
    participant_id: sent_to_id,
    sentTo: sentToParticipant,
    likes,
  };
};

export const convertToAIAnswer = (message_group, message_groups, participants) => {
  const {
    author_participant_id,
    content,
    message_items = [],
    created_at,
    updated_at,
    reply_to_id,
    uuid,
    is_streaming,
    meta,
    likes,
    id,
    question_id,
    task_id,
  } = message_group;
  const foundQuestion = message_groups.find(item => item.id === reply_to_id || question_id === item.id);
  const foundParticipant = participants?.find(participant => participant.id === author_participant_id);
  const { meta: { tools } = {} } = foundParticipant || { meta: {} };

  const {
    references = [],
    is_error = false,
    thinking_steps = [],
    tool_calls = [],
    first_tool_timestamp_start,
    error,
    context: { included: contextIncluded } = {},
  } = meta || {};
  const isSummarized = contextIncluded === false;
  const toolActions = [];
  const toolCalls = Object.values(tool_calls ?? {});
  const sortedSteps = [
    ...(thinking_steps?.map(step => ({ ...step, stepType: 'thinking_step' })) || []),
    ...toolCalls,
  ].sort(
    (a, b) =>
      new Date(a.timestamp_start || a.timestamp_finish).getTime() -
      new Date(b.timestamp_start || b.timestamp_finish).getTime(),
  );
  sortedSteps?.forEach((step, index) => {
    if (step.stepType === 'thinking_step') {
      // Handle thinking step
      const {
        text,
        thinking,
        message: { response_metadata: { model_name = '', tool_name = '' } = {} } = {
          additional_kwargs: {},
          content: '',
        },
        timestamp_start,
        timestamp_finish,
      } = step;

      // Skip empty thinking_steps (transition steps with no content)
      // Backend normalizes text field for all providers (OpenAI, Anthropic, etc.)
      if (!text || !text.trim()) {
        return;
      }

      toolActions.push({
        name: tool_name || TOOL_ACTION_NAMES.Llm,
        parent_agent_name: step.parent_agent_name || null,
        id: step.message.id,
        status: ToolActionStatus.complete,
        toolInputs: '',
        toolOutputs: text,
        toolMeta: {
          ls_model_name: model_name,
        },
        created_at:
          (!index ? first_tool_timestamp_start : undefined) ||
          timestamp_start ||
          timestamp_finish ||
          convertTime(created_at),
        ended_at: timestamp_finish || convertTime(created_at),
        timestamp: timestamp_finish || convertTime(created_at),
        content: text,
        thinking,
        type: TOOL_ACTION_TYPES.Llm,
      });
    } else {
      // Support both old format (toolkit___tool) and new format (clean tool names)
      const toolNameRaw = step.tool_name || step.name || '';
      const hasOldFormat = toolNameRaw.includes('___');
      // Raw sanitised key — kept for pipeline routing and backwards-compat fallback in handleToolAction
      const toolkitName =
        step.toolkit_name ||
        step.tool_meta?.metadata?.toolkit_name ||
        (hasOldFormat ? toolNameRaw.split('___')[0] : '');
      const toolkitType =
        step.toolkit_type ||
        step.tool_meta?.metadata?.toolkit_type ||
        step.metadata?.toolkit_type ||
        tools?.find(tool => tool.name === toolkitName || tool.toolkit_name === toolkitName)?.type ||
        '';
      toolActions.push({
        // When a lazy-loading wrapper was used, step.tool_name is the wrapper class name (e.g. "LazyLoading").
        // The SDK signals this via step.metadata.original_name. Prefer step.tool_meta.name which
        // holds the real tool name (e.g. "get_plan_status") to avoid confusing chip labels.
        name:
          step.metadata?.original_name && step.tool_meta?.name
            ? step.tool_meta.name
            : step.tool_name || step.name || 'Tool Call',
        original_name: ChatHelpers.getToolActionOriginalName(step.metadata),
        parent_agent_name: step.metadata?.parent_agent_name,
        id: step.tool_run_id,
        status: ToolActionStatus.complete,
        toolInputs: step.tool_inputs,
        toolOutputs: step.tool_output,
        toolMeta: {
          ls_model_name: step.tool_meta.model_name,
          toolkit_name: toolkitName,
          // display_name: human-readable label injected by SDK. handleToolAction prefers this over toolkit_name.
          // For old internal tool history without display_name, handleToolAction falls back to resolveInternalToolDisplayName.
          display_name: step.tool_meta?.display_name || step.tool_meta?.metadata?.display_name,
          toolkit_type: toolkitType,
          mcp_server_url: step.metadata?.mcp_server_url,
          langgraph_node: step.metadata?.langgraph_node,
          icon_meta: step.tool_meta?.icon_meta,
          agent_type: step.tool_meta?.metadata?.agent_type,
        },
        created_at:
          (!index ? first_tool_timestamp_start : undefined) ||
          step.timestamp_start ||
          convertTime(created_at),
        ended_at: step.timestamp_finish || convertTime(created_at),
        timestamp: step.timestamp_finish || convertTime(created_at),
        content: step.content || convertJsonToString(step.error ?? ''),
        type: TOOL_ACTION_TYPES.Tool,
        isError: !!step.error,
      });
    }
  }) || [];

  const displayTime = updated_at || created_at;
  return {
    id: uuid,
    role: ROLES.Assistant,
    message_items: [...message_items].sort((a, b) => a.id - b.id),
    content: is_streaming ? '...' : content,
    created_at: new Date(convertTime(displayTime)).getTime(),
    participant_id: author_participant_id,
    question_id: foundQuestion?.uuid || foundQuestion?.id,
    replyTo: foundQuestion,
    isStreaming: is_streaming,
    isLoading: is_streaming,
    exception: is_error ? error || content || message_items[0]?.item_details?.content : undefined,
    references,
    likes,
    interaction_uuid: foundQuestion?.meta?.interaction_uuid,
    originalId: id,
    task_id,
    toolActions,
    isSummarized,
  };
};

export const convertMessagesToChatHistory = (message_groups = [], participants = [], playerInfo) => {
  const sortedMessages = [...(message_groups || [])].sort((a, b) => {
    return a.created_at.toLowerCase().localeCompare(b.created_at.toLowerCase());
  });
  const users = participants.filter(participant => participant.entity_name === ChatParticipantType.Users);
  const userIds = users.map(user => user.id);

  // Separate child messages from parent messages
  // Child messages have meta.is_child_agent = true and meta.parent_message_id
  const childMessagesByParent = {};
  const parentMessages = [];

  sortedMessages.forEach(message_group => {
    const isChildAgent =
      message_group.meta?.is_child_agent === true || message_group.meta?.is_child_agent === 'true';
    const parentMessageId = message_group.meta?.parent_message_id;

    if (isChildAgent && parentMessageId) {
      // Group child messages by parent
      if (!childMessagesByParent[parentMessageId]) {
        childMessagesByParent[parentMessageId] = [];
      }
      childMessagesByParent[parentMessageId].push(message_group);
    } else {
      parentMessages.push(message_group);
    }
  });

  // Convert parent messages and attach their children as SwarmChild toolActions
  return parentMessages.map(message_group => {
    const { author_participant_id, sent_to_id, reply_to_id, sent_to, uuid } = message_group;
    const isUser = isUserMessage(author_participant_id, sent_to_id, userIds, reply_to_id, sent_to);

    if (isUser) {
      return !playerInfo
        ? convertToUserQuestion(message_group, users, participants)
        : convertToPlayerQuestion(message_group, playerInfo, participants);
    }

    // Convert AI answer
    const aiMessage = convertToAIAnswer(message_group, sortedMessages, participants);

    // Attach child messages as SwarmChild toolActions
    const childMessages = childMessagesByParent[uuid] || [];
    if (childMessages.length > 0) {
      const swarmChildActions = childMessages.map(child => {
        // Get text content from message_items (API uses 'text_message' as item_type)
        const textItem = child.message_items?.find(item => item.item_type === 'text_message');
        const content = textItem?.item_details?.content || child.content || '';

        return {
          id: child.uuid,
          name: child.meta?.child_agent_name || 'Child Agent',
          type: TOOL_ACTION_TYPES.SwarmChild,
          status: ToolActionStatus.complete,
          content,
          toolInputs: '',
          toolOutputs: content,
          created_at: child.created_at,
          ended_at: child.created_at,
          timestamp: child.created_at,
          isSwarmChild: true,
          agentName: child.meta?.child_agent_name || 'Child Agent',
        };
      });

      // Prepend SwarmChild actions to toolActions (they should appear before other tools)
      aiMessage.toolActions = [...swarmChildActions, ...(aiMessage.toolActions || [])];
    }

    return aiMessage;
  });
};

export const convertConversationToChatHistory = (conversationDetails = {}) => {
  const { message_groups = [], participants = [] } = conversationDetails;
  return convertMessagesToChatHistory(message_groups, participants);
};
