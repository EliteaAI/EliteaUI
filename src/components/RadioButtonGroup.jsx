import { useCallback } from 'react';

import { Box, FormControlLabel, RadioGroup, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Checkbox } from '@/[fsd]/shared/ui';

import InfoIcon from './Icons/InfoIcon';

export default function RadioButtonGroup({
  value,
  defaultValue,
  onChange,
  items,
  wrapRow = false,
  columnGap,
  disabled,
}) {
  const theme = useTheme();
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          rowGap: '0px',
          columnGap: columnGap || '24px',
          flexWrap: wrapRow ? 'wrap' : 'nowrap',
        }}
      >
        {items.map(item => (
          <Box
            key={item.value}
            display="flex"
            flexDirection="column"
          >
            <FormControlLabel
              sx={{
                alignItems: 'flex-start',
                mb: '8px',
              }}
              value={item.value}
              control={
                <Checkbox.BaseCheckbox
                  mode="radio"
                  disabled={item.disabled || disabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <Typography
                    component="div"
                    variant="bodyMedium"
                    color={theme.palette.text.secondary}
                    sx={{ mt: '7px' }}
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
                    <Tooltip
                      title={item.info}
                      placement="top"
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          height: '100%',
                          width: '12px',
                          pt: '9px',
                        }}
                      >
                        <InfoIcon
                          width={12}
                          height={12}
                          fill={theme.palette.icon.main}
                        />
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              }
            />
          </Box>
        ))}
      </Box>
    </RadioGroup>
  );
}
