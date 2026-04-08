import { useCallback, useEffect, useState } from 'react';

import { Typography } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/system';

import CloseIcon from '@/components/Icons/CloseIcon.jsx';

const LoadingIndicatorLayer = styled('div')(({ theme }) => ({
  display: 'flex',
  position: 'fixed',
  width: '100%',
  height: '100%',
  top: '0',
  left: '0',
  '&::after': {
    content: '""',
    display: 'block',
    position: 'relative',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: `${theme.palette.background.eliteaDefault}`,
    opacity: '0.8',
  },
}));

const LoadingIndicatorContainer = styled('div')(({ theme }) => ({
  width: '31.25rem',
  height: '5.75rem',
  padding: '0',
  background: `${theme.palette.background.secondary}`,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '0.5rem',
  zIndex: 999,
  border: `1px solid ${theme.palette.border.lines}`,
}));

const LoadingIndicatorHeader = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
}));

const LoadingIndicatorTitle = styled('div')(() => ({}));

const Indicator = styled('div')(() => ({
  padding: '0.5rem 1.5rem 1.5rem 1.5rem',
}));

const LoadingIndicator = ({ open, title }) => {
  const [openToast, setOpenToast] = useState(open);

  const handleClose = useCallback(() => {
    setOpenToast(false);
  }, []);

  useEffect(() => {
    setOpenToast(open);
  }, [open]);

  return (
    <LoadingIndicatorLayer style={{ display: openToast ? 'block' : 'none' }}>
      <LoadingIndicatorContainer>
        <LoadingIndicatorHeader>
          <LoadingIndicatorTitle>
            <Typography variant={'headingSmall'}>{title}</Typography>
          </LoadingIndicatorTitle>
          <CloseIcon
            style={{ cursor: 'pointer' }}
            onClick={handleClose}
          />
        </LoadingIndicatorHeader>
        <Indicator>
          <LinearProgress />
        </Indicator>
      </LoadingIndicatorContainer>
    </LoadingIndicatorLayer>
  );
};

export default LoadingIndicator;
