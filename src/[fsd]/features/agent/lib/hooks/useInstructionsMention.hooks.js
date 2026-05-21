import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import {
  createMentionCmExtension,
  getItemDescription,
  isToolkitItem,
  parseMentionRanges,
} from '@/[fsd]/shared/lib/utils/instructionsMention.utils';
import { useToolsValidationInfo } from '@/hooks/application/useValidateApplicationVersion';
import { useTheme } from '@emotion/react';

import { useInstructionsSlashCommand } from './useInstructionsSlashCommand.hooks';

const { MentionPhase } = MentionConstants;

/**
 * Higher-level hook that wires the instructions slash-command state machine to
 * actual textarea text manipulation via the FileReaderInput component ref.
 *
 * @param {React.RefObject} fileReaderRef   - ref to the FileReaderInput component
 *        (must expose getCursorPosition, replaceRange)
 * @param {number}          applicationId   - current agent application ID
 * @param {number}          projectId       - current project ID
 * @param {object}          versionDetails  - version_details from Formik
 */
export const useInstructionsMention = ({ fileReaderRef, applicationId, projectId, versionDetails }) => {
  // Track input content via ref to avoid per-keystroke re-renders.
  const inputContentRef = useRef('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const theme = useTheme();

  // ── Mentionable items ─────────────────────────────────────────────────────

  const { toolsValidationInfo } = useToolsValidationInfo({
    applicationId,
    projectId,
    versionId: versionDetails?.id,
    tools: versionDetails?.tools,
  });

  const mentionableItems = useMemo(
    () =>
      (versionDetails?.tools || [])
        .filter(tool => !toolsValidationInfo[tool.id])
        .map(tool => ({
          name: tool.name,
          type: tool.type,
          agent_type: tool.agent_type,
          settings: tool.settings,
          isToolkit: isToolkitItem(tool),
          description: getItemDescription(tool),
        })),
    [versionDetails?.tools, toolsValidationInfo],
  );

  // ── Slash-command state machine ───────────────────────────────────────────

  const {
    phase,
    itemQuery,
    toolQuery,
    selectedItem,
    committedMentions,
    onKeyDown: slashOnKeyDown,
    syncWithValue,
    selectItem,
    commitMention: slashCommitMention,
    resetSlash,
    initCommittedMentions,
    mentionAnchorRef,
  } = useInstructionsSlashCommand();

  // Seed committedMentions from the saved instructions text when the version loads.
  // This enables backspace-into-mention detection to work on pre-existing tokens.
  useEffect(() => {
    const text = versionDetails?.instructions;
    if (!text || !mentionableItems.length) return;

    const mentions = [];
    const sortedItems = [...mentionableItems].sort((a, b) => b.name.length - a.name.length);

    for (const item of sortedItems) {
      const baseToken = '/' + item.name;
      let pos = text.indexOf(baseToken);
      while (pos !== -1) {
        const prevChar = pos > 0 ? text[pos - 1] : '';
        if (prevChar === '' || /\s/.test(prevChar)) {
          const after = text.slice(pos + baseToken.length);
          if (item.isToolkit && (after.startsWith('/') || after.startsWith('#'))) {
            const toolMatch = after.slice(1).match(/^([^\s/#]+)/);
            mentions.push({ name: item.name, tool_name: toolMatch ? toolMatch[1] : null });
          } else if (after === '' || /[\s/#]/.test(after[0])) {
            mentions.push({ name: item.name, tool_name: null });
          }
        }
        pos = text.indexOf(baseToken, pos + 1);
      }
    }

    const seen = new Set();
    const unique = mentions.filter(m => {
      const key = m.name + '::' + m.tool_name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    initCommittedMentions(unique);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionDetails?.id]);

  // ── Highlight ranges (textarea mirror overlay) ────────────────────────────

  const highlightRanges = useMemo(
    () => parseMentionRanges(versionDetails?.instructions ?? '', mentionableItems),
    [versionDetails?.instructions, mentionableItems],
  );

  // ── CodeMirror extension (full-screen editor) ─────────────────────────────

  const codeMirrorExtensions = useMemo(
    () => createMentionCmExtension(mentionableItems, theme.palette.text.info),
    [mentionableItems, theme.palette.text.info],
  );

  // ── Filtered suggestion lists ─────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!mentionableItems?.length) return [];
    if (!itemQuery) return mentionableItems;
    return mentionableItems.filter(item => item.name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [mentionableItems, itemQuery]);

  // ── Text manipulation helpers ─────────────────────────────────────────────

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

  // ── Input change handler ──────────────────────────────────────────────────

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

  // ── Item (agent / toolkit / pipeline) selection ──────────────────────────

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

  // ── Tool selection ────────────────────────────────────────────────────────

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
        // The current mention starts at anchor with '/' + selectedItem.name (which may
        // contain spaces). Skip past the known name prefix, then scan for the first
        // whitespace to find the end (covers the optional '/partialToolQuery' portion).
        const namePrefix = '/' + selectedItem.name;
        const afterNameStart = anchor + namePrefix.length;
        const afterName = content.slice(afterNameStart);
        const spaceIdx = afterName.search(/\s/);
        const end = afterNameStart + (spaceIdx === -1 ? afterName.length : spaceIdx);
        const replacement = '/' + selectedItem.name + '/' + toolName + ' ';
        ref?.replaceRange?.(anchor, end, replacement);
        inputContentRef.current = content.slice(0, anchor) + replacement + content.slice(end);
      }
      slashCommitMention(toolName);
    },
    // mentionAnchorRef and inputContentRef are refs — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileReaderRef, selectedItem, slashCommitMention],
  );

  // ── Available tools for the selected toolkit ──────────────────────────────

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

  // ── Keyboard navigation ───────────────────────────────────────────────────

  // Reset highlight to first item when the active list changes (phase switch or filter change).
  useEffect(() => {
    setHighlightedIndex(0);
  }, [phase, filteredItems, filteredTools]);

  const onKeyDown = useCallback(
    event => {
      const { key } = event;

      if (phase === MentionPhase.Items && filteredItems.length > 0) {
        if (key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % filteredItems.length);
          return;
        }
        if (key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex(prev => (prev <= 0 ? filteredItems.length - 1 : prev - 1));
          return;
        }
        if (key === 'Enter' && highlightedIndex >= 0) {
          event.preventDefault();
          const item = filteredItems[highlightedIndex];
          if (item) onSelectItem(item, item.isToolkit);
          return;
        }
      }

      if (phase === MentionPhase.Tools && filteredTools.length > 0) {
        if (key === 'ArrowDown') {
          event.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % filteredTools.length);
          return;
        }
        if (key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex(prev => (prev <= 0 ? filteredTools.length - 1 : prev - 1));
          return;
        }
        if (key === 'Enter' && highlightedIndex >= 0) {
          event.preventDefault();
          const tool = filteredTools[highlightedIndex];
          if (tool) onSelectTool(tool.name);
          return;
        }
      }

      slashOnKeyDown(event);
    },
    [phase, filteredItems, filteredTools, highlightedIndex, onSelectItem, onSelectTool, slashOnKeyDown],
  );

  return {
    phase,
    itemQuery,
    toolQuery,
    selectedItem: resolvedSelectedItem,
    committedMentions,
    mentionableItems,
    filteredItems,
    filteredTools,
    highlightedIndex,
    highlightRanges,
    codeMirrorExtensions,
    onKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    onSelectTool,
    resetSlash,
  };
};
