import { memo, useMemo, useState } from 'react';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import { ELITEA_CATALOG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/eliteaCatalogTourTargets.constants';
import { useGetPublicSkillDetailsQuery } from '@/[fsd]/features/skill-hub/api';
import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';
import AttachToAgentDialog from '@/[fsd]/features/skill-hub/ui/AttachToAgentDialog';
import SkillHubLike from '@/[fsd]/features/skill-hub/ui/SkillHubLike';
import SkillHubModalMenu from '@/[fsd]/features/skill-hub/ui/SkillHubModalMenu';
import { Markdown } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ChatParticipantType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import EntityIcon from '@/components/EntityIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import RouteDefinitions, { getBasename } from '@/routes';

const getCardAuthors = (skill, skillDetails) => {
  const { authors = [], author = {} } = skill || {};
  if (authors?.length) return authors;
  if (author?.id) return [author];
  if (skillDetails?.version_details?.author) return [skillDetails.version_details.author];
  return [];
};

const SkillHubModal = memo(props => {
  const { open, onClose, skill } = props;

  const styles = skillHubModalStyles();
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const { data: skillDetails } = useGetPublicSkillDetailsQuery({ skillId: skill?.id }, { skip: !skill?.id });

  const cardAuthors = useMemo(() => getCardAuthors(skill, skillDetails), [skill, skillDetails]);
  const name = useMemo(() => skill?.name || skillDetails?.name || 'Untitled Skill', [skill, skillDetails]);
  const description = useMemo(
    () => skill?.description || skillDetails?.description || 'No description available.',
    [skill, skillDetails],
  );
  const icon_meta = useMemo(
    () => skill?.icon_meta || skillDetails?.version_details?.icon_meta,
    [skill, skillDetails],
  );
  const instructions = useMemo(() => skillDetails?.version_details?.instructions || '', [skillDetails]);
  const versionId = useMemo(() => skillDetails?.version_details?.id, [skillDetails]);

  const link = useMemo(() => {
    if (!skill?.id) return '';
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename() || '';
    return `${baseUrl}${basename}${RouteDefinitions.EliteaCatalog}?tab=skills&${SkillHubConstants.SKILL_ID}=${skill.id}`;
  }, [skill]);

  const likeData = useMemo(() => (skill?.name ? skill : skillDetails || {}), [skill, skillDetails]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="skill-modal-title"
        aria-describedby="skill-modal-description"
        sx={styles.dialog}
      >
        <Box sx={styles.mainPanel}>
          <DialogTitle sx={styles.dialogTitle}>
            <Box sx={styles.authorContainer}>
              <AuthorContainer
                authors={cardAuthors}
                showName={false}
                style={{ minWidth: '1.25rem' }}
              />
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                {cardAuthors[0]?.name || 'Author'}
              </Typography>
            </Box>
            <Box sx={styles.authorContainer}>
              <SkillHubLike
                viewMode={ViewMode.Public}
                data={likeData}
              />
              <SkillHubModalMenu
                skillId={skill?.id}
                skillName={name}
                versionId={versionId}
                link={link}
              />
              <IconButton
                variant="elitea"
                color="secondary"
                aria-label="close"
                onClick={onClose}
                sx={styles.closeButton}
              >
                <CloseIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={styles.dialogContent}>
              <Box sx={styles.iconContainer}>
                <EntityIcon
                  icon={icon_meta}
                  entityType={ChatParticipantType.Skills}
                  projectId={PUBLIC_PROJECT_ID}
                  editable={false}
                  specifiedFontSize="2.5rem"
                  sx={styles.icon}
                />
              </Box>
              <Typography
                variant="headingMedium"
                color="text.secondary"
                sx={styles.name}
              >
                {name}
              </Typography>
              <Typography
                variant="bodySmall2"
                sx={styles.description}
              >
                {description}
              </Typography>
              <Typography
                variant="labelSmall"
                sx={styles.instructionsLabel}
              >
                INSTRUCTIONS
              </Typography>
              <Box sx={styles.instructionsBody}>
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                >
                  <Markdown>{instructions}</Markdown>
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>
            <BaseBtn
              data-tour={ELITEA_CATALOG_TOUR_TARGET_IDS.primaryActionButton}
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              onClick={() => setIsAttachOpen(true)}
            >
              Add to Agent
            </BaseBtn>
          </DialogActions>
        </Box>
      </Dialog>
      <AttachToAgentDialog
        open={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        skill={skill}
        versionId={versionId}
      />
    </>
  );
});

SkillHubModal.displayName = 'SkillHubModal';

/** @type {MuiSx} */
const skillHubModalStyles = () => ({
  dialog: {
    '& .MuiDialog-paper': ({ palette }) => ({
      width: '37.5rem',
      maxWidth: '37.5rem',
      maxHeight: '85vh',
      borderRadius: '1rem',
      background: palette.background.agentModal.border,
      boxSizing: 'border-box',
      border: 'none !important',
      padding: '0.0625rem',
    }),
    '& .MuiDialogTitle-root': {
      margin: 0,
      width: '100%',
    },
    '& .MuiDialogContent-root': ({ palette }) => ({
      borderRadius: '1rem',
      background: palette.background.agentModal.border,
      margin: 0,
      width: '100%',
      border: 'none !important',
      padding: '0.0625rem 0 !important',
    }),
  },
  mainPanel: ({ palette }) => ({
    width: '100%',
    background: palette.background.agentModal.background,
    borderRadius: 'calc(1rem - 1px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  }),
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
  },
  authorContainer: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  closeButton: { padding: 0, margin: 0 },
  dialogContent: ({ palette }) => ({
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '1rem',
    padding: '1.5rem 2rem 1.5rem 2rem',
    backgroundColor: palette.background.default,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    minHeight: 0,
  }),
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
  },
  icon: { width: '2.5rem', height: '2.5rem' },
  name: { textAlign: 'center', marginTop: '1.25rem' },
  description: ({ palette }) => ({
    textAlign: 'center',
    color: palette.text.metrics,
    lineHeight: '1.25rem',
    marginTop: '0.5rem',
  }),
  instructionsLabel: ({ palette }) => ({
    width: '100%',
    color: palette.text.default,
    textAlign: 'center',
    marginTop: '2rem',
    marginBottom: '1rem',
  }),
  instructionsBody: {
    width: '100%',
    minHeight: 0,
  },
  dialogActions: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
});

export default SkillHubModal;
