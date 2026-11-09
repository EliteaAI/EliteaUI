import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout } from '@/[fsd]/entities/edit-entity-with-ai';
import { useDebounceValue } from '@/[fsd]/shared/lib/hooks/useDebounceValue.hooks';
import { Banner } from '@/[fsd]/shared/ui';
import { CopyIconButton } from '@/[fsd]/shared/ui/button';

import { COMPARE_MESSAGES, YAML_DIFF } from '../../lib/constants/compareVersions.constants';
import {
  buildNodeSummary,
  countLines,
  findNodeIdLine,
  validatePipelineYaml,
} from '../../lib/helpers/pipelineYaml.helpers';
import { useYamlMergeView } from '../../lib/hooks/useYamlMergeView.hooks';
import CompareSaveButton from '../CompareSaveButton';
import CompareVersionHeader from '../CompareVersionHeader';
import YamlDiffToolbar from '../yaml-diff/YamlDiffToolbar';
import YamlMergeEditor from '../yaml-diff/YamlMergeEditor';
import YamlPlainEditors from '../yaml-diff/YamlPlainEditors';

const lineSpan = (doc, from, to) => {
  if (to <= from) return 0;
  return doc.slice(from, Math.min(to, doc.length)).replace(/\n$/, '').split('\n').length;
};

