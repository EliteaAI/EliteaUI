import { memo, useCallback, useRef } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { useScrollActiveIntoView } from '@/[fsd]/shared/lib/hooks';
import { getRawParticipantUniqueId } from '@/common/utils';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';

import NewParticipantCard from './NewParticipantCard';
import NewPlaceholderCard from './NewPlaceholderCard';

const NewParticipantList = memo(props => {
  const {
    onSelectParticipant,
    isLoading,
    isFetching,
    participants = [],
    total = 0,
    resetPageDependencies,
    existingParticipantUids = [],
    onClose = () => {},
    title = 'Frequently used',
    onLoadMore,
    activeIndex = -1,
    // ELITEA-2202/2203/2204: caller-supplied testids. This component is shared
    // with RecommendationList/SearchResultList, so both stay undefined unless a
    // caller opts in (.agents/testing.md § Locator policy — shared components
    // never hardcode feature-scoped testids).
    containerTestId,
    getItemTestId,
  } = props;

  const { componentWidth, componentRef } = useGetComponentWidth();
  const containerRef = useRef(null);
  const { itemRefs } = useScrollActiveIntoView(activeIndex, containerRef);

  const onClickParticipant = useCallback(
    participant => {
      onSelectParticipant(participant);
    },
    [onSelectParticipant],
  );

  const placeholderWidth = componentWidth ? (componentWidth - 12) / 2 : 250;

  const styles = newParticipantListStyles();

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box
        ref={containerRef}
        data-testid={containerTestId}
        sx={styles.root}
      >
        <Box sx={styles.header}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            {title}
          </Typography>
        </Box>
        <Box sx={styles.body}>
          <Box
            sx={styles.grid}
            ref={componentRef}
          >
            {!isLoading && !participants?.length && !isFetching && (
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={styles.emptyText}
              >
                No matching results
              </Typography>
            )}
            {isLoading &&
              Array(6)
                .fill(null)
                .map((u, i) => (
                  <NewPlaceholderCard
                    width={placeholderWidth}
                    key={'isLoading' + i}
                  />
                ))}
            {!isLoading &&
              participants
                .map((item, idx) => ({ ...item, participantId: getRawParticipantUniqueId(item), _idx: idx }))
                .map(participant => (
                  <NewParticipantCard
                    key={participant.participantType + '_' + participant.id + '_' + participant.project_id}
                    participant={participant}
                    onClick={onClickParticipant}
                    alreadyExists={existingParticipantUids.find(item => item === participant.participantId)}
                    isActive={participant._idx === activeIndex}
                    itemRef={el => {
                      itemRefs.current[participant._idx] = el;
                    }}
                    testId={getItemTestId ? getItemTestId(participant) : undefined}
                  />
                ))}
            {isFetching &&
              !!participants?.length &&
              Array(6)
                .fill(null)
                .map((u, i) => (
                  <NewPlaceholderCard
                    width={placeholderWidth}
                    key={'isFetching_' + i}
                  />
                ))}
          </Box>
          {onLoadMore && (
            <ListInfiniteMoreLoader
              listCurrentSize={participants?.length}
              totalAvailableCount={total}
              onLoadMore={onLoadMore}
              resetPageDependencies={resetPageDependencies}
            />
          )}
        </Box>
      </Box>
    </ClickAwayListener>
  );
});

NewParticipantList.displayName = 'NewParticipantList';

/** @type {MuiSx} */
const newParticipantListStyles = () => ({
  root: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    width: '100%',
    maxWidth: '100%',
    maxHeight: '15.4375rem',
    borderRadius: '1rem',
    boxSizing: 'border-box',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: palette.background.default.secondary,
    height: 'auto',
    overflowY: 'auto',
  }),
  header: {
    height: '1rem',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0 0.5rem',
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    padding: '0.75rem auto',
    width: '100%',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'flex-start',
    width: '100%',
    boxSizing: 'border-box',
  },
  emptyText: {
    padding: '0 0.5rem',
    width: '100%',
    textAlign: 'left',
  },
});

export default NewParticipantList;
