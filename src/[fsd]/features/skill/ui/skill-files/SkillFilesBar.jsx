import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { describeSkillFiles } from '@/[fsd]/features/skill/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FileIcon from '@/assets/file.svg?react';

/**
 * The line under the instructions in Settings: "Files: References 2 · Scripts 7 · Assets 2" and Open Files.
 * Without files it offers Add files.
 */
const SkillFilesBar = memo(props => {
  const { files = [], onOpen, onAdd, sx } = props;
  const theme = useTheme();
  const hasFiles = files.length > 0;
  const styles = skillFilesBarStyles();

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="skill-files-bar"
    >
      <Box
        sx={styles.card}
        onClick={hasFiles ? onOpen : onAdd}
        data-testid="skill-files-card"
      >
        <FileIcon
          fill={theme.palette.icon.default}
          width={16}
          height={16}
        />
        <Typography
          variant="labelSmall"
          sx={styles.label}
        >
          Files:
        </Typography>
        <Typography
          variant="labelSmall"
          sx={styles.summary}
          title={hasFiles ? describeSkillFiles(files) : undefined}
        >
          {hasFiles ? describeSkillFiles(files) : 'None yet'}
        </Typography>
        {(hasFiles || onAdd) && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.auxiliary}
            data-testid="skill-files-bar-action"
          >
            {hasFiles ? 'Open Files' : 'Add files'}
          </Button.BaseBtn>
        )}
      </Box>
    </Box>
  );
});

SkillFilesBar.displayName = 'SkillFilesBar';

/** @type {MuiSx} */
const skillFilesBarStyles = () => ({
  root: {
    flexShrink: 0,
    padding: '1rem 1.5rem',
  },
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: '2.75rem',
    padding: '0 1rem',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover': { backgroundColor: palette.background.surface.interactive.active },
  }),
  label: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  summary: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    color: palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
});

export default SkillFilesBar;
