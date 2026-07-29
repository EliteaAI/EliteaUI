import { memo, useCallback, useMemo, useState } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import { useDetachSkill } from '@/[fsd]/features/skill/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Banner, Modal } from '@/[fsd]/shared/ui';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import SkillIcon from '@/assets/skill-icon.svg?react';
import { SkillsTabs } from '@/common/constants';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import EliteAImage from '@/components/EliteAImage';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import RouteDefinitions, { getBasename } from '@/routes';
import { useTheme } from '@emotion/react';

import SkillVersionSelector from './SkillVersionSelector.jsx';

const SkillCard = memo(({ skill, entityVersionId, disabled, isPublicView, parentEntityType = 'agent' }) => {
  const theme = useTheme();
  const [openAlert, setOpenAlert] = useState(false);
  const { detachSkill, isLoading } = useDetachSkill({ entityVersionId });
  const styles = useMemo(() => skillCardStyles(), []);

  // A public/catalog agent has no standalone skill page to open; a locked-but-owned version still does.
  const isOpenDisabled = isPublicView || !skill.skill_id;

  const onOpenInNewTab = useCallback(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const url = `${baseUrl}${basename}${RouteDefinitions.Skills}/${SkillsTabs[0]}/${skill.skill_id}?name=${skill.name}`;
    window.open(url, '_blank');
  }, [skill.skill_id, skill.name]);

  const onDelete = useCallback(() => setOpenAlert(true), []);
  const onCloseAlert = useCallback(() => setOpenAlert(false), []);

  const onConfirmAlert = useCallback(async () => {
    setOpenAlert(false);
    await detachSkill({ skillId: skill.skill_id });
  }, [detachSkill, skill.skill_id]);

  return (
    <>
      <Box
        sx={styles.cardContainer}
        data-testid={`skill-card-${skill.skill_id}`}
      >
        <Box sx={styles.cardHeader}>
          <Box sx={styles.iconBox}>
            {skill.icon_meta?.url ? (
              <EliteAImage
                style={styles.skillCustomIcon}
                image={skill.icon_meta}
                alt={skill.name}
              />
            ) : (
              <SkillIcon style={styles.skillIcon} />
            )}
          </Box>
          <Box sx={styles.contentBox}>
            <Box sx={styles.titleRow}>
              <TypographyWithConditionalTooltip
                title={skill.name}
                placement="right"
                variant="bodyMedium"
                component="div"
                color="text.secondary"
                sx={styles.skillName}
              >
                {skill.name}
              </TypographyWithConditionalTooltip>
            </Box>
            <SkillVersionSelector
              skill={skill}
              entityVersionId={entityVersionId}
              disabled={disabled}
            />
          </Box>
          <Box sx={styles.buttonsContainer}>
            <Tooltip
              title="Open skill in new tab"
              placement="top"
            >
              <IconButton
                id="OpenInNewTabButton"
                variant="elitea"
                color="tertiary"
                aria-label="open in new tab"
                onClick={onOpenInNewTab}
                disabled={isOpenDisabled}
                sx={styles.actionButton}
              >
                <OpenInNewIcon
                  sx={styles.actionIcon}
                  fill={!isOpenDisabled ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
                />
              </IconButton>
            </Tooltip>
            <Tooltip
              title="Remove skill"
              placement="top"
            >
              <IconButton
                id="DeleteButton"
                data-testid="skill-card-remove-button"
                variant="elitea"
                color="tertiary"
                aria-label="remove skill"
                onClick={onDelete}
                disabled={disabled}
                sx={styles.actionButton}
              >
                <DeleteIcon
                  sx={styles.actionIcon}
                  fill={!disabled ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
                />
                {isLoading && <StyledCircleProgress size={20} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {skill.version_missing && (
          <Banner.BannerMessage message="The attached skill version no longer exists. Select a valid version or remove this skill." />
        )}
        <Modal.DeleteEntityModal
          open={openAlert}
          onClose={onCloseAlert}
          onConfirm={onConfirmAlert}
          title="Remove skill?"
          titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
          textContent="Are you sure to remove the "
          name={skill.name}
          inlineExtraContent={` skill from ${parentEntityType}?`}
          confirmButtonText="Remove"
        />
      </Box>
    </>
  );
});

SkillCard.displayName = 'SkillCard';

/** @type {MuiSx} */
const skillCardStyles = () => ({
  cardContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
    '&:hover': {
      border: `0.0625rem solid ${palette.border.lines}`,
    },
  }),
  cardHeader: ({ palette }) => ({
    borderRadius: '0.5rem',
    height: '3.75rem',
    minHeight: '3.75rem',
    boxSizing: 'border-box',
    display: 'flex',
    padding: '0.5rem 1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    backgroundColor: palette.background.userInputBackground,
    '&:hover': {
      backgroundColor: palette.background.toolCard.hover,
      '#DeleteButton': { display: 'flex' },
      '#OpenInNewTabButton': { display: 'flex' },
    },
  }),
  iconBox: ({ palette }) => ({
    minWidth: '2.125rem',
    width: '2.125rem',
    height: '2.125rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: palette.background.secondary,
  }),
  skillIcon: {
    width: '1.25rem',
    height: '1.25rem',
  },
  skillCustomIcon: {
    width: '2.125rem',
    height: '2.125rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'default',
    flex: '1 1 0',
    minWidth: 0,
    height: 'auto',
    minHeight: '2.75rem',
    gap: '0.125rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  skillName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  buttonsContainer: {
    alignSelf: 'center',
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    display: 'none',
  },
  actionIcon: {
    fontSize: '1rem',
  },
});

export default SkillCard;
