import { memo, useCallback } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import applicationsDarkImage from '@/assets/images/Applications_Dark_1.png';
import applicationsLightImage from '@/assets/images/Applications_Light_1.png';
import PlusIcon from '@/assets/plus-icon.svg?react';

const EmptyStatePage = memo(props => {
  const {
    title,
    description,
    icon: Icon = null,
    imageDark = applicationsDarkImage,
    imageLight = applicationsLightImage,
    onCreateClick,
    onGuidedTourClick = null,
  } = props;

  const theme = useTheme();
  const styles = emptyStateStyles();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleCreateClick = useCallback(() => {
    onCreateClick();
  }, [onCreateClick]);

  const handleGuidedTourClick = useCallback(() => {
    // TODO: Implement guided tour logic
  }, []);

  return (
    <Box sx={styles.container}>
      {Icon ? (
        <Box component={Icon} />
      ) : (
        <Box
          component="img"
          src={isDarkMode ? imageDark : imageLight}
          alt="No image of tool"
          sx={styles.image}
        />
      )}

      <Typography
        variant="headingSmall"
        sx={styles.title}
      >
        {title}
      </Typography>

      <Typography sx={styles.description}>{description}</Typography>

      <Box sx={styles.actions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.special}
          onClick={handleCreateClick}
        >
          <PlusIcon /> Create
        </BaseBtn>
        {onGuidedTourClick && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onGuidedTourClick || handleGuidedTourClick}
          >
            Start Guided Tour
          </BaseBtn>
        )}
      </Box>
    </Box>
  );
});

EmptyStatePage.displayName = 'EmptyStatePage';

/** @type {MuiSx} */
const emptyStateStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    py: '3rem',
    px: '1.5rem',
    textAlign: 'center',
  },
  image: {
    width: '15rem',
    height: 'auto',
    mb: '1rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '1.125rem',
    fontWeight: 600,
  }),
  description: ({ palette }) => ({
    color: palette.background.tooltip.default,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    maxWidth: '24rem',
  }),
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    mt: '0.5rem',
  },
});

export default EmptyStatePage;
