import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '@mui/material';

import { useGetApplicationSkillsQuery } from '@/[fsd]/features/skill/api';
import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import {
  createMentionCmExtension,
  parseMentionRanges,
} from '@/[fsd]/shared/lib/utils/instructionsMention.utils';

import { useInstructionsTildaCommand } from './useInstructionsTildaCommand.hooks';

const { MentionPhase, SKILL_TRIGGER } = MentionConstants;

/**
 * Wires the "~" skill-mention state machine to the instructions textarea text
 * manipulation via the FileReaderInput component ref.
 */
export const useInstructionsSkillMention = ({ fileReaderRef, projectId, versionDetails }) => {
  const theme = useTheme();
  const inputContentRef = useRef('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const appVersionId = versionDetails?.id;
  const { data: applicationSkills } = useGetApplicationSkillsQuery(
    { projectId, appVersionId },
    { skip: !projectId || !appVersionId },
  );

  const mentionableItems = useMemo(
    () =>
      (applicationSkills?.skills || [])
        .map(skill => ({
          name: skill.name,
          description: skill.description,
          skill_id: skill.skill_id,
          icon_meta: skill.icon_meta,
          isToolkit: false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [applicationSkills?.skills],
  );

  const {
    phase,
    itemQuery,
    committedMentions,
    onKeyDown: skillOnKeyDown,
    syncWithValue,
    selectItem,
    resetSlash,
    initCommittedMentions,
    mentionAnchorRef,
  } = useInstructionsTildaCommand();

  useEffect(() => {
    const text = versionDetails?.instructions;
    if (!text || !mentionableItems.length) return;

    const mentions = [];
    const sortedItems = [...mentionableItems].sort((a, b) => b.name.length - a.name.length);

    for (const item of sortedItems) {
      const baseToken = SKILL_TRIGGER + item.name;
      let pos = text.indexOf(baseToken);
      while (pos !== -1) {
        const prevChar = pos > 0 ? text[pos - 1] : '';
        const after = text.slice(pos + baseToken.length);
        if ((prevChar === '' || /\s/.test(prevChar)) && (after === '' || /\s/.test(after[0]))) {
          mentions.push({ name: item.name, tool_name: null });
        }
        pos = text.indexOf(baseToken, pos + 1);
      }
    }

    const seen = new Set();
    const unique = mentions.filter(m => {
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    });

    initCommittedMentions(unique);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionDetails?.id, mentionableItems.length]);

  const filteredItems = useMemo(() => {
    if (!mentionableItems?.length) return [];
    if (!itemQuery) return mentionableItems;
    return mentionableItems.filter(item => item.name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [mentionableItems, itemQuery]);

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
    // mentionAnchorRef and inputContentRef are refs — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileReaderRef],
  );

  const onInstructionsInputChange = useCallback(
    value => {
      inputContentRef.current = value;
      if (!value) {
        resetSlash();
        return;
      }
      const cursorPos = fileReaderRef?.current?.getCursorPosition?.() ?? value.length;
      syncWithValue(value, cursorPos);
    },
    // fileReaderRef is a ref — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncWithValue, resetSlash],
  );

  const onSelectItem = useCallback(
    item => {
      const replacement = SKILL_TRIGGER + item.name + ' ';
      replaceFragment(replacement);
      selectItem(item);
    },
    [replaceFragment, selectItem],
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [phase, filteredItems]);

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
          if (item) onSelectItem(item);
          return;
        }
      }

      skillOnKeyDown(event);
    },
    [phase, filteredItems, highlightedIndex, onSelectItem, skillOnKeyDown],
  );

  // Mirror-overlay highlight ranges and CodeMirror decorations for "~" skill mentions,
  // mirroring the "/" tool-mention parity in useInstructionsMention.
  const highlightRanges = useMemo(
    () => parseMentionRanges(versionDetails?.instructions ?? '', mentionableItems, SKILL_TRIGGER),
    [versionDetails?.instructions, mentionableItems],
  );

  const codeMirrorExtensions = useMemo(
    () => createMentionCmExtension(mentionableItems, theme.palette.text.info, SKILL_TRIGGER),
    [mentionableItems, theme.palette.text.info],
  );

  return {
    phase,
    committedMentions,
    mentionableItems,
    filteredItems,
    highlightedIndex,
    highlightRanges,
    codeMirrorExtensions,
    onKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    resetSlash,
  };
};
