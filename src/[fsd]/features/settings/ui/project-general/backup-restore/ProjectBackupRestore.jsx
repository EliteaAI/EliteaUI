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
        Download a copy of this project&apos;s data as a backup file, or restore it from a previously
        downloaded backup. The backup covers agents, pipelines, toolkits, MCP servers and skills, and only
        those entities are restored. Credentials, tokens and other secrets are never included, so they are
        neither exported nor restored.
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
            {isDownloading ? 'Preparing...' : 'Download Backup'}
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
            Restore from Backup
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
