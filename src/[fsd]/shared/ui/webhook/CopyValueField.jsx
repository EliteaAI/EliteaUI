import { memo, useCallback, useState } from 'react';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Tooltip, Typography } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { handleCopy } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';

const MASK = '•'.repeat(24);

// A read-only value with Copy; `masked` hides it behind a Show toggle, as a secret is
const CopyValueField = memo(props => {
  const { label, value, masked = false, compact = false, testId, sx = {} } = props;
  const { toastInfo } = useToast();
  const [shown, setShown] = useState(!masked);
  const styles = copyValueFieldStyles(compact);
  const name = label.toLowerCase();

  const onCopy = useCallback(async () => {
    await handleCopy(value);
    toastInfo(`The ${name} has been copied to the clipboard.`);
  }, [value, name, toastInfo]);
  const onToggle = useCallback(() => setShown(prev => !prev), []);

  return (
    <Box sx={[styles.root, sx]}>
      {!compact && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {label}
        </Typography>
      )}
      <Box sx={styles.row}>
        <Typography
          variant="bodySmall"
          sx={styles.value}
          title={shown ? value : undefined}
          data-testid={testId}
        >
          {shown ? value : MASK}
        </Typography>
        {masked && (
          <Tooltip
            title={shown ? `Hide ${name}` : `Show ${name}`}
            placement="top"
          >
            <Box component="span">
              <BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                startIcon={
                  shown ? <VisibilityOffIcon sx={styles.icon} /> : <VisibilityIcon sx={styles.icon} />
                }
                onClick={onToggle}
                aria-label={shown ? `Hide ${name}` : `Show ${name}`}
                data-testid={testId && `${testId}-toggle`}
              />
            </Box>
          </Tooltip>
        )}
        <Tooltip
          title={`Copy ${name}`}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              disabled={!value}
              startIcon={<CopyIcon sx={styles.icon} />}
              onClick={onCopy}
              aria-label={`Copy ${name}`}
              data-testid={testId && `${testId}-copy`}
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

CopyValueField.displayName = 'CopyValueField';

/** @type {MuiSx} */
const copyValueFieldStyles = compact => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 },
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    ...(!compact && {
      padding: '0.25rem 0.25rem 0.25rem 0.75rem',
      borderRadius: '0.5rem',
      backgroundColor: palette.background.surface.interactive.default,
    }),
  }),
  value: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  icon: { fontSize: '1rem' },
});

export default CopyValueField;
