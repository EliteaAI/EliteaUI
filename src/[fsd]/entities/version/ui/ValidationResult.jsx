import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';

import { ENTITY_STUDIO } from '@/[fsd]/entities/version/lib/constants';
import DetailsContent from '@/[fsd]/entities/version/ui/DetailsContent';
import SeverityBadge from '@/[fsd]/entities/version/ui/SeverityBadge';
import InputActionsToolbar from '@/[fsd]/shared/ui/input/InputActionsToolbar';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';
import useToast from '@/hooks/useToast';

const STATUS_CONFIG = {
  PASS: {
    message: (entityLabel, studioName) =>
      `Your ${entityLabel} version meets all the necessary requirements and is ready to publish to ${studioName}!`,
    color: (palette, alphaMui) => ({
      iconColor: palette.status.publishedIcon,
      message: palette.status.publishedText,
      border: `0.0625rem solid ${alphaMui(palette.status.publishedBorder, 0.4)}`,
      background: alphaMui(palette.status.publishedBackground, 0.08),
    }),
    Icon: SuccessIcon,
    iconColor: theme => theme.palette.status.published,
  },
  WARN: {
    message: entityLabel =>
      `Your ${entityLabel} version meets the necessary requirements, but has some points for improvement. Follow summary details to improve.`,
    color: (palette, alphaMui) => ({
      iconColor: palette.status.onModeration,
      message: palette.status.warningText,
      border: `0.0625rem solid ${alphaMui(palette.status.onModeration, 0.4)}`,
      background: alphaMui(palette.status.onModeration, 0.08),
    }),
    Icon: AttentionIcon,
  },
  FAIL: {
    message: entityLabel =>
      `Sorry, your ${entityLabel} version doesn't meet all the necessary requirements. Follow summary details to fix the issues and try again.`,
    color: (palette, alphaMui) => ({
      iconColor: palette.status.rejected,
      message: palette.status.rejectedText,
      border: `0.0625rem solid ${alphaMui(palette.status.rejected, 0.4)}`,
      background: alphaMui(palette.status.rejected, 0.08),
    }),
    Icon: ErrorIcon,
  },
};

const SECTION_IDS = {
  critical: 'validation-critical',
  warnings: 'validation-warnings',
  suggestions: 'validation-suggestions',
};

const buildPlainText = (critical_issues = [], warnings = [], recommendations = []) => {
  const parts = [];
  if (critical_issues.length > 0) {
    parts.push(`Critical Issues (${critical_issues.length})`);
    critical_issues.forEach(i => {
      const ctx = i.context ? ` [${i.context}]` : '';
      parts.push(`  • ${i.field}${ctx}: ${i.issue}`);
      if (i.fix) parts.push(`    Fix: ${i.fix}`);
    });
    parts.push('');
  }
  if (warnings.length > 0) {
    parts.push(`Warnings (${warnings.length})`);
    warnings.forEach(i => {
      const ctx = i.context ? ` [${i.context}]` : '';
      parts.push(`  • ${i.field}${ctx}: ${i.issue}`);
      if (i.fix) parts.push(`    Fix: ${i.fix}`);
    });
    parts.push('');
  }
  if (recommendations.length > 0) {
    parts.push(`Suggestions (${recommendations.length})`);
    recommendations.forEach(i => {
      const ctx = i.context ? ` [${i.context}]` : '';
      parts.push(`  • ${i.field}${ctx}: ${i.suggestion}`);
    });
    parts.push('');
  }
  return parts.join('\n').trimEnd();
};

const ValidationResult = memo(props => {
  const { result, entityLabel = 'agent' } = props;
  const { status, counts = {}, critical_issues = [], warnings = [], recommendations = [] } = result;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FAIL;
  const studioName = ENTITY_STUDIO[entityLabel] || ENTITY_STUDIO.agent;
  const theme = useTheme();
  const scrollRef = useRef(null);
  const { toastInfo, toastError } = useToast();

  const [isHovering, setIsHovering] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const plainText = useMemo(
    () => buildPlainText(critical_issues, warnings, recommendations),
    [critical_issues, warnings, recommendations],
  );

  const hasDetails = critical_issues.length > 0 || warnings.length > 0 || recommendations.length > 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      toastInfo('The content has been copied to the clipboard.');
    } catch {
      toastError('Failed to copy the content!');
    }
  }, [plainText, toastInfo, toastError]);

  const scrollToSection = useCallback(sectionId => {
    const el = scrollRef.current?.querySelector(`#${sectionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const StatusIcon = config.Icon;

  return (
    <Box sx={styles.resultRoot}>
      <Box sx={styles.summaryHeader}>
        <Typography variant="labelSmall">SUMMARY:</Typography>
      </Box>

      <Box sx={styles.statusBox(config.color(theme.palette, alpha))}>
        <Box>
          {
            <StatusIcon
              size={16}
              fill={config.color(theme.palette, alpha).iconColor}
            />
          }
        </Box>
        <Typography
          variant="labelMedium"
          sx={{ color: config.color(theme.palette, alpha).message }}
        >
          {config.message(entityLabel, studioName)}
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
              showExpandAction={false}
              onCopy={handleCopy}
              onFullScreen={() => setShowFullScreen(true)}
              toolbarSx={styles.toolbar}
              iconButtonSx={styles.iconButton}
              iconSizeSx={styles.iconSize}
            />
          )}
          <Box
            ref={scrollRef}
            sx={{ ...styles.scrollArea, maxHeight: '12rem' }}
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

/** @type {MuiSx} */
const styles = {
  resultRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statusBox: config => ({
    borderRadius: '0.5rem',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: config.background,
    border: config.border,
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
  detailsContainer: ({ palette }) => ({
    position: 'relative',
    border: `1px solid ${palette.border.lines}`,
    backgroundColor: `${palette.background.tabPanel}`,
    borderRadius: '0.5rem',
    padding: '0.75rem',
    cursor: 'text',
    userSelect: 'text',
  }),
  scrollArea: {
    overflowY: 'auto',
    transition: 'max-height 0.2s ease',
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
    background: palette.background.default.secondary,
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

export default ValidationResult;