const ComparePipelineYamlStep = memo(props => {
  const {
    leftVersion,
    rightVersion,
    leftData,
    rightData,
    leftEdits,
    rightEdits,
    onLeftEdit,
    onRightEdit,
    onSaveLeft,
    onSaveRight,
    savingLeftKeys,
    savingRightKeys,
    leftSaveDisabledReason,
  } = props;

  const leftValue = leftEdits.instructions ?? leftData.instructions ?? '';
  const rightValue = rightEdits.instructions ?? rightData.instructions ?? '';

  // Counters, node summary and validation follow the text after a pause in typing
  const debouncedLeft = useDebounceValue(leftValue, YAML_DIFF.DEBOUNCE_MS);
  const debouncedRight = useDebounceValue(rightValue, YAML_DIFF.DEBOUNCE_MS);

  // Decided once per opening, so typing past the limit doesn't swap the editors under the cursor
  const [isTooLarge] = useState(
    () =>
      countLines(leftData.instructions) > YAML_DIFF.MAX_LINES ||
      countLines(rightData.instructions) > YAML_DIFF.MAX_LINES,
  );

  const handleLeftChange = useCallback(value => onLeftEdit('instructions', value), [onLeftEdit]);
  const handleRightChange = useCallback(value => onRightEdit('instructions', value), [onRightEdit]);

  const { hostRef, diff, scrollToChunk, scrollToLines } = useYamlMergeView({
    leftValue,
    rightValue,
    onLeftChange: handleLeftChange,
    onRightChange: handleRightChange,
    enabled: !isTooLarge,
  });

  const isIdentical = debouncedLeft === debouncedRight;
  const leftValidation = useMemo(() => validatePipelineYaml(debouncedLeft), [debouncedLeft]);
  const rightValidation = useMemo(() => validatePipelineYaml(debouncedRight), [debouncedRight]);
  const nodeSummary = useMemo(
    () => (isTooLarge || isIdentical ? null : buildNodeSummary(debouncedLeft, debouncedRight)),
    [debouncedLeft, debouncedRight, isIdentical, isTooLarge],
  );

  const { addedLines, removedLines } = useMemo(
    () =>
      diff.chunks.reduce(
        (totals, chunk) => ({
          addedLines: totals.addedLines + lineSpan(diff.b, chunk.fromB, chunk.toB),
          removedLines: totals.removedLines + lineSpan(diff.a, chunk.fromA, chunk.toA),
        }),
        { addedLines: 0, removedLines: 0 },
      ),
    [diff],
  );

  const [activeChange, setActiveChange] = useState(0);
  const changeCount = isIdentical ? 0 : diff.chunks.length;
  useEffect(() => {
    setActiveChange(prev => Math.min(prev, Math.max(changeCount - 1, 0)));
  }, [changeCount]);

  // The first change is in view when the step opens
  useEffect(() => {
    scrollToChunk(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToChange = useCallback(
    index => {
      setActiveChange(index);
      scrollToChunk(index);
    },
    [scrollToChunk],
  );
  const handlePreviousChange = useCallback(
    () => goToChange(Math.max(activeChange - 1, 0)),
    [activeChange, goToChange],
  );
  const handleNextChange = useCallback(
    () => goToChange(Math.min(activeChange + 1, changeCount - 1)),
    [activeChange, changeCount, goToChange],
  );
  const handleSelectNode = useCallback(
    nodeId => scrollToLines(findNodeIdLine(leftValue, nodeId), findNodeIdLine(rightValue, nodeId)),
    [leftValue, rightValue, scrollToLines],
  );

  // The live text decides Save: a save right after typing must not send a text the check hasn't seen
  const leftLiveValidation = leftValue === debouncedLeft ? leftValidation : validatePipelineYaml(leftValue);
  const rightLiveValidation =
    rightValue === debouncedRight ? rightValidation : validatePipelineYaml(rightValue);
  const leftIsDirty = leftEdits.instructions !== undefined;
  const rightIsDirty = rightEdits.instructions !== undefined;

  const handleSaveLeft = useCallback(() => onSaveLeft({ instructions: leftValue }), [leftValue, onSaveLeft]);
  const handleSaveRight = useCallback(
    () => onSaveRight({ instructions: rightValue }),
    [rightValue, onSaveRight],
  );

  const styles = comparePipelineYamlStepStyles();

  const saveSides = [
    {
      side: 'left',
      version: leftVersion,
      value: leftValue,
      validation: leftLiveValidation,
      isDirty: leftIsDirty,
      isSaving: Boolean(savingLeftKeys.instructions),
      reason: leftSaveDisabledReason,
      onSave: handleSaveLeft,
    },
    {
      side: 'right',
      version: rightVersion,
      value: rightValue,
      validation: rightLiveValidation,
      isDirty: rightIsDirty,
      isSaving: Boolean(savingRightKeys.instructions),
      reason: undefined,
      onSave: handleSaveRight,
    },
  ];

  const renderHeader = ({ version, value }) => (
    <Box sx={styles.headerCell}>
      <CompareVersionHeader version={version} />
      <CopyIconButton
        value={value}
        tooltip={`Copy YAML from version ${version?.name}`}
      />
    </Box>
  );

  const renderSave = ({ side, version, validation, isDirty, isSaving, reason, onSave }) => {
    const invalidMessage = isDirty && !validation.valid ? validation.message : '';
    return (
      <Box sx={styles.footerCell}>
        <Typography
          role={invalidMessage ? 'alert' : undefined}
          sx={styles.error}
          data-testid={`compare-yaml-error-${side}`}
        >
          {invalidMessage}
        </Typography>
        <CompareSaveButton
          label={`Save ${version?.name}`}
          isDirty={isDirty}
          isSaving={isSaving}
          disabledReason={reason || invalidMessage}
          onClick={onSave}
          testId={`compare-yaml-save-${side}`}
        />
      </Box>
    );
  };

  // The merge view spans both columns, so the shared layout gives the headers and the divider only
  return (
    <Box
      sx={styles.root}
      data-testid="compare-pipeline-yaml-step"
    >
      <Box sx={styles.header}>
        <EditEntityComparisonLayout
          currentLabel={renderHeader(saveSides[0])}
          suggestedLabel={renderHeader(saveSides[1])}
        />
      </Box>

      {isTooLarge && (
        <Box
          sx={styles.banner}
          data-testid="compare-yaml-too-large"
        >
          <Banner.BannerMessage
            variant="info"
            message={COMPARE_MESSAGES.yamlTooLarge}
          />
        </Box>
      )}
      {!isTooLarge && isIdentical && (
        <Typography
          sx={styles.noDiffNote}
          data-testid="compare-yaml-no-differences"
        >
          {COMPARE_MESSAGES.noDifferences}
        </Typography>
      )}
      {!isTooLarge && !isIdentical && changeCount > 0 && (
        <YamlDiffToolbar
          addedLines={addedLines}
          removedLines={removedLines}
          changeCount={changeCount}
          activeChange={activeChange}
          nodeSummary={nodeSummary}
          onPreviousChange={handlePreviousChange}
          onNextChange={handleNextChange}
          onSelectNode={handleSelectNode}
        />
      )}

      <Box sx={styles.editors}>
        {isTooLarge ? (
          <YamlPlainEditors
            leftValue={leftValue}
            rightValue={rightValue}
            onLeftChange={handleLeftChange}
            onRightChange={handleRightChange}
          />
        ) : (
          <YamlMergeEditor hostRef={hostRef} />
        )}
      </Box>

      <Box sx={styles.footerRow}>
        {saveSides.map(saveSide => (
          <Box
            key={saveSide.side}
            sx={styles.footerSide}
          >
            {renderSave(saveSide)}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

ComparePipelineYamlStep.displayName = 'ComparePipelineYamlStep';

/** @type {MuiSx} */
const comparePipelineYamlStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexShrink: 0,
    display: 'flex',
  },
  headerCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    textTransform: 'none',
    letterSpacing: 'normal',
    textAlign: 'left',
  },
  banner: {
    margin: '0.75rem 2rem 0',
  },
  noDiffNote: ({ palette }) => ({
    padding: '0.75rem 2rem 0',
    fontSize: '0.75rem',
    color: palette.text.secondary,
    fontStyle: 'italic',
  }),
  editors: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '0.75rem 2rem 0',
  },
  footerRow: {
    display: 'flex',
    flexShrink: 0,
    gap: '1rem',
    padding: '0.5rem 2rem 1rem',
  },
  footerSide: {
    flex: 1,
    minWidth: 0,
  },
  footerCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    minWidth: 0,
  },
  error: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.error,
    minHeight: '1rem',
  }),
});

export default ComparePipelineYamlStep;
