import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useForkSkill, useSkillExport } from '@/[fsd]/features/skill/lib/hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import ExportIcon from '@/components/Icons/ExportIcon';
import ForkIcon from '@/components/Icons/ForkIcon';

/**
 * Overflow menu for the skill catalog detail modal. Exactly three actions —
 * Export, Fork, Share — all scoped to the PUBLIC project (the skill is read from
 * the public catalog, matching the AgentModal public-project pattern).
 */
const SkillHubModalMenu = memo(props => {
  const { skillId, skillName, versionId, link } = props;

  const { doExport } = useSkillExport(PUBLIC_PROJECT_ID);
  const { doFork, isForking } = useForkSkill(PUBLIC_PROJECT_ID);
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
    if (openWizard) return;
    doFork({ skillId, versionId, skillName });
  }, [openWizard, doFork, skillId, versionId, skillName]);

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
    ],
    [onExport, onFork, skillId, isForking, openWizard, shareMenuItem],
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
