import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import AgentConversationStarterItem from './AgentConversationStarterItem';

const AgentConversationStarters = memo(props => {
  const { conversation_starters, onSelectStarter } = props;
  const styles = agentConversationStartersStyles();

  const filteredStarters = useMemo(
    () => conversation_starters?.filter(starter => starter?.trim()) || [],
    [conversation_starters],
  );

  return (
    <Box sx={styles.container}>
      <Typography
        variant="subtitle"
        sx={styles.header}
      >
        CONVERSATION STARTERS
      </Typography>
      {filteredStarters.length > 0 ? (
        <Box sx={styles.startersGrid(filteredStarters.length === 1)}>
          {filteredStarters.map((starter, index) => (
            <AgentConversationStarterItem
              key={index}
              text={starter}
              onSelectStarter={onSelectStarter}
            />
          ))}
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          No predefined conversation starters – just type your request to begin.
        </Typography>
      )}
    </Box>
  );
});

AgentConversationStarters.displayName = 'AgentConversationStarters';

/** @type {MuiSx} */
const agentConversationStartersStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    alignItems: 'center',
  },
  header: ({ palette }) => ({
    color: palette.text.tertiary,
  }),
  startersGrid: isSingleItem => ({
    display: 'grid',
    gridTemplateColumns: isSingleItem ? '1fr' : 'repeat(auto-fill, minmax(15rem, 1fr))',
    gap: '0.5rem',
    width: '100%',
    justifyItems: isSingleItem ? 'center' : 'stretch',
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.tertiary,
  }),
});

export default AgentConversationStarters;
