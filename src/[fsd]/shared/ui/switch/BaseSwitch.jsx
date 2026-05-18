import React, { forwardRef, memo, useCallback } from 'react';

import { Box, FormControlLabel, Switch as MuiSwitch, Typography } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

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
      size = 'small',
      variant = 'elitea',
      disabled,
      ...restProps
    } = props;

    const styles = genStyles({ width });

    const isBooleanMode = valueProp !== undefined;
    const checked = checkedProp ?? !!valueProp;

    const handleChange = useCallback(
      (event, checkedValue) => {
        onChangeProp?.(isBooleanMode ? checkedValue : event, checkedValue);
      },
      [onChangeProp, isBooleanMode],
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

    const tooltipIcon = infoTooltip ? (
      <InfoTooltip infoTooltip={infoTooltip} slotProps={slotProps} />
    ) : null;

    if (label) {
      return (
        <Box sx={[styles.container, slotProps?.container?.sx]}>
          <FormControlLabel
            control={switchComponent}
            label={
              <Typography
                variant={slotProps?.label?.variant || 'bodyMedium'}
                color={slotProps?.label?.color || 'text.secondary'}
                component="div"
                sx={[styles.label, slotProps?.label?.sx]}
              >
                {label}
                {tooltipIcon}
              </Typography>
            }
            disabled={disabled}
            labelPlacement={slotProps?.formControlLabel?.labelPlacement || 'end'}
            sx={[styles.formControlLabel, slotProps?.formControlLabel?.sx ?? {}]}
          />
        </Box>
      );
    }

    if (tooltipIcon) {
      return (
        <Box sx={[styles.standaloneWithTooltip, slotProps?.container?.sx]}>
          {switchComponent}
          {tooltipIcon}
        </Box>
      );
    }

    return switchComponent;
  }),
);

BaseSwitch.displayName = 'BaseSwitch';

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
  standaloneWithTooltip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  label: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  formControlLabel: {
    gap: '0.7rem',
  },
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
