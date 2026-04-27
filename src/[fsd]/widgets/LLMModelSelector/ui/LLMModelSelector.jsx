import { memo, useCallback, useRef, useState } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  ListItemIcon,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import ShareIcon from '@/assets/share-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import SettingIcon from '@/components/Icons/SettingIcon';

import { LLMSettingsDialog } from './LLMSettingsDialog';

/**
 * Reusable LLM Model Selector component with model dropdown and optional settings button
 * Used across different parts of the application like ChatBox, TestSettings, etc.
 */
const LLMModelSelector = memo(props => {
  const {
    selectedModel,
    onSelectModel,
    models = [],
    disabled = false,
    onClickSettings,
    llmSettings = {},
    onSetLLMSettings,
    showWebhookSecret = false,
    showStepsLimit = false,
    showSettingsEntry = true,
    modelTooltip = 'Select LLM Model',
    settingsTooltip = 'Model Settings',
  } = props;

  const theme = useTheme();
  const styles = llmModelSelectorStyles();

  const anchorRef = useRef(null);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  const handleMenuItemClick = (event, index) => {
    onSelectModel(models[index]);
    handleClose();
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleModelMenuClick = () => {
    setAnchorEl(anchorRef.current);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = useCallback(() => {
    if (onClickSettings) {
      // Use external settings handler if provided
      onClickSettings();
    } else if (onSetLLMSettings) {
      // Use internal modal dialog
      setShowLLMSettings(true);
    }
  }, [onClickSettings, onSetLLMSettings]);

  const handleApplySettings = useCallback(
    newSettings => {
      if (onSetLLMSettings) {
        onSetLLMSettings(newSettings);
      }
      setShowLLMSettings(false);
    },
    [onSetLLMSettings],
  );

  const handleCancelSettings = useCallback(() => {
    setShowLLMSettings(false);
  }, []);

  return (
    <>
      {/*<pre>{JSON.stringify(models, null, 2)}</pre>*/}
      <ButtonGroup
        variant="alita"
        disableElevation
        color="secondary"
        disabled={disabled}
        ref={anchorRef}
        aria-label="Model Selector Menu"
        sx={styles.buttonGroup}
      >
        <Tooltip
          placement="top"
          title={modelTooltip}
        >
          <Box
            component="span"
            sx={styles.modelButtonWrapper}
          >
            <Button
              variant="alita"
              color="secondary"
              disabled={disabled}
              onClick={handleModelMenuClick}
              sx={styles.modelButton}
            >
              {!!selectedModel && (
                <Box
                  component="span"
                  sx={styles.iconWrapper}
                >
                  {selectedModel?.shared ? (
                    <ShareIcon
                      fontSize="inherit"
                      sx={styles.icon}
                    />
                  ) : (
                    <BriefcaseIcon
                      fontSize="inherit"
                      sx={styles.icon}
                    />
                  )}
                </Box>
              )}
              <Box
                component="span"
                sx={styles.modelNameWrapper}
              >
                <Typography
                  variant="inherit"
                  textOverflow="ellipsis"
                  noWrap
                  overflow="hidden"
                >
                  {selectedModel?.display_name || selectedModel?.name || 'None'}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Tooltip>
        {showSettingsEntry && (
          <>
            <Divider orientation="vertical" />
            <Tooltip
              placement="top"
              title={settingsTooltip}
            >
              <Box component="span">
                <Button
                  size="small"
                  aria-expanded={open ? 'true' : undefined}
                  aria-label="model settings menu"
                  aria-haspopup="menu"
                  onClick={handleSettingsClick}
                  variant="alita"
                  color="secondary"
                  disabled={!onSetLLMSettings}
                >
                  <SettingIcon
                    sx={styles.settingIcon}
                    fill={!onSetLLMSettings || disabled ? theme.palette.icon.fill.disabled : undefined}
                  />
                </Button>
              </Box>
            </Tooltip>
          </>
        )}
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        slotProps={{
          list: {
            'aria-labelledby': 'model-selector-button',
          },
          paper: {
            sx: styles.menuPaper,
          },
        }}
      >
        {models.map((item, index) => (
          <MenuItem
            key={index}
            selected={item.id === selectedModel?.id}
            onClick={event => handleMenuItemClick(event, index)}
          >
            <ListItemIcon>
              {item.shared ? <ShareIcon fontSize="inherit" /> : <BriefcaseIcon fontSize="inherit" />}
            </ListItemIcon>
            {item.display_name || item.name}
          </MenuItem>
        ))}
      </Menu>

      {onSetLLMSettings && (
        <LLMSettingsDialog
          open={showLLMSettings}
          onApply={handleApplySettings}
          onCancel={handleCancelSettings}
          selectedModel={selectedModel}
          llmSettings={llmSettings}
          showWebhookSecret={showWebhookSecret}
          showStepsLimit={showStepsLimit}
        />
      )}
    </>
  );
});

LLMModelSelector.displayName = 'LLMModelSelector';

/** @type {MuiSx} */
const llmModelSelectorStyles = () => ({
  buttonGroup: {
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
  },
  modelButtonWrapper: {
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    display: 'inline-block',
  },
  modelButton: {
    minWidth: 0,
    maxWidth: '100%',
  },
  modelNameWrapper: {
    minWidth: 0,
    overflow: 'hidden',
    display: 'block',
  },
  iconWrapper: {
    width: '1rem',
    height: '1rem',
    minWidth: '1rem',
    minHeight: '1rem',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
  settingIcon: {
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
  },
  menuPaper: {
    marginTop: '-0.25rem',
  },
});

export default LLMModelSelector;
