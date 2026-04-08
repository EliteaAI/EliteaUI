import { useCallback, useMemo, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip.jsx';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import CheckIcon from '@/components/Icons/CheckIcon.jsx';
import { useProjectEntityLink } from '@/hooks/useProjectEntityLink.js';
import useToast from '@/hooks/useToast.jsx';
import { useTheme } from '@emotion/react';

const COPIED_EVENT_DURATION = 2500; // Reset after 2.5 seconds

const useCopyLink = ({ link } = {}) => {
  const { toastError, toastInfo } = useToast();
  const { projectEntityLink } = useProjectEntityLink();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link || projectEntityLink);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_EVENT_DURATION);
      toastInfo('The link has been copied to the clipboard');
    } catch {
      setCopied(false);
      toastError('Failed to copy the link!');
      return;
    }
  }, [link, projectEntityLink, toastError, toastInfo]);

  return {
    copied,
    handleCopy,
  };
};

export const useCopyLinkMenu = ({ link, label = 'Copy link', key } = {}) => {
  const theme = useTheme();
  const { copied, handleCopy } = useCopyLink({ link });

  const menuItem = useMemo(
    () => ({
      key: key || label,
      label,
      icon: copied ? (
        <CheckIcon
          sx={{ fontSize: '1rem' }}
          fill={theme.palette.icon.fill.default}
        />
      ) : (
        <Box
          sx={{
            width: '1rem',
            height: '1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            component={CopyLinkIcon}
            sx={{
              width: '1rem',
              height: '1rem',
              color: theme.palette.icon.fill.default,
            }}
            fill={theme.palette.icon.fill.default}
          />
        </Box>
      ),
      disabled: false,
      onClick: handleCopy,
    }),
    [copied, handleCopy, theme.palette.icon.fill.default, key, label],
  );

  return {
    copyLinkMenuItem: menuItem,
  };
};

export const CopyLinkToEntityButton = ({ link }) => {
  const theme = useTheme();
  const { copied, handleCopy } = useCopyLink({ link });
  return (
    <Tooltip
      title={copied ? 'Copied' : 'Copy link to clipboard'}
      placement="top"
    >
      <IconButton
        sx={{ marginLeft: '0px' }}
        variant="elitea"
        color="secondary"
        aria-label={copied ? 'Copied!' : 'Copy link to clipboard'}
        onClick={handleCopy}
      >
        {copied ? (
          <CheckIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.secondary}
          />
        ) : (
          <Box
            component={CopyLinkIcon}
            sx={{
              width: '1rem',
              height: '1rem',
            }}
            fill={theme.palette.icon.fill.secondary}
          />
        )}
      </IconButton>
    </Tooltip>
  );
};
