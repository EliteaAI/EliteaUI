import { useCallback, useRef, useState } from 'react';

/**
 * State machine for "/" slash-mention in the agent instructions textarea.
 *
 * Phases:
 *   'idle'  → no active mention
 *   'items' → user typed "/" and is filtering agents/pipelines/toolkits/MCPs
 *   'tools' → user selected a toolkit/MCP; filtering its specific tools
 *
 * committedMentions: [{name, tool_name}]
 *   name      — agent/toolkit name (appears as /name in text)
 *   tool_name — specific tool within a toolkit (null for agents/pipelines or
 *               when the whole toolkit is mentioned)
 *
 * Token written to textarea:
 *   agent/pipeline              → "/Name "
 *   toolkit without specific tool → "/Name "
 *   toolkit with specific tool  → "/Name#ToolName "
 *
 * mentionAnchorRef: character index of the leading "/" in the current mention.
 */
export const useInstructionsSlashCommand = () => {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'items' | 'tools'
  const phaseRef = useRef('idle');

  const [itemQuery, setItemQuery] = useState('');
  const [toolQuery, setToolQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null); // toolkit/MCP being drilled into
  const [committedMentions, setCommittedMentions] = useState([]);

  const committedMentionsRef = useRef([]);

  // Character index of the leading "/" that started this mention.
  const mentionAnchorRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const resetSlash = useCallback(() => {
    phaseRef.current = 'idle';
    setPhase('idle');
    setItemQuery('');
    setToolQuery('');
    setSelectedItem(null);
    mentionAnchorRef.current = null;
  }, []);

  const resetAll = useCallback(() => {
    phaseRef.current = 'idle';
    setPhase('idle');
    setItemQuery('');
    setToolQuery('');
    setSelectedItem(null);
    mentionAnchorRef.current = null;
    setCommittedMentions([]);
    committedMentionsRef.current = [];
  }, []);

  const upsertMention = useCallback((name, tool_name = null) => {
    setCommittedMentions(prev => {
      const existing = prev.find(m => m.name === name);
      const next = existing
        ? prev.map(m => (m.name === name ? { name, tool_name } : m))
        : [...prev, { name, tool_name }];
      committedMentionsRef.current = next;
      return next;
    });
  }, []);

  const uncommitByName = useCallback(name => {
    setCommittedMentions(prev => {
      const next = prev.filter(m => m.name !== name);
      committedMentionsRef.current = next;
      return next;
    });
  }, []);

  // ── Keyboard handler ─────────────────────────────────────────────────────────

  /**
   * Handle "/" and "Escape" before the textarea value updates.
   * Everything else is handled in syncWithValue.
   */
  const onKeyDown = useCallback(
    event => {
      const { key } = event;
      const current = phaseRef.current;

      if (current === 'idle' && key === '/') {
        phaseRef.current = 'items';
        setPhase('items');
        setItemQuery('');
        // For a textarea, selectionStart is the position where '/' will be inserted.
        // For CodeMirror the property is absent — anchor is set later in syncWithValue.
        mentionAnchorRef.current = event.target?.selectionStart ?? null;
        return;
      }

      if (key === 'Escape' && current !== 'idle') {
        resetSlash();
      }
    },
    [resetSlash],
  );

  // ── Sync ─────────────────────────────────────────────────────────────────────

  /**
   * Called on every input event with the current textarea text and cursor position.
   * Keeps hook state in sync with what the user actually typed.
   *
   * cursorPos is the caret offset in `text`. All pattern matching is performed
   * on textToCursor (= text.slice(0, cursorPos)) so that mid-text mentions work
   * correctly — the user can type "/" at any cursor position, not just at the end.
   *
   * Regex patterns (matched at end of textToCursor):
   *   fullMatch       → /name#toolQuery   (# separator for instructions)
   *   itemOnlyMatch   → /name             (no # yet)
   */
  const syncWithValue = useCallback(
    (text, cursorPos) => {
      const pos = cursorPos ?? text.length;
      const textToCursor = text.slice(0, pos);
      const current = phaseRef.current;

      if (current === 'idle') {
        // Detect backspace into a committed mention.
        const fullMatch = textToCursor.match(/\/([^#\s]+)#([^#\s]*)$/);
        const itemOnlyMatch = !fullMatch && textToCursor.match(/\/([^#\s]*)$/);

        if (fullMatch) {
          const name = fullMatch[1];
          const committedMatch = committedMentionsRef.current.find(
            m => m.name.toLowerCase() === name.toLowerCase(),
          );
          if (committedMatch) {
            uncommitByName(committedMatch.name);
            setSelectedItem({ name: committedMatch.name });
            setItemQuery(fullMatch[1]);
            setToolQuery(fullMatch[2]);
            phaseRef.current = 'tools';
            setPhase('tools');
            if (mentionAnchorRef.current === null) {
              mentionAnchorRef.current = pos - fullMatch[0].length;
            }
          }
        } else if (itemOnlyMatch) {
          const name = itemOnlyMatch[1];
          if (name.length > 0) {
            const committedMatch = committedMentionsRef.current.find(m =>
              m.name.toLowerCase().startsWith(name.toLowerCase()),
            );
            if (committedMatch) {
              uncommitByName(committedMatch.name);
              setItemQuery(name);
              phaseRef.current = 'items';
              setPhase('items');
              if (mentionAnchorRef.current === null) {
                mentionAnchorRef.current = pos - itemOnlyMatch[0].length;
              }
            }
          }
        } else {
          // Fallback for mention names that contain spaces (e.g. "Github mcp").
          // Check if textToCursor ends with a prefix of any committed mention token.
          for (const mention of committedMentionsRef.current) {
            const fullToken = mention.tool_name
              ? '/' + mention.name + '#' + mention.tool_name
              : '/' + mention.name;
            for (let len = fullToken.length; len >= 2; len--) {
              const candidate = fullToken.slice(0, len);
              if (!textToCursor.endsWith(candidate)) continue;
              const prevCharIdx = textToCursor.length - candidate.length - 1;
              const prevChar = prevCharIdx >= 0 ? textToCursor[prevCharIdx] : '';
              if (prevChar !== '' && !/\s/.test(prevChar)) break;
              const hashIdx = candidate.indexOf('#');
              if (hashIdx !== -1) {
                uncommitByName(mention.name);
                setSelectedItem({ name: mention.name });
                setItemQuery(mention.name);
                setToolQuery(candidate.slice(hashIdx + 1));
                phaseRef.current = 'tools';
                setPhase('tools');
                mentionAnchorRef.current = pos - candidate.length;
              } else {
                uncommitByName(mention.name);
                setItemQuery(candidate.slice(1));
                phaseRef.current = 'items';
                setPhase('items');
                mentionAnchorRef.current = pos - candidate.length;
              }
              return;
            }
          }
        }
        return;
      }

      if (current === 'items') {
        // When anchor is set and still points to '/', extract the query as the text
        // between the anchor and the cursor. This supports names with spaces.
        if (mentionAnchorRef.current !== null && text[mentionAnchorRef.current] === '/') {
          const afterAnchor = text.slice(mentionAnchorRef.current + 1, pos);
          const hashIdx = afterAnchor.indexOf('#');
          if (hashIdx !== -1) {
            setItemQuery(afterAnchor.slice(0, hashIdx));
            if (selectedItem) {
              setToolQuery(afterAnchor.slice(hashIdx + 1));
              phaseRef.current = 'tools';
              setPhase('tools');
            }
          } else if (afterAnchor.endsWith(' ') || afterAnchor.includes('\n')) {
            resetSlash();
          } else {
            setItemQuery(afterAnchor);
          }
          return;
        }

        const fullMatch = textToCursor.match(/\/([^#\s]+)#([^#\s]*)$/);
        const itemOnlyMatch = !fullMatch && textToCursor.match(/\/([^#\s]*)$/);

        if (fullMatch) {
          // User typed "#" — treat as a toolkit separator if we have a selected item.
          setItemQuery(fullMatch[1]);
          if (selectedItem) {
            setToolQuery(fullMatch[2]);
            phaseRef.current = 'tools';
            setPhase('tools');
          }
        } else if (itemOnlyMatch) {
          setItemQuery(itemOnlyMatch[1]);
          if (mentionAnchorRef.current === null) {
            mentionAnchorRef.current = pos - itemOnlyMatch[0].length;
          }
        } else {
          resetSlash();
        }
        return;
      }

      if (current === 'tools') {
        if (!selectedItem) {
          resetSlash();
          return;
        }
        const toolkitPrefix = '/' + selectedItem.name + '#';
        const prefixIdx = textToCursor.lastIndexOf(toolkitPrefix);
        if (prefixIdx !== -1) {
          const toolQueryPart = textToCursor.slice(prefixIdx + toolkitPrefix.length);
          if (/[\s#]/.test(toolQueryPart)) {
            resetSlash();
          } else {
            setToolQuery(toolQueryPart);
          }
          return;
        }
        // Separator deleted — fall back to items phase.
        const nameOnly = '/' + selectedItem.name;
        const nameIdx = textToCursor.lastIndexOf(nameOnly);
        if (nameIdx !== -1 && !/[\s#]/.test(textToCursor.slice(nameIdx + nameOnly.length))) {
          setItemQuery(selectedItem.name);
          phaseRef.current = 'items';
          setPhase('items');
        } else {
          // User may be backspacing into the name itself (e.g. "Github mcp" → "Github mc").
          // Check if textToCursor ends with a prefix of the toolkit name.
          let recovered = false;
          for (let len = nameOnly.length - 1; len >= 2; len--) {
            const candidate = nameOnly.slice(0, len);
            if (!textToCursor.endsWith(candidate)) continue;
            const prevCharIdx = textToCursor.length - candidate.length - 1;
            const prevChar = prevCharIdx >= 0 ? textToCursor[prevCharIdx] : '';
            if (prevChar !== '' && !/\s/.test(prevChar)) break;
            uncommitByName(selectedItem.name);
            setItemQuery(candidate.slice(1));
            phaseRef.current = 'items';
            setPhase('items');
            mentionAnchorRef.current = pos - candidate.length;
            recovered = true;
            break;
          }
          if (!recovered) resetSlash();
        }
      }
    },
    [resetSlash, selectedItem, uncommitByName],
  );

  // ── Selection handlers ────────────────────────────────────────────────────────

  /**
   * Called when the user picks an item from the dropdown.
   * For agents/pipelines: commit immediately and go idle.
   * For toolkits/MCPs: advance to 'tools' phase.
   *
   * @param {object} item - { name, type, settings?, agent_type? }
   * @param {boolean} isToolkit - true when item is a toolkit or MCP
   */
  const selectItem = useCallback(
    (item, isToolkit) => {
      if (!isToolkit) {
        // Agent or pipeline — commit directly.
        upsertMention(item.name, null);
        resetSlash();
        return;
      }
      // Toolkit or MCP — drill into tools phase.
      setSelectedItem(item);
      setItemQuery(item.name);
      setToolQuery('');
      upsertMention(item.name, null);
      phaseRef.current = 'tools';
      setPhase('tools');
    },
    [resetSlash, upsertMention],
  );

  /**
   * Commits the current toolkit mention with an optional specific tool.
   * toolName = null → whole toolkit is mentioned, no specific tool.
   */
  const commitMention = useCallback(
    (toolName = null) => {
      if (!selectedItem) return;
      upsertMention(selectedItem.name, toolName || null);
      resetSlash();
    },
    [selectedItem, upsertMention, resetSlash],
  );

  return {
    phase,
    itemQuery,
    toolQuery,
    selectedItem,
    committedMentions,
    onKeyDown,
    syncWithValue,
    selectItem,
    commitMention,
    resetSlash,
    resetAll,
    mentionAnchorRef,
  };
};
