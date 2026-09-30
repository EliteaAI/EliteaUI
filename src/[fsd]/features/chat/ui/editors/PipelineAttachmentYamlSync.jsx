import { memo } from 'react';

import { usePipelineAttachmentYamlSync } from '@/[fsd]/features/pipelines/lib/hooks';

// Always-mounted component that keeps input_attachments in sync regardless of active tab.
// Must live inside BaseEditor's children so it has access to Formik context.
// memo() prevents re-renders from parent state changes; the component still re-renders
// when its own Formik/Redux subscriptions change, which is exactly when sync is needed.
// isVisible and pipelineKey are forwarded so the hook writes only to this tab's own
// Redux key and skips dispatches when the tab is hidden, preventing cross-tab contamination.
const PipelineAttachmentYamlSync = memo(props => {
  const { isVisible, pipelineKey } = props;
  usePipelineAttachmentYamlSync(isVisible, pipelineKey);
  return null;
});

PipelineAttachmentYamlSync.displayName = 'PipelineAttachmentYamlSync';

export default PipelineAttachmentYamlSync;
