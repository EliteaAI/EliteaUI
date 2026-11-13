import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import LockSimple from '@/components/Icons/LockSimple';
import UsersIcon from '@/components/Icons/UsersIcon';

import { USERS_ACCESS_KIND } from '../../lib/constants';

const getLinksTooltip = (active, expired) => {
  const activeText = `${active} active external ${active === 1 ? 'link' : 'links'}`;
  return expired ? `${activeText} · ${expired} expired` : activeText;
};

const UsersAccessSummary = memo(props => {
  const { kind, label, linksCount = 0, expiredLinksCount = 0, onLabelClick } = props;

  const isOnlyYou = kind === USERS_ACCESS_KIND.onlyYou;
  const isLink = !isOnlyYou && !!onLabelClick;
  const styles = usersAccessSummaryStyles(isLink);

  return (
    <Box
      sx={styles.root}
      data-testid="chat-users-access-summary"
    >
      {isOnlyYou ? <LockSimple sx={styles.icon} /> : <UsersIcon sx={styles.icon} />}
      <Typography
        variant="labelSmall"
        component={isLink ? 'button' : 'span'}
        sx={styles.label}
        onClick={isLink ? onLabelClick : undefined}
        data-testid="chat-users-access-label"
      >
        {label}
      </Typography>
      {!!linksCount && (
        <>
          <Typography
            variant="labelSmall"
            sx={styles.dot}
          >
            ·
          </Typography>
          <Tooltip
            title={getLinksTooltip(linksCount, expiredLinksCount)}
            placement="top"
          >
            <Box
              sx={styles.links}
              data-testid="chat-users-access-links"
            >
              <Box sx={styles.linkIcon}>
                <CopyLinkIcon />
              </Box>
              <Typography
                variant="labelSmall"
                sx={styles.count}
              >
                {linksCount}
              </Typography>
            </Box>
          </Tooltip>
        </>
      )}
    </Box>
  );
});

UsersAccessSummary.displayName = 'UsersAccessSummary';

/** @type {MuiSx} */
const usersAccessSummaryStyles = isLink => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  icon: ({ palette }) => ({
    flexShrink: 0,
    fontSize: '1rem',
    color: palette.icon.default,
    '& path': { fill: palette.icon.default },
  }),
  label: ({ palette }) => ({
    minWidth: 0,
    padding: 0,
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
    ...(isLink && {
      cursor: 'pointer',
      textDecoration: 'underline',
      '&:hover, &:focus-visible': { color: palette.primary.main },
    }),
  }),
  dot: ({ palette }) => ({
    flexShrink: 0,
    color: palette.text.primary,
  }),
  links: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.25rem',
  },
  linkIcon: ({ palette }) => ({
    display: 'flex',
    '& svg': { width: '1rem', height: '1rem' },
    '& svg path': { fill: palette.icon.default },
  }),
  count: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default UsersAccessSummary;
