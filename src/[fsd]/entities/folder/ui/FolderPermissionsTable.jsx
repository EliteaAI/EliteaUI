import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Skeleton, Tooltip, Typography } from '@mui/material';

import { useResponsiveColumns } from '@/[fsd]/entities/grid-table/lib';
import { GridTableBody, GridTableHeader, GridTableRow } from '@/[fsd]/entities/grid-table/ui';
import { Button, Text } from '@/[fsd]/shared/ui';
import { AddButton } from '@/[fsd]/shared/ui/button';
import { useGetFolderAccessQuery, useSetFolderAccessMutation } from '@/api';
import NoPermissionsIcon from '@/assets/file-lock.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import EditIcon from '@/components/Icons/EditIcon';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import AddFolderPermissionDialog from './AddFolderPermissionDialog';

const FOLDER_PERMISSION_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: false },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: false, hideBelow: 600 },
  { field: 'access', label: 'Permissions', width: '10rem', sortable: false },
  { field: 'actions', label: '', width: '3.5rem', sortable: false },
];

const ACCESS_LABELS = {
  read_only: 'Read-only',
  no_access: 'No access',
};

const FolderPermissionsTable = memo(props => {
  const { folderId } = props;
  const styles = folderPermissionsTableStyles();
  const projectId = useSelectedProjectId();
  const { windowWidth } = useGetWindowWidth();
  const { toastError, toastSuccess } = useToast();
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetFolderAccessQuery(
    { projectId, folderId },
    { skip: !projectId || !folderId },
  );
  const [setFolderAccess, { isLoading: isSaving }] = useSetFolderAccessMutation();

  const rows = useMemo(
    () =>
      (data?.overrides || []).map(override => ({
        id: override.id,
        userId: override.user_id,
        name: override.user_name || `User ${override.user_id}`,
        email: override.user_email || '-',
        accessValue: override.access_level,
        accessLabel: ACCESS_LABELS[override.access_level] || override.access_level,
      })),
    [data?.overrides],
  );

  const existingUserIds = useMemo(() => rows.map(row => row.userId), [rows]);
  const total = data?.total ?? rows.length;
  const { visibleColumns, gridTemplateColumns, dataColumns } = useResponsiveColumns({
    columns: FOLDER_PERMISSION_COLUMNS,
    containerWidth: windowWidth,
    showCheckbox: false,
  });

  const renderCell = useCallback((column, value, row) => {
    const displayValue = column.field === 'access' ? row.accessLabel : value;

    return (
      <Text.EllipsisTypography
        variant="bodyMedium"
        color="text.secondary"
      >
        {displayValue || '-'}
      </Text.EllipsisTypography>
    );
  }, []);

  const renderActions = useCallback(
    () => (
      <Box sx={styles.actionsContainer}>
        <Tooltip
          title="Edit exception"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant="icon"
              sx={styles.actionButton}
              disabled
            >
              <EditIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    ),
    [styles.actionsContainer, styles.actionButton, styles.actionIcon],
  );

  const handleAddConfirm = useCallback(
    async ({ users, permission }) => {
      if (isSaving) return;

      try {
        await setFolderAccess({
          projectId,
          folderId,
          entries: users.map(user => ({
            user_id: user.id,
            access_level: permission,
          })),
        }).unwrap();
        setAddDialogOpen(false);
        toastSuccess(`Added exceptions for ${users.length} user${users.length === 1 ? '' : 's'}`);
      } catch {
        toastError('Failed to add permission exceptions');
      }
    },
    [folderId, isSaving, projectId, setFolderAccess, toastError, toastSuccess],
  );

  const renderEmptyState = () => (
    <Box sx={styles.emptyStateWrapper}>
      <Box sx={styles.emptyStateContainer}>
        <Box
          component={NoPermissionsIcon}
          sx={styles.emptyStateIcon}
        />
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={styles.emptyStateTitle}
        >
          No exceptions added yet
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.default"
          sx={styles.emptyStateSubtitle}
        >
          Users retain the permissions granted by their project roles.
        </Typography>
        <Button.BaseBtn
          variant="special"
          onClick={() => setAddDialogOpen(true)}
          startIcon={<PlusIcon />}
        >
          Add Exceptions
        </Button.BaseBtn>
      </Box>
    </Box>
  );

  const renderLoadingState = () => (
    <Box sx={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width="100%"
          height="2.5rem"
          sx={styles.skeleton}
        />
      ))}
    </Box>
  );

  const renderErrorState = () => (
    <Box sx={styles.errorState}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Failed to load permission exceptions
      </Typography>
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        onClick={refetch}
      >
        Retry
      </Button.BaseBtn>
    </Box>
  );

  const renderTable = () => (
    <Box sx={styles.tableWrapper}>
      <Box sx={styles.tableScrollContainer}>
        <Box sx={styles.stickyHeader}>
          <GridTableHeader
            columns={visibleColumns}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={false}
          />
        </Box>
        <GridTableBody sx={styles.tableBodySx}>
          {rows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              columns={dataColumns}
              showCheckbox={false}
              renderCell={renderCell}
              actions={renderActions()}
              dataCellSx={styles.dataCell}
            />
          ))}
        </GridTableBody>
      </Box>
    </Box>
  );

  const renderContent = () => {
    if (isLoading) return renderLoadingState();
    if (isError) return renderErrorState();
    if (rows.length === 0) return renderEmptyState();
    return renderTable();
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.sectionHeader}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={styles.sectionTitle}
        >
          Exceptions – {total}
        </Typography>
        {rows.length > 0 && (
          <AddButton
            tooltip="Add exception"
            onAdd={() => setAddDialogOpen(true)}
          />
        )}
      </Box>

      {renderContent()}

      <AddFolderPermissionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onConfirm={handleAddConfirm}
        projectId={projectId}
        existingUserIds={existingUserIds}
        loading={isSaving}
      />
    </Box>
  );
});

FolderPermissionsTable.displayName = 'FolderPermissionsTable';

export default FolderPermissionsTable;

const folderPermissionsTableStyles = () => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  sectionHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    minHeight: '4.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  sectionTitle: {
    fontWeight: 600,
  },
  tableWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    overflow: 'hidden',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  tableScrollContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
    backgroundColor: palette.background.default.secondary,
    borderRadius: '0.5rem',
  }),
  tableBodySx: {
    '& > div': {
      backgroundColor: 'transparent !important',
    },
  },
  stickyHeader: ({ palette }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: palette.background.default.secondary,
  }),
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionIcon: {
    width: '1rem',
    height: '1rem',
  },
  actionButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
    '&.Mui-disabled': {
      opacity: 0.5,
    },
  }),
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0rem 1rem',
  },
  skeletonContainer: {
    width: '100%',
    padding: '1rem 1.5rem',
  },
  skeleton: {
    marginBottom: '0.5rem',
  },
  errorState: ({ palette }) => ({
    flex: 1,
    minHeight: '25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    margin: '0 1.5rem 1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  emptyStateWrapper: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.default.secondary,
    minHeight: '25rem',
  }),
  emptyStateContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '4rem',
    gap: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  emptyStateIcon: ({ palette }) => ({
    width: '2.5rem',
    height: '2.5rem',
    color: palette.icon.fill.default,
    opacity: 0.6,
  }),
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: '-0.5rem',
    textAlign: 'center',
  },
});
