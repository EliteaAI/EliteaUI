/**
 * Rebuilds the secrets table rows from the list response.
 *
 * Rows carry browser-only state that the list never returns: a revealed value, or a value typed into a row
 * that is mid-edit. After a real fetch the table remounts and forgets which rows were revealed or edited,
 * so the rows start over from the server. Any other rebuild (a search, or a cache patch such as the sharing
 * toggle) keeps each existing row and only takes the fields the server owns.
 *
 * @param {Array<object>} localRows - rows currently in the table, including unsaved new rows
 * @param {Array<object>} serverRows - rows built from the list response
 * @param {{ keepLocalState: boolean }} options
 * @returns {Array<object>}
 */
export const mergeSecretRows = (localRows, serverRows, { keepLocalState }) => {
  const pendingNewRows = localRows.filter(row => row.isNew);

  if (!keepLocalState) {
    return [...pendingNewRows, ...serverRows];
  }

  const localRowsById = new Map(localRows.map(row => [row.id, row]));

  return [
    ...pendingNewRows,
    ...serverRows.map(serverRow => {
      const localRow = localRowsById.get(serverRow.id);

      return localRow
        ? {
            ...localRow,
            is_default: serverRow.is_default,
            allow_external_access: serverRow.allow_external_access,
          }
        : serverRow;
    }),
  ];
};
