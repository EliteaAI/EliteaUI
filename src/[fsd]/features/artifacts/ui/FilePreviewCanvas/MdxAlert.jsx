import { memo } from 'react';

import { Alert } from '@mui/material';

const MdxAlert = memo(props => {
  const { defaultSeverity = 'info', sx, severityProp = 'severity', alertProps } = props;
  return (
    <Alert
      severity={alertProps[severityProp] || defaultSeverity}
      sx={sx}
    >
      {alertProps.children}
    </Alert>
  );
});

MdxAlert.displayName = 'MdxAlert';

export default MdxAlert;
