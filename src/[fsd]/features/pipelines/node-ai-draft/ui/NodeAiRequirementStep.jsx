import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { NodeAiDraftConstants } from '@/[fsd]/features/pipelines/node-ai-draft/lib/constants';
import { YamlCodeEditor } from '@/[fsd]/features/pipelines/yaml-editor/ui';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const { NODE_AI_MODES, NODE_AI_NODE_TYPES } = NodeAiDraftConstants;
const { PipelineNodeDescriptions, PipelineNodeDisplayNames } = FlowEditorConstants;

// The counter shows up when this many characters are left (spec AC-9)
const COUNTER_FROM = 200;

/** Requirement step of the node AI modal: what to build or change (spec AC-7…AC-10) */
const NodeAiRequirementStep = memo(props => {
  const {
    mode,
    nodeType,
    modelName,
    requirement,
    setRequirement,
    charactersLeft,
    canGenerate,
    isGenerating,
    generate,
    stop,
    onCancel,
    currentNode,
  } = props;
  const [showCurrent, setShowCurrent] = useState(false);

  const hints = NODE_AI_NODE_TYPES[nodeType] || {};
  const examples = hints[mode] || [];
  const currentYaml = useMemo(() => NodeYamlHelpers.dumpNodeYaml(currentNode), [currentNode]);

  const onChange = useCallback(event => setRequirement(event.target.value), [setRequirement]);
  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && canGenerate) {
        event.preventDefault();
        generate();
      }
    },
    [canGenerate, generate],
  );
  const toggleCurrent = useCallback(() => setShowCurrent(prev => !prev), []);

  const styles = nodeAiRequirementStepStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerRow}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="node-ai-type-description"
        >
          {`${PipelineNodeDisplayNames[nodeType] || nodeType} · ${PipelineNodeDescriptions[nodeType] || ''}`}
        </Typography>
        <Tooltip
          title="Uses the model selected for this pipeline version"
          placement="top"
        >
          <Chip
            size="small"
            label={`Model: ${modelName}`}
            data-testid="node-ai-model-chip"
          />
        </Tooltip>
      </Box>

      {mode === NODE_AI_MODES.edit.key && (
        <Box>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={toggleCurrent}
            aria-expanded={showCurrent}
            data-testid="node-ai-current-config-toggle"
          >
            Current configuration
          </Button.BaseBtn>
          {showCurrent && (
            <YamlCodeEditor
              code={currentYaml}
              onChangeCode={() => {}}
              disabled
              syncWithPipelineReset={false}
              minHeight="8rem"
              data-testid="node-ai-current-config-yaml"
            />
          )}
        </Box>
      )}

      <Input.InputBase
        label={NODE_AI_MODES[mode].requirementLabel}
        value={requirement}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={hints.placeholder}
        multiline
        minRows={3}
        maxRows={10}
        fullWidth
        autoFocus
        inputProps={{
          readOnly: isGenerating,
          maxLength: requirement.length + Math.max(charactersLeft, 0),
          'data-testid': 'node-ai-requirement-input',
        }}
      />
      {charactersLeft <= COUNTER_FROM && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.counter}
          data-testid="node-ai-requirement-counter"
        >
          {`${charactersLeft} characters left`}
        </Typography>
      )}

      <Box sx={styles.examples}>
        {examples.map(example => (
          <Chip
            key={example}
            label={example}
            size="small"
            component="button"
            disabled={isGenerating}
            onClick={() => setRequirement(example)}
            data-testid="node-ai-example-chip"
          />
        ))}
      </Box>

      <Box sx={styles.actions}>
        {isGenerating && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.hint}
          >
            Usually takes 5–20 seconds
          </Typography>
        )}
        {isGenerating ? (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={stop}
            data-testid="node-ai-stop-button"
          >
            Stop
          </Button.BaseBtn>
        ) : (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onCancel}
            data-testid="node-ai-cancel-button"
          >
            Cancel
          </Button.BaseBtn>
        )}
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.special}
          onClick={generate}
          disabled={!canGenerate || isGenerating}
          startIcon={isGenerating ? <CircularProgress size="0.875rem" /> : null}
          data-testid="node-ai-generate-button"
        >
          {isGenerating ? 'Generating draft...' : 'Generate draft'}
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

NodeAiRequirementStep.displayName = 'NodeAiRequirementStep';

/** @type {MuiSx} */
const nodeAiRequirementStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: '-0.75rem',
  },
  examples: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  hint: {
    marginRight: 'auto',
  },
});

export default NodeAiRequirementStep;
