import React from 'react';

import Categories from '@/components/Categories';
import useCredentialTypes from '@/hooks/credentials/useCredentialTypes';

const CredentialsTypesPanel = ({ tagList, title = 'Types', style, specifiedStatus }) => {
  const { selectedTypes, handleClickType, handleClear } = useCredentialTypes();

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
};

export default CredentialsTypesPanel;
