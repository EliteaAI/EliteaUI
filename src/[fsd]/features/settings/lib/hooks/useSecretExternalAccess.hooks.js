import { useCallback, useState } from 'react';

import { buildErrorMessage } from '@/common/utils.jsx';

export const useSecretExternalAccess = ({ projectId, editSecret, setRows, refetch, toastError }) => {
  const [pendingRowIds, setPendingRowIds] = useState({});

  const isExternalAccessPending = useCallback(rowId => Boolean(pendingRowIds[rowId]), [pendingRowIds]);

  const setRowFlag = useCallback(
    (rowId, value) => {
      setRows(prevRows =>
        prevRows.map(row => (row && row.id === rowId ? { ...row, allow_external_access: value } : row)),
      );
    },
    [setRows],
  );

  const handleToggleExternalAccess = useCallback(
    async (row, nextValue) => {
      // A row that does not exist yet carries the flag into its create request
      if (row.isNew) {
        setRowFlag(row.id, nextValue);
        return;
      }

      setPendingRowIds(prev => ({ ...prev, [row.id]: true }));
      setRowFlag(row.id, nextValue);

      // The value is deliberately omitted: the backend keeps the stored one, so flipping
      // the flag never pulls the secret through the browser.
      const { error } = await editSecret({
        projectId,
        name: row.name,
        allow_external_access: nextValue,
      });

      setPendingRowIds(prev => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });

      if (error) {
        setRowFlag(row.id, !nextValue);
        toastError(error.status === 403 ? 'The access is not allowed' : buildErrorMessage(error));
        return;
      }

      refetch();
    },
    [projectId, editSecret, setRowFlag, refetch, toastError],
  );

  return { handleToggleExternalAccess, isExternalAccessPending };
};
