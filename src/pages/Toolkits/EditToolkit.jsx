import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Form, Formik } from 'formik';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { getIntegrationOptions } from '@/DEPRECATED.js';
import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { IndexesContainer } from '@/[fsd]/features/toolkits/indexes/ui';
// TODO: DELETE after migration period (Q1 2026) - Legacy OpenAPI toolkit migration
import { LegacyOpenApiMigration } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitsControls, ToolkitsTabBar } from '@/[fsd]/features/toolkits/ui';
import { useListModelsQuery } from '@/api/configurations.js';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { CapabilityTypes, SearchParams } from '@/common/constants.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import BackButton from '@/components/BackButton';
import ConfirmRedirectModal from '@/components/ConfirmRedirectModal';
import GearIcon from '@/components/Icons/GearIcon.jsx';
import IndexingIcon from '@/components/Icons/IndexingIcon.jsx';
import StyledTabs from '@/components/StyledTabs.jsx';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import Page404 from '@/pages/Page404.jsx';
import ConfigurationTab from '@/pages/Toolkits/ConfigurationTab.jsx';
import { interpolateUrl } from '@/utils/urlInterpolation';

const applicationCapabilities = [CapabilityTypes.chat_completion.value];
const emptyToolDetail = {};

export const EditToolkit = memo(props => {
  const { isMCP } = props;

  // const fileReaderEnhancerRef = useRef();
  const { toastError, toastInfo } = useToast();
  const { toolkitId, mcpId, appId, tab } = useParams();
  const realId = useMemo(() => (isMCP ? mcpId : appId || toolkitId), [isMCP, mcpId, appId, toolkitId]);
  const currentProjectId = useSelectedProjectId();
  const [editToolDetail, setEditToolDetail] = useState(null);
  const [isToolDirty, setIsToolDirty] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [updateConfigKey, setUpdateConfigKey] = useState(1);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const mode = useSelector(state => state.settings.mode);
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [showIframeFallback, setShowIframeFallback] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const {
    data: publicToolkitData = emptyToolDetail,
    isFetching: isFetchingPublic,
    isError: isPublicError,
    error: publicError,
  } = useToolkitsDetailsQuery(
    { projectId: currentProjectId, toolkitId: realId },
    { skip: !currentProjectId || !realId },
  );

  const handleClearEditTool = useCallback(() => {
    setIsToolDirty(false);
  }, []);

  const handleDiscard = useCallback(() => {
    // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
    setEditToolDetail(LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(publicToolkitData));
    setIsToolDirty(false);
    setUpdateConfigKey(prev => prev + 1);
    setDirty(false);
    setHasValidationErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicToolkitData?.id]);

  const handleValidationStateChange = useCallback(({ hasErrors }) => {
    setHasValidationErrors(hasErrors);
  }, []);

  // RTK Query automatically refetches when realId changes, no manual refetch needed

  useEffect(() => {
    if (!isFetchingPublic && publicToolkitData?.id) {
      // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
      setEditToolDetail(LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(publicToolkitData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchingPublic, publicToolkitData?.id]);

  const shouldShowNotFoundPage = isPublicError && isNotFoundError(publicError);

  useEffect(() => {
    if (isPublicError && !shouldShowNotFoundPage) {
      toastError(buildErrorMessage(publicError));
    }
  }, [publicError, isPublicError, shouldShowNotFoundPage, toastError]);

  // Check if this is an application-type toolkit with custom interface
  const isApplicationToolkit = useMemo(() => {
    return publicToolkitData?.meta?.application === true;
  }, [publicToolkitData?.meta?.application]);

  const interfaceType = useMemo(() => {
    return publicToolkitData?.meta?.interface?.type || 'default';
  }, [publicToolkitData?.meta?.interface?.type]);

  const appUrl = useMemo(() => {
    return publicToolkitData?.meta?.interface?.app_url;
  }, [publicToolkitData?.meta?.interface?.app_url]);

  // Interpolate the app URL with current context
  const interpolatedAppUrl = useMemo(() => {
    if (!appUrl) return null;
    return interpolateUrl(appUrl, {
      projectId: currentProjectId,
      toolkitId: realId,
      theme: mode,
    });
  }, [appUrl, currentProjectId, mode, realId]);

  // Reload iframe when theme changes
  useEffect(() => {
    if (interfaceType === 'iframe' && interpolatedAppUrl && !showIframeFallback) {
      setIframeKey(prev => prev + 1);
    }
  }, [interfaceType, interpolatedAppUrl, showIframeFallback]);

  // Show redirect modal immediately for redirect-type applications
  useEffect(() => {
    if (isApplicationToolkit && interfaceType === 'redirect' && interpolatedAppUrl) {
      setShowRedirectModal(true);
    }
  }, [isApplicationToolkit, interfaceType, interpolatedAppUrl]);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    toastInfo('Custom UI unavailable, showing standard interface');
    setShowIframeFallback(true);
  }, [toastInfo]);

  const handleRedirectModalClose = useCallback(() => {
    setShowRedirectModal(false);
  }, []);

  const toolType = useMemo(() => {
    return editToolDetail?.type || '';
  }, [editToolDetail?.type]);

  const { toolkitSchemas, isFetching } = useGetCurrentToolkitSchemas({ isMCP: isMCP && toolType !== 'mcp' });

  const toolSchema = useMemo(() => {
    return toolkitSchemas?.[toolType];
  }, [toolkitSchemas, toolType]);

  const blockOptions = useMemo(() => {
    return {
      // blockCondition: viewMode === ViewMode.Owner && !!dirty,
      blockCondition: !!dirty,
    };
  }, [dirty]);

  const { setBlockNav } = useNavBlocker(blockOptions);

  const selectedProjectId = useSelectedProjectId();
  const { data: modelsData = [] } = useListModelsQuery(
    { projectId: selectedProjectId, include_shared: true },
    { skip: !selectedProjectId },
  );
  const modelOptions = useMemo(
    () => getIntegrationOptions(modelsData?.items || [], applicationCapabilities),
    [modelsData],
  );

  const disableIndexingReason = useMemo(() => {
    const needToSelectIndexData = !editToolDetail?.settings?.selected_tools?.includes(
      IndexesToolsEnum.indexData,
    );
    const loading =
      !publicToolkitData?.settings?.pgvector_configuration ||
      !publicToolkitData?.settings?.embedding_model ||
      isFetching ||
      editToolDetail?.isLoadingConfigurations;

    return needToSelectIndexData || loading ? { loading, needToSelectIndexData } : null;
  }, [
    publicToolkitData,
    isFetching,
    editToolDetail?.isLoadingConfigurations,
    editToolDetail?.settings?.selected_tools,
  ]);

  const selectedIndexTools = useMemo(
    () =>
      editToolDetail?.settings?.selected_tools?.filter(st => Object.values(IndexesToolsEnum).includes(st)) ??
      [],
    [editToolDetail?.settings?.selected_tools],
  );

  const shouldHideIndexesTab = useMemo(() => {
    try {
      if (mcpId) return true;

      const schemaTools = toolSchema?.properties?.selected_tools?.items?.enum;
      if (!Array.isArray(schemaTools) || schemaTools.length === 0) return true;

      return !schemaTools.some(st => Object.values(IndexesToolsEnum).includes(st));
    } catch {
      return false;
    }
  }, [mcpId, toolSchema]);

  useGetIndexesListQuery(
    {
      toolkitId: realId,
      projectId: currentProjectId,
    },
    { skip: !!disableIndexingReason || shouldHideIndexesTab || !realId || !currentProjectId },
  );

  const tabs = useMemo(
    () => [
      {
        label: 'Configuration',
        icon: <GearIcon />,
        tabBarItems: !isFetchingPublic && (
          <ToolkitsTabBar
            showPlaceholder={!editToolDetail}
            onDiscard={handleDiscard}
            onClearEditTool={handleClearEditTool}
            hasNotSavedCredentials={false}
            toolSchema={toolSchema}
            hasValidationErrors={hasValidationErrors}
          />
        ),
        rightToolbar: isFetchingPublic ? null : (
          <ToolkitsControls
            setBlockNav={setBlockNav}
            publicToolkitData={publicToolkitData}
            isMCP={isMCP}
          />
        ),
        content: (
          <ConfigurationTab
            updateKey={updateConfigKey}
            isFetching={isFetchingPublic}
            modelOptions={modelOptions}
            setDirty={setDirty}
            editToolDetail={editToolDetail}
            setEditToolDetail={setEditToolDetail}
            isToolDirty={isToolDirty}
            setIsToolDirty={setIsToolDirty}
            editFieldRootPath={'settings'}
            hasNotSavedCredentials={false}
            isMCP={isMCP}
            toolkitId={realId}
            onValidationStateChange={handleValidationStateChange}
          />
        ),
      },
      {
        label: 'Indexes',
        icon: <IndexingIcon />,
        content: (
          <IndexesContainer
            toolkitId={realId}
            selectedIndexTools={selectedIndexTools}
            editToolDetail={editToolDetail}
          />
        ),
        ...(disableIndexingReason && {
          disabled: disableIndexingReason.loading
            ? 'Configure PgVector and Embedding model to enable Indexes options'
            : '"Index data" tool is not selected',
        }),
        ...(shouldHideIndexesTab && { display: 'none' }),
      },
      {
        label: 'Test',
        tabBarItems: null,
        content: <></>,
        display: 'none',
      },
    ],
    [
      isFetchingPublic,
      editToolDetail,
      handleDiscard,
      isToolDirty,
      handleClearEditTool,
      toolSchema,
      setBlockNav,
      publicToolkitData,
      isMCP,
      updateConfigKey,
      modelOptions,
      realId,
      selectedIndexTools,
      disableIndexingReason,
      shouldHideIndexesTab,
      hasValidationErrors,
      handleValidationStateChange,
    ],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const destTab = useMemo(() => searchParams.get(SearchParams.DestTab), [searchParams]);

  // Update URL with toolkit name when it loads
  useEffect(() => {
    if (publicToolkitData?.name && searchParams.get(SearchParams.Name) !== publicToolkitData.name) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(SearchParams.Name, publicToolkitData.name);
      setSearchParams(newSearchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicToolkitData?.name]);

  const defaultTab = useMemo(() => {
    // First, check the :tab parameter from the route path
    if (tab) {
      const tabIndex = tabs.findIndex(item => item.label.toLocaleLowerCase() === tab.toLocaleLowerCase());
      if (tabIndex !== -1) return tabIndex;
    }

    // Fallback to destTab search parameter
    if (destTab && destTab !== 'History') {
      return tabs.findIndex(item => item.label.toLocaleLowerCase() === destTab.toLocaleLowerCase());
    }

    return 0;
  }, [tabs, tab, destTab]);

  // Normalize initial values to prevent dirty state on initialization
  const normalizedInitialValues = useMemo(() => {
    if (!publicToolkitData) {
      return {};
    }

    // TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
    const normalized = LegacyOpenApiMigration.normalizeLegacyOpenApiToolkit(publicToolkitData);

    return {
      ...normalized,
      // Ensure settings object exists to prevent setFieldValue from making form dirty
      settings: normalized.settings || {},
      // Ensure type is set to prevent setFieldValue from making form dirty
      type: normalized.type || '',
    };
  }, [publicToolkitData]);

  const styles = useMemo(() => editToolkitStyles(isMCP), [isMCP]);

  if (shouldShowNotFoundPage) {
    return <Page404 />;
  }

  // Render redirect modal for redirect-type applications
  if (isApplicationToolkit && interfaceType === 'redirect' && interpolatedAppUrl) {
    return (
      <ConfirmRedirectModal
        open={showRedirectModal}
        toolkitName={publicToolkitData?.name}
        toolkitDescription={publicToolkitData?.description}
        redirectUrl={interpolatedAppUrl}
        onClose={handleRedirectModalClose}
      />
    );
  }

  // Render full-screen iframe for iframe-type applications (drawer only, no header)
  if (isApplicationToolkit && interfaceType === 'iframe' && interpolatedAppUrl && !showIframeFallback) {
    return (
      <Box sx={styles.iframeContainer}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={interpolatedAppUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={`${publicToolkitData?.name || 'Application'} Custom UI`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-storage-access-by-user-activation"
          onError={handleIframeError}
        />
      </Box>
    );
  }

  // Standard toolkit view (default or fallback)
  return (
    // <FileReaderEnhancerRefContext.Provider value={fileReaderEnhancerRef}>
    <Formik
      enableReinitialize
      initialValues={normalizedInitialValues}
      validationSchema={getValidateSchema}
    >
      <Form style={styles.formContainer}>
        <StyledTabs
          fullWidth
          leftTabbarSectionSX={styles.leftTabbarSection}
          rightTabbarSectionSX={styles.rightTabbarSection}
          panelStyle={styles.panelStyle}
          containerStyle={styles.containerStyle}
          leftPart={
            <Box sx={styles.leftPart}>
              <BackButton />
              <Typography
                variant="headingSmall"
                color="text.secondary"
              >
                {publicToolkitData?.name || 'Edit Toolkit'}
              </Typography>
            </Box>
          }
          tabsSX={styles.tabsSX}
          tabs={tabs}
          defaultTab={defaultTab}
        />
      </Form>
    </Formik>
    // </FileReaderEnhancerRefContext.Provider>
  );
});

EditToolkit.displayName = 'EditToolkit';

/** @type {MuiSx} */
const editToolkitStyles = isMCP => ({
  formContainer: {
    height: '100%',
  },
  iframeContainer: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
  leftTabbarSection: {
    flex: 1,
  },
  rightTabbarSection: {
    flex: '0 0 auto !important',
  },
  panelStyle: {
    paddingLeft: '0rem !important',
    paddingRight: '0rem !important',
  },
  containerStyle: {
    '& .MuiTab-root.Mui-selected': {
      display: isMCP ? 'none' : undefined,
    },
  },
  leftPart: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  tabsSX: {
    flex: 1,
    '& .MuiTabs-scroller': {
      justifyContent: 'center',
      '& .MuiTabs-list': {
        justifyContent: 'center',
      },
    },
  },
});
