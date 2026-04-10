import { useCallback } from 'react';

import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ToolkitViewOptions } from '@/common/constants';
import { SPACING } from '@/common/designTokens';

export const FormViewToggle = ({ view = ToolkitViewOptions.Form, onChangeView, containerSX, disabled }) => {
  const onChange = useCallback(
    (_, newValue) => {
      if (newValue !== null && newValue !== view) {
        onChangeView(newValue);
      }
    },
    [onChangeView, view],
  );

  return (
    <ToggleButtonGroup
      size="small"
      value={view}
      onChange={onChange}
      exclusive={true}
      disabled={disabled}
      aria-label="Toolkit View Toggler"
      sx={{ ml: 0, ...containerSX }}
    >
      <Tooltip
        key={ToolkitViewOptions.Form}
        title="Form view"
        placement="top"
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex' }}
        >
          <ToggleButton
            variant="elitea"
            value={ToolkitViewOptions.Form}
            sx={{
              padding: `${SPACING.SM} ${SPACING.SM}`,
              borderRadius: '8px 0 0 8px',
              textTransform: 'none',
            }}
          >
            Form
          </ToggleButton>
        </Box>
      </Tooltip>
      <Tooltip
        key={ToolkitViewOptions.Json}
        title="Raw Json view"
        placement="top"
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex' }}
        >
          <ToggleButton
            variant="elitea"
            value={ToolkitViewOptions.Json}
            sx={{
              padding: `${SPACING.SM} ${SPACING.SM}`,
              borderRadius: '0 8px 8px 0',
              textTransform: 'none',
            }}
          >
            Raw Json
          </ToggleButton>
        </Box>
      </Tooltip>
    </ToggleButtonGroup>
  );
};
