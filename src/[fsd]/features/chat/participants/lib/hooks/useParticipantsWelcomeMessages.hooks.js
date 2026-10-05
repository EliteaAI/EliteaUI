import { useEffect, useMemo, useState } from 'react';

import { useFetchParticipantDetails } from '@/[fsd]/features/chat/participants/lib/hooks/useFetchParticipantDetails.hooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import {
  getChatParticipantUniqueId,
  getParticipantWelcomeKey,
  isWelcomeMessageParticipant,
} from '../helpers/participants.helpers';

const previousMessageOf = (messagesByKey, participant) => {
  const prefix = `${getChatParticipantUniqueId(participant)}::`;
  return Object.entries(messagesByKey).find(([key]) => key.startsWith(prefix))?.[1];
};

/**
 * Resolves the welcome message of every agent/pipeline participant in a conversation, honoring the
 * version each participant is pinned to. Welcome messages are display-only: they are never part of
 * chat_history, so they never reach the LLM context.
 *
 * @returns {{ entries: Array<{ key: string, participant: object, message: string }>, isLoading: boolean }}
 *   entries with a non-empty message, in participant order; isLoading is true until the current
 *   participants/versions have been resolved.
 */
export const useParticipantsWelcomeMessages = participants => {
  const projectId = useSelectedProjectId();
  const { fetchOriginalDetails, fetchOriginalVersionDetails } = useFetchParticipantDetails();

  const welcomeParticipants = useMemo(
    () => (participants || []).filter(isWelcomeMessageParticipant),
    [participants],
  );
  const requestKey = useMemo(
    () => welcomeParticipants.map(getParticipantWelcomeKey).join('|'),
    [welcomeParticipants],
  );

  const [messagesByKey, setMessagesByKey] = useState({});
  const [resolvedRequestKey, setResolvedRequestKey] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const resolveMessage = async participant => {
      const { entity_name, entity_meta, entity_settings, version_details } = participant;
      const versionId = entity_settings?.version_id;

      // Set locally right after a version switch — no request needed.
      if (version_details && (!versionId || version_details.id === versionId)) {
        return version_details.welcome_message || '';
      }

      const entityProjectId = entity_meta?.project_id || projectId;
      const details = await fetchOriginalDetails(entity_name, entity_meta?.id, entityProjectId);

      if (!versionId || details.version_details?.id === versionId) {
        return details.version_details?.welcome_message || '';
      }

      const versionName = details.versions?.find(v => v.id === versionId)?.name;
      if (!versionName) return '';

      const versionDetails = await fetchOriginalVersionDetails(
        entity_name,
        entity_meta?.id,
        versionId,
        entityProjectId,
        versionName,
      );
      return versionDetails?.welcome_message || '';
    };

    Promise.all(
      welcomeParticipants.map(async participant => {
        try {
          return [getParticipantWelcomeKey(participant), await resolveMessage(participant)];
        } catch {
          return [getParticipantWelcomeKey(participant), ''];
        }
      }),
    ).then(entries => {
      if (cancelled) return;
      setMessagesByKey(Object.fromEntries(entries));
      setResolvedRequestKey(requestKey);
    });

    return () => {
      cancelled = true;
    };
    // requestKey captures every participant/version change that affects the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, projectId, fetchOriginalDetails, fetchOriginalVersionDetails]);

  const isLoading = resolvedRequestKey !== requestKey;

  const entries = useMemo(
    () =>
      welcomeParticipants
        .map(participant => {
          const key = getParticipantWelcomeKey(participant);
          // While a version switch is resolving, keep the previous message instead of flickering it out.
          const message = isLoading
            ? (messagesByKey[key] ?? previousMessageOf(messagesByKey, participant))
            : messagesByKey[key];
          return { key, participant, message: message || '' };
        })
        .filter(entry => entry.message.trim()),
    [welcomeParticipants, messagesByKey, isLoading],
  );

  return { entries, isLoading };
};
