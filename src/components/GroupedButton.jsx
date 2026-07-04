import { Button } from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';

import { typographyVariants } from '@/MainTheme';
import { PIPELINE_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

const StyledButton = styled(Button)(({ theme }) => ({
  ...typographyVariants.labelSmall,
  textWrap: 'nowrap',
  textTransform: 'none',
  display: 'flex',
  padding: '0.375rem 1rem',
  alignItems: 'center',
  gap: '0.5rem',
  borderRadius: '0.5rem',
  background: theme.palette.background.tabButton.default,
  color: theme.palette.text.primary,
  '&.Mui-selected': {
    color: theme.palette.text.secondary,
    '&.Mui-disabled': {
      color: theme.palette.text.primary,
    },
    '&:not(:hover)': {
      background: theme.palette.background.tabButton.active,
    },
  },
  border: 'none',
  borderRight: '0px !important',
}));

const GroupedButton = ({ value, onChange, buttonItems, readOnly, disabled, sx }) => {
  const theme = useTheme();
  return (
    <ButtonGroup
      disableElevation
      variant="contained"
      aria-label="chat action buttons"
      disabled={disabled}
      sx={sx}
      data-tour={PIPELINE_TOUR_TARGET_IDS.yamlEditor}
    >
      {buttonItems.map((item, index) => (
        <StyledButton
          key={index}
          sx={{
            '&:hover': {
              backgroundColor: theme.palette.background.button.default,
              color: theme.palette.text.secondary,
            },
          }}
          disableRipple
          disabled={readOnly || item.disabled}
          onClick={onChange}
          value={item.value}
          data-testid={item.testid || `pipeline-${item.value}-view`}
          className={`MuiToggleButtonGroup-grouped ${value === item.value ? ' Mui-selected' : ''}`}
        >
          {item.label}
        </StyledButton>
      ))}
    </ButtonGroup>
  );
};

export default GroupedButton;
