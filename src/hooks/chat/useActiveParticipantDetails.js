import { useCallback, useEffect, useState } from 'react';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useFetchParticipantDetails from './useFetchParticipantDetails';

const useActiveParticipantDetails = ({ activeParticipant, skip }) => {
  const projectId = useSelectedProjectId();
  const [activeParticipantDetails, setActiveParticipantDetails] = useState({});
  const { fetchOriginalDetails, fetchOriginalVersionDetails } = useFetchParticipantDetails();

  const fetchDetails = useCallback(
    async ({ forceRefetch = false } = {}) => {
      if (!activeParticipant) return;

      const { entity_name, entity_meta, entity_settings } = activeParticipant;
      const entityProjectId = entity_meta.project_id || projectId;

      const details = await fetchOriginalDetails(entity_name, entity_meta.id, entityProjectId, {
        forceRefetch,
      });

      let versionDetails = null;
      const needsVersionFetch =
        entity_settings.version_id && details.version_details?.id !== entity_settings.version_id;

      if (needsVersionFetch) {
        const versionName = details.versions?.find(v => v.id === entity_settings.version_id)?.name;
        versionDetails = await fetchOriginalVersionDetails(
          entity_name,
          entity_meta.id,
          entity_settings.version_id,
          entityProjectId,
          versionName,
        );
      }

      setActiveParticipantDetails({
        ...details,
        version_details: versionDetails || details.version_details || {},
      });
    },
    [activeParticipant, fetchOriginalDetails, fetchOriginalVersionDetails, projectId],
  );

  useEffect(() => {
    if (activeParticipant && !skip) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeParticipant?.entity_meta.id,
    activeParticipant?.entity_meta.project_id,
    activeParticipant?.entity_name,
    activeParticipant?.entity_settings.version_id,
  ]);

  useEffect(() => {
    if (!activeParticipant) {
      setActiveParticipantDetails({});
    }
  }, [activeParticipant]);

  // Create a stable callback that always forces a refetch to bypass cache
  const refetchParticipantDetails = useCallback(() => {
    return fetchDetails({ forceRefetch: true });
  }, [fetchDetails]);

  return {
    activeParticipantDetails,
    refetchParticipantDetails,
  };
};

export default useActiveParticipantDetails;
