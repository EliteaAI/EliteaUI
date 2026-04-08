import { memo } from 'react';

import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

const StyledExpandMoreIcon = memo(props => {
  const { sx, ...rest } = props;

  const styles = styledExpandMoreIconStyles();

  return (
    <ArrowForwardIosSharpIcon
      sx={[styles.icon, sx]}
      {...rest}
    />
  );
});

StyledExpandMoreIcon.displayName = 'StyledExpandMoreIcon';

/** @type {MuiSx} */
const styledExpandMoreIconStyles = () => ({
  icon: ({ palette }) => ({
    color: palette.icon.fill.default,
  }),
});

export default StyledExpandMoreIcon;
