import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, ButtonGroup, Divider, Tooltip, Typography, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import ShareIcon from '@/assets/share-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import SettingIcon from '@/components/Icons/SettingIcon';

import { normalizeLlmSettings } from '../lib/helpers';
import LLMModelsMenu from './LLMModelsMenu';
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
    onResetToDefaults,
    dataTourTargetId,
    variant = 'default',
  } = props;

  const theme = useTheme();
  const styles = llmModelSelectorStyles();

  const anchorRef = useRef(null);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const normalizedLlmSettings = useMemo(
    () => normalizeLlmSettings(llmSettings, selectedModel, { showStepsLimit }),
    [llmSettings, selectedModel, showStepsLimit],
  );

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

  if (variant === 'field') {
    return (
      <>
        <Box
          ref={anchorRef}
          sx={styles.fieldRoot}
        >
          <Box
            sx={styles.fieldSelector}
            onClick={disabled ? undefined : handleModelMenuClick}
          >
            <Typography
              variant="labelSmall"
              color="text.primary"
              sx={styles.fieldLabel}
            >
              Model
            </Typography>
            <Box sx={styles.fieldValueRow}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
                noWrap
                sx={styles.fieldValue}
              >
                {selectedModel?.display_name || selectedModel?.name || 'None'}
              </Typography>
              <ArrowDownIcon sx={styles.fieldChevron} />
            </Box>
          </Box>
          {showSettingsEntry && (
            <Tooltip
              placement="top"
              title={settingsTooltip}
            >
              <Button.BaseBtn
                variant={Button.BUTTON_VARIANTS.secondary}
                onClick={handleSettingsClick}
                disabled={!onSetLLMSettings || disabled}
                sx={styles.fieldSettingsBtn}
                startIcon={
                  <SettingIcon
                    sx={styles.settingIcon}
                    fill={!onSetLLMSettings || disabled ? undefined : undefined}
                  />
                }
              />
            </Tooltip>
          )}
        </Box>

        <LLMModelsMenu
          anchorEl={anchorEl}
          onClose={handleClose}
          models={models}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
        />

        {onSetLLMSettings && (
          <LLMSettingsDialog
            open={showLLMSettings}
            onApply={handleApplySettings}
            onCancel={handleCancelSettings}
            selectedModel={selectedModel}
            llmSettings={normalizedLlmSettings}
            showWebhookSecret={showWebhookSecret}
            showStepsLimit={showStepsLimit}
            onResetToDefaults={onResetToDefaults}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/*<pre>{JSON.stringify(models, null, 2)}</pre>*/}
      <ButtonGroup
        variant="elitea"
        disableElevation
        color="secondary"
        disabled={disabled}
        ref={anchorRef}
        aria-label="Model Selector Menu"
        data-testid="model-selector-button"
        sx={styles.buttonGroup}
        data-tour={dataTourTargetId || undefined}
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
              variant="elitea"
              color="secondary"
              disabled={disabled}
              onClick={handleModelMenuClick}
              sx={styles.modelButton}
              data-testid="model-selector-name"
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
                <Button.BaseBtn
                  size="small"
                  aria-expanded={showLLMSettings ? 'true' : undefined}
                  aria-label="model settings menu"
                  aria-haspopup="menu"
                  onClick={handleSettingsClick}
                  variant="elitea"
                  color="secondary"
                  disabled={!onSetLLMSettings}
                >
                  <SettingIcon
                    sx={styles.settingIcon}
                    fill={!onSetLLMSettings || disabled ? theme.palette.icon.fill.disabled : undefined}
                  />
                </Button.BaseBtn>
              </Box>
            </Tooltip>
          </>
        )}
      </ButtonGroup>

      <LLMModelsMenu
        anchorEl={anchorEl}
        onClose={handleClose}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
      />

      {onSetLLMSettings && (
        <LLMSettingsDialog
          open={showLLMSettings}
          onApply={handleApplySettings}
          onCancel={handleCancelSettings}
          selectedModel={selectedModel}
          llmSettings={normalizedLlmSettings}
          showWebhookSecret={showWebhookSecret}
          showStepsLimit={showStepsLimit}
          onResetToDefaults={onResetToDefaults}
        />
      )}
    </>
  );
});

LLMModelSelector.displayName = 'LLMModelSelector';

/** @type {MuiSx} */
const llmModelSelectorStyles = () => ({
  fieldRoot: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '0.5rem',
    padding: '0.5rem 0',
    width: '100%',
    cursor: 'default',
  },
  fieldSelector: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.25rem',
    cursor: 'pointer',
    minWidth: 0,
    borderBottom: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
  },
  fieldLabel: {
    lineHeight: 1,
  },
  fieldValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  fieldValue: {
    flex: 1,
    minWidth: 0,
  },
  fieldChevron: {
    fontSize: '1rem',
    flexShrink: 0,
    color: 'text.secondary',
  },
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
});

export default LLMModelSelector;
