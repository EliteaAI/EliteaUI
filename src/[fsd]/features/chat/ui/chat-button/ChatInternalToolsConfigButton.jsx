import React, { memo, useRef, useState } from 'react';

import { ClickAwayListener, IconButton, Paper, Popper } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useAvailableInternalTools } from '@/[fsd]/shared/lib/hooks';
import { Switch, Text } from '@/[fsd]/shared/ui';
import ValueIcon from '@/assets/value-icon.svg?react';

/**
 * Chat Configuration Button component with popup for internal tools settings
 * Shows a toggle for enabling/disabling internal tools like Pyodide Sandbox.
 * Only shows tools that are available based on toolkit configuration.
 */
const ChatInternalToolsConfigButton = memo(props => {
  const { disabled = false, onInternalToolsConfigChange, internal_tools = [] } = props;

  const buttonRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // Use POC approach: get available tools based on toolkit availability
  const availableTools = useAvailableInternalTools();

  const onClickButton = () => {
    setAnchorEl(buttonRef.current);
    setIsPopupOpen(!isPopupOpen);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setAnchorEl(null);
  };

  const handleToggleChange = (key, event, checkedValue) => {
    onInternalToolsConfigChange?.({ key, value: checkedValue });
  };

  // Don't render button if no tools are available
  if (availableTools.length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip title="Enable internal tools">
        <IconButton
          ref={buttonRef}
          variant="alita"
          color="secondary"
          aria-label="enable internal tools"
          onClick={onClickButton}
          disabled={disabled}
          sx={styles.iconButton}
        >
          <ValueIcon sx={styles.valueIcon} />
        </IconButton>
      </Tooltip>

      <Popper
        open={isPopupOpen}
        anchorEl={anchorEl}
        placement="top-end"
        style={styles.popper}
        modifiers={popperModifiers}
      >
        <ClickAwayListener onClickAway={handleClosePopup}>
          <Paper
            elevation={8}
            sx={styles.paper}
          >
            {availableTools.map(tool => (
              <Switch.BaseSwitch
                key={tool.name}
                label={tool.title}
                checked={internal_tools.includes(tool.name)}
                onChange={(event, checkedValue) => handleToggleChange(tool.name, event, checkedValue)}
                width="100%"
                infoTooltip={<Text.TextWithLink {...tool.infoTooltip} />}
                slotProps={{
                  formControlLabel: {
                    sx: styles.formControlLabel,
                    labelPlacement: 'start',
                  },
                  switch: { size: 'small' },
                }}
              />
            ))}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
});

ChatInternalToolsConfigButton.displayName = 'ChatInternalToolsConfigButton';

/** @type {MuiSx} */
const styles = {
  iconButton: {
    marginLeft: '0rem',
  },
  valueIcon: {
    fontSize: '1rem',
  },
  popper: {
    zIndex: 9998,
  },
  paper: {
    minWidth: 200,
    borderRadius: '.5rem',
    border: ({ palette }) => `.0625rem solid ${palette.border.lines}`,
    boxShadow: ({ palette }) => palette.boxShadow.default,
    backgroundColor: ({ palette }) => palette.background.secondary,
    padding: '.5rem 0',
  },
  formControlLabel: {
    margin: 0,
    width: '15.75rem',
    height: '2.75rem',
    boxSizing: 'border-box',
    display: 'flex',
    padding: '.5rem 1rem',
    gap: '.5rem',
    justifyContent: 'space-between',

    '& .MuiFormControlLabel-label': {
      marginLeft: '.5rem',
    },
  },
};

const popperModifiers = [
  {
    name: 'offset',
    options: {
      offset: [120, 10],
    },
  },
];

export default ChatInternalToolsConfigButton;
