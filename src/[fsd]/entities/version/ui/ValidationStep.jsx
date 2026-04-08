import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';

import InputActionsToolbar from '@/[fsd]/shared/ui/input/InputActionsToolbar';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';
import useToast from '@/hooks/useToast';

const STATUS_CONFIG = {
  PASS: {
    message:
      'Your agent version meets all the necessary requirements and is ready to publish to Agent Studio!',
    color: 'success.main',
    Icon: SuccessIcon,
    iconColor: theme => theme.palette.status.published,
  },
  WARN: {
    message:
      'Your agent version meets the necessary requirements, but has some points for improvement. Follow summary details to improve.',
    color: 'warning.main',
    Icon: AttentionIcon,
    iconColor: theme => theme.palette.status.onModeration,
  },
  FAIL: {
    message:
      "Sorry, your agent version doesn't meet all the necessary requirements. Follow summary details to fix the issues and try again.",
    color: 'error.main',
    Icon: ErrorIcon,
    iconColor: theme => theme.palette.status.rejected,
  },
};

const SECTION_IDS = {
  critical: 'validation-critical',
  warnings: 'validation-warnings',
  suggestions: 'validation-suggestions',
};

/**
 * Builds plain text for copy-to-clipboard.
 */
const buildPlainText = (critical_issues = [], warnings = [], recommendations = []) => {
  const parts = [];
  if (critical_issues.length > 0) {
    parts.push(`Critical Issues (${critical_issues.length})`);
    critical_issues.forEach(i => {
      parts.push(`  • ${i.field}: ${i.issue}`);
      if (i.fix) parts.push(`    Fix: ${i.fix}`);
    });
    parts.push('');
  }
  if (warnings.length > 0) {
    parts.push(`Warnings (${warnings.length})`);
    warnings.forEach(i => {
      parts.push(`  • ${i.field}: ${i.issue}`);
      if (i.fix) parts.push(`    Fix: ${i.fix}`);
    });
    parts.push('');
  }
  if (recommendations.length > 0) {
    parts.push(`Suggestions (${recommendations.length})`);
    recommendations.forEach(i => {
      parts.push(`  • ${i.field}: ${i.suggestion}`);
    });
    parts.push('');
  }
  return parts.join('\n').trimEnd();
};

const ValidationStep = memo(({ isValidating, validationResult }) => {
  if (isValidating) {
    return (
      <Box sx={styles.loadingRoot}>
        <CircularProgress size={48} />
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={{ marginTop: '1.5rem', textAlign: 'center' }}
        >
          Reviewing your agent version to ensure it meets publication rules.
        </Typography>
      </Box>
    );
  }

  if (!validationResult) {
    return null;
  }

  return <ValidationResult result={validationResult} />;
});

ValidationStep.displayName = 'ValidationStep';

