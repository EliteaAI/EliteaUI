import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

export default function Toggle({ value, onChange, id, name, sx = {}, options, disabled }) {
  return (
    <ToggleButtonGroup
      size="small"
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      exclusive={true}
      aria-label="secret view toggler"
      sx={{ ml: 1, ...sx }}
    >
      <ToggleButton
        variant="elitea"
        value={options[0].value}
        key={options[0].value}
        disabled={options[0].disabled}
        sx={{ borderRadius: '8px 0 0 8px' }}
        disableRipple
      >
        <Typography variant={'labelSmall'}>{options[0].label}</Typography>
      </ToggleButton>
      {options.slice(1, -1).map(option => (
        <ToggleButton
          variant="elitea"
          value={option.value}
          key={option.value}
          disabled={option.disabled}
          sx={{ borderRadius: '8px 0 0 8px' }}
          disableRipple
        >
          <Typography variant={'labelSmall'}>{option.label}</Typography>
        </ToggleButton>
      ))}
      <ToggleButton
        variant="elitea"
        value={options[options.length - 1].value}
        key={options[options.length - 1].value}
        disabled={options[options.length - 1].disabled}
        sx={{ borderRadius: '0 8px 8px 0' }}
        disableRipple
      >
        <Typography variant={'labelSmall'}>{options[options.length - 1].label}</Typography>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
