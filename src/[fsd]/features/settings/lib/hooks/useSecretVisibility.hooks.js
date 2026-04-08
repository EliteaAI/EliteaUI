import { useCallback, useEffect, useRef, useState } from 'react';

import { buildErrorMessage } from '@/common/utils.jsx';

export const useSecretVisibility = ({
  rows,
  setRows,
  showSecret,
  hideSecret,
  projectId,
  toastError,
  refetch,
}) => {
  const [isShowSecretMap, setIsShowSecretMap] = useState({});
  const rowsRef = useRef(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const handleShowSecret = useCallback(
    async id => {
      const editedRow = rowsRef.current.find(row => row.id === id);
      if (!editedRow) return;

      const { data, error } = await showSecret({
        projectId,
        name: editedRow.name,
      });

      if (error && error.status != '404') {
        toastError(buildErrorMessage(error));
        return;
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

      setIsShowSecretMap(prevIsShowSecretMap => ({
        ...prevIsShowSecretMap,
        [id]: id,
      }));
    },
    [showSecret, projectId, toastError, setRows],
  );

  const handleHideSecret = useCallback(
    id => {
      setRows(prevRows =>
        prevRows.map(row => {
          if (row.id === id) {
            return { ...row, secretValue: row.secret_name };
          }
          return row;
        }),
      );

      setIsShowSecretMap(prevIsShowSecretMap => {
        const newIsShowSecretMap = { ...prevIsShowSecretMap };
        delete newIsShowSecretMap[id];
        return newIsShowSecretMap;
      });
    },
    [setRows],
  );

  const handleHideSecretPermanently = useCallback(
    async id => {
      const hidenRow = rowsRef.current.find(row => row.id === id);

      if (hidenRow?.is_default) {
        return;
      }

      if (hidenRow) {
        await hideSecret({ projectId, name: hidenRow.name });
        setTimeout(() => {
          refetch();
        }, 100);
      }
    },
    [hideSecret, projectId, refetch],
  );

  return {
    isShowSecretMap,
    setIsShowSecretMap,
    handleShowSecret,
    handleHideSecret,
    handleHideSecretPermanently,
  };
};
