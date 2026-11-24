import { memo, useCallback, useState } from 'react';

import { Box } from '@mui/material';

import SkillCompareFileTreeFolder from './SkillCompareFileTreeFolder';

const SkillCompareFileTree = memo(props => {
  const { root, selectedPath, onSelect } = props;

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

  const isClosed = useCallback(path => closed.has(path), [closed]);

  return (
    <Box
      sx={skillCompareFileTreeStyles.root}
      data-testid="skill-compare-file-tree"
    >
      <SkillCompareFileTreeFolder
        folder={root}
        depth={0}
        selectedPath={selectedPath}
        isClosed={isClosed}
        onToggle={toggleFolder}
        onSelect={onSelect}
      />
    </Box>
  );
});

SkillCompareFileTree.displayName = 'SkillCompareFileTree';

/** @type {MuiSx} */
const skillCompareFileTreeStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
};

export default SkillCompareFileTree;
