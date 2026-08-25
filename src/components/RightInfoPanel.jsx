import { memo } from 'react';

import Box from '@mui/material/Box';

import { FolderSection } from '@/[fsd]/entities/folder';
import Categories from '@/components/Categories';

const RightInfoPanel = memo(props => {
  const {
    tagList,
    specifiedStatus,
    title = 'Tags',
    folderEntityType,
    showFolders = false,
    onFolderSelect,
    selectedFolderId,
  } = props;

  const styles = stylesRightInfoPanel();

  return (
    <Box style={styles.mainContainer}>
      {showFolders && folderEntityType && (
        <FolderSection
          entityType={folderEntityType}
          onFolderSelect={onFolderSelect}
          selectedFolderId={selectedFolderId}
        />
      )}
      <Categories
        tagList={tagList}
        title={title}
        style={{ flex: 1 }}
        specifiedStatus={specifiedStatus}
      />
    </Box>
  );
});

const stylesRightInfoPanel = () => ({
  mainContainer: {
    height: `calc(100vh)`,
    display: 'flex',
    flexDirection: 'column',
  },
});

RightInfoPanel.displayName = 'RightInfoPanel';

export default RightInfoPanel;
