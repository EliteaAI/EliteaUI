import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGetApplicationSkillsQuery } from '@/[fsd]/features/skill/api';
import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import { parseMentionRanges } from '@/[fsd]/shared/lib/utils/instructionsMention.utils';
import { ChatParticipantType } from '@/common/constants';

const { MentionPhase, SKILL_TRIGGER } = MentionConstants;

/**
 * Drives the "~" skill-mention dropdown and highlight for the chat input.
 *
 * Mirrors the chat "/" mention stack (useSlashMention) but for a single-level
 * "~skill" reference. Sources ONLY the skills attached to the conversation's
 * active agent participant, so the dropdown matches the Agent instructions UX.
 *
 * @param {object} params
 * @param {React.RefObject} params.chatInput               - ref to the chat input (getInputContent/getCursorPosition/replaceRange)
 * @param {object|null}     params.activeParticipant        - currently selected conversation participant
 * @param {object|null}     params.activeParticipantDetails - resolved participant details (carries version_details.id)
 * @param {string}          params.projectId                - fallback project id
 */
export const useChatSkillMention = ({
  chatInput,
  activeParticipant,
  activeParticipantDetails,
  projectId,
}) => {
  const [inputContent, setInputContent] = useState('');
  const [phase, setPhase] = useState(MentionPhase.Idle);
  const [itemQuery, setItemQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const mentionAnchorRef = useRef(null);

  const isAgent = activeParticipant?.entity_name === ChatParticipantType.Applications;
  // The participant's entity_settings.version_id is not always populated (e.g. the agent
  // editor's test chat), so fall back to the resolved details' version_details.id.
  const appVersionId =
    activeParticipant?.entity_settings?.version_id || activeParticipantDetails?.version_details?.id;
  const participantProjectId = activeParticipant?.entity_meta?.project_id || projectId;

  const { data: applicationSkills } = useGetApplicationSkillsQuery(
    { projectId: participantProjectId, appVersionId },
    { skip: !isAgent || !participantProjectId || !appVersionId },
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

  const detectMention = useCallback((text, cursorPos) => {
    const upToCursor = text.slice(0, cursorPos);
    const anchor = upToCursor.lastIndexOf(SKILL_TRIGGER);
    if (anchor === -1) return null;
    const prevChar = anchor > 0 ? text[anchor - 1] : '';
    if (prevChar !== '' && !/\s/.test(prevChar)) return null;
    const fragment = upToCursor.slice(anchor + SKILL_TRIGGER.length);
    if (/\s/.test(fragment)) return null;
    return { anchor, query: fragment };
  }, []);

  const resetSkill = useCallback(() => {
    mentionAnchorRef.current = null;
    setPhase(MentionPhase.Idle);
    setItemQuery('');
  }, []);

  const onSkillInputChange = useCallback(
    value => {
      setInputContent(value);
      if (!value) {
        resetSkill();
        return;
      }
      const cursorPos = chatInput.current?.getCursorPosition?.() ?? value.length;
      const detected = detectMention(value, cursorPos);
      if (!detected) {
        resetSkill();
        return;
      }
      mentionAnchorRef.current = detected.anchor;
      setPhase(MentionPhase.Items);
      setItemQuery(detected.query);
    },
    // chatInput is a ref — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detectMention, resetSkill],
  );

  const filteredItems = useMemo(() => {
    if (!mentionableItems.length) return [];
    if (!itemQuery) return mentionableItems;
    return mentionableItems.filter(item => item.name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [mentionableItems, itemQuery]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [phase, filteredItems]);

  const onSelectSkill = useCallback(
    item => {
      const ref = chatInput.current;
      if (ref) {
        const content = ref.getInputContent?.() ?? inputContent;
        const anchor = mentionAnchorRef.current ?? content.length;
        const cursorPos = ref.getCursorPosition?.() ?? content.length;
        const replacement = SKILL_TRIGGER + item.name + ' ';
        ref.replaceRange?.(anchor, cursorPos, replacement);
        setInputContent(content.slice(0, anchor) + replacement + content.slice(cursorPos));
      }
      resetSkill();
    },
    // chatInput is a ref — stable, excluded intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputContent, resetSkill],
  );

  const onSkillKeyDown = useCallback(
    event => {
      if (phase !== MentionPhase.Items || filteredItems.length === 0) return;
      const { key } = event;
      if (key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex(prev => (prev <= 0 ? filteredItems.length - 1 : prev - 1));
      } else if (key === 'Enter') {
        event.preventDefault();
        const item = filteredItems[highlightedIndex];
        if (item) onSelectSkill(item);
      } else if (key === 'Escape') {
        resetSkill();
      }
    },
    [phase, filteredItems, highlightedIndex, onSelectSkill, resetSkill],
  );

  const skillHighlightRanges = useMemo(
    () => parseMentionRanges(inputContent, mentionableItems, SKILL_TRIGGER),
    [inputContent, mentionableItems],
  );

  const committedMentions = useMemo(
    () => skillHighlightRanges.map(range => ({ name: inputContent.slice(range.start + 1, range.end) })),
    [skillHighlightRanges, inputContent],
  );

  return {
    skillPhase: phase,
    filteredItems,
    committedMentions,
    highlightedIndex,
    onSkillInputChange,
    onSkillKeyDown,
    onSelectSkill,
    resetSkill,
    skillHighlightRanges,
  };
};
