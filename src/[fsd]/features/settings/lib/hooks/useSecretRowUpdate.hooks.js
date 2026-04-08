import { useCallback } from 'react';

export const useSecretRowUpdate = ({ projectId, addSecret, editSecret, setRows, refetch }) => {
  const processRowUpdate = useCallback(
    async newRow => {
      // Validate that newRow has a valid id
      if (!newRow || newRow.id == null) {
        return newRow;
      }

      let updatedRow = { ...newRow, isNew: false };

      if (!newRow.name && !newRow.secretValue) {
        setRows(prevRows => prevRows.filter(row => row && row.id !== newRow.id));
        return { ...newRow, _action: 'delete' };
      }

      const responseResult = newRow?.isNew
        ? await addSecret({
            projectId,
            name: newRow.name,
            value: newRow.secretValue,
          })
        : await editSecret({
            projectId,
            name: newRow.name,
            value: newRow.secretValue,
          });

      if (responseResult.error) {
        return newRow;
      }

      const secretName = responseResult.data.secret_name;

      // For new rows, remove temporary row and refetch
      if (newRow.isNew && newRow.name) {
        setRows(prevRows => prevRows.filter(row => row && row.id !== newRow.id));

        setTimeout(() => {
          refetch();
        }, 100);

        return { ...newRow, isNew: false, secretValue: secretName };
      } else {
        updatedRow = { ...updatedRow, secretValue: secretName };
        setRows(prevRows =>
          prevRows
            .map(row => (row && row.id === newRow.id ? updatedRow : row))
            .filter(row => row && row.id != null),
        );
        return updatedRow;
      }
    },
    [projectId, editSecret, addSecret, setRows, refetch],
  );

  return { processRowUpdate };
};
