import { memo } from 'react';

import { Alert } from '@mui/material';

const BackupAlert = memo(props => {
  const { severity = 'info', children, ...rest } = props;
  const styles = backupAlertStyles(severity);

  return (
    <Alert
      severity={severity}
      sx={styles.alert}
      {...rest}
    >
      {children}
    </Alert>
  );
});

BackupAlert.displayName = 'BackupAlert';

// MuiAlert only carries theme overrides for the "filled" variant (and those use raw,
// non-palette colors), so the default "standard" Alerts fall back to MUI's stock palette
// and clash with the app background. Re-theme them with the same background/border/icon/text
// tokens the toolkits "index result" banners already use.
/** @type {MuiSx} */
const backupAlertStyles = severity => ({
  alert: ({ palette }) => {
    const colors = palette.alert[severity] || palette.alert.info;
    return {
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${colors.border}`,
      backgroundColor: colors.background,
      '& .MuiAlert-icon': {
        color: palette.icon.indexResult[severity] || palette.icon.indexResult.info,
      },
      '& .MuiAlert-message': {
        width: '100%',
        color: colors.text,
      },
    };
  },
});

export default BackupAlert;
