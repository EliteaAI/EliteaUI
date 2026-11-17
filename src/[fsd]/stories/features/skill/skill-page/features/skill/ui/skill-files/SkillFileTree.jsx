import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { buildSkillFileTree } from '@/[fsd]/features/skill/lib/helpers';

import SkillFileTreeRow from './SkillFileTreeRow';

/**
 * The files a person added to the skill: folders first, then the files at the root.
 * SKILL.md is not in the tree: the instructions are always on the right.
 */
const SkillFileTree = memo(props => {
  const { files = [], selectedPath, onSelect, onAction, initiallyClosed = [] } = props;

  const styles = skillFileTreeStyles();
  const { folders, rootFiles } = useMemo(() => buildSkillFileTree(files), [files]);
  const [closed, setClosed] = useState(() => new Set(initiallyClosed));

  const toggleFolder = useCallback(
    name =>
      setClosed(previous => {
        const next = new Set(previous);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      }),
    [],
  );

  // A file opened from outside the tree (a link in the instructions) opens its folder
  const isClosed = useCallback(
    name => closed.has(name) && !selectedPath?.startsWith(`${name}/`),
    [closed, selectedPath],
  );

  return (
    <Box
      sx={styles.root}
      data-testid="skill-file-tree"
    >
      {folders.map(folder => (
        <Box key={folder.name}>
          <SkillFileTreeRow
            path={`${folder.name}/`}
            label={folder.name}
            isFolder
            onClick={() => toggleFolder(folder.name)}
            onAction={onAction}
          />
          {!isClosed(folder.name) &&
            folder.files.map(file => (
              <SkillFileTreeRow
                key={file.path}
                path={file.path}
                label={file.path.slice(folder.name.length + 1)}
                depth={1}
                isSelected={selectedPath === file.path}
                onClick={onSelect}
                onAction={onAction}
              />
            ))}
        </Box>
      ))}
      {rootFiles.map(file => (
        <SkillFileTreeRow
          key={file.path}
          path={file.path}
          label={file.path}
          isSelected={selectedPath === file.path}
          onClick={onSelect}
          onAction={onAction}
        />
      ))}
    </Box>
  );
});

SkillFileTree.displayName = 'SkillFileTree';

/** @type {MuiSx} */
const skillFileTreeStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '1rem 1.5rem',
    boxSizing: 'border-box',
  },
});

export default SkillFileTree;
