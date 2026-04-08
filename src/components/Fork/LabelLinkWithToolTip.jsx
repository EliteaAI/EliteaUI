import React, { useCallback } from 'react';

import { Box, Link, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import { useProjectEntityLink } from '@/hooks/useProjectEntityLink';
import { useTheme } from '@emotion/react';

export const LabelLinkWithToolTip = ({ label, value, tooltip, href, disabled }) => {
  const theme = useTheme();
  const { projectEntityLink } = useProjectEntityLink({ isRelative: true });
  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }
    localStorage.setItem('viewForkedEntityBackUrl', projectEntityLink);
    window.location.href = href;
  }, [disabled, href, projectEntityLink]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
        overflow: 'hidden',
        flexWrap: 'nowrap',
      }}
    >
      <Typography
        component={'div'}
        width={'95px'}
        variant="bodyMedium"
      >
        {label}
      </Typography>
      <StyledTooltip
        title={tooltip}
        placement="top"
      >
        <Link
          variant="bodyMedium"
          onClick={onClick}
          color={!disabled ? theme.palette.text.secondary : theme.palette.text.disabled}
          sx={{
            textDecoration: 'underline',
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: 'calc(100% - 110px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            wordWrap: 'break-word',
            textOverflow: 'ellipsis',
          }}
          // href={href}
        >
          {value}
        </Link>
      </StyledTooltip>
    </Box>
  );
};
