import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Split from 'react-split';

import { Box, CircularProgress, useTheme } from '@mui/material';

import { DrawerPage, DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { SettingsPreview, TokensSection } from '@/[fsd]/features/settings/ui/personal-tokes';
import { useListModelsQuery } from '@/api/configurations';
import { PUBLIC_PROJECT_ID, VITE_SERVER_URL, ViewMode } from '@/common/constants';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const PersonalTokens = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { routeStack = [] } = useMemo(() => locationState || { routeStack: [] }, [locationState]);
  const selectedProjectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const { isSmallWindow } = useIsSmallWindow();
  const { toastError } = useToast();
  const [search, setSearch] = useState('');
  const {
    data: modelsData = { items: [], total: 0 },
    isError,
    isFetching,
    isSuccess,
  } = useListModelsQuery(
    { projectId: selectedProjectId, include_shared: true },
    { skip: !selectedProjectId || selectedProjectId == PUBLIC_PROJECT_ID },
  );
  const configurations = useMemo(() => modelsData?.items || [], [modelsData?.items]);

  const [model, setModel] = useState({
    configuration_uid: '',
    model_name: '',
    configuration_name: '',
  });
  const [showSettingsPreview, setShowSettingsPreview] = useState(false);
  const [selectedTokenForPreview, setSelectedTokenForPreview] = useState(null);
  const styles = tokensSettingsStyles(showSettingsPreview, isSmallWindow);

  useEffect(() => {
    if (isSuccess && !configurations.length) {
      setModel({
        configuration_uid: '',
        model_name: '',
        configuration_name: '',
      });
    }
  }, [isSuccess, configurations?.length]);

  // Set default model when configurations are loaded
  useEffect(() => {
    if (isSuccess && configurations?.length > 0) {
      let defaultModel = null;

      // First, try to find a model marked as default for the current project
      const projectDefaultModel = configurations.find(
        m => m.default === true && m.project_id === selectedProjectId,
      );

      if (projectDefaultModel) {
        defaultModel = {
          configuration_uid: projectDefaultModel.id,
          model_name: projectDefaultModel.name,
          configuration_name: `Project ${projectDefaultModel.project_id || 'Default'}`,
        };
      } else {
        // Fallback: find any default model or first model for the current project
        const projectModel =
          configurations.find(m => m.project_id === selectedProjectId) ||
          configurations.find(m => m.default === true) ||
          configurations[0];

        defaultModel = {
          configuration_uid: projectModel.id,
          model_name: projectModel.name,
          configuration_name: `Project ${projectModel.project_id || 'Default'}`,
        };
      }

      if (defaultModel) {
        setModel(defaultModel);
      }
    }
  }, [isSuccess, configurations, selectedProjectId]);

  useEffect(() => {
    if (isError) {
      toastError('Failed to load models, Please try refreshing the page');
    }
  }, [isError, toastError]);

  // Canvas-like state management for Split layout
  const [sizes, setSizes] = useState([100, 0]);

  const onAddPersonalToken = useCallback(() => {
    const newRouteStack = [...routeStack];
    if (newRouteStack.length) {
      newRouteStack[newRouteStack.length - 1].pagePath = `${RouteDefinitions.Settings}/tokens`;
    }
    newRouteStack.push({
      breadCrumb: 'New personal token',
      viewMode: ViewMode.Owner,
      pagePath: RouteDefinitions.CreatePersonalToken,
    });
    navigate(
      {
        pathname: RouteDefinitions.CreatePersonalToken,
      },
      {
        replace: false,
        state: {
          routeStack: newRouteStack,
        },
      },
    );
  }, [navigate, routeStack]);

  const onPreviewSettings = useCallback(
    token => {
      setSelectedTokenForPreview(token);
      const newSizes = isSmallWindow ? [35, 65] : [60, 40];
      setSizes(newSizes);
      setShowSettingsPreview(true);
    },
    [isSmallWindow],
  );

  const onCloseSettingsPreview = useCallback(() => {
    setSizes([100, 0]);
    setTimeout(() => {
      setShowSettingsPreview(false);
      setSelectedTokenForPreview(null);
    }, 50);
  }, []);

  const onDragEnd = useCallback(newSizes => {
    setSizes(newSizes);
    if (newSizes[1] <= 28) {
      setTimeout(() => {
        setShowSettingsPreview(false);
        setSelectedTokenForPreview(null);
        setSizes([100, 0]);
      }, 50);
    }
  }, []);

  useEffect(() => {
    if (showSettingsPreview && sizes[1] === 0) {
      const timer = setTimeout(() => {
        if (isSmallWindow) {
          setSizes([35, 65]);
        } else {
          setSizes([40, 60]);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showSettingsPreview, sizes, isSmallWindow]);

  const gutterStyle = useCallback(
    () => ({
      cursor: showSettingsPreview ? (isSmallWindow ? 'row-resize' : 'col-resize') : 'not-allowed',
      pointerEvents: showSettingsPreview ? 'auto' : 'none',
      width: showSettingsPreview ? (isSmallWindow ? '100%' : '0.625rem') : '0',
      height: showSettingsPreview ? (isSmallWindow ? '0.625rem' : '100%') : '0',
      backgroundColor: showSettingsPreview ? theme.palette.background.tabPanel : 'transparent',
      border: showSettingsPreview ? `0.0625rem solid ${theme.palette.border.lines}` : 'none',
      ...(showSettingsPreview && {
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
        },
      }),
    }),
    [showSettingsPreview, isSmallWindow, theme],
  );

  const onIdeSettingsDownload = useCallback(
    (token, ide) => {
      const serverUrl = user.api_url || VITE_SERVER_URL?.replace('/api/v2', '') || window.location.origin;
      const settings =
        ide.toLowerCase() === 'vscode'
          ? JSON.stringify(
              {
                'eliteacode.providerServerURL': serverUrl,
                'eliteacode.LLMServerUrl': serverUrl,
                'eliteacode.modelName': model.model_name,
                'eliteacode.LLMModelName': model.model_name,
                'eliteacode.authToken': token,
                'eliteacode.LLMAuthToken': token,
                'eliteacode.projectId': selectedProjectId,
                'eliteacode.integrationUid': model.configuration_uid,
                'eliteacode.defaultViewMode': 'split',
                'eliteacode.verifySsl': false,
                'eliteacode.displayType': 'split',
                'eliteacode.debug': false,
              },
              null,
              2,
            )
          : `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="EliteASettings">
    <option name="displayType" value="SPLIT" />
    <option name="integrationName" value="${model.configuration_name}" /> 
    <option name="integrationUid" value="${model.configuration_uid}" />
    <option name="llmCustomModelEnabled" value="true" /> 
    <option name="llmCustomModelName" value="${model.model_name}" />
    <option name="llmServerUrl" value="${serverUrl}" />
    <option name="projectId" value="${selectedProjectId}" />
    <option name="provider" value="ELITEA_EYE" />
  </component>
</project>
`;
      const element = document.createElement('a');
      const file = new Blob([settings], {
        type: ide.toLowerCase() === 'vscode' ? 'application/json' : 'application/xml',
      });
      element.href = URL.createObjectURL(file);
      element.download = ide.toLowerCase() === 'vscode' ? 'settings.json' : 'elitea.xml';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    [model.configuration_name, model.model_name, selectedProjectId, model.configuration_uid, user.api_url],
  );

  const renderTokensContent = useCallback(
    () => (
      <>
        <DrawerPageHeader
          title="Personal Tokens"
          showSearchInput
          showAddButton
          slotProps={{
            searchInput: {
              placeholder: 'Search tokens...',
              search,
              onChangeSearch: setSearch,
            },
            addButton: {
              onAdd: onAddPersonalToken,
              disabled: isFetching || configurations.length === 0,
              tooltip: 'Generate new token',
            },
          }}
        />
        <TokensSection
          showDownload={!!model.configuration_uid && selectedProjectId !== PUBLIC_PROJECT_ID}
          onIdeSettingsDownload={onIdeSettingsDownload}
          onPreviewSettings={onPreviewSettings}
          search={search}
        />
      </>
    ),
    [
      search,
      setSearch,
      onAddPersonalToken,
      isFetching,
      configurations.length,
      model.configuration_uid,
      selectedProjectId,
      onIdeSettingsDownload,
      onPreviewSettings,
    ],
  );

  if (isFetching) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DrawerPage>
      <Box sx={styles.splitContainer}>
        {!showSettingsPreview ? (
          <Box sx={styles.mainTokensContainer}>{renderTokensContent()}</Box>
        ) : (
          <Split
            sizes={sizes}
            minSize={28}
            expandToMin={false}
            gutterSize={showSettingsPreview ? 1 : 0}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            onDragEnd={onDragEnd}
            gutterStyle={gutterStyle}
            direction={isSmallWindow ? 'vertical' : 'horizontal'}
            style={styles.splitStyle}
          >
            <Box sx={styles.tokensSectionInSplit}>{renderTokensContent()}</Box>

            <Box sx={styles.previewWrapper}>
              {showSettingsPreview && selectedTokenForPreview && (
                <SettingsPreview
                  onClose={onCloseSettingsPreview}
                  model={model}
                  token={selectedTokenForPreview.token}
                  projectId={selectedProjectId}
                  tokenName={selectedTokenForPreview.name}
                />
              )}
            </Box>
          </Split>
        )}
      </Box>
    </DrawerPage>
  );
});

/** @type {MuiSx} */
const tokensSettingsStyles = (showSettingsPreview, isSmallWindow) => ({
  loadingContainer: ({ palette }) => ({
    height: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background.primary,
  }),
  mainTokensContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100%',
  },
  splitContainer: ({ palette }) => ({
    flex: 1,
    height: '100%',
    display: 'flex',
    position: 'relative',
    overflow: 'scroll',
    boxSizing: 'border-box',
    width: '100%',
    '& .react-split': {
      display: 'flex !important',
    },
    '& .react-split > .pane': {
      transition: showSettingsPreview ? 'none' : 'all 50ms ease-in-out',
    },
    '& .gutter': {
      width: '0.0625rem !important',
      borderLeft: `0.0625rem solid ${palette.border.lines} !important`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '50%',
      backgroundColor: showSettingsPreview ? `${palette.border.lines} !important` : 'transparent',
      border: 'none !important',
      borderRadius: '0.125rem',
      transition: 'all 0.2s ease-in-out',
      '&:hover': showSettingsPreview
        ? {
            backgroundColor: `${palette.primary.main} !important`,
            opacity: '0.8 !important',
          }
        : {},
      '&.gutter-horizontal': {
        cursor: showSettingsPreview ? 'col-resize' : 'default',
        minWidth: showSettingsPreview ? '0.0625rem' : '0',
        width: showSettingsPreview ? '0.0625rem' : '0',
      },
      '&.gutter-vertical': {
        cursor: showSettingsPreview ? 'row-resize' : 'default',
        minHeight: showSettingsPreview ? '0.0625rem' : '0',
        height: showSettingsPreview ? '0.0625rem' : '0',
      },
    },
  }),
  tokensSectionWrapper: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  splitStyle: {
    display: 'flex',
    flex: 1,
    height: isSmallWindow ? 'max-content' : '100%',
    minHeight: isSmallWindow ? 'max-content' : '100%',
    flexDirection: isSmallWindow ? 'column' : 'row',
    maxWidth: '100%',
    gap: isSmallWindow ? '0.75rem' : undefined,
  },
  tokensSectionInSplit: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '100%',
    width: !showSettingsPreview ? '100% !important' : undefined,
    overflowY: 'auto',
  },
  previewWrapper: {
    display: !showSettingsPreview ? 'none' : 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    overflow: 'hidden',
    width: '100%',
    minWidth: isSmallWindow ? '100%' : '15rem',
    boxSizing: 'border-box',
  },
});

PersonalTokens.displayName = 'PersonalTokens';

export default PersonalTokens;
