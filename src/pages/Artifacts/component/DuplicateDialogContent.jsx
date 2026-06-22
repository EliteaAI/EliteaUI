import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Link, Typography } from '@mui/material';

import FileIcon from '@/assets/file.svg?react';

const SHOW_ALL_THRESHOLD = 5;
const getFilenameParts = filename => {
  const lastDotIndex = filename.lastIndexOf('.');

  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return {
      baseName: filename,
      extension: '',
    };
  }

  return {
    baseName: filename.slice(0, lastDotIndex),
    extension: filename.slice(lastDotIndex),
  };
};

const DuplicateDialogContent = memo(props => {
  const { duplicateFilenames = [] } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prevState => !prevState);
  }, []);
  const countFiles = duplicateFilenames.length;
  const label = useMemo(
    () =>
      `${countFiles === 1 ? 'This file' : `${countFiles} files`} already exist${countFiles === 1 ? 's' : ''} in this bucket. Choose how to handle duplicates.`,
    [countFiles],
  );
  const hasMoreThanThreshold = useMemo(
    () => duplicateFilenames.length > SHOW_ALL_THRESHOLD,
    [duplicateFilenames.length],
  );
  const visibleFilenames = useMemo(
    () => (isExpanded ? duplicateFilenames : duplicateFilenames.slice(0, SHOW_ALL_THRESHOLD)),
    [duplicateFilenames, isExpanded],
  );
  const visibleFilenameParts = useMemo(
    () => visibleFilenames.map(filename => ({ filename, ...getFilenameParts(filename) })),
    [visibleFilenames],
  );

  if (!duplicateFilenames.length) {
    return null;
  }
  const styles = duplicateDialogContentStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.labelSection}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          {label}
        </Typography>
      </Box>

      <Box sx={styles.filenamesList}>
        {visibleFilenameParts.map(({ filename, baseName, extension }, index) => (
          <Box
            key={`${index}-${filename}`}
            sx={styles.filenameRow}
          >
            <Box
              component={FileIcon}
              sx={styles.filenameIcon}
            />
            <Box sx={styles.filenameContent}>
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={styles.filenameBase}
              >
                {baseName}
              </Typography>
              {extension && (
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                  sx={styles.filenameExtension}
                >
                  {extension}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {hasMoreThanThreshold && (
        <Link
          component="button"
          variant="body2"
          onClick={handleToggleExpanded}
          sx={styles.showAllLink}
        >
          {isExpanded ? 'Show less' : 'Show all'}
        </Link>
      )}
    </Box>
  );
});

DuplicateDialogContent.displayName = 'DuplicateDialogContent';

export default DuplicateDialogContent;

/** @type {MuiSx} */
const duplicateDialogContentStyles = () => ({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
  },
  labelSection: ({ palette }) => ({
    paddingBottom: '1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  filenamesList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: 0,
    overflowY: 'auto',
  },
  filenameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  filenameContent: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    maxWidth: '100%',
  },
  filenameIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.icon.fill.default,
  }),
  filenameBase: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  filenameExtension: {
    flexShrink: 0,
    marginLeft: '0.125rem',
    whiteSpace: 'nowrap',
  },
  showAllLink: ({ palette }) => ({
    alignSelf: 'flex-start',
    fontSize: '0.75rem',
    fontWeight: 400,
    cursor: 'pointer',
    color: palette.primary.pressed,
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
      opacity: 0.8,
      cursor: 'pointer',
    },
  }),
});
