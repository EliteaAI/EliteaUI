import { Box, Typography } from '@mui/material';

import { RIGHT_PANEL_WIDTH } from '@/common/constants';
import BigRocketIcon from '@/components/Icons/BigRocketIcon';
import styled from '@emotion/styled';

const EmptyListHintBox = styled(Box, {
  shouldForwardProp: prop => prop !== 'headerHeight' && prop !== 'isFullWidth',
})(({ theme, headerHeight, isFullWidth }) => ({
  flexFrow: 1,
  width: isFullWidth ? '100%' : `calc(100% - ${RIGHT_PANEL_WIDTH + 16}px)`,
  height: `calc(100vh - ${headerHeight})`,
  borderRadius: '8px',
  backgroundColor: theme.palette.background.secondary,
}));

export default function EmptyListBox({
  showErrorMessage = false,
  emptyListPlaceHolder,
  rightContent,
  headerHeight = '70px',
  isFullWidth,
  sx = {},
}) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      width="100%"
      component="div"
      sx={sx}
    >
      <EmptyListHintBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        component="div"
        isFullWidth={isFullWidth}
        headerHeight={headerHeight}
      >
        <Box sx={{ textAlign: 'center' }}>
          <BigRocketIcon />
          <Typography
            component="div"
            variant="labelMedium"
            sx={{ mt: 3 }}
          >
            {showErrorMessage ? (
              <div>
                Oops! Something went wrong. <br />
                Please try again later!
              </div>
            ) : (
              emptyListPlaceHolder
            )}
          </Typography>
        </Box>
      </EmptyListHintBox>
      {rightContent && (
        <Box
          component="div"
          sx={{ mt: '-42px', width: '344px' }}
        >
          {rightContent}
        </Box>
      )}
    </Box>
  );
}
