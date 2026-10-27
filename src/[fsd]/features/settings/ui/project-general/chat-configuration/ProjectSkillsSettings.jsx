import { memo, useCallback } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { useProjectSkillsPlatformSettingsQuery } from '@/[fsd]/features/settings/api';
import { useProjectConfigRecord } from '@/[fsd]/features/settings/lib/hooks';
import { projectConfigCardStyles as styles } from '@/[fsd]/features/settings/ui/project-general/chat-configuration/projectConfigCard.styles';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const PROJECT_SKILLS_TOOLTIP =
  'When on, chats in this project can use every project skill, not only the skills added to the chat. The model searches the project for a skill that fits the request and loads it only when it applies; users can also call any project skill with **~skill-name**. **Use platform default** follows the setting chosen by your ELITEA administrators.';

const ProjectSkillsSettings = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { data: platformSettings } = useProjectSkillsPlatformSettingsQuery(
    { projectId },
    { skip: !projectId },
  );
  const { record, saveRecord, saving } = useProjectConfigRecord({
    type: 'project_skills',
    label: 'Project skills in chat',
    errorMessage: 'Unable to update project skills in chat',
  });
  const projectChoice = record?.data?.enabled ?? null;
  const value = projectChoice === null ? 'default' : String(projectChoice);
  const isAvailable = platformSettings?.available === true;
  const isEffectivelyOn = isAvailable && (projectChoice ?? platformSettings?.project_default === true);
  const platformDefaultLabel = platformSettings
    ? `Use platform default (${platformSettings.project_default ? 'Enabled' : 'Disabled'})`
    : 'Use platform default';

  const saveChoice = useCallback(
    event => saveRecord({ enabled: event.target.value === 'default' ? null : event.target.value === 'true' }),
    [saveRecord],
  );
  const disabled = !checkPermission(PERMISSIONS.configuration.update) || saving;

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
        <MenuItem value="default">{platformDefaultLabel}</MenuItem>
        <MenuItem value="true">Enabled</MenuItem>
        <MenuItem value="false">Disabled</MenuItem>
      </Input.InputBase>
    </Box>
  );
});

ProjectSkillsSettings.displayName = 'ProjectSkillsSettings';

export default ProjectSkillsSettings;
