import { memo } from 'react';

import { Box } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { ProjectParamsHeader } from '@/[fsd]/features/settings/ui/project-general/general';
import AgentPipelineBuilder from '@/[fsd]/features/settings/ui/project-general/general/AgentPipelineBuilder';
import { ProjectAIConfigurations } from '@/[fsd]/features/settings/ui/project-general/project-ai-configurations';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';

import SettingsFormProvider from '../shared/SettingsFormProvider';

const ProjectGeneralContent = memo(() => {
  const styles = componentStyles();

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title="General"
        showBorder
      />

      <Box sx={styles.body}>
        <BasicAccordion
          data-testid="project-general-section"
          // style={style}
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={styles.accordionStyles}
          items={[
            {
              title: 'General',
              content: (
                <Box>
                  <ProjectParamsHeader />
                </Box>
              ),
            },
          ]}
        />
        <BasicAccordion
          data-testid="ai-configurations"
          // style={style}
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={styles.accordionStyles}
          items={[
            {
              title: 'AI Configurations',
              content: (
                <Box>
                  <ProjectAIConfigurations />
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

ProjectGeneralContent.displayName = 'ProjectGeneralContent';
export default ProjectGeneralContent;

/** @type {MuiSx} */
const componentStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
  },
  accordionStyles: {
    padding: '0 !important',
  },
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    marginTop: '0.5rem',
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '0.75rem',
  },
  editorText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
    alignSelf: 'center',
  },
});
