import React, { useCallback } from 'react';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import SearchIcon from '@/components/Icons/SearchIcon';
import { useTheme } from '@emotion/react';

const ConversationSearchButton = ({ collapsed = false, onExpand, onSearchActivate }) => {
  const theme = useTheme();

  const handleSearchClick = useCallback(() => {
    // If collapsed, expand first then activate search
    if (collapsed && onExpand) {
      onExpand();
    }
    // Notify parent that search was activated
    onSearchActivate?.(true);
  }, [collapsed, onExpand, onSearchActivate]);

  return (
    <Tooltip
      title="Search conversations"
      placement="top"
    >
      <IconButton
        onClick={handleSearchClick}
        variant="elitea"
        color="secondary"
        sx={{
          minWidth: '28px !important',
          width: '28px !important',
          height: '28px',
          boxSizing: 'border-box',
          padding: '6px !important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '0px',
        }}
      >
        <SearchIcon
          sx={{
            width: '16px',
            height: '16px',
          }}
          fill={theme.palette.icon.fill.secondary}
        />
      </IconButton>
    </Tooltip>
  );
};

export default ConversationSearchButton;
