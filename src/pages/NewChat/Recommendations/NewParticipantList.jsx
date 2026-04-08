import { useCallback } from 'react';

import { Box, ClickAwayListener, Skeleton, Typography, useTheme } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { getRawParticipantUniqueId } from '@/common/utils';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';

import NewParticipantCard from './NewParticipantCard';

const NewPlaceholderCard = ({ width }) => {
  const theme = useTheme();
  return (
    <Skeleton
      variant="rectangular"
      width={width || 250}
      height={56}
      sx={{
        borderRadius: '8px',
        border: `1px solid ${theme.palette.border.lines}`,
      }}
    />
  );
};

export default function NewParticipantList({
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
}) {
  const theme = useTheme();
  const { componentWidth, componentRef } = useGetComponentWidth();

  const onClickParticipant = useCallback(
    participant => {
      onSelectParticipant(participant);
    },
    [onSelectParticipant],
  );

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box
        border={`1px solid ${theme.palette.border.lines}`}
        width={'100%'}
        maxWidth={'100%'}
        maxHeight={'247px'}
        borderRadius={'16px'}
        boxSizing={'border-box'}
        padding={'12px'}
        display={'flex'}
        flexDirection={'column'}
        gap={'12px'}
        sx={{
          background: theme.palette.background.secondary,
          height: 'auto',
          overflowY: 'auto',
        }}
      >
        <Box
          height={'16px'}
          display={'flex'}
          alignItems={'center'}
          width={'100%'}
          padding={'0 8px'}
        >
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            padding: '12px auto',
            width: '100%',
          }}
        >
          <Box
            display={'flex'}
            flexWrap={'wrap'}
            gap={'12px'}
            justifyContent={'flex-start'}
            width={'100%'}
            boxSizing={'border-box'}
            ref={componentRef}
          >
            {!isLoading && !participants?.length && !isFetching && (
              <Typography
                padding={'0 8px'}
                variant="bodyMedium"
                color="text.secondary"
                width={'100%'}
                textAlign={'left'}
              >
                No matching results
              </Typography>
            )}
            {isLoading &&
              Array(6)
                .fill(null)
                .map((u, i) => (
                  <NewPlaceholderCard
                    width={componentWidth ? (componentWidth - 12) / 2 : 250}
                    key={'isLoading' + i}
                  />
                ))}
            {!isLoading &&
              participants
                .map(item => ({ ...item, participantId: getRawParticipantUniqueId(item) }))
                .map(participant => (
                  <NewParticipantCard
                    key={participant.participantType + '_' + participant.id + '_' + participant.project_id}
                    participant={participant}
                    onClick={onClickParticipant}
                    alreadyExists={existingParticipantUids.find(item => item === participant.participantId)}
                  />
                ))}
            {isFetching &&
              !!participants?.length &&
              Array(6)
                .fill(null)
                .map((u, i) => (
                  <NewPlaceholderCard
                    width={componentWidth ? (componentWidth - 12) / 2 : 250}
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
}
