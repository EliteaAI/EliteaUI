import { memo } from 'react';

import { StepConnector } from '@mui/material';

const TimeLineEndConnector = memo(props => {
  // Stepper injects `index` and `last` into every child. StepConnector does not consume them, so they
  // would leak onto the DOM element and trigger a React unknown-attribute warning.
  // eslint-disable-next-line no-unused-vars
  const { index, last, ...rest } = props;

  const styles = timeLineEndConnectorStyles();

  return (
    <StepConnector
      sx={styles.connector}
      {...rest}
    />
  );
});

TimeLineEndConnector.displayName = 'TimeLineEndConnector';

/** @type {MuiSx} */
// Always hidden, exactly as the timeline rendered before it was split into components: the former
// `display: undefined` override for runs with fewer than two steps never won over this base value.
// The element still has to stay the last Stepper child, because the connector margin selectors in
// TimeLine count from the end.
const timeLineEndConnectorStyles = () => ({
  connector: ({ palette }) => ({
    display: 'none',
    '.MuiStepConnector-line': {
      borderColor: `${palette.components.flowEditor.node.border} !important`,
      marginLeft: '-1.0625rem',
      marginRight: '-1.0625rem',
      borderTopWidth: '0.375rem',
      borderRadius: '0.625rem',
      zIndex: 0,
    },
  }),
});

export default TimeLineEndConnector;
