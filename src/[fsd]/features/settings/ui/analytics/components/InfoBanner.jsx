import { memo } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Typography } from '@mui/material';

const InfoBanner = memo(props => {
  const { children } = props;

  return (
    <Box sx={styles.infoBanner}>
      <Box sx={styles.infoBannerTitle}>
        <InfoOutlinedIcon sx={styles.infoBannerIcon} />
        <Typography
          variant="labelMedium"
          sx={styles.infoBannerTitleText}
        >
          Note
        </Typography>
      </Box>
      {children}
    </Box>
  );
});

InfoBanner.displayName = 'InfoBanner';

/** @type {MuiSx} */
const styles = {
  infoBanner: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '0.75rem 1rem',
    background: palette.background.indexResult.info,
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.indexResult.info}`,
  }),
  infoBannerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  infoBannerIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.indexResult.info,
  }),
  infoBannerTitleText: ({ palette }) => ({
    color: palette.text.indexResult.info,
  }),
};

export const infoBannerTextSx = ({ palette }) => ({
  color: palette.text.indexResult.info,
});

export default InfoBanner;
