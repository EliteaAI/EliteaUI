import { Children, memo, useContext } from 'react';

import { Box } from '@mui/material';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { TriggerTypeSelector } from '@/[fsd]/features/pipelines/flow-editor/ui/settings';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';

const { NODE_CONFIG_SECTIONS } = NodePanelConstants;

const NodeConfigSection = memo(props => {
  const { section = NODE_CONFIG_SECTIONS.basic, children } = props;
  const { isRunningPipeline, disabled } = useContext(FlowEditorContext);
  const panelContext = useContext(NodeConfigPanelContext);

  const isBasic = section === NODE_CONFIG_SECTIONS.basic;
  const showTrigger = isBasic && panelContext?.isEntrypoint;

  if (!showTrigger && !Children.toArray(children).length) return null;

  const styles = nodeConfigSectionStyles();

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded={isBasic}
      accordionSX={styles.accordion}
      summarySX={styles.summary}
      accordionDetailsSX={styles.details}
      data-testid={`pipeline-node-panel-${section}-section`}
      items={[
        {
          title: isBasic ? 'Basic' : 'Advanced',
          testId: `pipeline-node-panel-${section}-section-toggle`,
          content: (
            <Box sx={styles.fields}>
              {showTrigger && <TriggerTypeSelector disabled={isRunningPipeline || disabled} />}
              {children}
            </Box>
          ),
        },
      ]}
    />
  );
});

NodeConfigSection.displayName = 'NodeConfigSection';

/** @type {MuiSx} */
const nodeConfigSectionStyles = () => ({
  accordion: {
    background: 'transparent',
  },
  summary: {
    paddingLeft: 0,
  },
  // Same spacing as the agent configuration form sections and the previous node card body
  details: {
    padding: 0,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
});

export default NodeConfigSection;
