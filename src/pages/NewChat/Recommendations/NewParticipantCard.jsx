import { memo, useCallback, useEffect, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { TooltipWithDuration } from '@/ComponentsLib/Tooltip';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';

const NewParticipantCard = memo(({ participant, onClick, alreadyExists }) => {
  const cardRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      () => {
        tooltipRef.current.closeTooltip();
      },
      {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1,
      },
    );
    const currentRef = cardRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const onClickHandler = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      onClick(participant);
    },
    [onClick, participant],
  );

  return (
    <TooltipWithDuration
      delaySeconds={1000}
      ref={tooltipRef}
      placement="top"
      title={
        <>
          <Typography sx={styles.tipNameText}>{participant.name}</Typography>
          <Typography sx={styles.tipDescriptionText}>{participant.description || ''}</Typography>
        </>
      }
    >
      <Box
        ref={cardRef}
        sx={styles.card(alreadyExists)}
        onClick={onClickHandler}
      >
        <EntityIcon
          icon={participant.icon_meta}
          entityType={participant.agent_type === 'pipeline' ? 'pipeline' : participant.participantType}
          editable={false}
        />
        <Box sx={styles.bodyContainer}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
            sx={styles.nameText}
          >
            {participant.name}
          </Typography>
          <Typography
            variant="bodySmall"
            color="text.default"
            sx={styles.typeText}
            component={'span'}
          >
            {participant.participantType === ChatParticipantType.Applications
              ? participant.agent_type === 'pipeline'
                ? 'pipeline'
                : 'agent'
              : participant.participantType}
          </Typography>
        </Box>
        {participant.project_id == PUBLIC_PROJECT_ID &&
          (participant.participantType === ChatParticipantType.Applications ||
            participant.participantType === ChatParticipantType.Pipelines) && (
            <Box sx={styles.publicLabelContainer}>
              <Typography
                variant="bodySmall"
                sx={styles.publicLabel}
              >
                {'Public'}
              </Typography>
            </Box>
          )}
      </Box>
    </TooltipWithDuration>
  );
});

/** @type {MuiSx} */
const styles = {
  tipNameText: {
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
  },
  tipDescriptionText: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
  },
  card: alreadyExists => theme => ({
    display: 'flex',
    boxSizing: 'border-box',
    gap: '0.75rem',
    borderRadius: '0.5rem',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    height: '3.5rem',
    cursor: alreadyExists ? 'default' : 'pointer',
    border: alreadyExists ? `1px solid ${theme.palette.border.userMessageEditor}` : 'none',
    background: theme.palette.background.userInputBackground,
    '&:hover': {
      background: theme.palette.background.userInputBackgroundActive,
    },
    [theme.breakpoints.down('prompt_list_sm')]: {
      width: '100%',
    },
    [theme.breakpoints.between('prompt_list_sm', 'prompt_list_full_width_sm')]: {
      width: '100%',
    },
    [theme.breakpoints.between('prompt_list_full_width_sm', 'prompt_list_xl')]: {
      width: 'calc(50% - 0.375rem)',
    },
    [theme.breakpoints.between('prompt_list_xl', 'prompt_list_xxl')]: {
      width: 'calc(33.33% - 0.5rem)',
    },
    [theme.breakpoints.between('prompt_list_xxl', 'prompt_list_xxxl')]: {
      width: 'calc(33.33% - 0.5rem)',
    },
    [theme.breakpoints.up('prompt_list_xxxl')]: {
      width: 'calc(25% - 0.6rem)',
    },
  }),
  bodyContainer: {
    width: 'calc(100% - 2.25rem)',
  },
  nameText: {
    width: '100%',
    wordWrap: 'break-word',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '1',
    whiteSpaceCollapse: 'preserve', // prevent white spaces being collapsed
  },
  typeText: {
    width: '100%',
    wordWrap: 'break-word',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '1',
    whiteSpaceCollapse: 'preserve', // prevent white spaces being collapsed
    textTransform: 'capitalize', // This will capitalize the first letter of each word
  },
  publicLabelContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem', // 2px 6px
    height: '1.25rem', // 20px
    borderRadius: '0.875rem', // 8px
    border: ({ palette }) => `1px solid ${palette.border.lines}`,
  },
  publicLabel: {
    textTransform: 'none', // Don't capitalize the public label
    color: ({ palette }) => palette.text.metrics,
  },
};

NewParticipantCard.displayName = 'NewParticipantCard';

export default NewParticipantCard;
