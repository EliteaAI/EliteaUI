import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { DrawerPage, DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { DeleteUserButton, EditUsersButton, UsersTable } from '@/[fsd]/features/settings/ui/users';
import { useRoleListQuery, useUserCreateMutation, useUserListQuery } from '@/api/admin';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import InviteUserDialog from '@/components/InviteUserDialog';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const Users = memo(() => {
  const styles = projectsStyles();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const { checkPermission } = useCheckPermission();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [uiPage, setUiPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const shouldInvite = useMemo(() => {
    return searchParams.get('inviteUsers') === '1';
  }, [searchParams]);

  // If navigated with ?inviteUser=1, trigger creation of a new secret row
  useEffect(() => {
    if (shouldInvite) {
      setOpenInviteDialog(true);
      // Remove the flag from URL to avoid re-triggering
      const newParams = new URLSearchParams(location.search);
      newParams.delete('inviteUsers');
      setSearchParams(newParams, { replace: true });
    }
  }, [location.search, setSearchParams, shouldInvite]);
  const { data, isFetching, refetch, isError, error } = useUserListQuery(
    {
      projectId,
      page,
      pageSize,
    },
    {
      skip: !projectId || !checkPermission(PERMISSIONS.users.view),
      refetchOnMountOrArgChange: true,
    },
  );
  const {
    data: roles = [],
    isError: isRolesError,
    error: rolesError,
  } = useRoleListQuery(
    {
      projectId,
      page,
      pageSize,
    },
    {
      skip: !projectId || !checkPermission(PERMISSIONS.users.view),
      refetchOnMountOrArgChange: true,
    },
  );

  const rolesOptions = useMemo(() => roles.map(({ name }) => ({ label: name, value: name })), [roles]);
  const { rows: users = [], total } = data || {};

  const filteredUsers = useMemo(() => {
    if (!search) return users;

    const searchLower = search.toLowerCase();
    return users.filter(user => {
      const emailMatch = (user.email ?? '').toLowerCase().includes(searchLower);
      const nameMatch = (user.name ?? '').toLowerCase().includes(searchLower);
      const rolesMatch = user.roles.join(',').toLowerCase().includes(searchLower);
      return emailMatch || nameMatch || rolesMatch;
    });
  }, [search, users]);

  const visibleRows = useMemo(
    () => filteredUsers.slice(uiPage * pageSize, uiPage * pageSize + pageSize),
    [filteredUsers, uiPage, pageSize],
  );

  const [inviteUsers, { isError: isInviteError, error: inviteError, reset, isSuccess: isInviteSuccess }] =
    useUserCreateMutation();

  const handleChange = useCallback(value => {
    setSearch(value);
    setPage(0);
    setUiPage(0);
  }, []);

  const onChangePage = useCallback(
    (_, newPage) => {
      const loadLimit = (newPage + 1) * pageSize;
      if (filteredUsers.length !== total && filteredUsers.length < loadLimit) {
        setPage(newPage);
      }
      setUiPage(newPage);
    },
    [pageSize, total, filteredUsers.length],
  );

  const onChangePageSize = useCallback(event => {
    const newPageSize = +event.target.value;
    setPageSize(newPageSize);
    setSelectedUsers([]);
    setPage(0);
    setUiPage(0);
  }, []);

  const onSelectPage = useCallback(
    selected => {
      if (selected) {
        setSelectedUsers([...visibleRows]);
      } else {
        setSelectedUsers([]);
      }
    },
    [visibleRows],
  );

  const onSelectRow = useCallback((user, selected) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(item => item.id !== user.id));
    }
  }, []);

  const handleOpenInviteDialog = useCallback(() => {
    setOpenInviteDialog(true);
  }, []);

  const handleCloseInviteDialog = useCallback(() => {
    setOpenInviteDialog(false);
  }, []);

  const handleConfirmInvite = useCallback(
    ({ emails, roles: selectedRoles }) => {
      handleCloseInviteDialog();
      setEmailCount(emails.length);
      inviteUsers({
        projectId,
        emails,
        roles: selectedRoles,
      });
    },
    [inviteUsers, projectId, handleCloseInviteDialog],
  );

  useEffect(() => {
    if (isError) {
      toastError(error?.status === 403 ? 'The access is not allowed' : buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  useEffect(() => {
    if (isRolesError) {
      toastError(rolesError?.status === 403 ? 'The access is not allowed' : buildErrorMessage(rolesError));
    }
  }, [rolesError, isRolesError, toastError]);

  useEffect(() => {
    if (isInviteSuccess) {
      toastSuccess(emailCount > 1 ? 'The users have been invited' : 'The user has been invited');
      refetch();
      reset();
    }
  }, [emailCount, isInviteSuccess, refetch, reset, toastSuccess]);

  useEffect(() => {
    if (isInviteError) {
      toastError(buildErrorMessage(inviteError));
      reset();
    }
  }, [inviteError, isInviteError, reset, toastError]);

  return (
    <>
      <DrawerPage>
        {/* <ProjectGroupEditor /> */}
        <DrawerPageHeader
          title="Users"
          showAddButton={checkPermission(PERMISSIONS.users.create)}
          showSearchInput={checkPermission(PERMISSIONS.users.view)}
          slotProps={{
            searchInput: {
              search,
              onChangeSearch: handleChange,
              placeholder: 'Search ',
            },
            addButton: {
              onAdd: handleOpenInviteDialog,
              tooltip: 'Invite users',
            },
          }}
          extraContent={
            <>
              {checkPermission(PERMISSIONS.users.edit) && (
                <EditUsersButton
                  users={selectedUsers}
                  refetch={refetch}
                  disabled={!selectedUsers.length}
                  setSelectedUsers={setSelectedUsers}
                  rolesOptions={rolesOptions}
                  sx={styles.actionButton}
                  isBatchEdit
                />
              )}
              {checkPermission(PERMISSIONS.users.delete) && (
                <DeleteUserButton
                  users={selectedUsers}
                  refetch={refetch}
                  disabled={!selectedUsers.length}
                  setSelectedUsers={setSelectedUsers}
                  useSecondaryButton
                  sx={styles.actionButton}
                />
              )}
            </>
          }
        />
        {checkPermission(PERMISSIONS.users.view) && (
          <>
            <Box sx={styles.tableContainer}>
              <UsersTable
                users={isError ? [] : visibleRows}
                total={!search ? total : filteredUsers.length}
                rowsPerPage={pageSize}
                page={uiPage}
                onChangePageSize={onChangePageSize}
                onPageChange={onChangePage}
                selectedUsers={selectedUsers}
                onSelectPage={onSelectPage}
                onSelectRow={onSelectRow}
                refetch={refetch}
                isFetching={isFetching}
                toastError={toastError}
                toastSuccess={toastSuccess}
                rolesOptions={rolesOptions}
                setSelectedUsers={setSelectedUsers}
              />
            </Box>
          </>
        )}
      </DrawerPage>
      <InviteUserDialog
        title="Invite users"
        open={openInviteDialog}
        onClose={handleCloseInviteDialog}
        onCancel={handleCloseInviteDialog}
        onConfirm={handleConfirmInvite}
        rolesOptions={rolesOptions}
      />
    </>
  );
});

Users.displayName = 'Users';

/** @type {MuiSx} */
const projectsStyles = () => ({
  container: {
    padding: '1rem 1.5rem 0 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1rem',
    width: '100%',
    boxSizing: 'border-box',
    height: '100%',
  },
  teammatesHeader: {
    display: 'flex',
    flexDirection: 'row',
    padding: '0.375rem 0',
    gap: '1rem',
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
    flexWrap: { xs: 'wrap', sm: 'nowrap' },
  },
  searchInput: {
    width: { xs: '12.5rem', sm: '15.625rem' },
    maxWidth: '100%',
    minWidth: '9.375rem',
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
    minWidth: { xs: '100%', sm: 'auto' },
    order: { xs: 10, sm: 0 },
  },
  actionButton: {
    flexShrink: 0,
    minWidth: 'fit-content',
  },
  tableContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    maxWidth: '100%',
  },
});

export default Users;