const ValidationResult = memo(({ result }) => {
  const { status, counts = {}, critical_issues = [], warnings = [], recommendations = [] } = result;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FAIL;
  const StatusIcon = config.Icon;
  const theme = useTheme();
  const scrollRef = useRef(null);
  const { toastInfo, toastError } = useToast();

  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const plainText = useMemo(
    () => buildPlainText(critical_issues, warnings, recommendations),
    [critical_issues, warnings, recommendations],
  );

  const hasDetails = critical_issues.length > 0 || warnings.length > 0 || recommendations.length > 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      toastInfo('The content has been copied to the clipboard');
    } catch {
      toastError('Failed to copy the content!');
    }
  }, [plainText, toastInfo, toastError]);

  const scrollToSection = useCallback(sectionId => {
    const el = scrollRef.current?.querySelector(`#${sectionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <Box sx={styles.resultRoot}>
      <Box sx={styles.summaryHeader}>
        <StatusIcon
          width={16}
          height={16}
          fill={config.iconColor(theme)}
        />
        <Typography
          variant="bodySmall"
          sx={{ color: config.color, fontWeight: 700 }}
        >
          SUMMARY:
        </Typography>
      </Box>

      <Box sx={styles.statusBox}>
        <Typography
          variant="bodySmall"
          sx={{ color: config.color }}
        >
          {config.message}
        </Typography>
      </Box>

      <Box sx={styles.countersRow}>
        <SeverityBadge
          label="Critical"
          count={counts.critical || 0}
          icon={
            <ErrorIcon
              size={14}
              fill={theme.palette.status.rejected}
            />
          }
          onClick={() => scrollToSection(SECTION_IDS.critical)}
          disabled={!critical_issues.length}
        />
        <SeverityBadge
          label="Warnings"
          count={counts.warnings || 0}
          icon={
            <AttentionIcon
              width={14}
              height={14}
              fill={theme.palette.status.onModeration}
            />
          }
          onClick={() => scrollToSection(SECTION_IDS.warnings)}
          disabled={!warnings.length}
        />
        <SeverityBadge
          label="Suggestions"
          count={counts.suggestions || 0}
          icon={
            <InfoIcon
              width={14}
              height={14}
              fill={theme.palette.icon.fill.tips}
            />
          }
          onClick={() => scrollToSection(SECTION_IDS.suggestions)}
          disabled={!recommendations.length}
        />
      </Box>

      {hasDetails && (
        <Box
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          sx={styles.detailsContainer}
        >
          {isHovering && (
            <InputActionsToolbar
              value={plainText}
              showCopyAction
              showFullScreenAction
              showExpandAction
              onCopy={handleCopy}
              onFullScreen={() => setShowFullScreen(true)}
              switchRows={() => setIsExpanded(prev => !prev)}
              isExpanded={isExpanded}
              toolbarSx={styles.toolbar}
              iconButtonSx={styles.iconButton}
              iconSizeSx={styles.iconSize}
            />
          )}
          <Box
            ref={scrollRef}
            sx={{ ...styles.scrollArea, maxHeight: isExpanded ? 'none' : '12rem' }}
          >
            <DetailsContent
              critical_issues={critical_issues}
              warnings={warnings}
              recommendations={recommendations}
            />
          </Box>
        </Box>
      )}

      {showFullScreen && (
        <Dialog
          open
          onClose={() => setShowFullScreen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: styles.fullScreenPaper } }}
        >
          <DialogTitle sx={styles.fullScreenTitle}>
            <Typography variant="headingSmall">Validation Details</Typography>
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={() => setShowFullScreen(false)}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={styles.fullScreenContent}>
            <DetailsContent
              critical_issues={critical_issues}
              warnings={warnings}
              recommendations={recommendations}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
});

ValidationResult.displayName = 'ValidationResult';

const DetailsContent = memo(({ critical_issues, warnings, recommendations }) => (
  <Box sx={styles.detailsContent}>
    {critical_issues.length > 0 && (
      <Box id={SECTION_IDS.critical}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          Critical Issues ({critical_issues.length})
        </Typography>
        {critical_issues.map((item, idx) => (
          <IssueItem
            key={idx}
            item={item}
            type="critical"
          />
        ))}
      </Box>
    )}
    {warnings.length > 0 && (
      <Box id={SECTION_IDS.warnings}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          Warnings ({warnings.length})
        </Typography>
        {warnings.map((item, idx) => (
          <IssueItem
            key={idx}
            item={item}
            type="warning"
          />
        ))}
      </Box>
    )}
    {recommendations.length > 0 && (
      <Box id={SECTION_IDS.suggestions}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          Suggestions ({recommendations.length})
        </Typography>
        {recommendations.map((item, idx) => (
          <IssueItem
            key={idx}
            item={item}
            type="suggestion"
          />
        ))}
      </Box>
    )}
  </Box>
));

DetailsContent.displayName = 'DetailsContent';

const IssueItem = memo(({ item, type }) => (
  <Box sx={styles.issueItem}>
    <Typography
      variant="bodySmall"
      color="text.secondary"
      sx={{ fontWeight: 600 }}
    >
      {'\u2022 '}
      {item.field}:
    </Typography>
    <Typography
      variant="bodySmall"
      color="text.secondary"
      sx={{ paddingLeft: '0.75rem' }}
    >
      {type === 'suggestion' ? item.suggestion : item.issue}
    </Typography>
    {item.fix && (
      <Typography
        variant="bodySmall"
        color="text.tips"
        sx={{ paddingLeft: '0.75rem' }}
      >
        Fix: {item.fix}
      </Typography>
    )}
  </Box>
));

IssueItem.displayName = 'IssueItem';

/**
 * Reusable severity badge with icon, label and count.
 * @param {{ icon: React.ReactNode, label: string, count: number, onClick: () => void, disabled: boolean }} props
 */
const SeverityBadge = memo(({ icon, label, count, onClick, disabled }) => (
  <Box
    sx={[
      styles.counter,
      {
        cursor: disabled ? 'default' : 'pointer',
        '&:hover': disabled ? {} : { opacity: 0.8 },
      },
    ]}
    onClick={disabled ? undefined : onClick}
    role={disabled ? undefined : 'button'}
    tabIndex={disabled ? undefined : 0}
  >
    {icon && <Box sx={styles.counterIcon}>{icon}</Box>}
    <Typography
      variant="bodySmall"
      color="text.secondary"
    >
      {label}
    </Typography>
    <Typography
      variant="bodySmall"
      color="text.secondary"
      sx={{ fontWeight: 600 }}
    >
      {count}
    </Typography>
  </Box>
));

SeverityBadge.displayName = 'SeverityBadge';

/** @type {MuiSx} */
const styles = {
  loadingRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
  resultRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statusBox: ({ palette }) => ({
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.75rem',
  }),
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  countersRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  counter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '2rem',
    padding: '0.375rem 0.75rem',
  }),
  counterIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  detailsContainer: ({ palette }) => ({
    position: 'relative',
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.75rem',
    cursor: 'text',
    userSelect: 'text',
  }),
  scrollArea: {
    overflowY: 'auto',
    transition: 'max-height 0.2s ease',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  issueItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    display: 'flex',
    gap: '0.25rem',
    zIndex: 1,
  },
  iconButton: {
    padding: '0.25rem',
  },
  iconSize: {
    fontSize: '1rem',
  },
  fullScreenPaper: ({ palette }) => ({
    background: palette.background.secondary,
  }),
  fullScreenTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullScreenContent: {
    padding: '1.5rem !important',
  },
};

export default ValidationStep;
