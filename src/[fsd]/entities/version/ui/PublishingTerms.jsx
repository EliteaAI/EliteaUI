import { memo, useCallback, useState } from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import InputActionsToolbar from '@/[fsd]/shared/ui/input/InputActionsToolbar';
import CloseIcon from '@/components/Icons/CloseIcon';

const TERMS_SECTIONS = [
  {
    heading: '1 - Exclusions Notice',
    lines: [
      'When publishing, certain components will be stripped from the public version for security and privacy:',
      '• Credentials and API keys',
      '• Private datasource connections',
      '• Environment-specific configurations',
      '• Internal tool endpoints',
      '',
      'Consumers of your published agent will need to provide their own credentials and configurations.',
    ],
  },
  {
    heading: '2 - Best Practices Requirements',
    lines: [
      'To ensure a quality experience for consumers, your agent should include:',
      '• A clear, descriptive name (not generic)',
      '• A detailed description explaining capabilities',
      '• At least one tag for discoverability',
      '• Comprehensive instructions for the model',
      '• Welcome message and conversation starters',
      '',
      'Agents that do not meet these requirements may fail validation.',
    ],
  },
  {
    heading: '3 - Administrative Rights',
    lines: [
      'By publishing, you acknowledge that:',
      '• Platform administrators may unpublish your agent at any time',
      '• You retain the ability to unpublish your own agent',
      '• Published agents are visible to all users in Agent Studio',
      '• Usage metrics may be collected for published agents',
    ],
  },
];

const COLLAPSED_HEIGHT = '10rem';
const EXPANDED_HEIGHT = 'none';

const PublishingTerms = memo(() => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const switchRows = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <>
      <Box
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        sx={styles.container}
      >
        {isHovering && (
          <InputActionsToolbar
            value="terms"
            showCopyAction={false}
            showFullScreenAction
            showExpandAction
            onFullScreen={() => setShowFullScreen(true)}
            switchRows={switchRows}
            isExpanded={isExpanded}
            toolbarSx={styles.toolbar}
            iconButtonSx={styles.iconButton}
            iconSizeSx={styles.iconSize}
          />
        )}
        <Box sx={{ ...styles.scrollArea, maxHeight: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}>
          <TermsContent />
        </Box>
      </Box>

      {showFullScreen && (
        <Dialog
          open
          onClose={() => setShowFullScreen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: styles.fullScreenPaper } }}
        >
          <DialogTitle sx={styles.fullScreenTitle}>
            <Typography variant="headingSmall">Publishing Terms</Typography>
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={() => setShowFullScreen(false)}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={styles.fullScreenContent}>
            <TermsContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

PublishingTerms.displayName = 'PublishingTerms';

const TermsContent = memo(() => (
  <Box sx={styles.termsContent}>
    {TERMS_SECTIONS.map((section, idx) => (
      <Box
        key={idx}
        sx={styles.section}
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          {section.heading}
        </Typography>
        {section.lines.map((line, lineIdx) => (
          <Typography
            key={lineIdx}
            variant="bodySmall"
            color="text.secondary"
            sx={line === '' ? { height: '0.5rem' } : undefined}
          >
            {line}
          </Typography>
        ))}
      </Box>
    ))}
  </Box>
));

TermsContent.displayName = 'TermsContent';

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
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
  termsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
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

export default PublishingTerms;
