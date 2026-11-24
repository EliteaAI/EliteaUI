import { memo } from 'react';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Typography, useTheme } from '@mui/material';

import { fileBaseName, isDiffableTextFile } from '@/[fsd]/features/skill/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { formatFileSize } from '@/common/attachmentValidationUtils';
import DownloadIcon from '@/components/Icons/DownloadIcon';

const SkillCompareFileCard = memo(props => {
  const { side, file, isChanged, onDownload } = props;
  const theme = useTheme();
  const styles = skillCompareFileCardStyles(isChanged);
  const name = fileBaseName(file.path);
  const size = formatFileSize(file.size);

  return (
    <Box
      sx={styles.card}
      data-testid={`skill-compare-file-card-${side}`}
      data-changed={isChanged || undefined}
    >
      <Box sx={styles.icon}>
        <DescriptionOutlinedIcon fontSize="small" />
      </Box>
      <Box sx={styles.texts}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.name}
        >
          {name}
        </Typography>
        <Typography
          variant="bodySmall"
          color="text.primary"
        >
          {file.isText && !isDiffableTextFile(file) ? `${size} · too long to compare here` : size}
        </Typography>
      </Box>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.tertiary}
        aria-label={`Download ${name}`}
        startIcon={<DownloadIcon fill={theme.palette.icon.default} />}
        onClick={() => onDownload?.(file.path)}
        data-testid={`skill-compare-file-download-${side}`}
      />
    </Box>
  );
});

SkillCompareFileCard.displayName = 'SkillCompareFileCard';

/** @type {MuiSx} */
const skillCompareFileCardStyles = isChanged => ({
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${isChanged ? palette.alert.warning.border : palette.border.lines}`,
  }),
  icon: ({ palette }) => ({
    flexShrink: 0,
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: palette.icon.default,
    backgroundColor: palette.background.surface.interactive.active,
  }),
  texts: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default SkillCompareFileCard;
