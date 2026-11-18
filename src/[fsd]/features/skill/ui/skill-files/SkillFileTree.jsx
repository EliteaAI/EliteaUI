import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { buildSkillFileTree, isPathInFolder } from '@/[fsd]/features/skill/lib/helpers';

import SkillFileTreeFolder from './SkillFileTreeFolder';

/**
 * The files a person added to the skill, folders first, each level sorted by name.
 * SKILL.md is not in the tree: the instructions are always on the right.
 */
const SkillFileTree = memo(props => {
  const { files = [], selectedPath, readOnly = false, onSelect, onAction } = props;

  const styles = skillFileTreeStyles();
  const root = useMemo(() => buildSkillFileTree(files), [files]);
  const [closed, setClosed] = useState(() => new Set());

  const toggleFolder = useCallback(
    path =>
      setClosed(previous => {
        const next = new Set(previous);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      }),
    [],
  );

  // A file opened from outside the tree (a link in the instructions) opens the folders above it
  const isClosed = useCallback(
    path => closed.has(path) && !(selectedPath && isPathInFolder(selectedPath, path)),
    [closed, selectedPath],
  );

  return (
    <Box
      sx={styles.root}
      data-testid="skill-file-tree"
    >
      <SkillFileTreeFolder
        folder={root}
        depth={0}
        selectedPath={selectedPath}
        readOnly={readOnly}
        isClosed={isClosed}
        onToggle={toggleFolder}
        onSelect={onSelect}
        onAction={onAction}
      />
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
