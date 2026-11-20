import { useEffect, useMemo, useRef } from 'react';

import { useConversationEditMutation } from '@/api';

const EMPTY_TOOLS = [];

const sameTools = (a = [], b = []) => a.length === b.length && a.every(tool => b.includes(tool));

/**
 * Keeps the agent Test chat's conversation modules equal to the editor's current MODULES selection, saved or
 * not, so a module turned on in the editor (e.g. Elitea Builder) works in the next turn of the same chat.
 */
export const useApplicationChatInternalTools = ({
  activeConversation,
  setActiveConversation,
  internalTools,
  projectId,
}) => {
  const [editConversation] = useConversationEditMutation();
  const editorTools = useMemo(() => internalTools || EMPTY_TOOLS, [internalTools]);
  const conversationId = activeConversation?.id;
  const conversationTools = activeConversation?.meta?.internal_tools || EMPTY_TOOLS;
  const meta = activeConversation?.meta;
  const pendingRef = useRef(null);

  useEffect(() => {
    if (!conversationId || sameTools(conversationTools, editorTools)) return;
    const key = `${conversationId}:${[...editorTools].sort().join(',')}`;
    if (pendingRef.current === key) return;
    pendingRef.current = key;

    const newMeta = { ...(meta || {}), internal_tools: [...editorTools] };
    setActiveConversation(prev => (prev?.id === conversationId ? { ...prev, meta: newMeta } : prev));
    editConversation({ projectId, id: conversationId, meta: newMeta }).finally(() => {
      if (pendingRef.current === key) pendingRef.current = null;
    });
  }, [
    conversationId,
    conversationTools,
    editorTools,
    meta,
    projectId,
    editConversation,
    setActiveConversation,
  ]);
};
