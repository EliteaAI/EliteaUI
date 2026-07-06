import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { useProjectInfoQuery } from '@/[fsd]/features/settings/api/projectInfoApi';
import ProjectAvatar from '@/[fsd]/widgets/sidebar-root/ui/ProjectAvatar';
import { PERMISSIONS } from '@/common/constants';
import EditIcon from '@/components/Icons/EditIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

import SelectProjectIconDialog from './SelectProjectIconDialog';

const ProjectParamsHeader = memo(() => {
  const projectName = useSelectedProjectName();
  const projectId = useSelectedProjectId();

  const styles = projectParamsHeaderStyles();

  const { checkPermission } = useCheckPermission();

  const canEdit = checkPermission(PERMISSIONS.projectContext.edit);

  const { data: projectInfo } = useProjectInfoQuery(projectId, {
    skip: !projectId,
  });

  const [openIconDialog, setOpenIconDialog] = useState(false);

  const iconMeta = projectInfo?.icon_meta;
  const teammatesCount = projectInfo?.teammates_count ?? 0;

  const handleOpenDialog = useCallback(() => {
    if (!canEdit) return;
    setOpenIconDialog(true);
  }, [canEdit]);

  const handleCloseDialog = useCallback(() => {
    setOpenIconDialog(false);
  }, []);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerContent}>
        <Box sx={styles.avatarWrapper}>
          <ProjectAvatar
            projectName={projectName}
            iconMeta={iconMeta}
            size="3.5rem"
          />
          {canEdit && (
            <IconButton
              sx={styles.editButton}
              onClick={handleOpenDialog}
            >
              <EditIcon sx={styles.editIcon} />
            </IconButton>
          )}
        </Box>

        <Box sx={styles.infoContainer}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
            sx={styles.projectName}
          >
            {projectName}
          </Typography>
          <Box sx={styles.metaRow}>
            <Box sx={styles.metaItem}>
              <UsersIcon sx={styles.metaIconSvg} />
              <Typography sx={styles.metaLabel}>Teammates:</Typography>
              <Typography sx={styles.metaValue}>{teammatesCount}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {openIconDialog && (
        <SelectProjectIconDialog
          open={openIconDialog}
          onClose={handleCloseDialog}
          projectId={projectId}
          selectedIcon={iconMeta}
          projectName={projectName}
        />
      )}
    </Box>
  );
});

ProjectParamsHeader.displayName = 'ProjectParamsHeader';

/** @type {MuiSx} */
const projectParamsHeaderStyles = () => ({
  root: {
    padding: '1.5rem',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatarWrapper: {
    position: 'relative',
    width: '3.5rem',
    height: '3.5rem',
    minWidth: '3.5rem',
  },
  editButton: ({ palette }) => ({
    position: 'absolute',
    bottom: '-0.25rem',
    right: '-0.25rem',
    width: '1.5rem',
    height: '1.5rem',
    backgroundColor: palette.background.secondary,
    border: `.125rem solid ${palette.background.default}`,
    '&:hover': {
      backgroundColor: palette.background.dataGrid.main,
    },
  }),
  editIcon: {
    fontSize: '0.75rem',
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  projectName: {
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  metaIconSvg: ({ palette }) => ({
    width: '0.875rem',
    height: '0.875rem',
    color: palette.icon.fill.primary,
  }),
  metaValue: ({ palette }) => ({
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  metaLabel: ({ palette }) => ({
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: palette.text.primary,
    marginRight: '0.5rem',
  }),
});

export default ProjectParamsHeader;
