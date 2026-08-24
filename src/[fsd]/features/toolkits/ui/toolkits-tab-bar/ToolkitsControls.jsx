import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { PinEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
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
          // ELITEA-1946 — DotMenu.jsx wires `testId: item.key`, and
          // useExportToolkitMenu()'s menuItem carries no `key`, so this item
          // rendered no data-testid at all. Supplying the key at THIS call
          // site (same shape as SkillControls.jsx's
          // `{ ...pinMenuItem, key: 'pin-toggle-skill' }`) keeps the testid
          // scoped to the toolkit/MCP menu and leaves the shared hook alone.
          key: 'toolkit-actions-export',
          disabled:
            !checkPermission(PERMISSIONS.applications.export) ||
            !checkPermission(PERMISSIONS.toolkits.export),
        },
        forkEntityMenuItem,
        // ELITEA-1959 — useCopyLinkMenu() defaults `key: key || label`, which
        // leaked the visible label into the testid as `Copy link-menuitem`
        // (with a space). Naming the key here renders
        // `copy-link-toolkit-menuitem`, matching {section}-{element}-{type}.
        { ...copyLinkMenuItem, key: 'copy-link-toolkit' },
        // ELITEA-1946 — same reason as CredentialsControls.jsx's
        // `key: 'pin-toggle-credential'`: the testid is the item's STABLE
        // identity; its pinned/unpinned state stays in the visible label.
        { ...pinMenuItem, key: 'pin-toggle-toolkit' },
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
