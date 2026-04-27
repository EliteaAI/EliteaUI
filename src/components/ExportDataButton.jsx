import { useCallback, useMemo, useState } from 'react';

import { Button, Menu, MenuItem, Typography } from '@mui/material';

import { StyledCircleProgress } from './Chat/StyledComponents';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 20px 8px 20px',
  '& .MuiTypography-root': {
    color: theme.palette.text.secondary,
  },
}));

const BasicMenuItem = ({ label, onClick }) => {
  return (
    <StyledMenuItem onClick={onClick}>
      <Typography variant="labelMedium">{label}</Typography>
    </StyledMenuItem>
  );
};

export default function ExportDataButton({ style, onExport, isLoading, title = 'Export', options }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const handleClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const menuList = useMemo(() => {
    return options
      .map(item => ({
        label: item.label,
        onClick: () => {
          onExport(item.value);
          handleClose();
        },
      }))
      .map(({ onClick, label, value }, index) => {
        return (
          <BasicMenuItem
            key={index}
            value={value}
            label={label}
            onClick={onClick}
          />
        );
      });
  }, [handleClose, onExport, options]);

  return (
    <div style={style}>
      <Button
        variant="alita"
        color="secondary"
        sx={{ marginLeft: '0px' }}
        id={'export-action'}
        aria-label="export"
        aria-controls={open ? 'action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        disabled={!menuList.length || isLoading}
        onClick={handleClick}
      >
        {title}
        {isLoading && <StyledCircleProgress size={18} />}
      </Button>
      <Menu
        id={'export-dots-menu'}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'action-button',
        }}
        sx={{ marginTop: '4px' }}
        keepMounted
      >
        {menuList}
      </Menu>
    </div>
  );
}
