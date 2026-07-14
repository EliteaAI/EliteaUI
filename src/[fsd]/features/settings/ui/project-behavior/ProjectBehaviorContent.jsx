import { memo } from 'react';

import { Box } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';

import SettingsFormProvider from '../shared/SettingsFormProvider';
import AgentPipelineBuilder from './AgentPipelineBuilder';
import ProjectContext from './ProjectContext';

const ProjectBehaviorContent = memo(() => {
  const styles = componentStyles();

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title="Project Behavior"
        showBorder
      />
      <Box sx={styles.body}>
        <BasicAccordion
          data-testid="project-context-section"
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={styles.accordionStyles}
          items={[
            {
              title: 'Project Context',
              content: (
                <Box sx={styles.containerStyles}>
                  <ProjectContext />
                </Box>
              ),
            },
          ]}
        />
        <BasicAccordion
          data-testid="agent-pipeline-builder-section"
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={styles.accordionStyles}
          items={[
            {
              title: 'Agent & Pipeline Builder',
              content: (
                <Box sx={styles.containerStyles}>
                  <SettingsFormProvider FormContent={AgentPipelineBuilder} />
                </Box>
              ),
            },
          ]}
        />
      </Box>
    </Box>
  );
});

ProjectBehaviorContent.displayName = 'ProjectBehaviorContent';
export default ProjectBehaviorContent;

/** @type {MuiSx} */
const componentStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '1rem 1.5rem',
    paddingBottom: '2.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '46.875rem',
  },
  accordionStyles: {
    padding: '0 !important',
  },
  containerStyles: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginTop: '0.5rem',
  },
});
