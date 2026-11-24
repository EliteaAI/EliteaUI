import { memo, useCallback } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

import SkillCompareFileStatusChip from './SkillCompareFileStatusChip';

const SkillCompareFileTreeRow = memo(props => {
  const { path, label, isFolder = false, isOpen, depth = 0, isSelected = false, status, onClick } = props;

  const styles = skillCompareFileTreeRowStyles(depth, isSelected, isOpen);

  const handleClick = useCallback(() => onClick?.(path), [onClick, path]);
  const handleKeyDown = useCallback(
    event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onClick?.(path);
    },
    [onClick, path],
  );

  return (
    <Box
      role="button"
      tabIndex={0}
      sx={styles.row}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`skill-compare-file-row-${path}`}
      data-selected={isSelected ? 'true' : 'false'}
      aria-expanded={isFolder ? isOpen : undefined}
    >
      {isFolder && <KeyboardArrowDownIcon sx={styles.chevron} />}
      <Tooltip.TypographyWithConditionalTooltip
        title={label}
        placement="top"
        variant="bodyMedium"
        sx={isFolder ? styles.folderLabel : styles.fileLabel}
      >
        {label}
      </Tooltip.TypographyWithConditionalTooltip>
      {!isFolder && <SkillCompareFileStatusChip status={status} />}
    </Box>
  );
});

SkillCompareFileTreeRow.displayName = 'SkillCompareFileTreeRow';

/** @type {MuiSx} */
const skillCompareFileTreeRowStyles = (depth, isSelected, isOpen) => ({
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    height: '2.5rem',
    marginLeft: `${depth * 1.25}rem`,
    padding: '0 0.5rem',
    borderRadius: '0.375rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
    backgroundColor: isSelected ? palette.background.interactiveItem.active : 'transparent',
    '&:hover': {
      backgroundColor: isSelected
        ? palette.background.interactiveItem.active
        : palette.background.surface.interactive.default,
    },
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '-0.125rem',
    },
  }),
  chevron: ({ palette }) => ({
    flexShrink: 0,
    fontSize: '1rem',
    color: palette.icon.default,
    transform: isOpen ? 'none' : 'rotate(-90deg)',
  }),
  folderLabel: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    color: palette.text.primary,
  }),
  fileLabel: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    color: palette.text.secondary,
  }),
});

export default SkillCompareFileTreeRow;
