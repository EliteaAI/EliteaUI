import { memo, useCallback, useMemo, useState } from 'react';

import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Box, FormControlLabel, Link, Typography } from '@mui/material';

import { ProjectDataDeleteConstants } from '@/[fsd]/features/settings/lib/constants';
import { useProjectDataDelete } from '@/[fsd]/features/settings/lib/hooks';
import BackupAlert from '@/[fsd]/features/settings/ui/project-general/backup-restore/BackupAlert';
import { Checkbox } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

import DeleteProjectDataDialog from './DeleteProjectDataDialog';
import ProjectDataTypeOption from './ProjectDataTypeOption';

const { PROJECT_DATA_TYPES, SECTION_DESCRIPTION, SECTION_TOOLTIP, CHATS_RESTORE_NOTE } =
  ProjectDataDeleteConstants;

const ProjectDataDelete = memo(props => {
  const { projectName, onOpenBackup } = props;

  const [selected, setSelected] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { counts, isCountsLoading, isDeleting, doDelete } = useProjectDataDelete();

  const selectedTypes = useMemo(
    () =>
      PROJECT_DATA_TYPES.filter(type => selected.includes(type.key)).map(type => ({
        ...type,
        count: counts?.[type.key]?.count,
        blocked: counts?.[type.key]?.blocked || 0,
      })),
    [counts, selected],
  );

  // Kept in display order: the dialog lists and the backend deletes them in it
  const handleToggle = useCallback(
    key => () =>
      setSelected(prev =>
        PROJECT_DATA_TYPES.map(type => type.key).filter(item =>
          item === key ? !prev.includes(key) : prev.includes(item),
        ),
      ),
    [],
  );

  const isAllSelected = selected.length === PROJECT_DATA_TYPES.length;
  const isSomeSelected = selected.length > 0 && !isAllSelected;

  const handleToggleAll = useCallback(
    () =>
      setSelected(prev =>
        prev.length === PROJECT_DATA_TYPES.length ? [] : PROJECT_DATA_TYPES.map(type => type.key),
      ),
    [],
  );

  const handleOpenDialog = useCallback(() => setIsDialogOpen(true), []);
  const handleCloseDialog = useCallback(() => setIsDialogOpen(false), []);

  const handleConfirm = useCallback(async () => {
    const isDone = await doDelete(selected);
    if (isDone) {
      setIsDialogOpen(false);
      setSelected([]);
    }
  }, [doDelete, selected]);

  const styles = projectDataDeleteStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.description}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {SECTION_DESCRIPTION}
        </Typography>
        <InfoTooltip
          infoTooltip={SECTION_TOOLTIP}
          testId="project-data-delete-info"
        />
      </Box>

      <BackupAlert severity="warning">
        We strongly recommend creating and verifying a backup before deleting project data. This action cannot
        be undone.{' '}
        <Link
          component="button"
          variant="bodySmall"
          onClick={onOpenBackup}
          data-testid="project-data-delete-backup-link"
        >
          Go to Back Up &amp; Restore
        </Link>
        <Box
          component="span"
          sx={styles.note}
        >
          {CHATS_RESTORE_NOTE}
        </Box>
      </BackupAlert>

      <FormControlLabel
        data-testid="project-data-select-all"
        control={
          <Checkbox.BaseCheckbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onChange={handleToggleAll}
            disabled={isDeleting}
          />
        }
        label={<Typography variant="labelMedium">Select all</Typography>}
      />

      <Box sx={styles.types}>
        {PROJECT_DATA_TYPES.map(type => (
          <ProjectDataTypeOption
            key={type.key}
            type={type}
            summary={counts?.[type.key]}
            isLoading={isCountsLoading}
            checked={selected.includes(type.key)}
            disabled={isDeleting}
            onChange={handleToggle(type.key)}
          />
        ))}
      </Box>

      <Box sx={styles.actions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.alarm}
          size="small"
          startIcon={<DeleteOutline />}
          onClick={handleOpenDialog}
          disabled={!selected.length || isDeleting}
          data-testid="project-data-delete-open"
        >
          Delete selected data
        </BaseBtn>
      </Box>

      <DeleteProjectDataDialog
        open={isDialogOpen}
        projectName={projectName}
        selectedTypes={selectedTypes}
        isDeleting={isDeleting}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
      />
    </Box>
  );
});

ProjectDataDelete.displayName = 'ProjectDataDelete';

/** @type {MuiSx} */
const projectDataDeleteStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  description: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  note: {
    display: 'block',
    marginTop: '0.25rem',
  },
  types: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
    gap: '0.5rem 1rem',
  },
  actions: {
    paddingBottom: '1.5rem',
  },
});

export default ProjectDataDelete;
