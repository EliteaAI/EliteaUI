import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useAgentHubExport, useForkAgentHub } from '@/[fsd]/features/agent-hub/lib/hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import ExportIcon from '@/components/Icons/ExportIcon';
import ForkIcon from '@/components/Icons/ForkIcon';

/**
 * Overflow menu for the agent catalog detail modal. Exactly three actions —
 * Export, Fork, Share — all scoped to the PUBLIC project (the agent is read from
 * the public catalog), mirroring the skill catalog modal menu.
 */
const AgentHubModalMenu = memo(props => {
  const { agentId, agentName, versionId, link } = props;

  const { doExport } = useAgentHubExport(PUBLIC_PROJECT_ID);
  const { doFork, isForking } = useForkAgentHub(PUBLIC_PROJECT_ID);
  const openWizard = useSelector(state => state.importWizard.openWizard);

  const { copyLinkMenuItem: shareMenuItem } = useCopyLinkMenu({
    key: 'share-agent',
    label: 'Share',
    link,
  });

  const onExport = useCallback(() => {
    doExport({ agentId, versionId, agentName });
  }, [doExport, agentId, versionId, agentName]);

  const onFork = useCallback(() => {
    if (openWizard) return;
    doFork({ agentId, versionId, agentName });
  }, [openWizard, doFork, agentId, versionId, agentName]);

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
        disabled: !agentId || isForking || openWizard,
        onClick: onFork,
      },
      shareMenuItem,
    ],
    [onExport, onFork, agentId, isForking, openWizard, shareMenuItem],
  );

  return (
    <Controls.ControlsDropdown
      menuItems={menuItems}
      anchorButtonProps={{ 'data-testid': 'agent-hub-modal-menu-button' }}
    />
  );
});

AgentHubModalMenu.displayName = 'AgentHubModalMenu';

export default AgentHubModalMenu;
