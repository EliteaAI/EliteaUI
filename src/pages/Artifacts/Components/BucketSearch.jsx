import React, { useCallback } from 'react';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import SearchIcon from '@/components/Icons/SearchIcon';
import { useTheme } from '@emotion/react';

const BucketSearch = ({ onSearchActivate }) => {
  const theme = useTheme();

  const handleSearchClick = useCallback(() => {
    onSearchActivate?.(true);
  }, [onSearchActivate]);

  return (
    <Tooltip
      title="Search buckets"
      placement="top"
    >
      <IconButton
        onClick={handleSearchClick}
        variant="elitea"
        color="secondary"
        data-testid="artifacts-search-buckets-button"
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
          fill={theme.palette.icon.secondary}
        />
      </IconButton>
    </Tooltip>
  );
};

export default BucketSearch;
