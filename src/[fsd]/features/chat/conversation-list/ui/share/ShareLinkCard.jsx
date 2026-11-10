import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import LinkIconSvg from '@/assets/copy-link-icon.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import LockSimple from '@/components/Icons/LockSimple';

import { buildLinkContentLabel, buildLinkMeta, buildLinkTitle } from '../../lib/helpers/shareChat.helpers';

const ShareLinkCard = memo(props => {
  const { link, totals, now, isExpired, onRevoke, onDelete, onCopy } = props;

  const handleRevoke = useCallback(() => onRevoke(link), [link, onRevoke]);
  const handleDelete = useCallback(() => onDelete(link), [link, onDelete]);
  const handleCopy = useCallback(() => onCopy(link), [link, onCopy]);

  const styles = shareLinkCardStyles();

  return (
    <Box
      data-testid="link-card"
      sx={styles.root}
    >
      <Box sx={styles.text}>
        <Box sx={styles.titleLine}>
          {link.has_password && (
            <Tooltip
              title="Password protected"
              placement="top"
            >
              <Box
                component="span"
                data-testid="link-lock"
                aria-label="Password protected"
                sx={styles.lock}
              >
                <LockSimple sx={styles.lockIcon} />
              </Box>
            </Tooltip>
          )}
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            noWrap
          >
            {isExpired ? buildLinkContentLabel(link, totals) : buildLinkTitle(link, totals, now)}
          </Typography>
          {isExpired && (
            <Typography
              variant="bodySmall"
              sx={styles.expiredBadge}
            >
              Expired
            </Typography>
          )}
        </Box>
        <Typography
          variant="bodySmall"
          color="text.primary"
        >
          {buildLinkMeta(link)}
        </Typography>
      </Box>
      {isExpired ? (
        <Tooltip title="Delete link">
          <Button.BaseBtn
            data-testid="link-delete"
            aria-label="Delete link"
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<DeleteIcon sx={styles.icon} />}
            onClick={handleDelete}
          />
        </Tooltip>
      ) : (
        <Box sx={styles.actions}>
          <Button.BaseBtn
            data-testid="link-revoke"
            variant={BUTTON_VARIANTS.tertiary}
            onClick={handleRevoke}
          >
            Revoke
          </Button.BaseBtn>
          <Tooltip title="Copy link">
            <Button.BaseBtn
              data-testid="link-copy"
              aria-label="Copy link"
              variant={BUTTON_VARIANTS.secondary}
              size="small"
              startIcon={<LinkIconSvg />}
              onClick={handleCopy}
              sx={styles.copyButton}
            />
          </Tooltip>
        </Box>
      )}
    </Box>
  );
});

ShareLinkCard.displayName = 'ShareLinkCard';

/** @type {MuiSx} */
const shareLinkCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover': {
      backgroundColor: palette.background.interactiveItem.hover,
    },
  }),
  text: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  titleLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  expiredBadge: ({ palette }) => ({
    flexShrink: 0,
    padding: '0 0.5rem',
    borderRadius: '0.625rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1.25rem',
    backgroundColor: palette.border.attention,
    color: palette.text.secondary,
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1rem',
  },
  lock: {
    display: 'inline-flex',
    flexShrink: 0,
  },
  lockIcon: {
    fontSize: '0.75rem',
  },
  copyButton: ({ palette }) => ({
    '& svg path': { fill: palette.icon.secondary },
  }),
});

export default ShareLinkCard;
