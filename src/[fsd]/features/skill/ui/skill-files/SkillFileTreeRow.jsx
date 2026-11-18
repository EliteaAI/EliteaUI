import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';
import FolderIcon from '@/components/Icons/FolderIcon';

import SkillFileMenu from './SkillFileMenu';

/**
 * One row of the skill file tree: a folder (chevron, folder icon, count) or a file.
 * On hover and when selected the count hides and the "⋮" menu shows.
 */
const SkillFileTreeRow = memo(props => {
  const {
    path,
    label,
    isFolder = false,
    isOpen,
    depth = 0,
    isSelected = false,
    readOnly = false,
    onClick,
    onAction,
  } = props;
  const hasMenu = !(isFolder && readOnly);

  const styles = skillFileTreeRowStyles(depth, isSelected);

  const handleClick = useCallback(() => onClick?.(path), [onClick, path]);

  return (
    <Box
      sx={styles.row}
      onClick={handleClick}
      data-testid={`skill-file-row-${path}`}
      data-selected={isSelected ? 'true' : 'false'}
      aria-expanded={isFolder ? isOpen : undefined}
    >
      {isFolder && (
        <Box sx={styles.icon}>
          <FolderIcon sx={styles.folderIcon} />
        </Box>
      )}
      <Tooltip.TypographyWithConditionalTooltip
        title={label}
        placement="top"
        variant="bodyMedium"
        sx={styles.label}
      >
        {label}
      </Tooltip.TypographyWithConditionalTooltip>
      {hasMenu && (
        <Box
          sx={styles.menu}
          className="skill-file-row-menu"
          onClick={event => event.stopPropagation()}
        >
          <SkillFileMenu
            id={`skill-file-menu-${path.replace(/[^\w-]/g, '_')}`}
            path={path}
            isFolder={isFolder}
            readOnly={readOnly}
            onAction={onAction}
          />
        </Box>
      )}
    </Box>
  );
});

SkillFileTreeRow.displayName = 'SkillFileTreeRow';

/** @type {MuiSx} */
const skillFileTreeRowStyles = (depth, isSelected) => ({
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    height: '2.5rem',
    marginLeft: `${depth * 1.75}rem`,
    padding: '0 0.5rem 0 0.75rem',
    borderRadius: '0.375rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
    backgroundColor: isSelected ? palette.background.interactiveItem.active : 'transparent',
    '& .skill-file-row-menu': { display: isSelected ? 'flex' : 'none' },
    '&:hover': {
      backgroundColor: isSelected
        ? palette.background.interactiveItem.active
        : palette.background.surface.interactive.default,
      '& .skill-file-row-menu': { display: 'flex' },
    },
  }),
  icon: {
    display: 'flex',
    flexShrink: 0,
  },
  folderIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.default,
  }),
  label: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    color: palette.text.secondary,
  }),
  menu: {
    alignItems: 'center',
    height: '1.75rem',
  },
});

export default SkillFileTreeRow;
