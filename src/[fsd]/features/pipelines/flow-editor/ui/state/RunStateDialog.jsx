import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Step,
  StepConnector,
  Stepper,
  Typography,
} from '@mui/material';

import { BudgetErrorMessage, ContinuationError } from '@/[fsd]/features/chat';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import ProcessConnector from '@/[fsd]/features/pipelines/flow-editor/ui/state/ProcessConnector';
import ProcessStepIcon from '@/[fsd]/features/pipelines/flow-editor/ui/state/ProcessStepIcon';
import RunStatus from '@/[fsd]/features/pipelines/flow-editor/ui/state/RunStatus';
import StateItemView from '@/[fsd]/features/pipelines/flow-editor/ui/state/StateItemView';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PipelineStateViewModal from '@/components/PipelineStateViewModal';

const RunStateDialog = memo(props => {
  const { data, state, open, onClose, onStop, onDelete, editorHeight, editorWidth } = props;

  const [selectedStep, setSelectedStep] = useState(0);
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedState, setSelectedState] = useState({});

  const variables = useMemo(() => Object.keys(state ?? { input: '', messages: [] }), [state]);
  const styles = runStateDialogStyles(editorWidth, editorHeight);

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
    if (data.status === FlowEditorConstants.PipelineStatus.InProgress && data.timeline?.length) {
      setSelectedStep(data.timeline.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.timeline?.length]);

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
                  <IconButton
                    variant="elitea"
                    color="tertiary"
                    sx={styles.iconButton}
                    onClick={onStop}
                  >
                    <Box sx={({ palette }) => ({ color: palette.icon.fill.secondary })}>
                      <StopIcon
                        width="16"
                        height="16"
                      />
                    </Box>
                  </IconButton>
                ) : (
                  <IconButton
                    variant="elitea"
                    color="tertiary"
                    sx={styles.iconButton}
                    onClick={onDelete}
                    data-testid="pipeline-run-details-delete-button"
                  >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                )}
                <IconButton
                  variant="elitea"
                  color="tertiary"
                  sx={styles.iconButton}
                  onClick={onClose}
                  data-testid="pipeline-run-details-close-button"
                >
                  <Box sx={({ palette }) => ({ color: palette.icon.fill.secondary })}>
                    <CollapseIcon
                      width="16"
                      height="16"
                    />
                  </Box>
                </IconButton>
              </Box>
            </Box>
            <Box sx={styles.contentContainer}>
              <Box
                sx={styles.timelineHeader}
                data-testid="pipeline-run-details-timeline-section"
              >
                <Box sx={styles.timelineStep}>
                  <Typography
                    variant="subtitle"
                    color="text.primary"
                  >
                    Timeline step:
                  </Typography>
                  <Typography
                    variant="bodyMedium"
                    color="text.secondary"
                  >
                    {data.status === FlowEditorConstants.PipelineStatus.InProgress
                      ? data.timeline[data.timeline.length - 2]?.id || 'Start'
                      : data.timeline[selectedStep]?.id}
                  </Typography>
                </Box>
                {(data.status === FlowEditorConstants.PipelineStatus.InProgress ||
                  data.status === FlowEditorConstants.PipelineStatus.Error ||
                  data.status === FlowEditorConstants.PipelineStatus.Interrupt) && (
                  <Box sx={styles.statusIndicator}>
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                    >
                      {`${data.timeline[data.timeline.length - 1]?.id || ''}:`}
                    </Typography>
                    {data.timeline[data.timeline.length - 1]?.status ===
                      FlowEditorConstants.PipelineStatus.InProgress && (
                      <>
                        <Box sx={styles.progressBox}>
                          <StyledCircleProgress
                            size={14}
                            sx={styles.progressColor}
                          />
                        </Box>
                        <Typography
                          variant="bodyMedium"
                          sx={styles.statusTextInactive}
                        >
                          Performing
                        </Typography>
                      </>
                    )}
                    {data.timeline[data.timeline.length - 1]?.status ===
                      FlowEditorConstants.PipelineStatus.Error && (
                      <>
                        <Box sx={styles.progressBox}>
                          <ErrorOutlineIcon
                            fontSize="1rem"
                            sx={styles.errorIcon}
                          />
                        </Box>
                        <Typography
                          variant="bodyMedium"
                          sx={styles.statusTextError}
                        >
                          Error
                        </Typography>
                      </>
                    )}
                    {data.timeline[data.timeline.length - 1]?.status ===
                      FlowEditorConstants.PipelineStatus.Interrupt && (
                      <>
                        <Box
                          sx={[styles.progressBox, ({ palette }) => ({ color: palette.status.onModeration })]}
                        >
                          <AttentionIcon
                            width="14"
                            height="14"
                          />
                        </Box>
                        <Typography
                          variant="bodyMedium"
                          sx={styles.statusTextInactive}
                        >
                          User action waiting...
                        </Typography>
                      </>
                    )}
                    {data.timeline[data.timeline.length - 1]?.status ===
                      FlowEditorConstants.PipelineStatus.Completed && (
                      <>
                        <Typography
                          variant="bodyMedium"
                          sx={styles.statusTextPublished}
                        >
                          Completed
                        </Typography>
                      </>
                    )}
                    {data.timeline[data.timeline.length - 1]?.status ===
                      FlowEditorConstants.PipelineStatus.Stopped && (
                      <>
                        <Box
                          sx={[styles.progressBox, ({ palette }) => ({ color: palette.status.onModeration })]}
                        >
                          <AttentionIcon
                            width="14"
                            height="14"
                          />
                        </Box>
                        <Typography
                          variant="bodyMedium"
                          sx={styles.statusTextInactive}
                        >
                          Stopped
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
              <Stepper
                sx={styles.stepper}
                activeStep={data.timeline.findIndex(
                  step => step.status === FlowEditorConstants.PipelineStatus.InProgress,
                )}
                connector={
                  <ProcessConnector isError={data.status === FlowEditorConstants.PipelineStatus.Error} />
                }
              >
                {data.timeline.map((step, index) => (
                  <Step
                    key={index}
                    sx={styles.step}
                  >
                    <ProcessStepIcon
                      onSelect={onSelect}
                      index={index}
                      tooltip={step.id}
                      active={index === selectedStep}
                      isError={data.status === FlowEditorConstants.PipelineStatus.Error}
                    />
                    <Typography
                      sx={styles.stepLabel}
                      variant="bodySmall"
                      data-testid={`pipeline-run-details-timeline-timestamp-${index}`}
                    >
                      {format(new Date(step.created_at), 'HH:mm:ss')}
                    </Typography>
                  </Step>
                ))}
                <StepConnector
                  sx={[
                    styles.stepConnector,
                    {
                      display: data.timeline.length < 2 ? undefined : 'none',
                    },
                  ]}
                />
              </Stepper>
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
                              valueBefore={
                                selectedStep ? data.timeline[selectedStep - 1].state[variable] : ''
                              }
                              valueAfter={data.timeline[selectedStep]?.state[variable]}
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
    border: `0.0625rem solid ${palette.border.flowNode}`,
    boxShadow: palette.boxShadow.default,
    position: 'absolute',
    top: 0,
    margin: '12.5rem',
    minHeight: '25rem',
    maxWidth: '90vw',
    width: `${editorWidth * 0.9}px`,
    maxHeight: `${editorHeight * 0.8}px`,
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
    background: palette.background.tabPanel,
  }),
  header: ({ palette }) => ({
    height: '2.75rem',
    padding: '0.5rem 1.5rem',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `0.0625rem solid ${palette.border.flowNode}`,
  }),
  headerActions: {
    height: '100%',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 0,
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
  timelineHeader: {
    display: 'flex',
    width: '100%',
    height: '2.25rem',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem 0 1.5rem',
  },
  timelineStep: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  statusIndicator: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  progressBox: {
    width: '0.875rem',
    height: '0.875rem',
  },
  progressColor: ({ palette }) => ({
    color: palette.icon.fill.inactive,
  }),
  statusTextInactive: ({ palette }) => ({
    color: palette.icon.fill.inactive,
  }),
  errorIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.status.rejected,
  }),
  statusTextError: ({ palette }) => ({
    color: palette.status.rejected,
  }),
  statusTextPublished: ({ palette }) => ({
    color: palette.status.published,
  }),
  stepper: ({ palette }) => ({
    padding: '1rem 1.5rem 1.75rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.flowNode}`,
    height: '3.375rem',
  }),
  step: {
    padding: '0 !important',
    position: 'relative',
  },
  stepLabel: {
    position: 'absolute',
    left: '-0.5rem',
    bottom: '-1.25rem',
    width: '12.5rem',
  },
  stepConnector: ({ palette }) => ({
    display: 'none',
    '.MuiStepConnector-line': {
      borderColor: `${palette.border.flowNode} !important`,
      marginLeft: '-1.0625rem',
      marginRight: '-1.0625rem',
      borderTopWidth: '0.375rem',
      borderRadius: '0.625rem',
      zIndex: 0,
    },
  }),
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
    borderBottom: `0.0625rem solid ${palette.border.flowNode}`,
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
    background: `${palette.background.tabPanel} !important`,
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
