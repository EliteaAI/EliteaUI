import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import Person from '@/components/Icons/Person';

const CredentialOptionLabel = memo(props => {
  const {
    isPersonal,
    label,
    credentialUrl,
    isInvalid,
    isChecking,
    invalidMessage,
    onRevalidate,
    isSelected,
  } = props;

  return (
    <Box
      component="span"
      sx={styles.labelContainer}
    >
      <Box
        component="span"
        sx={styles.leadingIconBox}
      >
        {isPersonal ? <Person fontSize="1rem" /> : <BriefcaseIcon fontSize="1rem" />}
      </Box>
      <Box
        component="span"
        sx={styles.labelText}
      >
        {label}
      </Box>
      {credentialUrl && (
        <Tooltip
          title="Open in new tab"
          placement="top"
        >
          <BaseBtn
            aria-label="Open in new tab"
            data-testid="credential-open-in-new-tab-button"
            className="credential-action"
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            onMouseDown={event => event.stopPropagation()}
            onClick={event => {
              event.stopPropagation();
              window.open(credentialUrl, '_blank', 'noopener,noreferrer');
            }}
            sx={styles.optionActionButton}
          >
            <OpenInNewIcon />
          </BaseBtn>
        </Tooltip>
      )}
      {isInvalid && (
        <Tooltip
          title="Reload and apply changes"
          placement="top"
        >
          <BaseBtn
            aria-label="Reload and apply changes"
            data-testid="credential-reload-button"
            className="credential-action"
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            disabled={isChecking}
            onMouseDown={event => event.stopPropagation()}
            onClick={onRevalidate}
            sx={styles.optionActionButton}
          >
            <RefreshIcon />
          </BaseBtn>
        </Tooltip>
      )}
      {isInvalid && !isSelected && (
        <Tooltip
          title={invalidMessage || 'Credential is unavailable or misconfigured'}
          placement="top"
        >
          <Box
            data-testid="credential-status-indicator"
            aria-label={invalidMessage || 'Credential is unavailable or misconfigured'}
            sx={styles.attentionIconBox}
          >
            <AttentionIcon />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

CredentialOptionLabel.displayName = 'CredentialOptionLabel';

/** @type {MuiSx} */
const styles = {
  labelContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    width: '100%',
    '& .credential-action': { display: 'none' },
    '&:hover .credential-action': { display: 'inline-flex' },
  },
  leadingIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
  },
  labelText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  optionActionButton: ({ palette }) => ({
    padding: 0,
    marginLeft: 'auto',
    flexShrink: 0,
    width: '1.5rem !important',
    height: '1.5rem !important',
    minWidth: '1.5rem !important',
    minHeight: '1.5rem !important',
    '& svg': {
      width: '0.875rem',
      height: '0.875rem',
    },
    '&:hover': {
      opacity: 1,
      backgroundColor: palette.background.surface.interactive.active,
    },
  }),
  attentionIconBox: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    color: palette.icon.attention,
    '& svg': {
      width: '0.875rem',
      height: '0.875rem',
    },
  }),
};

export default CredentialOptionLabel;
