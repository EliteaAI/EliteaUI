import { memo } from 'react';

import { TEST_PANEL_STORAGE_KEYS, TEST_PANEL_WIDTH } from '../lib/constants/entityTestPanel.constants';
import { useTestPanelWidth } from '../lib/hooks/useTestPanelWidth.hooks';
import EntityTestPanelShell from './EntityTestPanelShell';
import TestPanelResizeHandle from './TestPanelResizeHandle';

const EntityTestPanel = memo(props => {
  const { isOpen, isFullWidth, workspaceRef, headerActions, controls, children, testIdPrefix } = props;

  const { containerRef, width, handleResizeStart } = useTestPanelWidth({
    workspaceRef,
    storageKeyPrefix: TEST_PANEL_STORAGE_KEYS.chat,
    defaultWidth: TEST_PANEL_WIDTH.CHAT_DEFAULT,
  });

  return (
    <EntityTestPanelShell
      panelRef={containerRef}
      isOpen={isOpen}
      width={width}
      isFullWidth={isFullWidth}
      headerActions={headerActions}
      controls={controls}
      testId={`${testIdPrefix}-test-panel`}
      resizeHandle={
        !isFullWidth && (
          <TestPanelResizeHandle
            onResizeStart={handleResizeStart}
            testId={`${testIdPrefix}-test-panel-resize-handle`}
          />
        )
      }
    >
      {children}
    </EntityTestPanelShell>
  );
});

EntityTestPanel.displayName = 'EntityTestPanel';

export default EntityTestPanel;
