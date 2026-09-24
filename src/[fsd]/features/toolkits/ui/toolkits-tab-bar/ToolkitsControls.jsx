import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { PinEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { usePin, usePinMenu } from '@/[fsd]/widgets/pin-toggler';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import { useForkEntityMenu } from '@/components/Fork/ForkEntityButton';
import useCheckPermission from '@/hooks/useCheckPermission';
import useViewMode from '@/hooks/useViewMode';
import AuthorsButton from '@/pages/Applications/Components/Applications/AuthorsButton';
import { useDeleteToolkitMenu } from '@/pages/Toolkits/DeleteToolkitButton.jsx';
import { useExportToolkitMenu } from '@/pages/Toolkits/ExportToolkitButton';

const ToolkitsControls = memo(props => {
  const { setBlockNav, publicToolkitData, isMCP } = props;
  const styles = toolkitsControlsStyles();

  const viewMode = useViewMode();

  const formik = useFormikContext();
  const { values: { id } = {} } = formik;

  const { checkPermission } = useCheckPermission();
  const { isPrivate } = useProjectType();

  const deletePermission = isMCP ? PERMISSIONS.mcps?.delete : PERMISSIONS.toolkits.delete;
  const canDelete = isPrivate || checkPermission(deletePermission);

  const {
    isPinned,
    togglePin,
    isLoading: isPinLoading,
  } = usePin({
    entityId: id,
    entityType: PinEntityConstants.PinEntityType.Toolkit,
    formikContext: formik,
  });

  const { copyLinkMenuItem } = useCopyLinkMenu();

  const { pinMenuItem } = usePinMenu({
    isPinned,
    onTogglePin: togglePin,
    isLoading: isPinLoading,
  });

  const { exportToolkitMenuItem } = useExportToolkitMenu({ disabled: true });
  const { forkEntityMenuItem } = useForkEntityMenu({
    id,
    entity_name: 'toolkits',
    data: publicToolkitData || {},
    disabled: true,
  });
  const { deleteToolkitMenuItem } = useDeleteToolkitMenu(setBlockNav, false, isMCP);

  const items = useMemo(
    () =>
      [
        {
          ...exportToolkitMenuItem,
          disabled:
            !checkPermission(PERMISSIONS.applications.export) ||
            !checkPermission(PERMISSIONS.toolkits.export),
        },
        forkEntityMenuItem,
        copyLinkMenuItem,
        pinMenuItem,
        canDelete && deleteToolkitMenuItem,
      ].filter(Boolean),
    [
      checkPermission,
      copyLinkMenuItem,
      deleteToolkitMenuItem,
      exportToolkitMenuItem,
      forkEntityMenuItem,
      pinMenuItem,
      canDelete,
    ],
  );

  return (
    <Box sx={styles.divider}>
      {viewMode === ViewMode.Public && (
        <Box
          sx={{
            marginRight: '0.5rem',
          }}
        >
          <AuthorsButton key="AuthorsButton" />
        </Box>
      )}
      <Controls.ControlsDropdown menuItems={items} />
    </Box>
  );
});

ToolkitsControls.displayName = 'ToolkitsControls';

/** @type {MuiSx} */
const toolkitsControlsStyles = () => ({
  divider: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    paddingLeft: '0.5rem',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '0.25rem',
      bottom: '0.25rem',
      borderLeft: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    },
  },
});

export default ToolkitsControls;
