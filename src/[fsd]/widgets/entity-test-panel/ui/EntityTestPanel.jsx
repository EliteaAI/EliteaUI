import { memo } from 'react';

import { useTestPanelWidth } from '../lib/hooks/useTestPanelWidth.hooks';
import EntityTestPanelShell from './EntityTestPanelShell';
import TestPanelResizeHandle from './TestPanelResizeHandle';

const EntityTestPanel = memo(props => {
  const { isOpen, isFullWidth, workspaceRef, storageKeyPrefix, controls, children, testIdPrefix } = props;

  const { containerRef, width, handleResizeStart } = useTestPanelWidth({ workspaceRef, storageKeyPrefix });

  return (
    <EntityTestPanelShell
      panelRef={containerRef}
      isOpen={isOpen}
      width={width}
      isFullWidth={isFullWidth}
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
