import { useEffect, useMemo, useState } from 'react';

import { useFetchParticipantDetails } from '@/[fsd]/features/chat/participants/lib/hooks/useFetchParticipantDetails.hooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import {
  getChatParticipantUniqueId,
  getParticipantWelcomeKey,
  isWelcomeMessageParticipant,
} from '../helpers/participants.helpers';

/**
 * Resolves the welcome message of an agent/pipeline participant for the version it is pinned to.
 * Welcome messages are display-only: they are never part of chat_history, so they never reach the
 * LLM context.
 *
 * @returns {{ key: string | null, message: string, isLoading: boolean }}
 *   key changes with the participant and its version; message is '' when there is nothing to show.
 */
export const useParticipantWelcomeMessage = participant => {
  const projectId = useSelectedProjectId();
  const { fetchOriginalDetails, fetchOriginalVersionDetails } = useFetchParticipantDetails();

  const welcomeParticipant = isWelcomeMessageParticipant(participant) ? participant : null;
  const key = welcomeParticipant ? getParticipantWelcomeKey(welcomeParticipant) : null;
  const uniqueId = welcomeParticipant ? getChatParticipantUniqueId(welcomeParticipant) : null;

  const [resolved, setResolved] = useState({ key: null, uniqueId: null, message: '' });

  useEffect(() => {
    if (!welcomeParticipant) return;

    let cancelled = false;

    const resolveMessage = async () => {
      const { entity_name, entity_meta, entity_settings, version_details } = welcomeParticipant;
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

    resolveMessage()
      .catch(() => '')
      .then(message => {
        if (!cancelled) setResolved({ key, uniqueId, message });
      });

    return () => {
      cancelled = true;
    };
    // key captures every participant/version change that affects the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, projectId, fetchOriginalDetails, fetchOriginalVersionDetails]);

  const isLoading = !!key && resolved.key !== key;

  const message = useMemo(() => {
    if (!key) return '';
    if (!isLoading) return resolved.message.trim() ? resolved.message : '';
    // While the same participant's new version resolves, keep its previous greeting instead of
    // flickering it out; never show another participant's greeting.
    return resolved.uniqueId === uniqueId ? resolved.message : '';
  }, [key, uniqueId, isLoading, resolved]);

  return { key, message, isLoading };
};
