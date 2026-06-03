import { memo } from 'react';

import DataRowAction from '@/components/DataRowAction';
import useDataViewMode from '@/hooks/useDataViewMode';

const DataTableActionsCell = memo(props => {
  const { row, cardType, viewMode } = props;
  const dataViewMode = useDataViewMode(viewMode, row);
  return (
    <DataRowAction
      viewMode={dataViewMode}
      data={row}
      type={cardType}
    />
  );
});
DataTableActionsCell.displayName = 'DataTableActionsCell';

export default DataTableActionsCell;
