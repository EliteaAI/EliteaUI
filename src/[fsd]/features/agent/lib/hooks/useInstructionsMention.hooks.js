import { useCallback, useMemo, useRef } from 'react';

import { useInstructionsSlashCommand } from './useInstructionsSlashCommand.hooks';

/**
 * Higher-level hook that wires the instructions slash-command state machine to
 * actual textarea text manipulation via the FileReaderInput component ref.
 *
 * @param {React.RefObject} fileReaderRef - ref to the FileReaderInput component
 *        (must expose getCursorPosition, replaceRange)
 */
export const useInstructionsMention = ({ fileReaderRef, mentionableItems = [] }) => {
  // Track input content via ref to avoid per-keystroke re-renders.
  const inputContentRef = useRef('');

  const {
    phase,
    itemQuery,
    toolQuery,
    selectedItem,
    onKeyDown,
    syncWithValue,
    selectItem,
    commitMention: slashCommitMention,
    resetSlash,
    resetAll,
    mentionAnchorRef,
  } = useInstructionsSlashCommand();

  // ── Text manipulation helpers ────────────────────────────────────────────────

  /**
   * Replace text in the textarea from anchor to cursorPos with replacement.
   * Falls back to append if the ref is not available.
   */
  const replaceFragment = useCallback(
    (replacement, endOverride) => {
      const ref = fileReaderRef?.current;
      if (!ref) return;

      const content = ref.getInputContent?.() ?? inputContentRef.current;
      const anchor = mentionAnchorRef.current ?? 0;
      const end = endOverride ?? ref.getCursorPosition?.() ?? content.length;

      ref.replaceRange?.(anchor, end, replacement);
      inputContentRef.current = content.slice(0, anchor) + replacement + content.slice(end);
    },
    // mentionAnchorRef and inputContentRef are refs — stable, excluded from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileReaderRef],
  );

  // ── Input change handler ─────────────────────────────────────────────────────

  const onInstructionsInputChange = useCallback(
    value => {
      inputContentRef.current = value;
      if (!value) {
        resetSlash();
        return;
      }
      // Read cursor position from the input element synchronously during the event.
      // Falls back to end-of-text so the existing end-of-text behavior is preserved.
      // fileReaderRef is a ref — stable, excluded from deps intentionally.
      const cursorPos = fileReaderRef?.current?.getCursorPosition?.() ?? value.length;
      syncWithValue(value, cursorPos);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncWithValue, resetSlash],
  );

  // ── Item (agent / toolkit / pipeline) selection ──────────────────────────────

  const onSelectItem = useCallback(
    (item, isToolkit) => {
      if (!isToolkit) {
        // Agent or pipeline: replace fragment and commit.
        const replacement = '/' + item.name + ' ';
        replaceFragment(replacement);
        selectItem(item, false);
        return;
      }
      // Toolkit/MCP: replace fragment with "/name" (no trailing space yet) and
      // advance to 'tools' phase.
      const replacement = '/' + item.name;
      replaceFragment(replacement);
      selectItem(item, true);
    },
    [replaceFragment, selectItem],
  );

  // ── Tool selection ────────────────────────────────────────────────────────────

  /**
   * Called when the user picks a specific tool (or passes null to commit
   * the whole toolkit without a specific tool).
   */
  const onSelectTool = useCallback(
    toolName => {
      if (toolName === null) {
        // Dismissed — commit toolkit-only mention.
        if (selectedItem) {
          const ref = fileReaderRef?.current;
          const content = ref?.getInputContent?.() ?? inputContentRef.current;
          const anchor = mentionAnchorRef.current ?? 0;
          // Find end of the toolkit name in text.
          const nameEnd = anchor + ('/' + selectedItem.name).length;
          const replacement = '/' + selectedItem.name + ' ';
          ref?.replaceRange?.(anchor, nameEnd, replacement);
          inputContentRef.current = content.slice(0, anchor) + replacement + content.slice(nameEnd);
        }
        slashCommitMention(null);
        return;
      }
      // Commit with specific tool.
      if (selectedItem) {
        const ref = fileReaderRef?.current;
        const content = ref?.getInputContent?.() ?? inputContentRef.current;
        const anchor = mentionAnchorRef.current ?? 0;
        // Locate the end of the toolkit prefix in text.
        const toolkitPrefix = '/' + selectedItem.name + '#';
        const prefixIdx = content.lastIndexOf(toolkitPrefix, anchor + toolkitPrefix.length + 50);
        let end;
        if (prefixIdx !== -1) {
          const afterPrefix = content.slice(prefixIdx + toolkitPrefix.length);
          const spaceIdx = afterPrefix.search(/[\s#]/);
          end = prefixIdx + toolkitPrefix.length + (spaceIdx === -1 ? afterPrefix.length : spaceIdx);
        } else {
          // Fallback: no # separator yet — end after the name.
          end = anchor + ('/' + selectedItem.name).length;
        }
        const replacement = '/' + selectedItem.name + '#' + toolName + ' ';
        ref?.replaceRange?.(anchor, end, replacement);
        inputContentRef.current = content.slice(0, anchor) + replacement + content.slice(end);
      }
      slashCommitMention(toolName);
    },
    // mentionAnchorRef and inputContentRef are refs — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileReaderRef, selectedItem, slashCommitMention],
  );

  // ── Available tools for the selected toolkit ──────────────────────────────────

  // When re-entering tools phase via backspace, selectedItem only has { name }.
  // Look up the full item (with settings/type) from mentionableItems.
  const resolvedSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.settings !== undefined) return selectedItem;
    return mentionableItems.find(item => item.name === selectedItem.name) ?? selectedItem;
  }, [selectedItem, mentionableItems]);

  const availableTools = useMemo(() => {
    if (!resolvedSelectedItem?.settings) return [];
    const isMcp = resolvedSelectedItem.type === 'mcp' || resolvedSelectedItem.type?.startsWith('mcp_');
    if (isMcp) {
      return (resolvedSelectedItem.settings.available_mcp_tools || []).map(item => ({
        name: item.value || item.label,
        description: item.description || '',
      }));
    }
    return (resolvedSelectedItem.settings.selected_tools || []).map(name => ({
      name,
      description: '',
    }));
  }, [resolvedSelectedItem]);

  const filteredTools = useMemo(
    () =>
      availableTools.filter(tool => !toolQuery || tool.name.toLowerCase().includes(toolQuery.toLowerCase())),
    [availableTools, toolQuery],
  );

  return {
    phase,
    itemQuery,
    toolQuery,
    selectedItem: resolvedSelectedItem,
    filteredTools,
    onKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    onSelectTool,
    resetSlash,
    resetMentionState: resetAll,
  };
};
