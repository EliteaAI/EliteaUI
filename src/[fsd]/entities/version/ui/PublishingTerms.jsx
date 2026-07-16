import { memo, useState } from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import { ENTITY_STUDIO } from '@/[fsd]/entities/version/lib/constants';
import InputActionsToolbar from '@/[fsd]/shared/ui/input/InputActionsToolbar';
import CloseIcon from '@/components/Icons/CloseIcon';

const ENTITY_PLURAL = { agent: 'Agents', skill: 'Skills' };

const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);

const buildAgentTermsSections = (entityLabel, studioName, entityPlural) => [
  {
    heading: '1 - Exclusions Notice',
    lines: [
      'When publishing, certain components will be stripped from the public version for security and privacy:',
      '• Credentials and API keys',
      '• Private datasource connections',
      '• Environment-specific configurations',
      '• Internal tool endpoints',
      '',
      `Consumers of your published ${entityLabel} will need to provide their own credentials and configurations.`,
      '',
      `Attached Skills and sub-agents are retained: their instructions are embedded in the published ${entityLabel}. Retained Skills are never listed as separate entries in the catalog.`,
    ],
  },
  {
    heading: '2 - Best Practices Requirements',
    lines: [
      `To ensure a quality experience for consumers, your ${entityLabel} should include:`,
      '• A clear, descriptive name (not generic)',
      '• A detailed description explaining capabilities',
      '• At least one tag for discoverability',
      '• Comprehensive instructions for the model',
      '• Welcome message and conversation starters',
      '',
      `${entityPlural} that do not meet these requirements may fail validation.`,
    ],
  },
  {
    heading: '3 - Administrative Rights',
    lines: [
      'By publishing, you acknowledge that:',
      `• Platform administrators may unpublish your ${entityLabel} at any time`,
      `• You retain the ability to unpublish your own ${entityLabel}`,
      `• Published ${entityLabel}s are visible to all users in ${studioName}`,
      `• Usage metrics may be collected for published ${entityLabel}s`,
    ],
  },
];

const buildSkillTermsSections = () => [
  {
    heading: '1 - Content Notice',
    lines: [
      'Skills are published as pure prompt instruction sets. The published version is a read-only snapshot of your skill at the time of publishing.',
      'No external integrations, credentials, or project-specific references are carried over.',
    ],
  },
  {
    heading: '2 - Best Practices Requirements',
    lines: [
      'For an optimal experience, your published skill should include:',
      '• A clear, descriptive name (not generic)',
      '• A comprehensive description covering purpose and use cases',
      '• A distinctive icon that identifies the skill',
      '• Complete, actionable instructions',
      '• A descriptive version name following semantic versioning',
      '',
      'Skills that do not meet these requirements may fail validation.',
    ],
  },
  {
    heading: '3 - Administrative Rights',
    lines: [
      'Elitea administrators reserve the right to unpublish skills that:',
      '• Violate platform rules or guidelines',
      '• Do not meet quality standards',
      '• Contain inappropriate, harmful, or offensive content',
      '• Embed credentials, API keys, or security-sensitive information',
      '• Fail to satisfy publishing requirements',
    ],
  },
];

const COLLAPSED_HEIGHT = '10rem';

const PublishingTerms = memo(({ entityLabel = 'agent' }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const sections =
    entityLabel === 'skill'
      ? buildSkillTermsSections()
      : buildAgentTermsSections(
          entityLabel,
          ENTITY_STUDIO[entityLabel] || ENTITY_STUDIO.agent,
          ENTITY_PLURAL[entityLabel] || capitalize(`${entityLabel}s`),
        );

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
            showExpandAction={false}
            onFullScreen={() => setShowFullScreen(true)}
            toolbarSx={styles.toolbar}
            iconButtonSx={styles.iconButton}
            iconSizeSx={styles.iconSize}
          />
        )}
        <Box sx={{ ...styles.scrollArea, maxHeight: COLLAPSED_HEIGHT }}>
          <TermsContent sections={sections} />
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
            <TermsContent sections={sections} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

PublishingTerms.displayName = 'PublishingTerms';

const TermsContent = memo(({ sections }) => (
  <Box sx={styles.termsContent}>
    {sections.map((section, idx) => (
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
