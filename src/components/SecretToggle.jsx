import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { SPACING } from '@/common/designTokens';

export default function SecretToggle({ showPlainText, onChange, id, name, sx = {} }) {
  return (
    <ToggleButtonGroup
      size="small"
      id={id}
      name={name}
      value={showPlainText}
      onChange={onChange}
      exclusive={true}
      aria-label="secret view toggler"
      sx={{ ml: 1, ...sx }}
    >
      <ToggleButton
        value={false}
        variant="alita"
        key={'false'}
        sx={{ padding: `${SPACING.SM} ${SPACING.SM}`, borderRadius: '8px 0 0 8px' }}
        disableRipple
      >
        <Typography variant={'labelSmall'}>Secret</Typography>
      </ToggleButton>
      <ToggleButton
        value={true}
        key={'true'}
        variant="alita"
        sx={{ padding: `${SPACING.SM} ${SPACING.SM}`, borderRadius: '0 8px 8px 0' }}
        disableRipple
      >
        <Typography variant={'labelSmall'}>Plain</Typography>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
