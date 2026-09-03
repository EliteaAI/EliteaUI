import { memo, useCallback, useState } from 'react';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import RestoreOutlined from '@mui/icons-material/RestoreOutlined';
import { Box, Typography } from '@mui/material';

import { useProjectBackup } from '@/[fsd]/features/settings/lib/hooks';
import RestoreProjectDialog from '@/[fsd]/features/settings/ui/project-general/backup-restore/RestoreProjectDialog';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useSelectedProjectName } from '@/hooks/useSelectedProject';

const ProjectBackupRestore = memo(() => {
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const projectName = useSelectedProjectName();
  const { doDownload, isDownloading, canDownload, canRestore, projectId } = useProjectBackup();

  const handleOpenRestore = useCallback(() => setIsRestoreOpen(true), []);
  const handleCloseRestore = useCallback(() => setIsRestoreOpen(false), []);

  return (
    <Box sx={componentStyles.root}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Back up this project&apos;s data to be able to restore it, if needed. Your backup will be downloaded
        as an encrypted SQL file and will include agents, pipelines, toolkits, MCP servers and skills.
        Credentials, tokens and other secrets will be excluded from this backup file and cannot be restored.
      </Typography>

      <Box sx={componentStyles.actions}>
        {canDownload && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            startIcon={<DownloadOutlined />}
            onClick={doDownload}
            disabled={isDownloading || !projectId}
            data-testid="project-backup-download"
          >
            {isDownloading ? 'Preparing...' : 'Create a Backup'}
          </BaseBtn>
        )}
        {canRestore && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            startIcon={<RestoreOutlined />}
            onClick={handleOpenRestore}
            disabled={!projectId}
            data-testid="project-backup-restore"
          >
            Restore from the Backup
          </BaseBtn>
        )}
      </Box>

      {canRestore && (
        <RestoreProjectDialog
          open={isRestoreOpen}
          onClose={handleCloseRestore}
          projectId={projectId}
          projectName={projectName}
        />
      )}
    </Box>
  );
});

ProjectBackupRestore.displayName = 'ProjectBackupRestore';

/** @type {MuiSx} */
const componentStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
};

export default ProjectBackupRestore;
