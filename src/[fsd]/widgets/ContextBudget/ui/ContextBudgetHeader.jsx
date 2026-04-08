import { memo } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { TOOLTIP_CONFIG } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import EditIcon from '@/components/Icons/EditIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Header section with title, info icon, and edit button
 */
const ContextBudgetHeader = memo(props => {
  const { onEdit } = props;
  const styles = contextBudgetHeaderStyles();

  return (
    <Box sx={styles.header}>
      <Box sx={styles.headerLeft}>
        <Typography
          variant="labelSmall"
          sx={styles.title}
        >
          Context Budget
        </Typography>
        <Tooltip
          title="Shows how much of your conversation context window is being used"
          placement={TOOLTIP_CONFIG.INFO.placement}
        >
          <Box sx={styles.infoIconWrapper}>
            <InfoIcon
              width={16}
              height={16}
            />
          </Box>
        </Tooltip>
      </Box>
      <Tooltip
        title="Edit context settings"
        placement={TOOLTIP_CONFIG.INFO.placement}
      >
        <IconButton
          variant="elitea"
          color="tertiary"
          onClick={onEdit}
        >
          <EditIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

ContextBudgetHeader.displayName = 'ContextBudgetHeader';

/** @type {MuiSx} */
const contextBudgetHeaderStyles = () => ({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    gap: '0.375rem',
    alignSelf: 'stretch',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: '0.25rem',
    height: '1rem',
    flex: '1',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  infoIconWrapper: {
    display: 'flex',
  },
});

export default ContextBudgetHeader;
