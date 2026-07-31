import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, IconButton, Link, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { BudgetWarningConstants } from '@/[fsd]/shared/lib/constants';
import ErrorIcon from '@/assets/error-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';
import CloseIcon from '@/components/Icons/CloseIcon';

/**
 * Advance notice that a budget is nearing its limit, shown above the message input.
 *
 * Distinct from BudgetErrorMessage: that explains a request already blocked, this arrives
 * while requests still work. The scope decides the wording and where the link goes — the
 * backend sends only one, so there is no precedence rule to apply here.
 */
const BudgetWarningBanner = memo(props => {
  const { scope, percentUsed, onDismiss } = props;

  const styles = budgetWarningBannerStyles();

  const variant = BudgetWarningConstants.BUDGET_WARNING_VARIANTS[scope];

  if (!variant || percentUsed === null || percentUsed === undefined) return null;

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
        {variant.message(percentUsed)}{' '}
        <Link
          component={RouterLink}
          to={variant.to}
          sx={styles.link}
        >
          {variant.linkLabel}
        </Link>
      </Typography>
      <StyledTooltip
        title="Dismiss budget warning"
        placement="top"
      >
        <IconButton
          variant="elitea"
          color="secondary"
          aria-label="Dismiss budget warning"
          onClick={onDismiss}
          sx={styles.closeButton}
        >
          <CloseIcon sx={styles.closeIcon} />
        </IconButton>
      </StyledTooltip>
    </Box>
  );
});

BudgetWarningBanner.displayName = 'BudgetWarningBanner';

/** @type {MuiSx} */
const budgetWarningBannerStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: palette.background.errorBkg,
    border: `0.0625rem solid ${palette.background.wrongBkg}`,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: '0.5rem',
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.error,
    flexShrink: 0,
  }),
  // Wraps rather than truncating on a narrow viewport, so the percentage stays readable
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
  // Never shrinks away: the banner must stay dismissible at any width
  closeButton: {
    padding: 0,
    flexShrink: 0,
  },
  closeIcon: {
    fontSize: '1rem',
  },
});

export default BudgetWarningBanner;
