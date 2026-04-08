import { useMemo } from 'react';

import { useFormikContext } from 'formik';

import { ForkedVersionAuthorAvatar } from '@/components/ForkedVersionAuthorAvatar';

export default function ForkedVersionAuthorButton({ entityType = 'agent' }) {
  const { values: { version_details: versionDetails = {} } = {} } = useFormikContext();
  const { meta: { parent_project_id: forkedProjectId, parent_entity_id: forkedEntityId } = {} } = useMemo(
    () => versionDetails || { meta: { parent_project_id: '', parent_entity_id: '' } },
    [versionDetails],
  );

  return (
    <ForkedVersionAuthorAvatar
      forkedProjectId={forkedProjectId}
      forkedEntityId={forkedEntityId}
      forkedEntityType={entityType}
      size={28}
    />
  );
}
