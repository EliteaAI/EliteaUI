import { memo, useMemo, useState } from 'react';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import BaseEditor from '@/[fsd]/features/chat/ui/editors/BaseEditor';
import SkillEditorSaveButton from '@/[fsd]/features/chat/ui/editors/SkillEditorSaveButton';
import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const buildInitialValues = data => ({
  id: data?.id ?? null,
  name: data?.name || '',
  description: data?.description || '',
  versions: data?.versions || [],
  meta: data?.meta || {},
  version_details: {
    id: data?.version_details?.id ?? null,
    name: data?.version_details?.name || data?.version?.name || LATEST_VERSION_NAME,
    tags: data?.version_details?.tags || data?.tags || [],
    instructions: data?.version_details?.instructions ?? data?.instructions ?? '',
    meta: data?.version_details?.meta || {},
    status: data?.version_details?.status ?? null,
  },
});

const SkillEditor = memo(props => {
  const { skill, onCloseSkillEditor, isVisible } = props;
  const projectId = useSelectedProjectId();
  const skillId = skill?.entity_meta?.id;
  const versionId = skill?.entity_settings?.version_id;
  const [isDirty, setIsDirty] = useState(false);

  const { data, error } = useSkillDetailsQuery(
    { projectId, skillId, versionId },
    { skip: !projectId || !skillId },
  );

  const initialValues = useMemo(() => buildInitialValues(data), [data]);

  return (
    <BaseEditor
      isVisible={isVisible}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      onClose={onCloseSkillEditor}
      title={skill?.name || skill?.meta?.name || 'Skill'}
      initialValues={initialValues}
      validationSchema={SkillValidateSchema}
      error={error}
      saveButton={<SkillEditorSaveButton isDirty={isDirty} />}
    >
      <CreateSkillForm />
    </BaseEditor>
  );
});

SkillEditor.displayName = 'SkillEditor';

export default SkillEditor;
