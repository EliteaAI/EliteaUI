import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { DumpYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import NodeTypeIconTile from '@/[fsd]/features/pipelines/flow-editor/ui/add-node/NodeTypeIconTile';
import { NodeAiDraftConstants } from '@/[fsd]/features/pipelines/node-ai-draft/lib/constants';
import { useApplyNodeDraft, useNodeAiDraft } from '@/[fsd]/features/pipelines/node-ai-draft/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useListModelsQuery } from '@/api/configurations';

import NodeAiRequirementStep from './NodeAiRequirementStep';
import NodeAiReviewStep from './NodeAiReviewStep';

const { NODE_AI_MODES } = NodeAiDraftConstants;

/** Build / Edit one node with AI: requirement → generating → review → Apply (spec AC-2…AC-29) */
const NodeAiDraftModal = memo(props => {
  const { open, onClose, mode, yamlNode, NodeComponent } = props;
  const { yamlJsonObject } = useContext(FlowEditorContext);
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const llmSettings = useNodeAiAssistantConfig();
  const { data: models } = useListModelsQuery({ projectId, include_shared: true }, { skip: !projectId });

  // Taken once: the draft and Apply are checked against the node as it was when the modal opened (AC-29)
  const [snapshot] = useState(yamlNode);
  const [sandboxTools, setSandboxTools] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const pipelineYaml = useMemo(() => DumpYamlHelpers.dumpYaml(yamlJsonObject), [yamlJsonObject]);

  const draftState = useNodeAiDraft({
    projectId,
    applicationId: values?.id,
    versionId: values?.version_details?.id,
    mode,
    node: snapshot,
    pipelineYaml,
    llmSettings,
  });
  const { apply, error: applyError } = useApplyNodeDraft({ snapshot });
  const { step, draft, hasDraft, error } = draftState;

  const modelName = useMemo(() => {
    const model = (models?.items || []).find(item => item.name === llmSettings?.model_name);
    return model?.display_name || model?.name || llmSettings?.model_name || '';
  }, [models?.items, llmSettings?.model_name]);

  const requestClose = useCallback(() => {
    if (hasDraft) setConfirmDiscard(true);
    else onClose();
  }, [hasDraft, onClose]);
  const onKeepReviewing = useCallback(() => setConfirmDiscard(false), []);

  const onApply = useCallback(
    async node => {
      if (await apply({ ...draft, node: node || draft.node }, sandboxTools)) onClose();
    },
    [apply, draft, sandboxTools, onClose],
  );

  // Tools picked in the Flow view belong to that draft; a new draft starts from the pipeline's tools again
  const draftKey = draft?.summary;
  useEffect(() => setSandboxTools(null), [draftKey]);

  const styles = nodeAiDraftModalStyles();
  const errorText = step === 'error' ? error?.message : step === 'review' ? applyError : null;

  return (
    <>
      <Modal.BaseModal
        open={open}
        onClose={requestClose}
        title={
          <Box sx={styles.title}>
            <NodeTypeIconTile type={snapshot.type} />
            <Typography
              variant="headingSmall"
              color="text.secondary"
              data-testid="node-ai-modal-title-text"
            >
              {`${snapshot.id} - ${NODE_AI_MODES[mode].label}`}
            </Typography>
          </Box>
        }
        data-testid="node-ai-modal"
        sx={styles.paper}
        hideSections
        content={
          <Box sx={styles.content}>
            {errorText && (
              <Box sx={styles.error}>
                <Typography
                  variant="bodySmall"
                  color="error"
                  data-testid="node-ai-error"
                >
                  {errorText}
                </Typography>
                {step === 'error' && error?.canRetry && (
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.secondary}
                    onClick={draftState.generate}
                    data-testid="node-ai-try-again-button"
                  >
                    Try again
                  </Button.BaseBtn>
                )}
              </Box>
            )}
            {step === 'review' && draft ? (
              <NodeAiReviewStep
                draft={draft}
                original={snapshot}
                mode={mode}
                isDraftEdited={draftState.isDraftEdited}
                pipeline={yamlJsonObject}
                NodeComponent={NodeComponent}
                updateDraftNode={draftState.updateDraftNode}
                toggleNewState={draftState.toggleNewState}
                sandboxTools={sandboxTools}
                onToolsChange={setSandboxTools}
                back={draftState.back}
                regenerate={draftState.regenerate}
                apply={onApply}
              />
            ) : (
              <NodeAiRequirementStep
                mode={mode}
                nodeType={snapshot.type}
                modelName={modelName}
                requirement={draftState.requirement}
                setRequirement={draftState.setRequirement}
                charactersLeft={draftState.charactersLeft}
                canGenerate={draftState.canGenerate}
                isGenerating={step === 'generating'}
                generate={draftState.generate}
                stop={draftState.stop}
                onCancel={requestClose}
                currentNode={snapshot}
              />
            )}
          </Box>
        }
      />
      <Modal.BaseModal
        open={confirmDiscard}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Discard this draft?"
        onClose={onKeepReviewing}
        onConfirm={onClose}
        cancelButtonText="Keep reviewing"
        confirmButtonText="Discard"
      />
    </>
  );
});

NodeAiDraftModal.displayName = 'NodeAiDraftModal';

/** @type {MuiSx} */
const nodeAiDraftModalStyles = () => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  // The node fields need more room than BaseModal's default 37.5rem; the content never sets its own width
  paper: {
    width: '50rem',
    maxWidth: 'calc(100vw - 4rem)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    minWidth: 0,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
});

export default NodeAiDraftModal;
