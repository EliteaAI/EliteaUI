import { forwardRef, memo, useCallback } from 'react';

import PropTypes from 'prop-types';

import { Box, FormControlLabel, Switch as MuiSwitch, Tooltip, Typography } from '@mui/material';

import InfoIcon from '@/components/Icons/InfoIcon';

export const SWITCH_VARIANTS = {
  elitea: 'elitea',
};

const BaseSwitch = memo(
  forwardRef((props, ref) => {
    const {
      label,
      infoTooltip,
      width,
      slotProps,
      checked: checkedProp,
      value: valueProp,
      onChange: onChangeProp,
      size,
      variant = 'elitea',
      disabled,
      ...restProps
    } = props;

    const styles = genStyles({ width });

    const checked = checkedProp !== undefined ? checkedProp : !!valueProp;

    const handleChange = useCallback(
      (event, checkedValue) => {
        if (onChangeProp) {
          const isValueProp = valueProp !== undefined;
          onChangeProp(isValueProp ? checkedValue : event, checkedValue);
        }
      },
      [onChangeProp, valueProp],
    );

    const switchComponent = (
      <MuiSwitch
        ref={ref}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        size={size}
        variant={variant}
        {...slotProps?.switch}
        {...restProps}
      />
    );

    if (label) {
      return (
        <Box sx={[styles.container, slotProps?.container?.sx]}>
          <FormControlLabel
            control={switchComponent}
            label={
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                component="div"
                sx={styles.label}
              >
                {label}
                {infoTooltip && (
                  <Tooltip
                    title={infoTooltip}
                    placement="top"
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: slotProps?.tooltip?.zIndex || 9999,
                        },
                      },
                    }}
                  >
                    <Box sx={styles.iconContainer}>
                      <InfoIcon
                        width={16}
                        height={16}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Typography>
            }
            disabled={disabled}
            labelPlacement={slotProps?.formControlLabel?.labelPlacement || 'end'}
            sx={slotProps?.formControlLabel?.sx}
          />
        </Box>
      );
    }

    return switchComponent;
  }),
);

BaseSwitch.displayName = 'BaseSwitch';

BaseSwitch.propTypes = {
  // Standard MUI Switch props
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  variant: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  value: PropTypes.bool,
  infoTooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  slotProps: PropTypes.shape({
    container: PropTypes.object,
    formControlLabel: PropTypes.object,
    switch: PropTypes.object,
    tooltip: PropTypes.object,
  }),
};

const genStyles = ({ width }) => ({
  container: {
    height: '2.75rem',
    width: width || '100%',
    padding: '0',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  iconContainer: { display: 'flex', alignItems: 'center', gap: '0.25rem', height: '100%' },
});

export default BaseSwitch;

export const eliteaSwitchColors = theme => ({
  [SWITCH_VARIANTS.elitea]: {
    default: {
      on: {
        thumb: theme.palette.background.switch.default.on.thumb,
        track: theme.palette.background.switch.default.on.track,
      },
      off: {
        thumb: theme.palette.background.switch.default.off.thumb,
        track: theme.palette.background.switch.default.off.track,
      },
    },
    disabled: {
      on: {
        thumb: theme.palette.background.switch.disabled.on.thumb,
        track: theme.palette.background.switch.disabled.on.track,
      },
      off: {
        thumb: theme.palette.background.switch.disabled.off.thumb,
        track: theme.palette.background.switch.disabled.off.track,
      },
    },
  },
});

export const eliteaSwitchVariants = [
  {
    props: { variant: SWITCH_VARIANTS.elitea },
    style: ({ theme }) => {
      const colors = eliteaSwitchColors(theme)[SWITCH_VARIANTS.elitea];
      return {
        '& .MuiSwitch-switchBase': {
          color: colors.default.off.thumb,
          '&.Mui-checked': {
            color: colors.default.on.thumb,
            '& + .MuiSwitch-track': {
              backgroundColor: colors.default.on.track,
              opacity: 1,
            },
          },
        },
        '& .MuiSwitch-track': {
          backgroundColor: colors.default.off.track,
          opacity: 1,
        },
        '& .MuiSwitch-switchBase.Mui-disabled': {
          color: colors.disabled.off.thumb,
          '&.Mui-checked': {
            color: colors.disabled.on.thumb,
          },
        },
        '& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track': {
          backgroundColor: colors.default.off.track,
          opacity: '1 ',
        },
        '& .MuiSwitch-switchBase.Mui-disabled.Mui-checked + .MuiSwitch-track': {
          backgroundColor: colors.default.on.track,
          opacity: '1 ',
        },
      };
    },
  },
];
