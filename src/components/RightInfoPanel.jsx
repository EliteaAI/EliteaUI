import { memo, useCallback, useState } from 'react';

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
    onFolderDelete,
  } = props;

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);

  const handleExpandChange = useCallback(expanded => {
    setIsFoldersExpanded(expanded);
  }, []);

  const styles = stylesRightInfoPanel(isFoldersExpanded);

  return (
    <Box sx={styles.mainContainer}>
      {showFolders && folderEntityType && (
        <FolderSection
          entityType={folderEntityType}
          onFolderSelect={onFolderSelect}
          selectedFolderId={selectedFolderId}
          onExpandChange={handleExpandChange}
          onFolderDelete={onFolderDelete}
        />
      )}
      <Categories
        tagList={tagList}
        title={title}
        style={isFoldersExpanded ? { overflowY: 'visible' } : { flex: 1, minHeight: 0 }}
        specifiedStatus={specifiedStatus}
      />
    </Box>
  );
});

/** @type {MuiSx} */
const stylesRightInfoPanel = isFoldersExpanded => ({
  mainContainer: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    ...(isFoldersExpanded && {
      overflowY: 'auto',
      overflowX: 'hidden',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    }),
  },
});

RightInfoPanel.displayName = 'RightInfoPanel';

export default RightInfoPanel;
