import { memo, useCallback, useEffect, useRef, useState } from 'react';

import BaseEditor from '@/[fsd]/features/chat/ui/editors/BaseEditor';
import ProjectContextEditorFeature from '@/[fsd]/features/settings/ui/project-context/ProjectContextEditor';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useProjectContextQuery } from '@/api/projectContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const ProjectContextEditor = memo(props => {
  const { onCloseProjectContextEditor, isVisible, onDirtyStateChange, disableNavBlocking = false } = props;
  const projectId = useSelectedProjectId();
  const { data: serverData } = useProjectContextQuery(projectId, {
    skip: !projectId,
    refetchOnMountOrArgChange: true,
  });
  const [isDirty, setIsDirty] = useState(false);
  const saveRef = useRef(null);
  const discardRef = useRef(null);

  const handleSave = useCallback(() => {
    saveRef.current?.();
  }, []);

  const handleDiscard = useCallback(() => {
    discardRef.current?.();
  }, []);

  useEffect(() => {
    onDirtyStateChange?.(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const saveButton = (
    <Button.BaseBtn
      data-testid="project-context-save-button"
      variant={BUTTON_VARIANTS.contained}
      disabled={!isDirty}
      onClick={handleSave}
    >
      Save
    </Button.BaseBtn>
  );

  return (
    <BaseEditor
      isVisible={isVisible}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      onClose={onCloseProjectContextEditor}
      onDiscard={handleDiscard}
      disableNavBlocking={disableNavBlocking}
      isFormikContext={false}
      title="Project Context"
      initialValues={{}}
      saveButton={saveButton}
      contentSX={{ padding: 0, overflow: 'hidden' }}
    >
      <ProjectContextEditorFeature
        serverData={serverData}
        projectId={projectId}
        canEdit
        inlineMode
        onDirtyChange={setIsDirty}
        saveRef={saveRef}
        discardRef={discardRef}
      />
    </BaseEditor>
  );
});

ProjectContextEditor.displayName = 'ProjectContextEditor';

export default ProjectContextEditor;
