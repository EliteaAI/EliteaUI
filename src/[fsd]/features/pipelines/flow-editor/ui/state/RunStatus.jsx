import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

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

export default RunStatus;
