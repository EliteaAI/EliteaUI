import { useCallback, useEffect, useRef, useState } from 'react';

import { GridRowModes } from '@mui/x-data-grid';

import { buildErrorMessage } from '@/common/utils.jsx';
import { copyToClipboard } from '@/utils/browserUtils.js';

export const useSecretRowActions = ({
  rows,
  setRows,
  setRowModesModel,
  deleteSecret,
  showSecret,
  projectId,
  toastError,
  toastInfo,
  refetch,
  isShowSecretMap,
  setIsShowSecretMap,
}) => {
  const [anchorElMap, setAnchorElMap] = useState({});
  const [openAlert, setOpenAlert] = useState(null);
  const [openAlertType, setOpenAlertType] = useState('');
  const rowsRef = useRef(rows);
  const isShowSecretMapRef = useRef(isShowSecretMap);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    isShowSecretMapRef.current = isShowSecretMap;
  }, [isShowSecretMap]);

  const handleActionsMenuClick = useCallback(
    id => event => {
      setAnchorElMap(prevAnchorElMap => ({
        ...prevAnchorElMap,
        [id]: event.currentTarget,
      }));
    },
    [],
  );

  const handleActionsMenuClose = useCallback(
    id => () => {
      setAnchorElMap(prevAnchorElMap => {
        const newAnchorElMap = { ...prevAnchorElMap };
        delete newAnchorElMap[id];
        return newAnchorElMap;
      });
    },
    [],
  );

  const closeMenu = useCallback(id => {
    setAnchorElMap(prevAnchorElMap => {
      const newAnchorElMap = { ...prevAnchorElMap };
      delete newAnchorElMap[id];
      return newAnchorElMap;
    });
  }, []);

  const handleEditClick = useCallback(
    id => async () => {
      const editedRow = rowsRef.current.find(row => row.id === id);

      if (editedRow?.is_default) {
        return;
      }

      if (!editedRow?.name) {
        setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' } }));
        closeMenu(id);
        return;
      }

      const { data, error } = await showSecret({
        projectId,
        name: editedRow.name,
      });

      if (error && error.status != '404') {
        toastError(buildErrorMessage(error));
        return;
      }

      if (isShowSecretMapRef.current[id]) {
        // Hide the secret
        setRows(prevRows =>
          prevRows.map(row => {
            if (row.id === id) {
              return { ...row, secretValue: row.secret_name };
            }
            return row;
          }),
        );

        setIsShowSecretMap(prevMap => {
          const newMap = { ...prevMap };
          delete newMap[id];
          return newMap;
        });
      }

      setRows(prevRows =>
        prevRows.map(row => {
          if (row.id === id) {
            return {
              ...row,
              secretValue: data?.value || '',
              secret_name: data?.secret_name || row.secret_name,
            };
          }
          return row;
        }),
      );

      setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.Edit, fieldToFocus: 'secretValue' } }));
      closeMenu(id);
    },
    [setRowModesModel, closeMenu, showSecret, projectId, toastError, setIsShowSecretMap, setRows],
  );

  const handleSaveClick = useCallback(
    id => () => {
      setRowModesModel(prev => ({ ...prev, [id]: { mode: GridRowModes.View } }));
    },
    [setRowModesModel],
  );

  const handleCancelClick = useCallback(
    id => () => {
      setRowModesModel(prev => ({
        ...prev,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      }));

      setRows(prevRows => {
        const editedRow = prevRows.find(row => row.id === id);
        if (!editedRow) return prevRows;

        editedRow.secretValue = editedRow.secret_name;
        delete editedRow.secret_name;

        if (editedRow.isNew) {
          return prevRows.filter(row => row.id !== id);
        }
        return prevRows;
      });
      closeMenu(id);
    },
    [setRows, setRowModesModel, closeMenu],
  );

  const handleDeleteClick = useCallback(
    async id => {
      const deletedRow = rowsRef.current.find(row => row.id === id);

      if (deletedRow?.is_default) {
        return;
      }

      if (deletedRow && deletedRow.name) {
        await deleteSecret({ projectId, name: deletedRow.name });
        setTimeout(() => {
          refetch();
        }, 100);
      } else {
        setRows(prevRows => prevRows.filter(row => row.id !== id));
      }
    },
    [deleteSecret, projectId, setRows, refetch],
  );

  const handleCopyVisibleSecret = useCallback(
    id => async () => {
      const targetRow = rowsRef.current.find(row => row.id === id);
      if (targetRow && isShowSecretMapRef.current[id]) {
        try {
          await copyToClipboard(targetRow.secretValue);
          toastInfo('The secret has been copied to the clipboard');

          // Hide the secret after copying
          setRows(prevRows =>
            prevRows.map(row => {
              if (row.id === id) {
                return { ...row, secretValue: row.secret_name };
              }
              return row;
            }),
          );

          setIsShowSecretMap(prevMap => {
            const newMap = { ...prevMap };
            delete newMap[id];
            return newMap;
          });
        } catch {
          toastInfo('Failed to copy to clipboard');
        }
      }
    },
    [toastInfo, setIsShowSecretMap, setRows],
  );

  const onClickDelete = useCallback(
    id => () => {
      closeMenu(id);
      setOpenAlert(id);
      setOpenAlertType('delete');
    },
    [closeMenu],
  );

  const onClickHide = useCallback(
    id => () => {
      closeMenu(id);
      setOpenAlert(id);
      setOpenAlertType('hide');
    },
    [closeMenu],
  );

  const onCloseAlert = useCallback(
    () => () => {
      setOpenAlert(null);
      setOpenAlertType('');
    },
    [],
  );

  const onConfirmAlert = useCallback(
    (id, handleHideSecretPermanently) => () => {
      switch (openAlertType) {
        case 'delete':
          handleDeleteClick(id);
          break;
        case 'hide':
          handleHideSecretPermanently(id);
          break;
      }

      onCloseAlert()();
    },
    [openAlertType, handleDeleteClick, onCloseAlert],
  );

  return {
    anchorElMap,
    openAlert,
    openAlertType,
    handleActionsMenuClick,
    handleActionsMenuClose,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    handleCopyVisibleSecret,
    onClickDelete,
    onClickHide,
    onCloseAlert,
    onConfirmAlert,
  };
};
