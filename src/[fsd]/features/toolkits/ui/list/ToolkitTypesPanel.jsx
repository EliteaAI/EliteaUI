import { memo } from 'react';

import Categories from '@/components/Categories';
import useTypes from '@/hooks/toolkit/useTypes';

const ToolkitTypesPanel = memo(props => {
  const { tagList, title = 'Types', style, specifiedStatus } = props;

  const { selectedTypes, handleClickType, handleClear } = useTypes();

  return (
    <Categories
      tagList={tagList}
      title={title}
      style={style}
      specifiedStatus={specifiedStatus}
      customSelectedItems={selectedTypes}
      customHandleClick={handleClickType}
      customHandleClear={handleClear}
      maintainAlphabeticalOrder={true}
    />
  );
});

ToolkitTypesPanel.displayName = 'ToolkitTypesPanel';

export default ToolkitTypesPanel;
