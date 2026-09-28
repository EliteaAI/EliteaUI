import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, IconButton, Link, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { BudgetWarningConstants } from '@/[fsd]/shared/lib/constants';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';
import CloseIcon from '@/components/Icons/CloseIcon';

/**
 * Advance notice that a budget is nearing its limit; BudgetErrorMessage covers a blocked request.
 */
const BudgetWarningBanner = memo(props => {
  const { scope, percentUsed, severity, dismissible = true, onDismiss } = props;

  const styles = budgetWarningBannerStyles(severity);

  const variant = BudgetWarningConstants.BUDGET_WARNING_VARIANTS[scope];

  if (!variant || percentUsed === null || percentUsed === undefined) return null;

  return (
    <Box
      sx={styles.container}
      data-testid="budget-warning-banner"
      data-severity={severity}
    >
      <Box
        component={AttentionIcon}
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
      {dismissible && (
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
      )}
    </Box>
  );
});

BudgetWarningBanner.displayName = 'BudgetWarningBanner';

const { BUDGET_WARNING_SEVERITY } = BudgetWarningConstants;

// Border width stays constant so the banner never jumps in height between levels
const severityTokens = (palette, severity) =>
  ({
    [BUDGET_WARNING_SEVERITY.CRITICAL]: {
      background: palette.alert.error.background,
      border: palette.alert.error.border,
      icon: palette.icon.error,
      text: palette.alert.error.text,
    },
    [BUDGET_WARNING_SEVERITY.ELEVATED]: {
      background: palette.alert.warning.background,
      border: palette.alert.warning.borderStrong,
      icon: palette.icon.warning,
      text: palette.status.warningText,
    },
  })[severity] ?? {
    background: palette.alert.warning.background,
    border: palette.alert.warning.border,
    icon: palette.icon.warning,
    text: palette.status.warningText,
  };

/** @type {MuiSx} */
const budgetWarningBannerStyles = severity => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: severityTokens(palette, severity).background,
    border: `0.0625rem solid ${severityTokens(palette, severity).border}`,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: '0.5rem',
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: severityTokens(palette, severity).icon,
    flexShrink: 0,
  }),
  // Wraps rather than truncating on a narrow viewport, so the percentage stays readable
  text: ({ palette }) => ({
    flex: 1,
    color: severityTokens(palette, severity).text,
    wordBreak: 'break-word',
  }),
  link: ({ palette }) => ({
    color: palette.components.button.text.create,
    textDecorationColor: palette.components.button.text.create,
    '&:hover': {
      color: palette.components.button.text.create,
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
