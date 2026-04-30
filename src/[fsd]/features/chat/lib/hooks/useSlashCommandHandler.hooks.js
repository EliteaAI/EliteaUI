import { useCallback, useRef, useState } from 'react';

/** Pure utility: convert a committed mention entry to a toolkit object. */
const toolkitFromMention = mention => ({
  id: mention.toolkit_id,
  project_id: mention.project_id,
  name: mention.toolkit_name,
  type: mention.toolkit_type,
  settings: mention.toolkit_settings,
});

/**
 * Manages "/" slash-mention state in the chat input.
 *
 * Phases:
 *   'idle'    → no active slash mention
 *   'toolkit' → user typed "/" and is filtering toolkits by name
 *   'tool'    → user selected a toolkit and is optionally filtering its tools
 *
 * Design principle — single source of truth:
 *   syncWithValue() parses the actual textarea text on every onChange.
 *   onKeyDown() only handles two things that require immediate response before
 *   the textarea value updates: '/' (to open the dropdown at once) and Escape.
 *   No character accumulation is done in onKeyDown.
 *
 * committedMentions: [{toolkit_id, project_id, toolkit_name, toolkit_type, toolkit_settings, tool_name}]
 * These are passed as mentioned_toolkits in the socket payload when the message is sent.
 * Call clearMentions() after a successful send.
 *
 * mentionAnchorRef: character index in the full text where the currently-editing mention starts.
 * Exposed so useSlashMention can perform correct text replacements even when
 * the mention is in the middle of the input (multi-mention editing).
 */

