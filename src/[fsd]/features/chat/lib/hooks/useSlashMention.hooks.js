import { useCallback, useMemo, useState } from 'react';

import { ChatParticipantType } from '@/common/constants';

import { useSlashCommandHandler } from './useSlashCommandHandler.hooks';
import { useSlashHighlights } from './useSlashHighlights.hooks';

/**
 * Higher-level hook that combines slash-mention state management with
 * chat-input text manipulation. Shared by NewConversationView and ChatBox.
 *
 * @param {object} params
 * @param {React.RefObject} params.chatInput - ref to the chat input component
 * @param {object|null}     params.activeConversation - current conversation object
 */
export const useSlashMention = ({ chatInput, activeConversation }) => {
  // Track a copy of the current input text so highlight ranges can be computed
  // without reading the DOM imperative ref on every render.
  const [inputContent, setInputContent] = useState('');

  const {
    phase: slashPhase,
    toolkitQuery: slashToolkitQuery,
    toolQuery: slashToolQuery,
    selectedToolkit: slashSelectedToolkit,
    committedMentions,
    isQueryFinal: slashIsQueryFinal,
    onKeyDown: slashOnKeyDown,
    syncWithValue: slashSyncWithValue,
    selectToolkit: slashSelectToolkit,
    commitMention: slashCommitMention,
    clearMentions,
    resetSlash,
    mentionAnchorRef,
  } = useSlashCommandHandler({ setInputContent });

  // IDs of toolkit participants in the current conversation, used by SlashSuggestionList
  // to filter the autosuggest to only those already added (AC1).
  const participantToolkitIds = useMemo(
    () =>
      (activeConversation?.participants || [])
        .filter(p => p.entity_name === ChatParticipantType.Toolkits)
        .map(p => ({ id: p.entity_meta.id, project_id: p.entity_meta.project_id })),
    [activeConversation?.participants],
  );

  // Replace the typed "/query" or "/query/" fragment with "/toolkit.name" in the input.
  // Uses mentionAnchorRef so that editing an earlier mention in the middle of the text
  // replaces only the correct fragment (not the last mention in the string).
  const onSlashSelectToolkit = useCallback(
    toolkit => {
      if (chatInput.current) {
        const content = chatInput.current.getInputContent();
        const anchor = mentionAnchorRef.current ?? content.length;
        // Use cursor position as the fragment end instead of whitespace search.
        // Whitespace search breaks for toolkit names that contain spaces — it stops
        // at the first space inside the name rather than at the end of the typed fragment.
        const cursorPos = chatInput.current.getCursorPosition() ?? content.length;
        // Fragment is text from anchor up to (but not including) the cursor.
        const afterAnchor = content.slice(anchor, cursorPos);
        // When the fragment already contains the separator '/' (e.g. "/typedname/"),
        // include it in both the replaced range and the replacement so that:
        //   • the separator is preserved in the text, and
        //   • replaceRange places the cursor AFTER the separator (not before it).
        const separatorIdx = afterAnchor.indexOf('/', 1); // skip the leading '/'
        const hasSeparatorInFragment = separatorIdx !== -1;
        // Also check if the separator sits immediately at the cursor (cursor between
        // toolkit name and tool query, e.g. "/name|/toolQuery").
        const hasSeparatorAtCursor = !hasSeparatorInFragment && content[cursorPos] === '/';
        const hasSeparator = hasSeparatorInFragment || hasSeparatorAtCursor;

        let replaceEnd = cursorPos;
        if (hasSeparatorInFragment) replaceEnd = anchor + separatorIdx + 1;
        else if (hasSeparatorAtCursor) replaceEnd = cursorPos + 1;

        const replacement = hasSeparator ? '/' + toolkit.name + '/' : '/' + toolkit.name;
        chatInput.current.replaceRange(anchor, replaceEnd, replacement);
        // replaceRange bypasses onChange, so sync local inputContent manually so that
        // useSlashHighlights can compute highlight ranges without waiting for a keystroke.
        setInputContent(content.slice(0, anchor) + replacement + content.slice(replaceEnd));
      }
      slashSelectToolkit(toolkit);
    },
    // mentionAnchorRef is a ref — stable, no dep needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slashSelectToolkit],
  );

  // Replace the "/toolkit[/toolQuery]" fragment with the final mention token.
  // Uses mentionAnchorRef for precise bounds so that committing an earlier mention
  // never overwrites text that follows it. Handles both null and non-null toolName.
  const onSlashCommitMention = useCallback(
    toolName => {
      if (chatInput.current && slashSelectedToolkit) {
        const content = chatInput.current.getInputContent();
        const anchor = mentionAnchorRef.current ?? 0;
        // Locate mention end using the toolkit name directly so that toolkit names
        // containing spaces are handled correctly (whitespace search would truncate early).
        const toolkitPrefix = '/' + slashSelectedToolkit.name + '/';
        let mentionEnd;
        if (content.startsWith(toolkitPrefix, anchor)) {
          // /toolkitName/ is present — advance past the separator then skip the tool query.
          const afterPrefix = content.slice(anchor + toolkitPrefix.length);
          const endIdx = afterPrefix.search(/[\s/]/);
          mentionEnd = anchor + toolkitPrefix.length + (endIdx === -1 ? afterPrefix.length : endIdx);
        } else {
          // No separator yet — mention ends right after the toolkit name.
          mentionEnd = anchor + ('/' + slashSelectedToolkit.name).length;
        }
        const mentionToken = toolName
          ? `/${slashSelectedToolkit.name}/${toolName}`
          : `/${slashSelectedToolkit.name}`;
        const replacement = mentionToken + ' ';
        chatInput.current.replaceRange(anchor, mentionEnd, replacement);
        // replaceRange bypasses onChange; sync local inputContent so the highlight
        // mirror stays aligned immediately (before the next keystroke fires onChange).
        setInputContent(content.slice(0, anchor) + replacement + content.slice(mentionEnd));
      }
      slashCommitMention(toolName);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slashCommitMention, slashSelectedToolkit],
  );

  const onSlashInputChange = useCallback(
    value => {
      setInputContent(value);
      if (!value) {
        clearMentions();
        resetSlash();
        return;
      }
      const cursorPos = chatInput.current?.getCursorPosition() ?? null;
      slashSyncWithValue(value, cursorPos);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slashSyncWithValue, clearMentions, resetSlash],
  );

  // Character ranges within inputContent that correspond to committed mention tokens.
  // Passed to UserInput so it can render the backdrop highlight.

  const slashHighlightRanges = useSlashHighlights(inputContent, committedMentions);

  return {
    slashPhase,
    slashToolkitQuery,
    slashToolQuery,
    slashSelectedToolkit,
    committedMentions,
    slashIsQueryFinal,
    slashOnKeyDown,
    participantToolkitIds,
    resetSlash,
    clearMentions,
    onSlashSelectToolkit,
    onSlashCommitMention,
    onSlashInputChange,
    slashHighlightRanges,
  };
};
