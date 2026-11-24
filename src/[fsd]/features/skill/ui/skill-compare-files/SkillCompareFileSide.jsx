import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { fileBaseName } from '@/[fsd]/features/skill/lib/helpers';
import { CopyIconButton } from '@/[fsd]/shared/ui/button';
import { MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';

import SkillCompareFileCard from './SkillCompareFileCard';
import SkillCompareFileText from './SkillCompareFileText';

const SkillCompareFileSide = memo(props => {
  const {
    side,
    file,
    versionName,
    isTextCompare,
    isChanged,
    value,
    otherValue,
    isLoading,
    error,
    note,
    canEdit,
    onChange,
    onDownload,
  } = props;
  const styles = skillCompareFileSideStyles();

  if (!file)
    return (
      <Box
        sx={styles.absent}
        data-testid={`skill-compare-file-absent-${side}`}
      >
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          {`Not in ${versionName}`}
        </Typography>
      </Box>
    );

  if (!isTextCompare)
    return (
      <Box sx={styles.root}>
        <SkillCompareFileCard
          side={side}
          file={file}
          isChanged={isChanged}
          onDownload={onDownload}
        />
      </Box>
    );

  const folderPath = file.path.slice(0, file.path.length - fileBaseName(file.path).length);

  const renderContent = () => {
    if (error)
      return (
        <Typography
          variant="bodySmall"
          color="text.primary"
          data-testid={`skill-compare-file-error-${side}`}
        >
          {buildErrorMessage(error)}
        </Typography>
      );
    if (value === undefined || isLoading)
      return (
        <Box sx={styles.loading}>
          <CircularProgress size="1.5rem" />
        </Box>
      );
    return (
      <Box
        sx={styles.editableCard}
        data-testid={`skill-compare-file-text-${side}`}
      >
        <SkillCompareFileText
          key={file.path}
          value={value}
          otherValue={otherValue}
          tone={side === 'left' ? 'removed' : 'added'}
          editable={canEdit}
          onChange={onChange}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
        />
      </Box>
    );
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="labelMedium"
          color="text.primary"
          sx={styles.path}
        >
          {folderPath}
          <Box
            component="span"
            sx={styles.name}
          >
            {fileBaseName(file.path)}
          </Box>
        </Typography>
        {value !== undefined && (
          <CopyIconButton
            value={value}
            tooltip={`Copy ${fileBaseName(file.path)} from version ${versionName}`}
          />
        )}
      </Box>
      {note && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.noDiffNote}
        >
          {note}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
});

SkillCompareFileSide.displayName = 'SkillCompareFileSide';

/** @type {MuiSx} */
const skillCompareFileSideStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
  },
  absent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '1rem 2rem',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    minHeight: '1.75rem',
  },
  path: {
    minWidth: 0,
    overflowWrap: 'anywhere',
    textTransform: 'none',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  noDiffNote: {
    fontStyle: 'italic',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '5rem',
  },
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
});

export default SkillCompareFileSide;
