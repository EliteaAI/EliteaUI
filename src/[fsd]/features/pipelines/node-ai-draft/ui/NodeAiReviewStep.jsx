import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Checkbox, Chip, FormControlLabel, List, ListItem, Typography } from '@mui/material';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { NodeConfigViewToggle } from '@/[fsd]/features/pipelines/flow-editor/ui/node-panel';
import { NodeAiDraftConstants } from '@/[fsd]/features/pipelines/node-ai-draft/lib/constants';
import {
  NodeDraftDiffHelpers,
  NodeDraftYamlHelpers,
} from '@/[fsd]/features/pipelines/node-ai-draft/lib/helpers';
import { YamlCodeEditor } from '@/[fsd]/features/pipelines/yaml-editor/ui';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import NodeDraftSandbox from './NodeDraftSandbox';
import NodeDraftYamlDiff from './NodeDraftYamlDiff';

const { NODE_CONFIG_VIEWS, NODE_YAML_APPLY_DELAY_MS } = NodePanelConstants;
const VIEW_TEST_IDS = { flow: 'node-ai-view-flow-tab', yaml: 'node-ai-view-yaml-tab' };
const { NODE_AI_MODES } = NodeAiDraftConstants;

/** Review step: the draft in Flow or YAML view, what Apply will add, and the backend's warnings (AC-11…AC-21) */
const NodeAiReviewStep = memo(props => {
  const {
    draft,
    original,
    mode,
    isDraftEdited,
    pipeline,
    NodeComponent,
    updateDraftNode,
    toggleNewState,
    sandboxTools,
    onToolsChange,
    back,
    regenerate,
    apply,
  } = props;
  const [view, setView] = useState(NODE_CONFIG_VIEWS.flow);
  const [yamlCode, setYamlCode] = useState(() => NodeYamlHelpers.dumpNodeYaml(draft.node));
  const [yamlError, setYamlError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const timerRef = useRef(null);
  // The node the YAML view itself produced: when it comes back as the draft, the text stays as typed
  const fromYamlRef = useRef(null);

  // A new draft (Regenerate, Refine, a Flow view edit) resets the YAML text
  useEffect(() => {
    if (fromYamlRef.current === draft.node) return;
    setYamlCode(NodeYamlHelpers.dumpNodeYaml(draft.node));
    setYamlError(null);
  }, [draft.node]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const applyYaml = useCallback(
    code => {
      const { node, error } = NodeDraftYamlHelpers.parseDraftYaml(code, draft.node);
      setYamlError(error || null);
      if (!node) return null;
      if (NodeYamlHelpers.isSameNode(node, draft.node)) return draft.node;
      fromYamlRef.current = node;
      updateDraftNode(node);
      return node;
    },
    [draft.node, updateDraftNode],
  );

  const onChangeYaml = useCallback(
    code => {
      setYamlCode(code);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => applyYaml(code), NODE_YAML_APPLY_DELAY_MS);
    },
    [applyYaml],
  );

  // Leaving the YAML view or applying needs YAML that parses (AC-16). The action gets the node as it is now,
  // so a click inside the debounce window doesn't apply the draft from before the last keystrokes.
  const guard = useCallback(
    action => {
      let node = draft.node;
      if (view === NODE_CONFIG_VIEWS.yaml) {
        clearTimeout(timerRef.current);
        node = applyYaml(yamlCode);
        if (!node) {
          setPendingAction(() => () => action(draft.node));
          return;
        }
      }
      action(node);
    },
    [view, applyYaml, yamlCode, draft.node],
  );

  const onViewChange = useCallback(next => guard(() => setView(next)), [guard]);
  const onApply = useCallback(() => guard(node => apply(node)), [guard, apply]);
  const onFix = useCallback(() => setPendingAction(null), []);
  const onDiscardYaml = useCallback(() => {
    setYamlCode(NodeYamlHelpers.dumpNodeYaml(draft.node));
    setYamlError(null);
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }, [draft.node, pendingAction]);

  const onRegenerate = useCallback(() => {
    if (isDraftEdited) setConfirmRegenerate(true);
    else regenerate();
  }, [isDraftEdited, regenerate]);
  const onConfirmRegenerate = useCallback(() => {
    setConfirmRegenerate(false);
    regenerate();
  }, [regenerate]);
  const onKeepEditing = useCallback(() => setConfirmRegenerate(false), []);

  const attachments = useMemo(() => draft.attachments || [], [draft.attachments]);
  const isEdit = mode === NODE_AI_MODES.edit.key;
  // Recomputed from the original, so it also counts the user's own edits of the draft
  const changedPaths = useMemo(
    () => (isEdit ? NodeDraftDiffHelpers.changedFieldPaths(original, draft.node) : []),
    [isEdit, original, draft.node],
  );
  const styles = nodeAiReviewStepStyles();

  return (
    <Box sx={styles.root}>
      {draft.summary && (
        <Typography
          variant="bodyMedium"
          data-testid="node-ai-summary"
        >
          {draft.summary}
        </Typography>
      )}

      <Box sx={styles.viewRow}>
        <NodeConfigViewToggle
          value={view}
          onChange={onViewChange}
          testIds={VIEW_TEST_IDS}
        />
        {isEdit && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="node-ai-changed-count"
          >
            {`${changedPaths.length} ${changedPaths.length === 1 ? 'field' : 'fields'} changed`}
          </Typography>
        )}
      </Box>
      {isEdit && changedPaths.length > 0 && (
        <Box sx={styles.markers}>
          {changedPaths.map(path => (
            <Chip
              key={path}
              size="small"
              variant="outlined"
              label={`Changed · ${path}`}
              data-testid="node-ai-changed-marker"
            />
          ))}
        </Box>
      )}

      {view === NODE_CONFIG_VIEWS.flow ? (
        <NodeDraftSandbox
          node={draft.node}
          pipeline={pipeline}
          NodeComponent={NodeComponent}
          onChange={updateDraftNode}
          tools={sandboxTools}
          onToolsChange={onToolsChange}
        />
      ) : (
        <Box>
          <YamlCodeEditor
            code={yamlCode}
            onChangeCode={onChangeYaml}
            syncWithPipelineReset={false}
            minHeight="16rem"
            data-testid="node-ai-yaml-editor"
          />
          {isEdit && (
            <NodeDraftYamlDiff
              original={original}
              node={draft.node}
            />
          )}
          {yamlError && (
            <Typography
              variant="bodySmall"
              color="error"
              data-testid="node-ai-yaml-error"
            >
              {yamlError}
            </Typography>
          )}
        </Box>
      )}

      {attachments.length > 0 && (
        <Box>
          <Typography variant="labelMedium">Attachments</Typography>
          <List
            dense
            data-testid="node-ai-attachments-list"
          >
            {attachments.map(item => (
              <ListItem key={`${item.entity_type}-${item.id}`}>
                <Typography variant="bodySmall">
                  {`${item.name} · Will be attached`}
                  {item.needs_login && ' · Log in required'}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {draft.newState?.length > 0 && (
        <Box>
          <Typography variant="labelMedium">New state variables</Typography>
          <List
            dense
            data-testid="node-ai-new-state-list"
          >
            {draft.newState.map(variable => (
              <ListItem key={variable.name}>
                <FormControlLabel
                  label={`${variable.name} (${variable.type})`}
                  control={
                    <Checkbox
                      size="small"
                      checked={variable.checked}
                      onChange={() => toggleNewState(variable.name)}
                      inputProps={{ 'data-testid': 'node-ai-new-state-checkbox' }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {draft.warnings?.length > 0 && (
        <Box>
          <Typography variant="labelMedium">Warnings</Typography>
          <List
            dense
            data-testid="node-ai-warnings-list"
          >
            {draft.warnings.map(warning => (
              <ListItem key={warning}>
                <Typography variant="bodySmall">{warning}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={styles.actions}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={back}
          data-testid="node-ai-back-button"
        >
          Back
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={onRegenerate}
          data-testid="node-ai-regenerate-button"
        >
          Regenerate
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.special}
          onClick={onApply}
          data-testid="node-ai-apply-button"
        >
          Apply
        </Button.BaseBtn>
      </Box>

      <Modal.BaseModal
        open={Boolean(pendingAction)}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Fix the YAML first"
        content={yamlError}
        onClose={onFix}
        onConfirm={onDiscardYaml}
        cancelButtonText="Fix"
        confirmButtonText="Discard YAML changes"
        cancelButtonTestId="node-ai-yaml-fix-button"
        confirmButtonTestId="node-ai-yaml-discard-button"
      />
      <Modal.BaseModal
        open={confirmRegenerate}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Replace your edits with a new draft?"
        onClose={onKeepEditing}
        onConfirm={onConfirmRegenerate}
        cancelButtonText="Keep editing"
        confirmButtonText="Replace"
      />
    </Box>
  );
});

NodeAiReviewStep.displayName = 'NodeAiReviewStep';

/** @type {MuiSx} */
const nodeAiReviewStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  viewRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
});

export default NodeAiReviewStep;
