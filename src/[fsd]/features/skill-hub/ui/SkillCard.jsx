import { memo, useCallback, useMemo } from 'react';

import { Box, Card, Chip, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ELITEA_CATALOG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { isNewItem } from '@/[fsd]/shared/lib/helpers';
import { ChatParticipantType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import EntityIcon from '@/components/EntityIcon';
import { getCardGradientStyles } from '@/utils/cardStyles';

import SkillHubLike from './SkillHubLike';

const SkillCard = memo(props => {
  const { skill, onSelectItem, newItemDays } = props;

  const styles = skillCardStyles();

  const cardAuthors = useMemo(() => {
    const { authors = [], author = {} } = skill || {};
    return !authors?.length ? (author ? [author] : []) : authors;
  }, [skill]);

  const authorsTooltipText = useMemo(() => {
    if (!cardAuthors?.length) return '';
    return cardAuthors
      .map(a => a.name)
      .filter(Boolean)
      .join(', ');
  }, [cardAuthors]);

  const handleClick = useCallback(() => {
    onSelectItem?.(skill);
  }, [skill, onSelectItem]);

  if (!skill) return null;

  return (
    <Card
      data-tour={ELITEA_CATALOG_TOUR_TARGET_IDS.entityCard}
      sx={styles.card}
      onClick={handleClick}
    >
      <Box sx={styles.header}>
        <EntityIcon
          icon={skill.icon_meta}
          entityType={ChatParticipantType.Skills}
          projectId={PUBLIC_PROJECT_ID}
          editable={false}
        />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          {skill.name || 'Untitled'}
        </Typography>
      </Box>
      <Box
        data-tour={ELITEA_CATALOG_TOUR_TARGET_IDS.likeButton}
        sx={styles.footer}
      >
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
        <Box sx={styles.actionContainer}>
          {isNewItem(skill.created_at, newItemDays) && (
            <Chip
              label="New"
              size="small"
              sx={styles.newBadge}
            />
          )}
          <SkillHubLike
            viewMode={ViewMode.Public}
            data={skill}
          />
        </Box>
      </Box>
    </Card>
  );
});

SkillCard.displayName = 'SkillCard';

/** @type {MuiSx} */
const skillCardStyles = () => ({
  card: ({ palette }) => ({
    ...getCardGradientStyles(palette),
    position: 'relative',
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
  newBadge: ({ palette }) => ({
    height: '1.125rem',
    fontSize: '0.625rem',
    fontWeight: 700,
    backgroundColor: palette.success.main,
    color: palette.success.contrastText,
    pointerEvents: 'none',
    zIndex: 1,
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
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
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default SkillCard;
