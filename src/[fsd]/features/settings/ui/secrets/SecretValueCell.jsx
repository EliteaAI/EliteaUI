import { memo, useCallback } from 'react';

import { Box, Button } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import { Text } from '@/[fsd]/shared/ui';
import { copyToClipboard, isSafari } from '@/utils/browserUtils.js';

const SecretValueCell = memo(props => {
  const { secretName, label, tooltip, copyMessage, showSecret, projectId, toastInfo } = props;

  const isSafariBrowser = isSafari();
  const styles = labelButtonStyles();

  const handleDirectCopy = useCallback(async () => {
    const { data } = await showSecret({
      projectId,
      name: secretName,
    });

    if (data) {
      const { value } = data;

      try {
        await copyToClipboard(value);
        toastInfo(copyMessage);
      } catch {
        toastInfo('Failed to copy to clipboard');
      }
    }
  }, [projectId, secretName, showSecret, copyMessage, toastInfo]);

  return (
    <Box sx={styles.container}>
      <StyledTooltip
        title={tooltip}
        placement="top"
      >
        <Button
          sx={styles.button}
          variant="elitea"
          color="tertiary"
          onClick={isSafariBrowser ? undefined : handleDirectCopy}
        >
          <Text.EllipsisTypography
            variant="bodyMedium"
            color="text.secondary"
          >
            {label}
          </Text.EllipsisTypography>
        </Button>
      </StyledTooltip>
    </Box>
  );
});

SecretValueCell.displayName = 'SecretValueCell';

/** @type {MuiSx} */
const labelButtonStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
    width: '100%',
  },
  button: {
    padding: '0.25rem 0.5rem',
    height: '100%',
    textAlign: 'left',
    flex: 1,
    justifyContent: 'flex-start',
  },
});

export default SecretValueCell;
