import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import FieldWithCopy from '@/[fsd]/features/settings/ui/ai-configuration/Configuration/FieldWithCopy';

const ProjectAIConfiguration = memo(props => {
  const { userApiUrl, projectId, modelProjectId } = props;

  const styles = useMemo(() => projectAIConfigurationStyles(), []);

  return (
    <Box sx={styles.projectConfigSection}>
      <Box sx={styles.fieldsGrid}>
        <FieldWithCopy
          label="OpenAI-BaseURL:"
          value={userApiUrl ? `${userApiUrl.replace('/api/v2', '')}/llm/v1` : 'Not configured'}
        />
        {modelProjectId ? (
          <FieldWithCopy
            label="OpenAI-Project:"
            value={modelProjectId}
          />
        ) : (
          <Box />
        )}
      </Box>
      <Box sx={styles.fieldsGrid}>
        <FieldWithCopy
          label="Server URL:"
          value={userApiUrl || 'Not configured'}
        />
        <FieldWithCopy
          label="Project ID:"
          value={projectId || 'Not configured'}
        />
      </Box>
    </Box>
  );
});

ProjectAIConfiguration.displayName = 'ProjectAIConfiguration';

/** @type {MuiSx} */
const projectAIConfigurationStyles = () => ({
  projectConfigSection: ({ palette }) => ({
    flexShrink: 0,
    padding: '1rem 1.5rem',
    backgroundColor: palette.background.secondary,
    borderBottom: `0.0625rem solid ${palette.border.sidebarDivider}`,
    gap: '0.25rem',
    width: '100%',
  }),
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
  },
});

export default ProjectAIConfiguration;
