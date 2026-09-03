import { memo } from 'react';

import { Box } from '@mui/material';

import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import Markdown from '@/[fsd]/shared/ui/markdown';
import { getToolIcon } from '@/common/toolkitUtils';

const styles = swarmChildListStyles();

const SwarmChildList = memo(props => {
  const { actions } = props;

  if (!actions.length) return null;

  return (
    <Box sx={styles.container}>
      {actions.map((action, idx) => {
        const SwarmIcon = getToolIcon('agent');
        const agentName = action.toolMeta?.agent_name || action.name || 'Sub-agent';
        return (
          <BasicAccordion
            key={`swarm-child-accordion-${action.id || idx}`}
            defaultExpanded={false}
            uppercase={false}
            accordionSX={styles.accordion}
            summarySX={styles.summary}
            accordionDetailsSX={styles.details}
            items={[
              {
                title: (
                  <Box sx={styles.titleBox}>
                    <SwarmIcon sx={styles.icon} />
                    <span>{agentName}</span>
                  </Box>
                ),
                content: <Markdown>{action.content || action.toolOutputs || ''}</Markdown>,
              },
            ]}
          />
        );
      })}
    </Box>
  );
});

SwarmChildList.displayName = 'SwarmChildList';

/** @type {MuiSx} */
const swarmChildListStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
    width: '100%',
  },
  accordion: ({ palette }) => ({
    backgroundColor: palette.background.secondary,
    borderRadius: '0.5rem !important',
    border: `0.0625rem solid ${palette.border.table}`,
    '&:before': { display: 'none' },
    '&.Mui-expanded': { margin: 0 },
  }),
  summary: ({ palette }) => ({
    minHeight: '2.5rem !important',
    padding: '0 0.75rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.5rem',
    '&.Mui-expanded': {
      minHeight: '2.5rem !important',
      borderRadius: '0.5rem 0.5rem 0 0',
    },
    '& .MuiAccordionSummary-content': { margin: '0.5rem 0' },
  }),
  titleBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '& span': {
      fontWeight: 600,
      color: palette.text.secondary,
      fontSize: '0.875rem',
    },
  }),
  icon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.primary.main,
  }),
  details: {
    padding: '0.75rem',
    maxHeight: '25rem',
    overflow: 'auto',
    '& p': { margin: '0 0 0.5rem 0' },
    '& p:last-child': { marginBottom: 0 },
  },
});

export default SwarmChildList;
