import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button, Text } from '@/[fsd]/shared/ui';
import { CONTEXT_WINDOW_COPY, TOOLTIP_CONFIG } from '@/[fsd]/widgets/context-budget/lib/constants';
import EditIcon from '@/assets/edit.svg?react';
import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Header section with title, info icon, and edit button
 */
const ContextBudgetHeader = memo(props => {
  const { onEdit, canEdit = true } = props;
  const styles = contextBudgetHeaderStyles();

  return (
    <Box sx={styles.header}>
      <Box sx={styles.headerLeft}>
        <Text.EllipsisTypography
          data-testid="context-budget-title"
          variant="headingSmall"
        >
          Context management
        </Text.EllipsisTypography>
        <Tooltip
          title="Chat totals are provider-reported tokens for every model call in this chat. The safety margin is excluded from the available window. The next request is estimated separately for automatic compaction."
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
        title={canEdit ? 'Edit context settings' : CONTEXT_WINDOW_COPY.NO_PERMISSION}
        placement={TOOLTIP_CONFIG.INFO.placement}
      >
        <Box component="span">
          <Button.BaseBtn
            variant="tertiary"
            onClick={onEdit}
            disabled={!canEdit}
            data-testid="context-budget-edit-button"
            startIcon={<EditIcon />}
          />
        </Box>
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
    flex: '1',
    minWidth: 0,
  },
  infoIconWrapper: {
    display: 'flex',
  },
});

export default ContextBudgetHeader;
