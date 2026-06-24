import { memo, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Divider, Typography } from '@mui/material';

import { IWModalEntityCardWrapper, IWModalEntityTextField } from '@/[fsd]/entities/import-wizard/ui';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { ProjectSelectShowMode } from '@/[fsd]/features/project/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SkillIcon from '@/assets/skill-icon.svg?react';
import ProjectSelect from '@/components/ProjectSelect';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SkillImportModal = memo(props => {
  const { open, skill, isImporting, onClose, onConfirm } = props;
  const styles = skillImportModalStyles();

  const projectId = useSelectedProjectId();
  const { projects = [] } = useSelector(state => state.settings);

  const defaultProject = useMemo(() => {
    const match = projects.find(p => String(p.id) === String(projectId));
    return match ? { id: match.id, name: match.name } : {};
  }, [projects, projectId]);

  const [selectedProject, setSelectedProject] = useState(defaultProject);

  if (!skill) return null;

  // Imported skills are always created with version 'base', regardless of
  // what version was in the exported file.
  const targetProject = selectedProject?.id ? selectedProject : defaultProject;

  return (
    <Modal.BaseModal
      open={open}
      title="Import parameters"
      onClose={onClose}
      content={
        <Box sx={styles.container}>
          <Box sx={styles.projectRow}>
            <Typography sx={styles.projectLabel}>PROJECT:</Typography>
            <ProjectSelect
              forLocalUsage
              showValidation={false}
              displayEmpty
              showBorder={false}
              name="skillImportProject"
              showMode={ProjectSelectShowMode.NormalMode}
              value={targetProject}
              onChange={setSelectedProject}
              selectPlaceholder="Select project"
            />
          </Box>

          <Divider sx={styles.divider} />

          <Typography sx={styles.sectionLabel}>MAIN ENTITY</Typography>

          <IWModalEntityCardWrapper
            icon={<SkillIcon />}
            title={skill.name}
            subtitle={`Type: Skill | Version: ${LATEST_VERSION_NAME}`}
          >
            {setFullscreenData => (
              <>
                <IWModalEntityTextField
                  title="Description"
                  description={skill.description}
                  lineClamp={3}
                  setFullscreenData={setFullscreenData}
                  height="4rem"
                />
                <IWModalEntityTextField
                  title="Instructions"
                  description={skill.instructions}
                  lineClamp={8}
                  setFullscreenData={setFullscreenData}
                  height="9rem"
                  type="markdown"
                />
              </>
            )}
          </IWModalEntityCardWrapper>
        </Box>
      }
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onClose}
            disabled={isImporting}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            onClick={() => onConfirm(targetProject?.id)}
            disabled={isImporting}
          >
            Import
          </Button.BaseBtn>
        </>
      }
    />
  );
});

SkillImportModal.displayName = 'SkillImportModal';

/** @type {MuiSx} */
const skillImportModalStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '34rem',
  },
  projectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '0.75rem',
  },
  projectLabel: ({ palette }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    color: palette.text.secondary,
  }),
  divider: ({ palette }) => ({
    borderColor: palette.border.lines,
    marginX: '-1.5rem',
  }),
  sectionLabel: ({ palette }) => ({
    fontWeight: 500,
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    color: palette.text.secondary,
    padding: '0.75rem 0',
  }),
});

export default SkillImportModal;
