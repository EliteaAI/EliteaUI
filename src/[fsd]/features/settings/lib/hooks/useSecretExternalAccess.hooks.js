import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { eliteaApi } from '@/api/eliteaApi';
import { buildErrorMessage } from '@/common/utils.jsx';

export const useSecretExternalAccess = ({ projectId, editSecret, setRows, toastError }) => {
  const dispatch = useDispatch();
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

      // Patched rather than refetched: refetching puts the table back into isFetching, which
      // remounts it and replaces the rows, discarding whatever another row is mid-edit. But the
      // rows are rebuilt from this cache whenever they recompute, so leaving it stale would flip
      // the switch back the next time the user types in the search box.
      dispatch(
        eliteaApi.util.updateQueryData('secretsList', projectId, draft => {
          const secret = draft.find(item => item.name === row.name);
          if (secret) {
            secret.allow_external_access = nextValue;
          }
        }),
      );
    },
    [projectId, editSecret, setRowFlag, toastError, dispatch],
  );

  return { handleToggleExternalAccess, isExternalAccessPending };
};