export const useSlashCommandHandler = ({ setInputContent }) => {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'toolkit' | 'tool'
  // phaseRef mirrors phase so onKeyDown/syncWithValue always read the latest value
  // without needing phase in their dependency arrays (avoids stale closures).
  const phaseRef = useRef('idle');

  const [toolkitQuery, setToolkitQuery] = useState('');
  const [toolQuery, setToolQuery] = useState('');
  const [selectedToolkit, setSelectedToolkit] = useState(null); // {id, project_id, name, type, settings}
  const [committedMentions, setCommittedMentions] = useState([]);
  const [isQueryFinal, setIsQueryFinal] = useState(false);

  // When in toolkit phase and a second '/' is detected in the text (fullMatch),
  // this stores the tool-query portion so selectToolkit can seed toolQuery correctly.
  const pendingToolQueryRef = useRef('');

  // Remembers the last selected toolkit for the regex fallback path in idle phase.
  const lastToolkitRef = useRef(null);

  // committedMentionsRef mirrors committedMentions so syncWithValue can always
  // read the latest value without listing it in the dependency array.
  const committedMentionsRef = useRef([]);

  // Character index in the full text where the currently-editing mention starts (the '/').
  // Set when first entering slash mode, cleared on resetSlash.
  // Exposed to useSlashMention so text replacements always target the correct range,
  // even when the mention is in the middle of the input.
  const mentionAnchorRef = useRef(null);

  const getCommitedMentions = useCallback((prevCommitedMentions, newMention) => {
    const existingMention = prevCommitedMentions.find(
      mention => mention.toolkit_id === newMention.toolkit_id && mention.project_id === newMention.project_id,
    );
    if (existingMention) {
      return prevCommitedMentions.map(mention => {
        if (mention.toolkit_id === newMention.toolkit_id && mention.project_id === newMention.project_id) {
          return newMention;
        }
        return mention;
      });
    }
    return [...prevCommitedMentions, { ...newMention }];
  }, []);

  const resetSlash = useCallback(() => {
    phaseRef.current = 'idle';
    setPhase('idle');
    setToolkitQuery('');
    setToolQuery('');
    setSelectedToolkit(null);
    setIsQueryFinal(false);
    pendingToolQueryRef.current = '';
    mentionAnchorRef.current = null;
  }, []);

  /**
   * Handles keypresses that need an immediate reaction before the textarea value updates.
   * - '/' in idle  → open toolkit dropdown right away (before onChange fires)
   * - '/' in toolkit → mark isQueryFinal so the auto-select effect runs
   * - Escape        → dismiss
   * Everything else is handled by syncWithValue.
   */
  const onKeyDown = useCallback(
    event => {
      const { key } = event;
      const currentPhase = phaseRef.current;

      if (currentPhase === 'idle' && key === '/') {
        phaseRef.current = 'toolkit';
        setPhase('toolkit');
        setToolkitQuery('');
        setIsQueryFinal(false);
        // mentionAnchorRef is set by syncWithValue on the subsequent onChange.
        return;
      }

      if (currentPhase === 'toolkit' && key === '/') {
        // User typed the separator slash — signal that the toolkit name is complete.
        setIsQueryFinal(true);
        return;
      }

      if (key === 'Escape' && currentPhase !== 'idle') {
        resetSlash();
      }
    },
    [resetSlash],
  );

  // ── Idle phase helpers ───────────────────────────────────────────────────────

  /** Remove a mention from state+ref by toolkit identity. */
  const uncommitMention = useCallback((toolkitId, projectId) => {
    setCommittedMentions(prev => {
      const next = prev.filter(m => !(m.toolkit_id === toolkitId && m.project_id === projectId));
      committedMentionsRef.current = next;
      return next;
    });
  }, []);

  /**
   * Handles /toolkitName/toolQuery — re-enters tool phase from a committed mention.
   * Returns true if it handled the case.
   */
  const tryReEnterToolPhaseFromMention = useCallback(
    (textToCursor, mention) => {
      const fullPrefix = '/' + mention.toolkit_name + '/';
      const prefixIdx = textToCursor.lastIndexOf(fullPrefix);
      if (prefixIdx === -1) return false;

      const toolQueryPart = textToCursor.slice(prefixIdx + fullPrefix.length);
      if (/[\s/]/.test(toolQueryPart)) return false;

      const toolkit = toolkitFromMention(mention);
      uncommitMention(mention.toolkit_id, mention.project_id);
      setSelectedToolkit(toolkit);
      lastToolkitRef.current = toolkit;
      setToolkitQuery(mention.toolkit_name);
      setToolQuery(toolQueryPart);
      phaseRef.current = 'tool';
      setPhase('tool');
      setIsQueryFinal(false);
      if (mentionAnchorRef.current === null) mentionAnchorRef.current = prefixIdx;
      return true;
    },
    [uncommitMention],
  );

  /**
   * Handles /toolkitName (no separator) — re-enters toolkit phase from a committed mention.
   * Returns true if it handled the case.
   */
  const tryReEnterToolkitPhaseFromMention = useCallback(
    (textToCursor, mention) => {
      const nameOnly = '/' + mention.toolkit_name;
      const nameIdx = textToCursor.lastIndexOf(nameOnly);
      if (nameIdx === -1) return false;
      if (!/^[^\s/]*$/.test(textToCursor.slice(nameIdx + nameOnly.length))) return false;

      uncommitMention(mention.toolkit_id, mention.project_id);
      lastToolkitRef.current = toolkitFromMention(mention);
      setToolkitQuery(mention.toolkit_name);
      phaseRef.current = 'toolkit';
      setPhase('toolkit');
      setIsQueryFinal(false);
      if (mentionAnchorRef.current === null) mentionAnchorRef.current = nameIdx;
      return true;
    },
    [uncommitMention],
  );

  /**
   * Handles the regex full-match path (/toolkitName/toolQuery) when no committed
   * mention loop matched. Resolves via committed mention, lastToolkitRef, or unknown.
   */
  const syncIdleHandleFullMatch = useCallback(
    (textToCursor, cursorPos, fullMatch) => {
      const detectedName = fullMatch[1].toLowerCase();
      const committedMatch = committedMentionsRef.current.find(
        m => m.toolkit_name.toLowerCase() === detectedName,
      );

      if (committedMatch) {
        const toolkit = toolkitFromMention(committedMatch);
        uncommitMention(committedMatch.toolkit_id, committedMatch.project_id);
        setSelectedToolkit(toolkit);
        lastToolkitRef.current = toolkit;
        setToolkitQuery(fullMatch[1]);
        setToolQuery(fullMatch[2]);
        phaseRef.current = 'tool';
        setPhase('tool');
        setIsQueryFinal(false);
      } else if (lastToolkitRef.current && lastToolkitRef.current.name.toLowerCase() === detectedName) {
        // Fallback to lastToolkitRef (handles paste/backspace for most-recent toolkit).
        setSelectedToolkit(lastToolkitRef.current);
        setToolkitQuery(fullMatch[1]);
        setToolQuery(fullMatch[2]);
        phaseRef.current = 'tool';
        setPhase('tool');
        setIsQueryFinal(false);
      } else {
        // Unknown toolkit name — enter toolkit phase; auto-select will resolve it.
        pendingToolQueryRef.current = fullMatch[2];
        setToolkitQuery(fullMatch[1]);
        phaseRef.current = 'toolkit';
        setPhase('toolkit');
        setIsQueryFinal(true);
      }

      if (mentionAnchorRef.current === null) {
        mentionAnchorRef.current = (cursorPos ?? textToCursor.length) - fullMatch[0].length;
      }
    },
    [uncommitMention],
  );

  /**
   * Handles the regex toolkit-only match (/toolkitName, no separator).
   * Covers backspace/paste; normal '/' keypress is handled in onKeyDown.
   */
  const syncIdleHandleToolkitOnlyMatch = useCallback((textToCursor, cursorPos, toolkitOnlyMatch) => {
    setToolkitQuery(toolkitOnlyMatch[1]);
    phaseRef.current = 'toolkit';
    setPhase('toolkit');
    setIsQueryFinal(false);
    if (mentionAnchorRef.current === null) {
      mentionAnchorRef.current = (cursorPos ?? textToCursor.length) - toolkitOnlyMatch[0].length;
    }
  }, []);

  /**
   * Last-resort fallback for space-containing toolkit names being partially backspaced.
   * Uses the position of the last '/' to find a matching committed mention or lastToolkitRef.
   */
  const syncIdleHandleLastSlashFallback = useCallback(
    textToCursor => {
      const lastSlashIdx = textToCursor.lastIndexOf('/');
      if (lastSlashIdx === -1) return;

      const afterSlash = textToCursor.slice(lastSlashIdx + 1);
      if (afterSlash.length === 0 || afterSlash.endsWith(' ')) return;

      for (const mention of committedMentionsRef.current) {
        if (mention.toolkit_name.toLowerCase().startsWith(afterSlash.toLowerCase())) {
          uncommitMention(mention.toolkit_id, mention.project_id);
          lastToolkitRef.current = toolkitFromMention(mention);
          setToolkitQuery(afterSlash);
          phaseRef.current = 'toolkit';
          setPhase('toolkit');
          setIsQueryFinal(false);
          if (mentionAnchorRef.current === null) mentionAnchorRef.current = lastSlashIdx;
          return;
        }
      }

      // Committed mention already removed — fall back to lastToolkitRef.
      if (
        lastToolkitRef.current &&
        lastToolkitRef.current.name.toLowerCase().startsWith(afterSlash.toLowerCase())
      ) {
        setToolkitQuery(afterSlash);
        phaseRef.current = 'toolkit';
        setPhase('toolkit');
        setIsQueryFinal(false);
        if (mentionAnchorRef.current === null) mentionAnchorRef.current = lastSlashIdx;
      }
    },
    [uncommitMention],
  );

  // ── Idle phase ───────────────────────────────────────────────────────────────
  //
  // Four strategies to re-enter toolkit/tool phase from idle:
  //   1. Committed-mention literal prefix loop (handles space-containing names)
  //   2. Regex full match: /toolkitName/toolQuery
  //   3. Regex toolkit-only match: /toolkitName
  //   4. lastSlashIdx fallback (space-containing names partially backspaced)
  const syncIdlePhase = useCallback(
    (textToCursor, cursorPos, fullMatch, toolkitOnlyMatch) => {
      for (const mention of committedMentionsRef.current) {
        if (tryReEnterToolPhaseFromMention(textToCursor, mention)) return;
        if (tryReEnterToolkitPhaseFromMention(textToCursor, mention)) return;
      }

      if (fullMatch) return syncIdleHandleFullMatch(textToCursor, cursorPos, fullMatch);
      if (toolkitOnlyMatch) return syncIdleHandleToolkitOnlyMatch(textToCursor, cursorPos, toolkitOnlyMatch);
      syncIdleHandleLastSlashFallback(textToCursor);
    },
    [
      tryReEnterToolPhaseFromMention,
      tryReEnterToolkitPhaseFromMention,
      syncIdleHandleFullMatch,
      syncIdleHandleToolkitOnlyMatch,
      syncIdleHandleLastSlashFallback,
    ],
  );

  // ── Toolkit phase ────────────────────────────────────────────────────────────
  const syncToolkitPhase = useCallback(
    (textToCursor, cursorPos, fullMatch, toolkitOnlyMatch) => {
      if (fullMatch) {
        // Second slash appeared (typed or pasted) — toolkit name is final.
        pendingToolQueryRef.current = fullMatch[2];
        setToolkitQuery(fullMatch[1]);
        setIsQueryFinal(true);
      } else if (toolkitOnlyMatch) {
        // Toolkit name is still being typed.
        setToolkitQuery(toolkitOnlyMatch[1]);
        setIsQueryFinal(false);
      } else {
        // Before dismissing, check if the partial text still prefixes a committed mention
        // or the last selected toolkit (handles space-containing names the regex can't detect).
        let kept = false;
        if (mentionAnchorRef.current !== null) {
          const fragment = textToCursor.slice(mentionAnchorRef.current);
          if (fragment.startsWith('/') && fragment.length > 1) {
            const afterSlash = fragment.slice(1);
            if (!afterSlash.includes('/') && !afterSlash.endsWith(' ')) {
              const partialCommit = committedMentionsRef.current.find(m =>
                m.toolkit_name.toLowerCase().startsWith(afterSlash.toLowerCase()),
              );
              const partialLast =
                lastToolkitRef.current &&
                lastToolkitRef.current.name.toLowerCase().startsWith(afterSlash.toLowerCase());
              if (partialCommit || partialLast) {
                setToolkitQuery(afterSlash);
                setIsQueryFinal(false);
                kept = true;
              }
            }
          }
        }
        if (!kept) resetSlash();
      }
      // Set anchor on the first syncWithValue call in toolkit phase
      // (covers fresh '/' pressed — onKeyDown enters toolkit but doesn't set anchor).
      if (mentionAnchorRef.current === null && (fullMatch || toolkitOnlyMatch)) {
        const match = fullMatch || toolkitOnlyMatch;
        mentionAnchorRef.current = (cursorPos ?? textToCursor.length) - match[0].length;
      }
    },
    [resetSlash],
  );

  // ── Tool phase ───────────────────────────────────────────────────────────────
  const syncToolPhase = useCallback(
    textToCursor => {
      if (!selectedToolkit) {
        resetSlash();
        return;
      }
      // Use textToCursor so editing a mention in the middle of the input is tracked
      // correctly — the tool query is the portion from the prefix end to the cursor.
      const toolkitPrefix = '/' + selectedToolkit.name + '/';
      const prefixIdx = textToCursor.lastIndexOf(toolkitPrefix);

      if (prefixIdx !== -1) {
        const toolQueryPart = textToCursor.slice(prefixIdx + toolkitPrefix.length);
        // A space or extra '/' after the prefix means the mention is finished.
        if (/[\s/]/.test(toolQueryPart)) {
          resetSlash();
        } else {
          setToolQuery(toolQueryPart);
        }
        return;
      }

      // Prefix not found — check if the separator '/' was just deleted.
      const toolkitNameOnly = '/' + selectedToolkit.name;
      const nameIdx = textToCursor.lastIndexOf(toolkitNameOnly);
      const afterName = nameIdx !== -1 ? textToCursor.slice(nameIdx + toolkitNameOnly.length) : null;

      if (afterName !== null && afterName.trim() === '') {
        // Separator deleted — commit as toolkit-only mention (no specific tool).
        setCommittedMentions(prev => {
          const next = getCommitedMentions(prev, {
            toolkit_id: selectedToolkit.id,
            project_id: selectedToolkit.project_id,
            toolkit_name: selectedToolkit.name,
            toolkit_type: selectedToolkit.type,
            toolkit_settings: selectedToolkit.settings,
            tool_name: null,
          });
          committedMentionsRef.current = next;
          return next;
        });
        resetSlash();
        return;
      }

      // Check if user is backspacing through a space-containing toolkit name.
      // Use mentionAnchorRef for precise fragment detection.
      let reEntered = false;
      if (mentionAnchorRef.current !== null) {
        const fragment = textToCursor.slice(mentionAnchorRef.current);
        if (fragment.startsWith('/') && fragment.length > 1) {
          const afterSlash = fragment.slice(1);
          if (
            !afterSlash.includes('/') &&
            !afterSlash.endsWith(' ') &&
            selectedToolkit.name.toLowerCase().startsWith(afterSlash.toLowerCase())
          ) {
            // Partial toolkit name — user is backspacing into it. Re-enter toolkit phase.
            setCommittedMentions(prev => {
              const next = prev.filter(
                m => !(m.toolkit_id === selectedToolkit.id && m.project_id === selectedToolkit.project_id),
              );
              committedMentionsRef.current = next;
              return next;
            });
            setToolkitQuery(afterSlash);
            phaseRef.current = 'toolkit';
            setPhase('toolkit');
            setIsQueryFinal(false);
            reEntered = true;
          }
        }
      }
      if (!reEntered) resetSlash();
    },
    [resetSlash, selectedToolkit, getCommitedMentions],
  );

  /**
   * Sync hook state from the actual textarea value on every onChange.
   * This is the authoritative state update path — handles typing, backspace,
   * Delete, cut, and paste uniformly.
   *
   * @param {string} text      - current full input text
   * @param {number} [cursorPos] - current cursor position (selectionStart after the change).
   *   When provided, matching uses text.slice(0, cursorPos) so that editing an earlier
   *   mention in the middle of the input is detected correctly.
   *   When omitted, falls back to full-text matching (original behaviour).
   *
   * Regex patterns (matched at end of textToCursor):
   *   fullMatch        → /toolkitName/toolQuery   (toolQuery may be empty)
   *   toolkitOnlyMatch → /toolkitName             (no second slash yet)
   *
   * Note: both patterns also match a bare "/" (empty name/query), which intentionally
   * keeps the dropdown visible immediately after the slash is typed.
   */
  const syncWithValue = useCallback(
    (text, cursorPos) => {
      const currentPhase = phaseRef.current;

      // Use text up to the cursor for detection so that editing an earlier mention
      // in the middle of the input doesn't get confused by later mentions.
      const textToCursor = cursorPos != null ? text.slice(0, cursorPos) : text;

      // /word/word2 or /word/ (toolQuery empty after second slash)
      const fullMatch = textToCursor.match(/\/([^/\s]+)\/([^/\s]*)$/);
      // /word (no second slash); also matches bare "/" (empty name)
      const toolkitOnlyMatch = !fullMatch && textToCursor.match(/\/([^/\s]*)$/);

      if (currentPhase === 'idle') return syncIdlePhase(textToCursor, cursorPos, fullMatch, toolkitOnlyMatch);
      if (currentPhase === 'toolkit')
        return syncToolkitPhase(textToCursor, cursorPos, fullMatch, toolkitOnlyMatch);
      if (currentPhase === 'tool') return syncToolPhase(textToCursor);
    },
    [syncIdlePhase, syncToolkitPhase, syncToolPhase],
  );

  /**
   * Called when the user selects a toolkit from the dropdown.
   * Advances to 'tool' phase so the user can optionally narrow to a specific tool.
   */
  const selectToolkit = useCallback(
    toolkit => {
      lastToolkitRef.current = toolkit;
      setSelectedToolkit(toolkit);
      phaseRef.current = 'tool';
      setPhase('tool');
      // Seed toolQuery from whatever was typed after the second '/' (may be '').
      setToolQuery(pendingToolQueryRef.current);
      pendingToolQueryRef.current = '';
      setIsQueryFinal(false);
      setCommittedMentions(prev => {
        const next = getCommitedMentions(prev, {
          toolkit_id: toolkit.id,
          project_id: toolkit.project_id,
          toolkit_name: toolkit.name,
          toolkit_type: toolkit.type,
          toolkit_settings: toolkit.settings,
          tool_name: null,
        });
        committedMentionsRef.current = next;
        return next;
      });
    },
    [getCommitedMentions],
  );

  /**
   * Commits the current mention.
   * toolName: null  → mention the entire toolkit (LLM picks the tool)
   * toolName: string → mention a specific tool
   */
  const commitMention = useCallback(
    (toolName = null) => {
      if (!selectedToolkit) return;

      setCommittedMentions(prev => {
        const next = getCommitedMentions(prev, {
          toolkit_id: selectedToolkit.id,
          project_id: selectedToolkit.project_id,
          toolkit_name: selectedToolkit.name,
          toolkit_type: selectedToolkit.type,
          toolkit_settings: selectedToolkit.settings,
          tool_name: toolName || null,
        });
        committedMentionsRef.current = next;
        return next;
      });
      resetSlash();
    },
    [selectedToolkit, resetSlash, getCommitedMentions],
  );

  /** Remove a specific mention by index (e.g., user clicks × on a chip). */
  const removeMention = useCallback(index => {
    setCommittedMentions(prev => {
      const next = prev.filter((_, i) => i !== index);
      committedMentionsRef.current = next;
      return next;
    });
  }, []);

  /** Call after a successful message send to clear the pending mentions. */
  const clearMentions = useCallback(() => {
    setCommittedMentions([]);
    committedMentionsRef.current = [];
    setInputContent?.('');
  }, [setInputContent]);

  return {
    phase,
    toolkitQuery,
    toolQuery,
    selectedToolkit,
    committedMentions,
    isQueryFinal,
    onKeyDown,
    syncWithValue,
    selectToolkit,
    commitMention,
    removeMention,
    clearMentions,
    resetSlash,
    mentionAnchorRef,
  };
};
