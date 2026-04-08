import { memo, useCallback, useMemo } from 'react';

import { Box, Card, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ChatParticipantType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import EntityIcon from '@/components/EntityIcon';
import { getCardGradientStyles } from '@/utils/cardStyles';

import AgentStudioLike from './AgentStudioLike';

const AgentCard = memo(props => {
  const { application, onSelectItem } = props;

  const styles = agentCardStyles();

  const cardAuthors = useMemo(() => {
    const { authors = [], author = {} } = application || {};
    return !authors?.length ? (author ? [author] : []) : authors;
  }, [application]);

  const authorsTooltipText = useMemo(() => {
    if (!cardAuthors?.length) return '';
    return cardAuthors
      .map(a => a.name)
      .filter(Boolean)
      .join(', ');
  }, [cardAuthors]);

  const handleClick = useCallback(() => {
    onSelectItem?.(application);
  }, [application, onSelectItem]);

  if (!application) return null;

  return (
    <Card
      sx={styles.card}
      onClick={handleClick}
    >
      <Box sx={styles.header}>
        <EntityIcon
          icon={application.icon_meta}
          entityType={ChatParticipantType.Applications}
          projectId={PUBLIC_PROJECT_ID}
          editable={false}
        />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          {application.name || 'Untitled'}
        </Typography>
      </Box>
      <Box sx={styles.footer}>
        <StyledTooltip
          key={`nameAuthor-tooltip-${authorsTooltipText}-${cardAuthors.id}`}
          placement="top"
          title={authorsTooltipText}
        >
          <Box>
            <AuthorContainer
              authors={cardAuthors}
              showName={false}
              style={styles.authors}
            />
          </Box>
        </StyledTooltip>
        <AgentStudioLike
          viewMode={ViewMode.Public}
          data={application}
        />
      </Box>
    </Card>
  );
});

AgentCard.displayName = 'AgentCard';

/** @type {MuiSx} */
const agentCardStyles = () => ({
  card: ({ palette }) => ({
    ...getCardGradientStyles(palette),
    height: '7rem',
    maxHeight: '7rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 0,
    boxSizing: 'border-box',
    paddingBottom: 0,
    cursor: 'pointer',
    boxShadow: 'none',
  }),
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    padding: '0.75rem 1.25rem',
    height: '4.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }),
  footer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '2.5rem',
    justifyContent: 'space-between',
    padding: '0 1rem 0.75rem 1.25rem',
    gap: '0.25rem',
  },
  authors: {
    minWidth: '1.25rem',
  },
});

export default AgentCard;
