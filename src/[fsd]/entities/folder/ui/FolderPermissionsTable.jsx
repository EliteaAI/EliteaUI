import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import NoPermissionsIcon from '@/assets/file-lock.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';

const FolderPermissionsTable = memo(() => {
  const styles = folderPermissionsTableStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.sectionHeader}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={styles.sectionTitle}
        >
          Exceptions – 0
        </Typography>
      </Box>

      <Box sx={styles.emptyStateWrapper}>
        <Box sx={styles.emptyStateContainer}>
          <Box
            component={NoPermissionsIcon}
            sx={styles.emptyStateIcon}
          />
          <Typography
            variant="headingSmall"
            color="text.secondary"
            sx={styles.emptyStateTitle}
          >
            No exceptions added yet
          </Typography>
          <Typography
            variant="bodyMedium"
            color="text.default"
            sx={styles.emptyStateSubtitle}
          >
            Users retain the permissions granted by their project roles.
          </Typography>
          <Button.BaseBtn
            variant="special"
            startIcon={<PlusIcon />}
          >
            Add Exceptions
          </Button.BaseBtn>
        </Box>
      </Box>
    </Box>
  );
});

FolderPermissionsTable.displayName = 'FolderPermissionsTable';

export default FolderPermissionsTable;

const folderPermissionsTableStyles = () => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  sectionHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    minHeight: '4.5rem',
    backgroundColor: palette.background.default.secondary,
  }),
  sectionTitle: {
    fontWeight: 600,
  },
  emptyStateWrapper: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem 1.5rem',
    backgroundColor: palette.background.default.secondary,
    minHeight: '25rem',
  }),
  emptyStateContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '4rem',
    gap: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.section,
  }),
  emptyStateIcon: ({ palette }) => ({
    width: '2.5rem',
    height: '2.5rem',
    color: palette.icon.fill.default,
    opacity: 0.6,
  }),
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: '-0.5rem',
    textAlign: 'center',
  },
});
