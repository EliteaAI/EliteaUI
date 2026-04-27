import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Step,
  StepConnector,
  Stepper,
  Typography,
  stepConnectorClasses,
} from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PipelineStateViewModal from '@/components/PipelineStateViewModal';

const ProcessConnector = memo(props => {
  const { isError, ...rest } = props;

  const styles = processConnectorStyles(isError);

  return (
    <StepConnector
      sx={styles.connector}
      {...rest}
    />
  );
});

ProcessConnector.displayName = 'ProcessConnector';

const StateItemViewHeader = memo(props => {
  const { title, onFullScreen } = props;

  const styles = stateItemViewHeaderStyles();

  return (
    <Box sx={styles.container}>
      <Typography
        variant="labelMedium"
        color="text.default"
      >
        {title}
      </Typography>
      <IconButton
        sx={styles.iconButton}
        variant="alita"
        color="tertiary"
        onClick={onFullScreen}
      >
        <FullscreenOutlinedIcon sx={styles.icon} />
      </IconButton>
    </Box>
  );
});

StateItemViewHeader.displayName = 'StateItemViewHeader';

const StateItemView = memo(props => {
  const { onFullScreen, name, valueBefore, valueAfter } = props;

  const styles = stateItemViewStyles();

  const onBeforeValueFullScreen = useCallback(() => {
    onFullScreen(name, valueBefore);
  }, [name, onFullScreen, valueBefore]);

  const onAfterValueFullScreen = useCallback(() => {
    onFullScreen(name, valueAfter);
  }, [name, onFullScreen, valueAfter]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.section}>
        <StateItemViewHeader
          title="Before"
          onFullScreen={onBeforeValueFullScreen}
        />
        <Box sx={styles.valueBox}>{JSON.stringify(valueBefore)}</Box>
      </Box>
      <Box sx={styles.section}>
        <StateItemViewHeader
          title="After"
          onFullScreen={onAfterValueFullScreen}
        />
        <Box sx={styles.valueBox}>{JSON.stringify(valueAfter)}</Box>
      </Box>
    </Box>
  );
});

StateItemView.displayName = 'StateItemView';

const ProcessStepIcon = memo(props => {
  const { active, tooltip, index, onSelect, isError } = props;

  const styles = processStepIconStyles(active, isError);

  const onClick = useCallback(() => {
    onSelect(index);
  }, [index, onSelect]);

  return (
    <StyledTooltip
      title={tooltip}
      placement="top"
    >
      <Box
        sx={styles.outerBox}
        onClick={onClick}
      >
        <Box sx={styles.innerBox} />
      </Box>
    </StyledTooltip>
  );
});

ProcessStepIcon.displayName = 'ProcessStepIcon';

const RunStatus = memo(props => {
  const { status } = props;

  const styles = runStatusStyles(status);

  return (
    <Box sx={styles.container}>
      <Typography
        component="div"
        variant="labelSmall"
        sx={styles.text}
      >
        {status}
      </Typography>
    </Box>
  );
});

RunStatus.displayName = 'RunStatus';

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
        <DialogContent sx={styles.dialogContent}>
          <Box sx={styles.mainContainer}>
            <Box sx={styles.header}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
              >
                {data.label}
              </Typography>
              <Box sx={styles.headerActions}>
                <RunStatus status={data.status} />
                {data.status === FlowEditorConstants.PipelineStatus.InProgress ? (
                  <IconButton
                    variant="alita"
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
                    variant="alita"
                    color="tertiary"
                    sx={styles.iconButton}
                    onClick={onDelete}
                  >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                )}
                <IconButton
                  variant="alita"
                  color="tertiary"
                  sx={styles.iconButton}
                  onClick={onClose}
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
              <Box sx={styles.timelineHeader}>
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
      />
    </>
  );
});

RunStateDialog.displayName = 'RunStateDialog';

/** @type {MuiSx} */
const processConnectorStyles = isError => ({
  connector: ({ palette }) => ({
    [`&.${stepConnectorClasses.active}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: !isError ? palette.status.published : palette.status.rejected,
      },
    },
    [`&.${stepConnectorClasses.completed}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: !isError ? palette.status.published : palette.status.rejected,
      },
    },
    [`& .${stepConnectorClasses.line}`]: {
      marginLeft: '-1.0625rem',
      marginRight: '-1.0625rem',
      borderColor: !isError ? palette.status.published : palette.status.rejected,
      borderTopWidth: '0.375rem',
      borderRadius: '0.625rem',
      zIndex: 0,
    },
  }),
});

/** @type {MuiSx} */
const stateItemViewHeaderStyles = () => ({
  container: {
    display: 'flex',
    height: '1.75rem',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconButton: {
    marginLeft: 0,
  },
  icon: {
    fontSize: '1.3125rem',
  },
});

/** @type {MuiSx} */
const stateItemViewStyles = () => ({
  container: {
    display: 'flex',
    maxWidth: '100%',
    width: '100%',
    paddingLeft: '1.625rem',
    boxSizing: 'border-box',
    gap: '0.625rem',
  },
  section: {
    maxHeight: '7.9375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    flex: 1,
    maxWidth: 'calc(50% - 0.3125rem)',
  },
  valueBox: ({ palette }) => ({
    width: '100%',
    minHeight: '2.625rem',
    flex: 1,
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'auto',
  }),
});

/** @type {MuiSx} */
const processStepIconStyles = (active, isError) => ({
  outerBox: ({ palette }) => ({
    width: '1.3125rem',
    height: '1.3125rem',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
    border: active ? `0.0625rem solid ${!isError ? palette.status.published : palette.status.rejected}` : 0,
    zIndex: 1,
    '&:hover': {
      width: '1.5rem',
      height: '1.5rem',
    },
  }),
  innerBox: ({ palette }) => ({
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    boxSizing: 'border-box',
    backgroundColor: !isError ? palette.status.published : palette.status.rejected,
    border: `0.1875rem solid ${palette.background.tabPanel}`,
    zIndex: 1,
    '&:hover': {
      width: '1.4375rem',
      height: '1.4375rem',
    },
  }),
});

/** @type {MuiSx} */
const runStatusStyles = status => ({
  container: ({ palette }) => {
    const borderColor =
      status === FlowEditorConstants.PipelineStatus.Completed
        ? palette.status.published
        : status === FlowEditorConstants.PipelineStatus.Error
          ? palette.status.rejected
          : status === FlowEditorConstants.PipelineStatus.Stopped
            ? palette.status.onModeration
            : palette.icon.fill.inactive;

    return {
      height: '1.5rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
      borderRadius: '1.25rem',
      width: '5.8125rem',
      border: `0.0625rem solid ${borderColor}`,
    };
  },
  text: ({ palette }) => {
    const color =
      status === FlowEditorConstants.PipelineStatus.Completed
        ? palette.status.published
        : status === FlowEditorConstants.PipelineStatus.Error
          ? palette.status.rejected
          : status === FlowEditorConstants.PipelineStatus.Stopped
            ? palette.status.onModeration
            : palette.icon.fill.inactive;

    return { color };
  },
});

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
  statesHeader: ({ palette }) => ({
    padding: '0 1.5rem 0.75rem 1.5rem',
    height: '1.75rem',
    borderBottom: `0.0625rem solid ${palette.border.flowNode}`,
  }),
  statesContainer: {
    height: 'calc(100% - 7.375rem)',
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
