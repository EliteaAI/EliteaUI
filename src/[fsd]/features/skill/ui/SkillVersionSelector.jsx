import { memo, useCallback, useMemo, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Menu, MenuItem, Typography } from '@mui/material';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { useAttachSkill, useDetachSkill } from '@/[fsd]/features/skill/lib/hooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Version dropdown for an attached skill card.
 * Lists the skill's versions (via skill details) and, on change, detaches the current
 * skill_version_id then re-attaches with the new one — mirroring AgentPipelineVersionSelector,
 * but name-based with NO router navigation.
 *
 * @param {Object} props
 * @param {Object} props.skill - Attached skill: { skill_id, version_id, version_name }.
 * @param {number} props.entityVersionId - The agent (application) version id being edited.
 * @param {boolean} [props.disabled]
 */
const SkillVersionSelector = memo(({ skill, entityVersionId, disabled }) => {
  const projectId = useSelectedProjectId();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { attachSkill } = useAttachSkill({ entityVersionId });
  const { detachSkill } = useDetachSkill({ entityVersionId });

  const { data: skillDetails } = useSkillDetailsQuery(
    { projectId, skillId: skill.skill_id },
    { skip: !projectId || !skill.skill_id || !anchorEl },
  );

  const versions = useMemo(() => {
    const list = skillDetails?.versions || [];
    return [...list].sort((a, b) => {
      const aLatest = a.name === LATEST_VERSION_NAME;
      const bLatest = b.name === LATEST_VERSION_NAME;
      if (aLatest && !bLatest) return -1;
      if (!aLatest && bLatest) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [skillDetails?.versions]);

  const displayText = useMemo(() => skill.version_name || LATEST_VERSION_NAME, [skill.version_name]);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleVersionSelect = useCallback(
    version => async () => {
      setAnchorEl(null);
      if (version.id === skill.version_id) return;
      setIsUpdating(true);
      // Backend errors on duplicate attach, so a version change = detach then re-attach.
      const detached = await detachSkill({ skillId: skill.skill_id });
      if (detached) {
        await attachSkill({ skillId: skill.skill_id, skillVersionId: version.id });
      }
      setIsUpdating(false);
    },
    [attachSkill, detachSkill, skill.skill_id, skill.version_id],
  );

  return (
    <Box sx={styles.contentWrapper}>
      <Box
        sx={[styles.selector, disabled && styles.selectorDisabled]}
        onClick={isUpdating || disabled ? undefined : handleOpen}
      >
        <Typography
          variant="bodySmall"
          className="version-text"
          sx={styles.versionText}
        >
          {displayText}
        </Typography>
        {isUpdating && <StyledCircleProgress size={16} />}
        {!disabled && (
          <KeyboardArrowDownIcon
            className="dropdown-icon"
            sx={[styles.dropdownIcon, { transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)' }]}
          />
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={styles.menu}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={styles.versionHeader}>
          <Typography
            variant="labelSmall"
            sx={styles.versionHeaderTitle}
          >
            Versions
          </Typography>
        </Box>

        {versions.length === 0 && (
          <MenuItem
            disabled
            sx={styles.menuItem}
          >
            No versions available
          </MenuItem>
        )}

        {versions.map(version => {
          const isSelected = version.id === skill.version_id;
          return (
            <MenuItem
              key={version.id}
              onClick={handleVersionSelect(version)}
              sx={isSelected ? styles.selectedMenuItem : styles.menuItem}
            >
              <Typography variant="bodyMedium">{version.name}</Typography>
              {isSelected && <CheckIcon sx={styles.selectedCheckIcon} />}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
});

SkillVersionSelector.displayName = 'SkillVersionSelector';

/** @type {MuiSx} */
const styles = {
  contentWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'auto',
    position: 'relative',
  },
  selector: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    position: 'relative',
    '&:hover': {
      '& .version-text': { color: palette.text.createButton },
      '& .dropdown-icon': { color: palette.text.createButton },
    },
  }),
  selectorDisabled: {
    cursor: 'default',
    '&:hover': {},
  },
  versionText: ({ palette }) => ({
    color: palette.text.primary,
    fontFamily: 'Montserrat',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '7.5rem',
    flexShrink: 1,
  }),
  dropdownIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.primary,
    transition: 'transform 0.2s ease-in-out',
    flexShrink: 0,
  }),
  menu: ({ palette }) => ({
    '& .MuiPaper-root': {
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${palette.border.lines}`,
      background: palette.background.secondary,
      boxShadow: '0 0.5rem 0.75rem rgba(0, 0, 0, 0.3)',
      minWidth: '15rem',
      maxWidth: '17.5rem',
      maxHeight: '12.5rem',
      overflow: 'hidden',
    },
    '& .MuiList-root': {
      padding: '0 0 0.25rem',
      maxHeight: '11.5rem',
      overflowY: 'auto',
    },
  }),
  versionHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.25rem 0.75rem 0.25rem 1.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '1.75rem',
    marginBottom: '0.25rem',
  }),
  versionHeaderTitle: ({ palette }) => ({
    fontFamily: 'Montserrat',
    color: palette.text.default,
    textTransform: 'uppercase',
  }),
  menuItem: ({ palette }) => ({
    fontFamily: 'Montserrat',
    padding: '0.5rem 1.25rem',
    minHeight: '2.5rem !important',
    color: palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.background.button.iconLabelButton.hover,
    },
  }),
  selectedMenuItem: ({ palette }) => ({
    fontFamily: 'Montserrat',
    fontWeight: '500',
    padding: '0.5rem 1.25rem',
    minHeight: '2.5rem !important',
    color: palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.background.conversation?.selected,
    cursor: 'default',
    '&:hover': {
      backgroundColor: palette.background.conversation?.selected,
    },
  }),
  selectedCheckIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.secondary,
    ml: 1,
  }),
};

export default SkillVersionSelector;
