import { memo } from 'react';

import { Box, Typography } from '@mui/material';

// FEATURE TOGGLE: Summarization details modal
// import Tooltip from '@/ComponentsLib/Tooltip';
// import { useModal } from '@/[fsd]/shared/lib/hooks';
// import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
// import { useSelectedProjectId } from '@/hooks/useSelectedProject';
// import SummaryDetailsModal from './SummaryDetailsModal';

const SummaryDetailsButton = memo(props => {
  const { count } = props;
  // FEATURE TOGGLE: Summarization details modal - isCompact used in disabled button styles
  const isCompact = true;
  // FEATURE TOGGLE: Summarization details modal
  // const { conversationId, disabled = false } = props;
  // const projectId = useSelectedProjectId();
  // const { isOpen, handleOpen, handleClose } = useModal();
  // const handleClick = useCallback(() => {
  //   handleOpen();
  // }, [handleOpen]);
  // const isDisabled = count === 0 || disabled;

  const styles = summaryDetailsButtonStyles(isCompact);

  // Show only the count without modal functionality
  return (
    <Box sx={styles.countDisplay}>
      <Typography variant={isCompact ? 'bodySmall2' : 'bodyMedium'}>{count}</Typography>
    </Box>
  );

  // FEATURE TOGGLE: Summarization details modal with button
  // return (
  //   <>
  //     <Tooltip
  //       title="Summaries details"
  //       disableInteractive
  //       leaveDelay={0}
  //     >
  //       <BaseBtn
  //         variant={BUTTON_VARIANTS.special}
  //         onClick={handleClick}
  //         disabled={isDisabled}
  //         sx={styles.button}
  //       >
  //         {count}
  //       </BaseBtn>
  //     </Tooltip>
  //
  //     <SummaryDetailsModal
  //       open={isOpen}
  //       onClose={handleClose}
  //       conversationId={conversationId}
  //       projectId={projectId}
  //     />
  //   </>
  // );
});

SummaryDetailsButton.displayName = 'SummaryDetailsButton';

/** @type {MuiSx} */
// eslint-disable-next-line no-unused-vars
const summaryDetailsButtonStyles = isCompact => ({
  countDisplay: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // FEATURE TOGGLE: Summarization details modal button styles
  // button: isCompact
  //   ? {
  //       padding: '0 0.4rem',
  //       marginRight: '-0.125rem',
  //       minWidth: 'auto',
  //       borderRadius: '0.9375rem',
  //       fontSize: '0.75rem',
  //       height: '1rem',
  //       fontWeight: 400,
  //     }
  //   : {
  //       padding: 0,
  //       minWidth: '1.5rem',
  //       width: '1.652rem',
  //       height: '1.5rem',
  //       borderRadius: '0.94rem',
  //       fontSize: '0.75rem',
  //       fontWeight: 400,
  //     },
});

export default SummaryDetailsButton;
