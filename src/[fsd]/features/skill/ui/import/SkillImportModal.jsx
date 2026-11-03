import { memo, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Divider, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { IWModalEntityCardWrapper, IWModalEntityTextField } from '@/[fsd]/entities/import-wizard/ui';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version';
import { ProjectSelectConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useLazyCheckPermissionListQuery } from '@/api/auth';
import SkillIcon from '@/assets/skill-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import ProjectSelect from '@/components/ProjectSelect';

const { ProjectSelectShowMode } = ProjectSelectConstants;

const SkillImportModal = memo(props => {
  const { open, skill, isImporting, onClose, onConfirm } = props;
  const styles = skillImportModalStyles();

  const projectId = useSelectedProjectId();
  const { projects = [] } = useSelector(state => state.settings);
  const user = useSelector(state => state.user);

  const defaultProject = useMemo(() => {
    const match = projects.find(p => String(p.id) === String(projectId));
    return match ? { id: match.id, name: match.name } : {};
  }, [projects, projectId]);

  const [selectedProject, setSelectedProject] = useState(defaultProject);
  const [canImport, setCanImport] = useState(false);

  const [getUserPermissions] = useLazyCheckPermissionListQuery();

  const targetProject = useMemo(
    () => (selectedProject?.id ? selectedProject : defaultProject),
    [selectedProject, defaultProject],
  );

  const targetProjectId = targetProject?.id;

  useEffect(() => {
    const checkPermission = permissions =>
      Array.isArray(permissions) && permissions.includes(PERMISSIONS.skills.create);

    setCanImport(false);

    if (!targetProjectId) return;

    if (String(targetProjectId) === String(projectId)) {
      setCanImport(checkPermission(user.permissions));
      return;
    }

    let ignore = false;
    getUserPermissions(targetProjectId).then(result => {
      if (!ignore) setCanImport(checkPermission(result.data));
    });
    return () => {
      ignore = true;
    };
  }, [getUserPermissions, projectId, targetProjectId, user.permissions]);

  if (!skill) return null;

  return (
    <Modal.BaseModal
      open={open}
      title="Import parameters"
      data-testid="skill-import-preview-dialog"
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
            titleTestId="skill-import-preview-name"
            subtitleTestId="skill-import-preview-type-version"
          >
            {setFullscreenData => (
              <>
                <IWModalEntityTextField
                  title="Description"
                  description={skill.description}
                  lineClamp={3}
                  setFullscreenData={setFullscreenData}
                  height="4rem"
                  testId="skill-import-preview-description"
                />
                <IWModalEntityTextField
                  title="Instructions"
                  description={skill.instructions}
                  lineClamp={8}
                  setFullscreenData={setFullscreenData}
                  height="9rem"
                  type="markdown"
                  testId="skill-import-preview-instructions"
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
          <Tooltip
            title={!canImport ? 'Insufficient permissions to import in this project.' : ''}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                onClick={() => onConfirm(targetProject?.id)}
                disabled={isImporting || !canImport}
                data-testid="skill-import-confirm-button"
              >
                Import
              </Button.BaseBtn>
            </Box>
          </Tooltip>
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
