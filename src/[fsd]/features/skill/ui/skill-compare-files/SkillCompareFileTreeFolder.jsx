import { memo } from 'react';

import { Box } from '@mui/material';

import SkillCompareFileTreeRow from './SkillCompareFileTreeRow';

const SkillCompareFileTreeFolder = memo(props => {
  const { folder, depth, selectedPath, isClosed, onToggle, onSelect } = props;

  return (
    <>
      {folder.folders.map(child => (
        <Box
          key={child.path}
          sx={skillCompareFileTreeFolderStyles.folder}
        >
          <SkillCompareFileTreeRow
            path={child.path}
            label={child.name}
            isFolder
            isOpen={!isClosed(child.path)}
            depth={depth}
            onClick={onToggle}
          />
          {!isClosed(child.path) && (
            <SkillCompareFileTreeFolder
              folder={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              isClosed={isClosed}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          )}
        </Box>
      ))}
      {folder.files.map(file => (
        <SkillCompareFileTreeRow
          key={file.path}
          path={file.path}
          label={file.path.slice(folder.path ? folder.path.length + 1 : 0)}
          depth={depth}
          isSelected={selectedPath === file.path}
          status={file.status}
          onClick={onSelect}
        />
      ))}
    </>
  );
});

SkillCompareFileTreeFolder.displayName = 'SkillCompareFileTreeFolder';

/** @type {MuiSx} */
const skillCompareFileTreeFolderStyles = {
  folder: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export default SkillCompareFileTreeFolder;
