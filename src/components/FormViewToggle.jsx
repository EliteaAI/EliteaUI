import { useCallback } from 'react';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

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
        title="Form view"
        placement="top"
      >
        <ToggleButton
          variant="alita"
          value={ToolkitViewOptions.Form}
          key={ToolkitViewOptions.Form}
          sx={{ padding: `${SPACING.SM} ${SPACING.SM}`, borderRadius: '8px 0 0 8px', textTransform: 'none' }}
        >
          Form
        </ToggleButton>
      </Tooltip>
      <Tooltip
        title="Raw Json view"
        placement="top"
      >
        <ToggleButton
          variant="alita"
          value={ToolkitViewOptions.Json}
          key={ToolkitViewOptions.Json}
          sx={{ padding: `${SPACING.SM} ${SPACING.SM}`, borderRadius: '0 8px 8px 0', textTransform: 'none' }}
        >
          Raw Json
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};
