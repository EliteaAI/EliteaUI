import React from 'react';

import { Box, Link } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import { buildForkedEntityHref } from '@/common/utils.jsx';
import ForkIcon from '@/components/Icons/ForkIcon.jsx';
import { useTheme } from '@emotion/react';

export const IconLinkWithToolTip = ({ tooltip, meta, type }) => {
  const theme = useTheme();
  const href = buildForkedEntityHref(type, meta);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
      <StyledTooltip
        title={`Forked from - ${tooltip}`}
        placement="top"
      >
        <Link
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '16px',
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': {
              background: theme.palette.background.button.secondary.default,
            },
          }}
          variant="bodyMedium"
          color={theme.palette.text.secondary}
          href={href}
        >
          <ForkIcon
            sx={{ fontSize: '16px' }}
            fill={theme.palette.icon.fill.default || theme.palette.icon.fill.secondary}
          />
        </Link>
      </StyledTooltip>
    </Box>
  );
};
