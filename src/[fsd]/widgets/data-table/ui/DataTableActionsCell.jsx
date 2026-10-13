import { memo } from 'react';

import { useDataViewMode } from '@/[fsd]/shared/lib/hooks';
import DataRowAction from '@/components/DataRowAction';

const DataTableActionsCell = memo(props => {
  const { row, cardType, viewMode, showFolders = true } = props;
  const dataViewMode = useDataViewMode(viewMode, row);
  return (
    <DataRowAction
      viewMode={dataViewMode}
      data={row}
      type={cardType}
      showFolders={showFolders}
    />
  );
});
DataTableActionsCell.displayName = 'DataTableActionsCell';

export default DataTableActionsCell;
