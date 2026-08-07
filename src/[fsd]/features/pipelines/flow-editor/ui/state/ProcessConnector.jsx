import { memo } from 'react';

import { StepConnector, stepConnectorClasses } from '@mui/material';

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

export default ProcessConnector;
