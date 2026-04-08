import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { Controls } from '@/[fsd]/shared/ui';
import { PinEntityType } from '@/[fsd]/widgets/PinToggler/lib/constants';
import { usePin, usePinMenu } from '@/[fsd]/widgets/PinToggler/lib/hooks';
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
  const viewMode = useViewMode();

  const formik = useFormikContext();
  const { values: { id } = {} } = formik;

  const { checkPermission } = useCheckPermission();

  const {
    isPinned,
    togglePin,
    isLoading: isPinLoading,
  } = usePin({
    entityId: id,
    entityType: PinEntityType.Toolkit,
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
    () => [
      {
        ...exportToolkitMenuItem,
        disabled:
          !checkPermission(PERMISSIONS.applications.export) || !checkPermission(PERMISSIONS.toolkits.export),
      },
      forkEntityMenuItem,
      copyLinkMenuItem,
      pinMenuItem,
      {
        ...deleteToolkitMenuItem,
        disabled:
          !checkPermission(PERMISSIONS.applications.delete) || !checkPermission(PERMISSIONS.toolkits.delete),
      },
    ],
    [
      checkPermission,
      copyLinkMenuItem,
      deleteToolkitMenuItem,
      exportToolkitMenuItem,
      forkEntityMenuItem,
      pinMenuItem,
    ],
  );

  return (
    <Box
      sx={{
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
          borderLeft: ({ palette }) => `1px solid ${palette.border.lines}`,
        },
      }}
    >
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

export default ToolkitsControls;
