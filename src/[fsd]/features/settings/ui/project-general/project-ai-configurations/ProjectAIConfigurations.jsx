import { memo, useState } from 'react';

import { Box } from '@mui/material';

import AIConfigurationToggle from '@/[fsd]/features/settings/ui/project-general/project-ai-configurations/AIConfigurationToggle';
import { OpenAITemplate } from '@/[fsd]/features/settings/ui/project-general/project-ai-configurations/open-ai-template';

import { ProjectGeneralConstants } from '../../../lib/constants';
import AIConfiguration from './AIConfiguration';

const ProjectAIConfigurations = memo(() => {
  const styles = getStyles();
  const [selectedTab, setSelectedTab] = useState(ProjectGeneralConstants.AIConfigurationTabs.Basic);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.toggleContainer}>
        <AIConfigurationToggle
          value={selectedTab}
          onChange={setSelectedTab}
        />
      </Box>
      {selectedTab === ProjectGeneralConstants.AIConfigurationTabs.Basic && <AIConfiguration />}
      {selectedTab === ProjectGeneralConstants.AIConfigurationTabs.OpenAITemplate && <OpenAITemplate />}
    </Box>
  );
});

ProjectAIConfigurations.displayName = 'ProjectAIConfigurations';

/** @type {MuiSx} */
const getStyles = () => ({
  toggleContainer: {
    paddingTop: '0.5rem',
    paddingBottom: '1rem',
  },
  root: {
    position: 'relative',
  },
});

export default ProjectAIConfigurations;
