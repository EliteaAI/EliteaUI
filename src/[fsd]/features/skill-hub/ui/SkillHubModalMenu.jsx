import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useForkSkill, useSkillExport } from '@/[fsd]/features/skill';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { Controls } from '@/[fsd]/shared/ui';
import ClockIcon from '@/assets/clock_icon.svg?react';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import ExportIcon from '@/components/Icons/ExportIcon';
import ForkIcon from '@/components/Icons/ForkIcon';
import RouteDefinitions from '@/routes';

const HISTORY_ICON_STYLE = { width: '1rem', height: '1rem' };

/**
 * Overflow menu for the skill catalog detail modal. Export, Fork and Share are scoped to the
 * PUBLIC project (the skill is read from the public catalog, matching the AgentModal
 * public-project pattern); Run History lists this skill's runs in the current project.
 */
const SkillHubModalMenu = memo(props => {
  const { skillId, skillName, versionId, link } = props;

  const { doExport } = useSkillExport(PUBLIC_PROJECT_ID);
  const { doFork, isForking } = useForkSkill(PUBLIC_PROJECT_ID);
  const navigate = useNavigate();
  const openWizard = useSelector(state => state.importWizard.openWizard);

  const { copyLinkMenuItem: shareMenuItem } = useCopyLinkMenu({
    key: 'share-skill',
    label: 'Share',
    link,
  });

  const onExport = useCallback(() => {
    doExport({ skillId, versionId, skillName });
  }, [doExport, skillId, versionId, skillName]);

  const onFork = useCallback(() => {
    doFork({ skillId, versionId, skillName });
  }, [doFork, skillId, versionId, skillName]);

  const onShowHistory = useCallback(() => {
    navigate(NavigationHelpers.buildRoute(RouteDefinitions.CatalogSkillRunHistory, { skillId }));
  }, [navigate, skillId]);

  const menuItems = useMemo(
    () => [
      {
        key: 'export',
        label: 'Export',
        icon: <ExportIcon sx={{ fontSize: '1rem' }} />,
        onClick: onExport,
      },
      {
        key: 'fork',
        label: 'Fork',
        icon: <ForkIcon sx={{ fontSize: '1rem' }} />,
        disabled: !skillId || isForking || openWizard,
        onClick: onFork,
      },
      shareMenuItem,
      {
        key: 'run-history',
        label: 'Run History',
        icon: <ClockIcon style={HISTORY_ICON_STYLE} />,
        disabled: !skillId,
        onClick: onShowHistory,
        slotProps: { MenuItem: { 'data-testid': 'catalog-skill-run-history-menu-item' } },
      },
    ],
    [onExport, onFork, skillId, isForking, openWizard, shareMenuItem, onShowHistory],
  );

  return (
    <Controls.ControlsDropdown
      menuItems={menuItems}
      anchorButtonProps={{ 'data-testid': 'skill-hub-modal-menu-button' }}
    />
  );
});

SkillHubModalMenu.displayName = 'SkillHubModalMenu';

export default SkillHubModalMenu;
