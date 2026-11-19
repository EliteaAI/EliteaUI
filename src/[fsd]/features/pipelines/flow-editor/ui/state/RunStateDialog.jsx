import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Dialog, DialogContent, Typography } from '@mui/material';

import { BudgetErrorMessage, ContinuationError } from '@/[fsd]/features/chat';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import RunStatus from '@/[fsd]/features/pipelines/flow-editor/ui/state/RunStatus';
import StateItemView from '@/[fsd]/features/pipelines/flow-editor/ui/state/StateItemView';
import { TimeLine } from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PipelineStateViewModal from '@/components/PipelineStateViewModal';

const RunStateDialog = memo(props => {
  const { data, state, open, onClose, onStop, onDelete, editorHeight, editorWidth } = props;

  const [selectedStep, setSelectedStep] = useState(0);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedState, setSelectedState] = useState({});

  const variables = useMemo(() => Object.keys(state ?? { input: '', messages: [] }), [state]);
  const styles = runStateDialogStyles(editorWidth, editorHeight);
  const steps = data.groupedTimeline?.length ? data.groupedTimeline : data.timeline;
  const lastOuterStep = steps.findLastIndex(step => !step.is_nested);
  const currentStep = steps[selectedStep];
  // Child state belongs to its own invocation, not the enclosing pipeline.
  const previousStep = steps.findLast(
    (step, index) =>
      index < selectedStep &&
      (currentStep?.is_nested ? step.is_nested && step.group_id === currentStep.group_id : !step.is_nested),
  );

  const onSelect = useCallback(index => {
    setSelectedStep(index);
  }, []);

  const onFullScreen = useCallback((name, value) => {
    setShowValueModal(true);
    setSelectedState({
      name,
      value,
    });
  }, []);

  const onCloseValueModal = useCallback(() => {
    setShowValueModal(false);
  }, []);

  useEffect(() => {
    if (data.status === FlowEditorConstants.PipelineStatus.InProgress && lastOuterStep >= 0) {
      setSelectedStep(lastOuterStep);
    }
  }, [data.status, lastOuterStep]);

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        slotProps={{
          paper: {
            sx: styles.dialogPaper,
          },
        }}
      >
        <DialogContent
          sx={styles.dialogContent}
          data-testid="pipeline-run-details-panel"
        >
          <Box sx={styles.mainContainer}>
            <Box sx={styles.header}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
                data-testid="pipeline-run-details-header"
              >
                {data.label}
              </Typography>
              <Box sx={styles.headerActions}>
                <RunStatus status={data.status} />
                {data.status === FlowEditorConstants.PipelineStatus.InProgress ? (
                  <Button.BaseBtn
                    variant={Button.BUTTON_VARIANTS.tertiary}
                    startIcon={<StopIcon aria-hidden="true" />}
                    aria-label="Stop run"
                    onClick={onStop}
                  />
                ) : (
                  <Button.BaseBtn
                    variant={Button.BUTTON_VARIANTS.tertiary}
                    startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
                    aria-label="Delete run"
                    onClick={onDelete}
                    data-testid="pipeline-run-details-delete-button"
                  />
                )}
                <Button.BaseBtn
                  variant={Button.BUTTON_VARIANTS.tertiary}
                  startIcon={<CollapseIcon aria-hidden="true" />}
                  aria-label="Close run details"
                  onClick={onClose}
                  data-testid="pipeline-run-details-close-button"
                />
              </Box>
            </Box>
            <Box sx={styles.contentContainer}>
              <TimeLine
                key={data.label}
                steps={steps}
                outerSteps={data.timeline}
                status={data.status}
                selectedStep={selectedStep}
                onSelect={onSelect}
              />
              {data.status === FlowEditorConstants.PipelineStatus.Error && !!data.error && (
                <Box sx={[styles.runError, data.continuationError && styles.continuationRunError]}>
                  {data.continuationError ? (
                    <ContinuationError
                      compact
                      error={data.continuationError}
                      trace={data.errorTrace}
                    />
                  ) : data.budgetErrorCode ? (
                    <BudgetErrorMessage code={data.budgetErrorCode} />
                  ) : (
                    <Typography
                      variant="bodySmall"
                      sx={styles.runErrorText}
                    >
                      {data.error}
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={styles.statesHeader}>
                <Typography
                  variant="subtitle"
                  color="text.secondary"
                >
                  States
                </Typography>
              </Box>
              <Box sx={styles.statesContainer}>
                {variables.map((variable, index) => {
                  return (
                    <BasicAccordion
                      key={variable + index}
                      showMode={AccordionConstants.AccordionShowMode.LeftMode}
                      accordionSX={styles.accordionSx}
                      summarySX={styles.accordionSummarySx}
                      titleSX={{
                        color: 'text.secondary',
                      }}
                      accordionDetailsSX={styles.accordionDetailsSx}
                      items={[
                        {
                          title: variable,
                          testId: `pipeline-run-details-state-row-${variable}`,
                          content: (
                            <StateItemView
                              name={variable}
                              onFullScreen={onFullScreen}
                              valueBefore={previousStep ? previousStep.state?.[variable] : ''}
                              valueAfter={currentStep?.state?.[variable]}
                            />
                          ),
                        },
                      ]}
                      defaultExpanded={!index}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <PipelineStateViewModal
        open={showValueModal}
        onClose={onCloseValueModal}
        label={selectedState?.name}
        value={selectedState.value}
        testId="pipeline-run-details-value-modal"
        headerTestId="pipeline-run-details-value-modal-header"
        closeButtonTestId="pipeline-run-details-value-modal-close-button"
        contentTestId="pipeline-run-details-value-modal-content"
      />
    </>
  );
});

RunStateDialog.displayName = 'RunStateDialog';

/** @type {MuiSx} */
const runStateDialogStyles = (editorWidth, editorHeight) => ({
  dialogPaper: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.components.flowEditor.node.border}`,
    boxShadow: palette.boxShadow.default,
    position: 'absolute',
    top: 'min(10.5rem, 22dvh)',
    margin: '0 12.5rem',
    minHeight: 'min(26.5rem, 76dvh)',
    maxWidth: '90vw',
    width: `${editorWidth * 0.9}px`,
    maxHeight: `min(${editorHeight * 0.85}px, 76dvh)`,
    minWidth: '60vw',
  }),
  dialogContent: {
    maxWidth: '100%',
    width: '100%',
    padding: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
  },
  mainContainer: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
    maxHeight: '100%',
    borderRadius: '0.5rem',
    background: palette.background.default.tertiary,
  }),
  header: ({ palette }) => ({
    height: '2.75rem',
    padding: '0.5rem 1.5rem',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `0.0625rem solid ${palette.components.flowEditor.node.border}`,
  }),
  headerActions: {
    height: '100%',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  contentContainer: {
    height: 'calc(100% - 2.75rem)',
    maxHeight: 'calc(100% - 2.75rem)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    paddingBlock: '0.5rem',
    width: '100%',
    gap: '0.25rem',
  },
  runError: {
    padding: '0 1.5rem 0.75rem 1.5rem',
    maxHeight: '7rem',
    overflow: 'auto',
  },
  continuationRunError: {
    maxHeight: 'none',
  },
  runErrorText: ({ palette }) => ({
    color: palette.status.rejected,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  statesHeader: ({ palette }) => ({
    padding: '0 1.5rem 0.75rem 1.5rem',
    height: '1.75rem',
    borderBottom: `0.0625rem solid ${palette.components.flowEditor.node.border}`,
  }),
  statesContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingInline: '1.5rem',
    overflow: 'auto',
    width: '100%',
  },
  accordionSx: ({ palette }) => ({
    background: `${palette.background.default.tertiary} !important`,
    width: '100%',
  }),
  accordionSummarySx: {
    borderRadius: '0.5rem',
    minHeight: '2rem !important',
  },
  accordionDetailsSx: {
    paddingLeft: 0,
  },
});

export default RunStateDialog;
