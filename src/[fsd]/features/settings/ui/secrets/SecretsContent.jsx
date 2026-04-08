import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';
import { GridRowModes } from '@mui/x-data-grid';

import { DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { SecretsTable } from '@/[fsd]/features/settings/ui/secrets';
import { useSecretsListQuery } from '@/api/secrets.js';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const SecretsContent = memo(() => {
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const [search, setSearch] = useState('');
  const [rowModesModel, setRowModesModel] = useState({});
  const [pageModel, setPageModel] = useState({
    page: 0,
    pageSize: 100,
  });
  const [forceRender, setForceRender] = useState(0);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldCreate = useMemo(() => {
    return searchParams.get('createSecret') === '1';
  }, [searchParams]);

  const [secretRows, setSecretRows] = useState([]);
  const { toastError } = useToast();

  const {
    data: secrets = [],
    isFetching,
    refetch,
    isError,
    error,
  } = useSecretsListQuery(projectId, {
    skip: !projectId || !checkPermission(PERMISSIONS.secrets.list),
    refetchOnMountOrArgChange: true,
  });

  const secretsList = useMemo(
    () =>
      secrets.map((secret, index) => ({
        id: secret.name ? `existing-${secret.name}` : `secret-${index}`, // Prefix existing secrets to avoid conflicts
        name: secret.name,
        secretValue: secret.secret_name,
        is_default: secret.is_default || false,
      })) || [],
    [secrets],
  );

  const filteredSecrets = useMemo(
    () =>
      search
        ? secretsList.filter(secret => secret.name.toLowerCase().includes(search.toLowerCase()))
        : secretsList,
    [search, secretsList],
  );

  useEffect(() => {
    if (!isFetching) {
      setSecretRows(filteredSecrets);
    }
  }, [isFetching, filteredSecrets]);

  // If navigated with ?createSecret=1, trigger creation of a new secret row
  useEffect(() => {
    if (shouldCreate) {
      // Simulate AddSecretButton click by focusing a new row at current pagination start
      const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      let newRowId;
      setSecretRows(oldRows => {
        const newRowIndex = oldRows.findIndex(row => row.isNew);
        if (newRowIndex !== -1) {
          const existingRows = [...oldRows];
          newRowId = oldRows[newRowIndex].id;
          existingRows.splice(newRowIndex, 1);
          return [
            ...existingRows.slice(0, pageModel.page * pageModel.pageSize),
            oldRows[newRowIndex],
            ...existingRows.slice(pageModel.page * pageModel.pageSize),
          ];
        }
        return [
          ...oldRows.slice(0, pageModel.page * pageModel.pageSize),
          { id, name: '', isNew: true },
          ...oldRows.slice(pageModel.page * pageModel.pageSize),
        ];
      });
      setRowModesModel(oldModel => ({
        ...oldModel,
        [newRowId || id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
      }));
      // Remove the flag from URL to avoid re-triggering
      const newParams = new URLSearchParams(location.search);
      newParams.delete('createSecret');
      setSearchParams(newParams, { replace: true });
    }
  }, [location.search, pageModel.page, pageModel.pageSize, setSearchParams, shouldCreate]);

  useEffect(() => {
    if (isError) {
      toastError(error?.status === 403 ? 'The access is not allowed' : buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const onPaginationModelChange = useCallback(newPageModel => {
    setPageModel(newPageModel);
  }, []);

  // Force re-render when sidebar state changes
  useEffect(() => {
    // Delay to allow sidebar animation to complete
    const timeoutId = setTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 300); // Adjust delay based on sidebar animation duration

    return () => clearTimeout(timeoutId);
  }, [sideBarCollapsed]);

  const addSecretRow = useCallback(() => {
    const id = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // More stable ID for new rows
    let newRowId = undefined;
    setSecretRows(oldRows => {
      const newRowIndex = oldRows.findIndex(row => row.isNew);
      if (newRowIndex !== -1) {
        const existingRows = [...oldRows];
        newRowId = oldRows[newRowIndex].id;
        existingRows.splice(newRowIndex, 1);
        return [
          ...existingRows.slice(0, pageModel.page * pageModel.pageSize),
          oldRows[newRowIndex],
          ...existingRows.slice(pageModel.page * pageModel.pageSize),
        ];
      }
      return [
        ...oldRows.slice(0, pageModel.page * pageModel.pageSize),
        { id, name: '', isNew: true },
        ...oldRows.slice(pageModel.page * pageModel.pageSize),
      ];
    });
    setRowModesModel(oldModel => ({
      ...oldModel,
      [newRowId || id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  }, [pageModel.page, pageModel.pageSize, setRowModesModel, setSecretRows]);

  return (
    <>
      <DrawerPageHeader
        title="Secrets"
        showSearchInput
        showAddButton
        slotProps={{
          searchInput: {
            placeholder: 'Search',
            search,
            onChangeSearch: setSearch,
          },
          addButton: {
            onAdd: addSecretRow,
            disabled:
              isFetching || Object.values(rowModesModel).filter(mode => mode.mode === 'edit').length > 0,
            tooltip: 'Create new secret',
          },
        }}
      />
      <Box
        key={`secrets-component-${forceRender}`}
        sx={styles.container}
      >
        <Box sx={styles.tableWrapper}>
          <SecretsTable
            rows={isError ? [] : secretRows}
            setRows={setSecretRows}
            rowModesModel={rowModesModel}
            setRowModesModel={setRowModesModel}
            isFetching={isFetching}
            refetch={refetch}
            projectId={projectId}
            onPaginationModelChange={onPaginationModelChange}
            pageModel={pageModel}
          />
        </Box>
      </Box>
    </>
  );
});

SecretsContent.displayName = 'SecretsContent';
/**
 * @type {MuiSx}
 */
const getStyles = () => ({
  container: () => ({
    padding: '0rem 0rem',
    width: '100%',
    height: 'calc(100% - 3.75rem)',
    display: 'flex',
    flexDirection: 'column',
  }),

  header: () => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    width: '100%',
    minWidth: 0,
    gap: 2,
  }),

  searchInput: () => ({
    width: { xs: '12.5rem', sm: '15.625rem' },
    maxWidth: '100%',
    minWidth: '9.375rem',
    borderBottom: '0.0625rem solid',
    borderColor: 'border.lines',
    padding: '0rem 1.5rem',
    flexShrink: 1,
  }),

  tableWrapper: () => ({
    flex: 1,
    minHeight: 0,
  }),
});

export default SecretsContent;
