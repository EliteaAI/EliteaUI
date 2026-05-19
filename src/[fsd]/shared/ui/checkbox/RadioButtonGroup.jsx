import { memo, useCallback } from 'react';

import { Box, FormControlLabel, RadioGroup, Typography, useTheme } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

import BaseCheckbox from './BaseCheckbox';

const RadioButtonGroup = memo(props => {
  const { value, defaultValue, onChange, items, wrapRow = false, columnGap, disabled } = props;
  const theme = useTheme();
  const styles = radioButtonGroupStyles(theme, wrapRow, columnGap);

  const onChangeHandler = useCallback(
    event => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <RadioGroup
      aria-labelledby="radio-buttons-group-label"
      defaultValue={defaultValue}
      name="radio-buttons-group"
      value={value}
      onChange={onChangeHandler}
    >
      <Box sx={styles.container}>
        {items.map(item => (
          <Box
            key={item.value}
            sx={styles.itemContainer}
          >
            <FormControlLabel
              sx={styles.formControlLabel}
              value={item.value}
              control={
                <BaseCheckbox
                  mode="radio"
                  disabled={item.disabled || disabled}
                />
              }
              label={
                <Box sx={styles.labelContainer}>
                  <Typography
                    component="div"
                    variant="bodyMedium"
                    sx={styles.typographyLabel}
                  >
                    {item.label}
                  </Typography>
                  {item.description && (
                    <Typography
                      component="div"
                      variant="bodySmall"
                    >
                      {item.description}
                    </Typography>
                  )}
                  {item.info && (
                    <InfoTooltip
                      infoTooltip={{
                        title: item.info,
                        icon: styles.infoIcon,
                      }}
                    />
                  )}
                </Box>
              }
            />
          </Box>
        ))}
      </Box>
    </RadioGroup>
  );
});

/** @type {MuiSx} */
const radioButtonGroupStyles = (theme, wrapRow, columnGap) => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    rowGap: 0,
    columnGap: columnGap || '1.5rem',
    flexWrap: wrapRow ? 'wrap' : 'nowrap',
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  formControlLabel: {
    alignItems: 'flex-start',
    mb: '0.5rem',
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.625rem',
  },
  typographyLabel: ({ palette }) => ({
    color: palette.text.secondary,
    mt: '0.4375rem',
  }),
  infoIcon: {
    fill: theme.palette.icon.main,
  },
});

RadioButtonGroup.displayName = 'RadioButtonGroup';

export default RadioButtonGroup;
