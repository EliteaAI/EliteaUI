import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import SkillFileTreeRow from './SkillFileTreeRow';

/** The contents of one folder of the tree: its subfolders (each with its own row), then its files. */
const SkillFileTreeFolder = memo(props => {
  const { folder, depth, selectedPath, readOnly, isClosed, onToggle, onSelect, onAction } = props;

  const handleToggle = useCallback(path => onToggle(path.replace(/\/$/, '')), [onToggle]);

  return (
    <>
      {folder.folders.map(child => (
        <Box key={child.path}>
          <SkillFileTreeRow
            path={`${child.path}/`}
            label={child.name}
            isFolder
            isOpen={!isClosed(child.path)}
            depth={depth}
            readOnly={readOnly}
            onClick={handleToggle}
            onAction={onAction}
          />
          {!isClosed(child.path) && (
            <SkillFileTreeFolder
              folder={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              readOnly={readOnly}
              isClosed={isClosed}
              onToggle={onToggle}
              onSelect={onSelect}
              onAction={onAction}
            />
          )}
        </Box>
      ))}
      {folder.files.map(file => (
        <SkillFileTreeRow
          key={file.path}
          path={file.path}
          label={file.path.slice(folder.path ? folder.path.length + 1 : 0)}
          depth={depth}
          isSelected={selectedPath === file.path}
          readOnly={readOnly}
          onClick={onSelect}
          onAction={onAction}
        />
      ))}
    </>
  );
});

SkillFileTreeFolder.displayName = 'SkillFileTreeFolder';

export default SkillFileTreeFolder;
