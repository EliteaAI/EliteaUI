import { memo, useCallback, useState } from 'react';

import { EntityIcon } from '@/[fsd]/shared/ui/icon';

import SelectIconDialog from './SelectIconDialog';

const EditableEntityIcon = memo(props => {
  const { icon, entityType, editable, onChangeIcon, projectId, entityId, versionId, ...restProps } = props;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEditClick = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleSelectIcon = useCallback(
    newIcon => {
      onChangeIcon?.(newIcon);
    },
    [onChangeIcon],
  );

  return (
    <>
      <EntityIcon
        icon={icon}
        entityType={entityType}
        editable={editable}
        onEditClick={handleEditClick}
        {...restProps}
      />
      {editable && (
        <SelectIconDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          selectedIcon={icon}
          entityType={entityType}
          onSelectIcon={handleSelectIcon}
          projectId={projectId}
          versionId={versionId}
          entityId={entityId}
        />
      )}
    </>
  );
});

EditableEntityIcon.displayName = 'EditableEntityIcon';

export default EditableEntityIcon;
