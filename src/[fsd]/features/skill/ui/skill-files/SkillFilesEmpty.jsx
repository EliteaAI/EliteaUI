import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ExportIcon from '@/components/Icons/ExportIcon';

/**
 * Files of a skill that has none: the icon, the text and Upload files in the middle, with no frame around.
 */
const SkillFilesEmpty = memo(props => {
  const { readOnly = false, onAdd } = props;
  const theme = useTheme();
  const styles = skillFilesEmptyStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="skill-files-empty"
    >
      <Box sx={styles.icon}>
        <ExportIcon
          width={26}
          height={26}
          fill={theme.palette.icon.default}
        />
      </Box>
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        No files yet
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        References, templates and scripts the agent reads when it needs them.
      </Typography>
      {!readOnly && (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color="primary"
          onClick={onAdd}
          data-testid="skill-files-upload"
        >
          Upload files
        </Button.BaseBtn>
      )}
    </Box>
  );
});

SkillFilesEmpty.displayName = 'SkillFilesEmpty';

/** @type {MuiSx} */
const skillFilesEmptyStyles = () => ({
  root: {
    margin: '2.5rem 1.5rem 0',
    height: '26rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.625rem',
    padding: '0 2.5rem',
    textAlign: 'center',
  },
  icon: ({ palette }) => ({
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '0.875rem',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: palette.background.interactiveItem.hover,
  }),
  title: ({ palette }) => ({ color: palette.text.secondary, fontSize: '0.9375rem' }),
  text: ({ palette }) => ({ color: palette.text.primary, maxWidth: '22.5rem' }),
});

export default SkillFilesEmpty;
