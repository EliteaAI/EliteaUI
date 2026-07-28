import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { BudgetErrorConstants } from '@/[fsd]/shared/lib/constants';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import ErrorIcon from '@/assets/error-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';

// A budget block is an expected policy outcome, not a platform failure, so it gets a
// plain explanation and a way to check usage rather than the raw provider error
const BudgetErrorMessage = memo(props => {
  const { code } = props;

  const styles = budgetErrorMessageStyles();
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  const variant = BudgetErrorConstants.BUDGET_ERROR_VARIANTS[code];

  if (!variant) return null;

  // The Usage tab itself is hidden when budgets are off, so linking there would dead-end
  const canSeeUsage = Boolean(platformSettings?.cost_budgets_enabled);

  return (
    <Box sx={styles.container}>
      <Box
        component={ErrorIcon}
        sx={styles.icon}
      />
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        {variant.message}
        {canSeeUsage && (
          <>
            {' '}
            <Link
              component={RouterLink}
              to={variant.to}
              sx={styles.link}
            >
              {variant.linkLabel}
            </Link>
          </>
        )}
      </Typography>
    </Box>
  );
});

BudgetErrorMessage.displayName = 'BudgetErrorMessage';

/** @type {MuiSx} */
const budgetErrorMessageStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '.75rem 1rem',
    backgroundColor: palette.background.errorBkg,
    border: `0.0625rem solid ${palette.background.wrongBkg}`,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: '0.5rem',
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.error,
    flexShrink: 0,
    marginTop: '0.1rem',
  }),
  text: ({ palette }) => ({
    flex: 1,
    color: palette.text.warningText,
    wordBreak: 'break-word',
  }),
  link: ({ palette }) => ({
    color: palette.text.createButton,
    textDecorationColor: palette.text.createButton,
    '&:hover': {
      color: palette.text.createButton,
    },
  }),
});

export default BudgetErrorMessage;
