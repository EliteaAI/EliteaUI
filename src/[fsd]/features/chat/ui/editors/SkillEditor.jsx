import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillEditorDetails } from '@/[fsd]/features/chat/lib/hooks/useSkillEditorDetails.hooks';
import BaseEditor from '@/[fsd]/features/chat/ui/editors/BaseEditor';
import SkillCanvasModelSelector from '@/[fsd]/features/chat/ui/editors/SkillCanvasModelSelector';
import SkillEditorCreateButton from '@/[fsd]/features/chat/ui/editors/SkillEditorCreateButton';
import SkillEditorSaveButton from '@/[fsd]/features/chat/ui/editors/SkillEditorSaveButton';
import {
  hasSkillChatModelOverride,
  withDefaultSkillModel,
  withoutSkillChatModel,
} from '@/[fsd]/features/skill/lib/helpers';
import { useSkillModels, useSkillValidationSchema } from '@/[fsd]/features/skill/lib/hooks';
import { CreateSkillForm } from '@/[fsd]/features/skill/ui';

const buildInitialValues = (data, defaultModel) => ({
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
    run_settings: withDefaultSkillModel(data?.version_details?.run_settings ?? null, defaultModel),
  },
});

const SkillEditor = memo(props => {
  const {
    skill,
    onCloseSkillEditor,
    isVisible,
    onDirtyStateChange,
    disableNavBlocking = false,
    onChangeSkillSettings,
    isNewConversation = false,
    isCreateMode = false,
    onSkillCreated,
  } = props;
  const skillId = skill?.entity_meta?.id;
  const [isDirty, setIsDirty] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, error, isPublic } = useSkillEditorDetails(skill);

  const { defaultModel, isLoadingModels } = useSkillModels();
  const validationSchema = useSkillValidationSchema(data?.version_details?.instructions);
  const initialValues = useMemo(() => buildInitialValues(data, defaultModel), [data, defaultModel]);
  const isAwaitingSkillDetails = !!skillId && data?.id !== skillId;

  const onDirtyStateChangeRef = useRef(onDirtyStateChange);

  useEffect(() => {
    onDirtyStateChangeRef.current = onDirtyStateChange;
  }, [onDirtyStateChange]);

  useEffect(() => () => onDirtyStateChangeRef.current?.(false), []);

  const onVersionModelSaved = useCallback(() => {
    if (!onChangeSkillSettings || !hasSkillChatModelOverride(skill?.entity_settings)) return;
    onChangeSkillSettings(withoutSkillChatModel(skill), true);
  }, [onChangeSkillSettings, skill]);

  return (
    <BaseEditor
      isVisible={isVisible}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      onDirtyStateChange={onDirtyStateChange}
      disableNavBlocking={disableNavBlocking}
      onClose={onCloseSkillEditor}
      title={isCreateMode ? 'Create New Skill' : skill?.name || skill?.meta?.name || 'Skill'}
      initialValues={initialValues}
      validationSchema={validationSchema}
      error={error}
      isPublic={isPublic}
      saveButton={
        isCreateMode ? (
          <SkillEditorCreateButton
            onSkillCreated={onSkillCreated}
            onCreatingChange={setIsCreating}
          />
        ) : (
          <SkillEditorSaveButton
            isDirty={isDirty}
            onModelSaved={onVersionModelSaved}
          />
        )
      }
    >
      {!isCreateMode && (
        <SkillCanvasModelSelector
          skill={skill}
          onChangeSkillSettings={onChangeSkillSettings}
          isNewConversation={isNewConversation}
        />
      )}
      {!isLoadingModels && (
        <CreateSkillForm
          disabled={isPublic || isCreating || isAwaitingSkillDetails}
          isCreateMode={isCreateMode}
        />
      )}
    </BaseEditor>
  );
});

SkillEditor.displayName = 'SkillEditor';

export default SkillEditor;
