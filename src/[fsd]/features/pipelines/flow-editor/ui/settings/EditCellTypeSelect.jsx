import React, { memo, useCallback } from 'react';

import { useGridApiContext } from '@mui/x-data-grid';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

const EditCellTypeSelect = memo(props => {
  const { id, field, row, setRows, rows } = props; //value, hasFocus
  const apiRef = useGridApiContext();
  const handleOnChange = useCallback(
    newValue => {
      const rowData = apiRef.current.getRow(id);
      apiRef.current.setEditCellValue({ id, field, value: newValue });
      setTimeout(() => {
        setRows(rows.map(item => (item.id === id ? { ...rowData, isNew: false, [field]: newValue } : item)));
      }, 30);
    },
    [apiRef, field, id, rows, setRows],
  );

  return (
    <SingleSelect
      sx={{ marginBottom: '0rem' }}
      label=""
      value={row[field]}
      onValueChange={handleOnChange}
      options={Object.entries(FlowEditorConstants.StatueTypeMap).map(([key, value]) => ({
        label: value,
        value: key,
      }))}
      disabled={false}
      showBorder
    />
  );
});

EditCellTypeSelect.displayName = 'EditCellTypeSelect';

export default EditCellTypeSelect;
