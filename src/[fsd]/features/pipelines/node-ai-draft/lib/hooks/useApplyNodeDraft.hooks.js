import { useCallback, useContext, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { flushSync } from 'react-dom';

import { NodeYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { NodeDraftApplyHelpers } from '@/[fsd]/features/pipelines/node-ai-draft/lib/helpers';
import { usePipelineAttachments } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useToast } from '@/[fsd]/shared/lib/hooks';

export const NODE_CHANGED_ERROR = 'This node changed while you were reviewing. Generate a new draft.';

/**
 * Apply as one unsaved editor step: the node, the checked new state variables and the attachments (spec AC-24).
 * Nothing is written when the node changed since `snapshot` (AC-29) or an attachment can't be built.
 * Header Discard reverts all of it (AC-25): the YAML through the pipeline reset, the tools through Formik.
 */
export const useApplyNodeDraft = ({ snapshot }) => {
  const { yamlJsonObject, setYamlJsonObject, resyncFlowFromYaml } = useContext(FlowEditorContext);
  const { values, setFieldValue } = useFormikContext();
  const { prepareToolkitAttachment, prepareApplicationAttachment } = usePipelineAttachments();
  const { toastSuccess } = useToast();
  const [error, setError] = useState(null);
  const applyingRef = useRef(false);

  const buildAttachment = useCallback(
    ({ entity_type: entityType, id, name }) =>
      entityType === 'toolkit' || entityType === 'mcp'
        ? prepareToolkitAttachment({ id, name }, { mcp: entityType === 'mcp', toolkitName: name })
        : prepareApplicationAttachment({ id, name }),
    [prepareToolkitAttachment, prepareApplicationAttachment],
  );

  const apply = useCallback(
    async (draft, sandboxTools) => {
      if (applyingRef.current) return false;
      const current = NodeYamlHelpers.findYamlNode(yamlJsonObject?.nodes, snapshot.id);
      if (!current || !NodeYamlHelpers.isSameNode(current, snapshot)) {
        setError(NODE_CHANGED_ERROR);
        return false;
      }
      applyingRef.current = true;
      try {
        const attachments = await Promise.all((draft.attachments || []).map(buildAttachment));
        // A failed lookup was toasted by the builder; applying without it would drop the node's toolkit
        if (attachments.some(tool => !tool)) return false;

        const nextYaml = NodeDraftApplyHelpers.applyDraftToPipeline(
          yamlJsonObject,
          draft.node,
          draft.newState,
        );
        // Tools and YAML render together, or reconcile sees the new node without its attachment and drops it
        // (the same reason usePipelineAttachments.addToolWithNode uses flushSync)
        flushSync(() => {
          setFieldValue(
            'version_details.tools',
            NodeDraftApplyHelpers.mergeDraftTools(values?.version_details?.tools, sandboxTools, attachments),
          );
          setYamlJsonObject(nextYaml);
        });
        resyncFlowFromYaml?.(nextYaml);
        setError(null);
        toastSuccess('Node updated with AI. Review and save the pipeline.');
        return true;
      } finally {
        applyingRef.current = false;
      }
    },
    [
      yamlJsonObject,
      snapshot,
      buildAttachment,
      setFieldValue,
      values?.version_details?.tools,
      setYamlJsonObject,
      resyncFlowFromYaml,
      toastSuccess,
    ],
  );

  return { apply, error };
};
