import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, IconButton, Typography } from '@mui/material';

import { TokensConstants } from '@/[fsd]/features/settings/lib/constants';
import { Field } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { VITE_SERVER_URL } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import { getExtensionsByLang } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';

const options = Object.values(TokensConstants.SETTINGS_PREVIEW_TYPES).map(type => ({
  label: TokensConstants.SETTINGS_PREVIEW_LABELS[type],
  value: type,
}));

const SettingsPreview = memo(props => {
  const { onClose, model, token, projectId, tokenName } = props;

  const styles = stylesSettingsPreview();
  const { toastSuccess, toastError } = useToast();
  const user = useSelector(state => state.user);
  const [selectedIDE, setSelectedIDE] = useState(TokensConstants.SETTINGS_PREVIEW_TYPES.VSCODE);

  const handleIDEChange = useCallback(newIDE => {
    setSelectedIDE(newIDE);
  }, []);

  // Generate the server URL - use user's API URL for consistency
  const serverUrl = useMemo(() => {
    return user.api_url || VITE_SERVER_URL?.replace('/api/v2', '') || window.location.origin;
  }, [user.api_url]);

  // Generate VSCode settings
  const getVSCodeSettings = useCallback((apiUrl, modelData, authToken, pId) => {
    return JSON.stringify(
      {
        'eliteacode.providerServerURL': apiUrl,
        'eliteacode.LLMServerUrl': apiUrl,
        'eliteacode.modelName': modelData.model_name || '',
        'eliteacode.LLMModelName': modelData.model_name || '',
        'eliteacode.authToken': authToken || 'Your_Personal_Token',
        'eliteacode.LLMAuthToken': authToken || 'Your_Personal_Token',
        'eliteacode.projectId': pId || '',
        'eliteacode.integrationUid': modelData.integration_uid || '',
        'eliteacode.defaultViewMode': 'split',
        'eliteacode.verifySsl': false,
        'eliteacode.displayType': 'split',
        'eliteacode.debug': false,
      },
      null,
      2,
    );
  }, []);

  // Generate JetBrains settings
  const getJetBrainsSettings = useCallback((apiUrl, modelData, pId) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="EliteASettings">
    <option name="displayType" value="SPLIT" />
    <option name="integrationName" value="${modelData.integration_name || ''}" /> 
    <option name="integrationUid" value="${modelData.integration_uid || ''}" />
    <option name="llmCustomModelEnabled" value="true" /> 
    <option name="llmCustomModelName" value="${modelData.model_name || ''}" />
    <option name="llmServerUrl" value="${apiUrl}" />
    <option name="projectId" value="${pId || ''}" />
    <option name="provider" value="ELITEA_EYE" />
  </component>
</project>`;
  }, []);

  // Generate settings content based on selected IDE
  const settingsContent = useMemo(() => {
    switch (selectedIDE) {
      case TokensConstants.SETTINGS_PREVIEW_TYPES.VSCODE:
        return getVSCodeSettings(serverUrl, model, token, projectId);
      case TokensConstants.SETTINGS_PREVIEW_TYPES.JETBRAINS:
        return getJetBrainsSettings(serverUrl, model, projectId);
      default:
        return `# No settings available for IDE: ${selectedIDE}`;
    }
  }, [selectedIDE, serverUrl, model, token, projectId, getVSCodeSettings, getJetBrainsSettings]);

  // Copy functionality
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(settingsContent);
      toastSuccess('Settings copied to clipboard');
    } catch {
      toastError('Failed to copy settings');
    }
  }, [settingsContent, toastSuccess, toastError]);

  // Download functionality
  const handleDownload = useCallback(() => {
    try {
      const fileName =
        selectedIDE === TokensConstants.SETTINGS_PREVIEW_TYPES.VSCODE ? 'settings.json' : 'elitea.xml';
      const mimeType =
        selectedIDE === TokensConstants.SETTINGS_PREVIEW_TYPES.VSCODE
          ? 'application/json'
          : 'application/xml';

      const element = document.createElement('a');
      const file = new Blob([settingsContent], { type: mimeType });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);

      toastSuccess(`Downloaded ${fileName}`);
    } catch {
      toastError('Failed to download file');
    }
  }, [settingsContent, selectedIDE, toastSuccess, toastError]);

  // Get the correct language for CodeMirror editor
  const editorLanguage = useMemo(() => {
    return selectedIDE === TokensConstants.SETTINGS_PREVIEW_TYPES.VSCODE ? 'json' : 'xml';
  }, [selectedIDE]);

  // Get extensions with fallback
  const extensions = useMemo(() => {
    const langExtensions = getExtensionsByLang(editorLanguage);
    return langExtensions?.extensionWithoutLinter || [];
  }, [editorLanguage]);

  const canvasTitle = useMemo(() => {
    const ideLabel = TokensConstants.SETTINGS_PREVIEW_LABELS[selectedIDE];
    if (tokenName) {
      return `${tokenName} • ${ideLabel} Settings`;
    }
    return `${ideLabel} Settings`;
  }, [selectedIDE, tokenName]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.headerLeft}>
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={onClose}
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            {canvasTitle}
          </Typography>
        </Box>

        <Box sx={styles.headerRight}>
          <Box sx={styles.selectContainer}>
            <SingleSelect
              sx={styles.select}
              label=""
              value={selectedIDE}
              onValueChange={handleIDEChange}
              options={options}
              inputSX={styles.selectInput}
            />
          </Box>
          <IconButton
            variant="elitea"
            color="secondary"
            onClick={handleCopy}
          >
            <CopyIcon sx={styles.icon} />
          </IconButton>

          <IconButton
            variant="elitea"
            color="secondary"
            onClick={handleDownload}
          >
            <DownloadIcon sx={styles.icon} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={styles.content}>
        <Field.CodeMirrorEditor
          key={`settings-preview-${selectedIDE}-${tokenName || 'default'}-${model?.model_name || 'no-model'}-${model?.integration_uid || 'no-uid'}`}
          value={settingsContent}
          language={editorLanguage}
          readOnly
          extensions={extensions}
          autoHeight
          maxHeight="none"
          variant="caption"
        />
      </Box>
    </Box>
  );
});

SettingsPreview.displayName = 'SettingsPreview';

/** @type {MuiSx} */
const stylesSettingsPreview = () => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    minHeight: 0,
    minWidth: '18.75rem',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '3.75rem',
    flexShrink: 0,
  }),
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: ({ palette }) => ({
    fontSize: '0.875rem',
    fill: palette.icon.fill.default,
  }),
  closeIcon: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.fill.default,
  }),
  content: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.background.primary,
    minHeight: 0,
  }),
  selectContainer: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '0.25rem',
  },
  select: {
    margin: '0 !important',
  },
  selectInput: {
    padding: '0.385rem !important',
    '& .MuiInput-input': {
      paddingBottom: '0.1875rem !important',
    },
    '& .MuiSelect-icon': {
      top: 'calc(50% - 0.5625rem) !important',
    },
  },
});

export default SettingsPreview;
