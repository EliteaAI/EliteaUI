import { memo } from 'react';

import { Box } from '@mui/material';

import InfoIconSvg from '@/assets/info.svg?react';

const InfoIcon = memo(props => {
  const { fill, sx, ...rest } = props;
  return (
    <Box
      component={InfoIconSvg}
      width="16"
      height="16"
      sx={[
        ({ palette }) => ({
          '& path': {
            fill: `${fill || palette.icon.fill.primary}`,
          },
        }),
        sx,
      ]}
      {...rest}
    />
  );
});
InfoIcon.displayName = 'InfoIcon';

export default InfoIcon;
