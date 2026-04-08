import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import ErrorIcon from '@/assets/error-icon.svg?react';
import FailIcon from '@/assets/fail-icon.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import SuccessIcon from '@/assets/success-icon.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const RunStateNode = memo(props => {
  const {
    avoidTooltip,
    data,
    id,
    deleteRunNode,
    onStopRun,
    yamlJsonObject,
    editorHeight,
    editorWidth,
    selected,
  } = props;

  const styles = runNodeStyles(data.status, selected);

  const [isOpened, setIsOpened] = useState(false);
  const runInProgress = data.status === FlowEditorConstants.PipelineStatus.InProgress;

  const onOpen = useCallback(() => {
    setIsOpened(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpened(false);
  }, []);

  const onStop = useCallback(
    event => {
      event.stopPropagation();
      onStopRun(id);
    },
    [onStopRun, id],
  );

  const onDelete = useCallback(
    event => {
      event.stopPropagation();
      deleteRunNode(id);
      setIsOpened(false);
    },
    [id, deleteRunNode],
  );

  return (
    <>
      <Box sx={styles.wrapper}>
        <Tooltip
          title={avoidTooltip ? '' : `Run is ${data.status.toLowerCase()}`}
          placement="bottom"
        >
          <Box sx={styles.statusIcon}>
            {(() => {
              switch (data.status) {
                case FlowEditorConstants.PipelineStatus.Completed:
                  return <SuccessIcon />;
                case FlowEditorConstants.PipelineStatus.Error:
                  return <ErrorIcon />;
                case FlowEditorConstants.PipelineStatus.InProgress:
                  return (
                    <CircularProgress
                      size={14}
                      thickness={5}
                    />
                  );
                default:
                  return <FailIcon />;
              }
            })()}
          </Box>
        </Tooltip>

        <Tooltip
          title={avoidTooltip ? '' : 'View details'}
          position="botton"
        >
          <Typography
            variant="labelMedium"
            sx={styles.runName}
            onClick={onOpen}
          >
            {data.label}
          </Typography>
        </Tooltip>

        <Tooltip
          title={avoidTooltip ? '' : `${runInProgress ? 'Stop' : 'Delete'}  run`}
          placement="bottom"
        >
          <Box sx={styles.negativeButton}>
            {runInProgress ? <StopIcon onClick={onStop} /> : <DeleteIcon onClick={onDelete} />}
          </Box>
        </Tooltip>
      </Box>
      <FlowEditorState.RunStateDialog
        data={data}
        state={yamlJsonObject.state}
        open={isOpened}
        onClose={onClose}
        onStop={onStop}
        onDelete={onDelete}
        editorHeight={editorHeight}
        editorWidth={editorWidth}
      />
    </>
  );
});

RunStateNode.displayName = 'RunStateNode';

/** @type {MuiSx} */
const runNodeStyles = (status, selected) => {
  const iconColor = palette => {
    switch (status) {
      case FlowEditorConstants.PipelineStatus.Completed:
        return palette.status.published;
      case FlowEditorConstants.PipelineStatus.Error:
        return palette.status.rejected;
      case FlowEditorConstants.PipelineStatus.Stopped:
        return palette.status.onModeration;
      default:
        return palette.icon.fill.inactive;
    }
  };

  return {
    wrapper: ({ palette }) => ({
      padding: '.375rem .75rem',
      borderRadius: '.5rem',
      border: `.0625rem solid ${selected ? palette.background.button.primary.disabled : palette.border.lines}`,
      background: selected ? palette.background.dataGrid.main : palette.background.tabPanel,
      height: '2.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '.5rem',

      '&:hover': {
        cursor: 'pointer',
        border: `.0625rem solid ${palette.background.button.primary.disabled}`,
        background: palette.background.dataGrid.main,
      },
    }),
    runName: ({ palette }) => ({ color: palette.text.secondary }),
    statusIcon: ({ palette }) => ({
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      cursor: 'pointer',

      path: {
        fill: iconColor(palette),
      },
      circle: {
        color: iconColor(palette),
      },
    }),
    negativeButton: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',

      svg: {
        fontSize: '1rem',

        ...(status === FlowEditorConstants.PipelineStatus.InProgress
          ? {
              path: {
                fill: ({ palette }) => palette.status.onModeration,
              },
            }
          : {
              ':hover': {
                path: {
                  fill: ({ palette }) => `${palette.text.secondary} !important`,
                },
              },
            }),
      },
    },
  };
};

export default RunStateNode;
