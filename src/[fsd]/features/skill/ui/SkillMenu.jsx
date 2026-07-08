import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useLazySkillDetailsQuery, useSkillListQuery } from '@/[fsd]/features/skill/api';
import { useAttachSkill } from '@/[fsd]/features/skill/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';
import SkillIcon from '@/assets/skill-icon.svg?react';
import { SearchParams, VITE_BASE_URI } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import EliteAImage from '@/components/EliteAImage';
import UnifiedDropdown from '@/components/UnifiedDropdown';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes.js';

const SEARCH_DEBOUNCE_MS = 300;
// Query param carrying a just-created skill id back to the agent for auto-attach
// (mirrors the toolkit "newToolkitId" round-trip).
const NEW_SKILL_ID_PARAM = 'newSkillId';

/**
 * "+ Skill" button + searchable dropdown for attaching a skill to the agent version.
 * Sourced from useSkillListQuery, excludes already-attached skill ids (duplicate prevention),
 * and on selection attaches with skill_version_id = the skill's 'base' version id.
 *
 * @param {Object} props
 * @param {number} props.applicationId - The agent (application) id, for the create-new round-trip.
 * @param {number} props.entityVersionId - The agent (application) version id being edited.
 * @param {number[]} props.attachedSkillIds - Already-attached skill ids to exclude.
 * @param {boolean} [props.disabled] - Disable when at limit / read-only.
 * @param {boolean} [props.isEntityUnsaved] - True when the agent has no persisted version yet.
 */
const SkillMenu = memo(props => {
  const { applicationId, entityVersionId, attachedSkillIds = [], disabled, isEntityUnsaved } = props;
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastError } = useToast();
  const styles = useMemo(() => skillMenuStyles(), []);

  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, SEARCH_DEBOUNCE_MS);

  const { attachSkill } = useAttachSkill({ entityVersionId });
  const [fetchSkillDetails] = useLazySkillDetailsQuery();
  const processedSkillIds = useRef(new Set());

  const { data: skillListData, isFetching } = useSkillListQuery(
    { projectId, params: { query: debouncedSearch } },
    { skip: !projectId || !anchorEl },
  );

  const attachedIdSet = useMemo(() => new Set(attachedSkillIds), [attachedSkillIds]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSearch('');
  }, []);

  const attachSkillById = useCallback(
    async skillId => {
      const details = await fetchSkillDetails({ projectId, skillId }).unwrap();
      const baseVersion =
        (details?.versions || []).find(v => v.name === LATEST_VERSION_NAME) || details?.versions?.[0];
      if (!baseVersion) {
        toastError('The selected skill has no available version.');
        return;
      }
      await attachSkill({ skillId, skillVersionId: baseVersion.id });
    },
    [attachSkill, fetchSkillDetails, projectId, toastError],
  );

  const handleSelectSkill = useCallback(
    skill => async () => {
      setAnchorEl(null);
      setSearch('');
      try {
        await attachSkillById(skill.id);
      } catch (error) {
        toastError(buildErrorMessage(error));
      }
    },
    [attachSkillById, toastError],
  );

  useEffect(() => {
    const newSkillId = searchParams.get(NEW_SKILL_ID_PARAM);
    if (!newSkillId || isEntityUnsaved || !entityVersionId) return;
    if (processedSkillIds.current.has(newSkillId)) return;
    processedSkillIds.current.add(newSkillId);

    const stripParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete(NEW_SKILL_ID_PARAM);
      setSearchParams(next, { replace: true });
    };

    if (attachedIdSet.has(Number(newSkillId))) {
      stripParam();
      return;
    }
    attachSkillById(Number(newSkillId))
      .catch(error => toastError(buildErrorMessage(error)))
      .finally(stripParam);
  }, [
    searchParams,
    setSearchParams,
    isEntityUnsaved,
    entityVersionId,
    attachedIdSet,
    attachSkillById,
    toastError,
  ]);

  const items = useMemo(() => {
    const rows = skillListData?.rows || [];
    return rows
      .filter(skill => !attachedIdSet.has(skill.id))
      .map(skill => ({
        key: `skill-${skill.id}`,
        label: skill.name,
        description: skill.description,
        icon: skill.icon_meta?.url ? (
          <EliteAImage
            style={styles.itemCustomIcon}
            image={skill.icon_meta}
            alt={skill.name}
          />
        ) : (
          <SkillIcon style={styles.itemIcon} />
        ),
        onClick: handleSelectSkill(skill),
      }));
  }, [skillListData?.rows, attachedIdSet, handleSelectSkill, styles.itemIcon, styles.itemCustomIcon]);

  const handleSearchChange = useCallback(e => setSearch(e.target.value), []);
  const handleButtonClick = useCallback(e => setAnchorEl(e.currentTarget), []);

  // "Create new": navigate to the skill create page with the agent context so it can return
  // here after save and auto-attach the new skill (mirrors the toolkit create-new round-trip).
  const handleCreateNew = useCallback(() => {
    handleClose();
    const currentParams = new URLSearchParams(window.location.search);
    const returnUrl = encodeURIComponent(window.location.pathname + '?' + currentParams.toString());
    const strippedReturnUrl = returnUrl.replace(encodeURIComponent(`${VITE_BASE_URI}/`), '');
    const url = `${RouteDefinitions.CreateSkill}?${SearchParams.SourceApplicationId}=${applicationId}&${SearchParams.ReturnUrl}=${strippedReturnUrl}`;
    navigate(url);
  }, [handleClose, navigate, applicationId]);

  const tooltipTitle = isEntityUnsaved
    ? 'Save the agent first, then add skills'
    : disabled
      ? 'Maximum number of skills reached'
      : '';
  const isButtonDisabled = disabled || isEntityUnsaved;

  return (
    <>
      <Box sx={styles.container}>
        <Tooltip
          title={tooltipTitle}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              disableRipple
              disabled={isButtonDisabled}
              onClick={isButtonDisabled ? undefined : handleButtonClick}
            >
              Skill
            </BaseBtn>
          </Box>
        </Tooltip>
      </Box>

      <UnifiedDropdown
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        items={items}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search skills..."
        showCreateNew
        onCreateNew={handleCreateNew}
        createNewLabel="Create new"
        isLoading={isFetching}
        emptyMessage="No skills available"
        noResultsMessage="No skills found"
        autoFocus
        showDivider={false}
      />
    </>
  );
});

SkillMenu.displayName = 'SkillMenu';

/** @type {MuiSx} */
const skillMenuStyles = () => ({
  container: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  itemIcon: {
    width: '1rem',
    height: '1rem',
  },
  itemCustomIcon: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
});

export default SkillMenu;
