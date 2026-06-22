import { useCallback, useMemo, useRef, useState } from 'react';

import { MentionConstants } from '@/[fsd]/shared/lib/constants';

const { MentionPhase, SKILL_TRIGGER } = MentionConstants;

export const useInstructionsTildaCommand = () => {
  const [phase, setPhase] = useState(MentionPhase.Idle);
  const phaseRef = useRef(MentionPhase.Idle);

  const [itemQuery, setItemQuery] = useState('');
  const [committedMentions, setCommittedMentions] = useState([]);
  const committedMentionsRef = useRef([]);

  const mentionAnchorRef = useRef(null);

  // "~name" up to whitespace. Anthropic skill names are kebab-case (lowercase, digits,
  // hyphens — no spaces), so whitespace terminates the mention, mirroring the "/" machine.
  const itemRegex = useMemo(() => {
    const t = SKILL_TRIGGER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${t}([^/\\s]*)$`);
  }, []);

  const reset = useCallback(() => {
    phaseRef.current = MentionPhase.Idle;
    setPhase(MentionPhase.Idle);
    setItemQuery('');
    mentionAnchorRef.current = null;
  }, []);

  const upsertMention = useCallback(name => {
    setCommittedMentions(prev => {
      if (prev.some(m => m.name === name)) return prev;
      const next = [...prev, { name, tool_name: null }];
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

  const initCommittedMentions = useCallback(mentions => {
    committedMentionsRef.current = mentions;
    setCommittedMentions(mentions);
  }, []);

  const onKeyDown = useCallback(
    event => {
      const { key } = event;
      const current = phaseRef.current;

      if (current === MentionPhase.Idle && key === SKILL_TRIGGER) {
        phaseRef.current = MentionPhase.Items;
        setPhase(MentionPhase.Items);
        setItemQuery('');
        // textarea: selectionStart is where "~" lands; CodeMirror sets the anchor in sync.
        mentionAnchorRef.current = event.target?.selectionStart ?? null;
        return;
      }

      if (key === 'Escape' && current !== MentionPhase.Idle) {
        reset();
      }
    },
    [reset],
  );

  const syncWithValue = useCallback(
    (text, cursorPos) => {
      const pos = cursorPos ?? text.length;
      const textToCursor = text.slice(0, pos);
      const current = phaseRef.current;

      if (current === MentionPhase.Idle) {
        // Backspace into a committed "~name" mention re-opens the items phase.
        const match = textToCursor.match(itemRegex);
        if (match && match[1].length > 0) {
          const committed = committedMentionsRef.current.find(m =>
            m.name.toLowerCase().startsWith(match[1].toLowerCase()),
          );
          if (committed) {
            uncommitByName(committed.name);
            setItemQuery(match[1]);
            phaseRef.current = MentionPhase.Items;
            setPhase(MentionPhase.Items);
            if (mentionAnchorRef.current === null) {
              mentionAnchorRef.current = pos - match[0].length;
            }
          }
        }
        return;
      }

      // MentionPhase.Items — capture "~query" up to the cursor. Any whitespace ends the
      // mention (skill names are space-free), so the regex alone drives the query.
      const match = textToCursor.match(itemRegex);
      if (match) {
        setItemQuery(match[1]);
        if (mentionAnchorRef.current === null) {
          mentionAnchorRef.current = pos - match[0].length;
        }
      } else {
        reset();
      }
    },
    [reset, uncommitByName, itemRegex],
  );

  const selectItem = useCallback(
    item => {
      upsertMention(item.name);
      reset();
    },
    [upsertMention, reset],
  );

  return {
    phase,
    itemQuery,
    committedMentions,
    onKeyDown,
    syncWithValue,
    selectItem,
    resetSlash: reset,
    initCommittedMentions,
    mentionAnchorRef,
  };
};
