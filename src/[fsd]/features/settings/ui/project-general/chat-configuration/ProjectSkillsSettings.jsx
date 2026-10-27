import { memo, useCallback, useState } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { useProjectSkillsPlatformSettingsQuery } from '@/[fsd]/features/settings/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import {
  useCreateConfigurationMutation,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const PROJECT_SKILLS_CONFIG = 'project_skills';

const PROJECT_SKILLS_TOOLTIP =
  'When on, chats in this project can use every project skill, not only the skills added to the chat. The model searches the project for a skill that fits the request and loads it only when it applies; users can also call any project skill with **~skill-name**. **Use platform default** follows the setting chosen by your ELITEA administrators.';

const ProjectSkillsSettings = memo(() => {
  const styles = projectSkillsSettingsStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError } = useToast();
  const { data: platformSettings } = useProjectSkillsPlatformSettingsQuery(
    { projectId },
    { skip: !projectId },
  );
  const { data, refetch: refreshSettings } = useGetConfigurationsListQuery(
    { projectId, type: PROJECT_SKILLS_CONFIG, includeShared: false },
    { skip: !projectId },
  );
  const [create] = useCreateConfigurationMutation();
  const [update] = useUpdateConfigurationMutation();
  const current = data?.items?.find(item => item.elitea_title === PROJECT_SKILLS_CONFIG);
  const projectChoice = current?.data?.enabled ?? null;
  const value = projectChoice === null ? 'default' : String(projectChoice);
  const isAvailable = platformSettings?.available === true;
  const isEffectivelyOn = isAvailable && (projectChoice ?? platformSettings?.project_default === true);
  const platformDefaultLabel = platformSettings?.project_default ? 'Enabled' : 'Disabled';

  const [saving, setSaving] = useState(false);
  const saveChoice = useCallback(
    async event => {
      setSaving(true);
      try {
        const body = {
          elitea_title: PROJECT_SKILLS_CONFIG,
          label: 'Project skills in chat',
          type: PROJECT_SKILLS_CONFIG,
          shared: false,
          data: { enabled: event.target.value === 'default' ? null : event.target.value === 'true' },
        };
        if (current?.id) await update({ projectId, configId: current.id, body }).unwrap();
        else await create({ projectId, body }).unwrap();
        await refreshSettings();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update project skills in chat');
      } finally {
        setSaving(false);
      }
    },
    [current?.id, projectId, update, create, refreshSettings, toastError],
  );
  const disabled = !checkPermission(PERMISSIONS.configuration.update) || saving || !isAvailable;

  return (
    <Box
      sx={styles.card}
      data-testid="project-skills-settings-card"
    >
      <Box sx={styles.text}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Project skills in chat
          </Typography>
          <InfoTooltip
            infoTooltip={PROJECT_SKILLS_TOOLTIP}
            testId="project-skills-info-tooltip"
          />
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Let chats use every skill in this project, not only the skills added to the chat.
        </Typography>
        {platformSettings && !isAvailable && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="project-skills-platform-off-hint"
          >
            Turned off for the whole environment by platform administrators.
          </Typography>
        )}
        {isAvailable && !isEffectivelyOn && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="project-skills-disabled-hint"
          >
            Currently disabled for this project.
          </Typography>
        )}
      </Box>
      <Input.InputBase
        select
        value={value}
        onChange={saveChoice}
        disabled={disabled}
        containerProps={{ sx: styles.select }}
        inputProps={{ 'data-testid': 'project-skills-project-setting' }}
      >
        <MenuItem value="default">{`Use platform default (${platformDefaultLabel})`}</MenuItem>
        <MenuItem value="true">Enabled</MenuItem>
        <MenuItem value="false">Disabled</MenuItem>
      </Input.InputBase>
    </Box>
  );
});

ProjectSkillsSettings.displayName = 'ProjectSkillsSettings';

/** @type {MuiSx} */
const projectSkillsSettingsStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '1rem',
  }),
  text: {
    flex: '999 1 20rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  select: {
    flex: '1 1 15rem',
  },
});

export default ProjectSkillsSettings;
