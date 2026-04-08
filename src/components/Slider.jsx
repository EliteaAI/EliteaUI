import * as React from 'react';
import { useEffect } from 'react';

import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import MuiInput from '@mui/material/Input';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import Tooltip from '@/ComponentsLib/Tooltip';
import InfoIcon from '@/components/Icons/InfoIcon';

const Input = styled(MuiInput)(
  ({ theme }) => `
  ::before {
    border-bottom: 1px solid ${theme.palette.border.lines} !important
  }
  & input[type=number] {
    MozAppearance: textfield;
  }
  & input[type=number]::-webkit-outer-spin-button {
    WebkitAppearance: none;
    display: none;
    margin: 0;
  }
  & input[type=number]::-webkit-inner-spin-button {
    WebkitAppearance: none;
    display: none;
    margin: 0;
  }
`,
);

const StyledGrid = styled(Grid)`
  padding-left: 0rem;
`;

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiSlider-rail,.MuiSlider-track': {
    height: '4px',
  },
  '& .MuiSlider-thumb': {
    width: '20px',
    height: '20px',
  },
}));

const StyledBox = styled(Box)`
  flex: 1;
`;

export default function InputSlider({
  label,
  value,
  range = [0, 1],
  step = 0.1,
  onChange,
  labelHint = null,
  isRequired = false,
}) {
  const [inputValue, setInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const precision = React.useMemo(() => String(step - Math.floor(step)).split('.')[1]?.length || 0, [step]);

  // Sync input value with prop value when not focused
  useEffect(() => {
    if (!isFocused) setInputValue(typeof value === 'number' ? String(value) : '');
  }, [value, isFocused]);

  const handleSliderChange = React.useCallback(
    (event, newValue) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  const handleInputChange = React.useCallback(
    event => {
      const rawValue = event.target.value;

      setInputValue(rawValue);

      if (!onChange) return;

      if (rawValue === '') return onChange('');

      const numValue = Number(rawValue);

      if (!isNaN(numValue)) onChange(numValue);
    },
    [onChange],
  );

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);

    if (!onChange) return;

    if (value === '' || value == null || isNaN(value)) return onChange(range[0]);
    if (value < range[0]) return onChange(range[0]);
    if (value > range[1]) return onChange(range[1]);

    const newValue = Number(Number(value).toFixed(precision));

    onChange(newValue);
  };

  return (
    <StyledBox>
      {labelHint ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
          <Typography
            id={'input-slider' + label}
            gutterBottom
          >
            <Typography variant="bodyMedium">{`${label}${isRequired ? ' *' : ''}`}</Typography>
          </Typography>

          <Tooltip
            title={labelHint}
            placement="top"
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                width: '16px',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <InfoIcon
                width={16}
                height={16}
              />
            </Box>
          </Tooltip>
        </Box>
      ) : (
        <Typography
          id={'input-slider' + label}
          gutterBottom
        >
          <Typography variant="bodySmall">{label}</Typography>
        </Typography>
      )}

      <Grid
        container
        spacing={2}
        alignItems="center"
      >
        <Grid size={{ xs: 10 }}>
          <StyledSlider
            size="small"
            step={step}
            min={range[0]}
            max={range[1]}
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
          />
        </Grid>
        <StyledGrid size={{ xs: 2 }}>
          <Input
            id={label + new Date().getTime()}
            value={isFocused ? inputValue : typeof value === 'number' ? String(value) : ''}
            size="small"
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            inputProps={{
              step,
              min: range[0],
              max: range[1],
              style: { textAlign: 'center' },
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
            fullWidth
          />
        </StyledGrid>
      </Grid>
    </StyledBox>
  );
}
