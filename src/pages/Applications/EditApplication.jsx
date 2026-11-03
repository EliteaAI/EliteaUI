import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Form, Formik } from 'formik';
import { useParams, useSearchParams } from 'react-router-dom';

import { ApplicationTabBar } from '@/[fsd]/entities/application-tab-bar/ui';
import { useIsVersionNotFound } from '@/[fsd]/entities/version/lib/hooks';
import { InstructionsInputRefProvider } from '@/[fsd]/shared/lib/context';
import { useToast, useViewMode } from '@/[fsd]/shared/lib/hooks';
import { BreadcrumbsOrTitle } from '@/[fsd]/shared/ui';
import { AgentEditTab } from '@/[fsd]/widgets/agent-editor';
import { ApplicationControls } from '@/[fsd]/widgets/application-controls';
import { useEntityTestPanel } from '@/[fsd]/widgets/entity-test-panel';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { buildErrorMessage, isNotFoundError } from '@/common/utils';
import StyledTabs from '@/components/StyledTabs';
import useCorrectUserNameInUrl from '@/hooks/application/useCorrectUserNameInUrl';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import Page404 from '@/pages/Page404.jsx';

import getValidateSchema from './Components/Applications/ApplicationCreationValidateSchema';
import useApplicationInitialValues from './useApplicationInitialValues';

const EditApplication = memo(() => {
  const viewMode = useViewMode();
  const { checkPermission } = useCheckPermission();
  const fileReaderEnhancerRef = useRef();

  const { toastError } = useToast();
  const { initialValues, isFetching, isError, error, applicationId } = useApplicationInitialValues();
  const { version } = useParams();
  const [searchParams] = useSearchParams();
  const isFromCreation = searchParams.get('isFromCreation') === 'true';
  const [dirty, setDirty] = useState(false);
  const [unsavedLLMSettings, setUnsavedLLMSettings] = useState();
  // Kept above the loading state, so a refetch of the agent doesn't close the Test panel
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);
  const { isOpen: isTestPanelOpen, open: openTestPanel, close: closeTestPanel } = useEntityTestPanel();

  const handleCloseTestPanel = useCallback(() => {
    setIsFullScreenChat(false);
    closeTestPanel();
  }, [closeTestPanel]);

  // Reset per-session LLM override when navigating to a different version,
  // so a model change on one version cannot bleed into execution of another (#6676).
  useEffect(() => {
    setUnsavedLLMSettings(undefined);
  }, [version]);

  const styles = useMemo(() => editApplicationStyles(), []);

  const handleDiscard = useCallback(() => {
    fileReaderEnhancerRef.current?.restoreValue(initialValues?.version_details?.instructions || '');
    setUnsavedLLMSettings(undefined);
  }, [initialValues?.version_details?.instructions]);

  const handleSuccess = useCallback(() => {
    setDirty(false);
  }, []);

  const blockOptions = useMemo(
    () => ({
      blockCondition:
        viewMode === ViewMode.Owner && dirty && checkPermission(PERMISSIONS.applications.update),
    }),
    [dirty, viewMode, checkPermission],
  );

  const { setBlockNav } = useNavBlocker(blockOptions);

  const isVersionNotFound = useIsVersionNotFound({
    version,
    isFetching,
    isError,
    versions: initialValues?.versions,
    skip: isFromCreation,
  });

  const shouldShowNotFoundPage = (isError && isNotFoundError(error)) || isVersionNotFound;

  useCorrectUserNameInUrl(initialValues?.name);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const tabs = useMemo(
    () => [
      {
        tabBarItems: !isFetching ? (
          <ApplicationTabBar
            onSuccess={handleSuccess}
            onDiscard={handleDiscard}
          />
        ) : null,
        rightToolbar: isFetching ? null : (
          <ApplicationControls
            setBlockNav={setBlockNav}
            onSuccess={handleSuccess}
          />
        ),
        content: (
          <AgentEditTab
            isFetching={isFetching}
            isError={isError}
            applicationId={applicationId}
            setDirty={setDirty}
            unsavedLLMSettings={unsavedLLMSettings}
            setUnsavedLLMSettings={setUnsavedLLMSettings}
            isTestPanelOpen={isTestPanelOpen}
            onOpenTestPanel={openTestPanel}
            onCloseTestPanel={handleCloseTestPanel}
            isFullScreen={isFullScreenChat}
            setIsFullScreen={setIsFullScreenChat}
          />
        ),
      },
    ],
    [
      isFetching,
      isError,
      applicationId,
      unsavedLLMSettings,
      isTestPanelOpen,
      openTestPanel,
      handleCloseTestPanel,
      isFullScreenChat,
      handleSuccess,
      handleDiscard,
      setBlockNav,
    ],
  );

  if (shouldShowNotFoundPage) {
    return <Page404 />;
  }

  return (
    <InstructionsInputRefProvider inputRef={fileReaderEnhancerRef}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={getValidateSchema}
        onSubmit={() => {}}
      >
        <Form style={styles.form}>
          <StyledTabs
            fullWidth
            panelStyle={styles.tabPanel}
            containerStyle={styles.tabContainer}
            leftTabbarSectionSX={styles.leftTabbarSection}
            tabs={tabs}
            leftPart={<BreadcrumbsOrTitle title={initialValues?.name || 'Edit Agent'} />}
          />
        </Form>
      </Formik>
    </InstructionsInputRefProvider>
  );
});

EditApplication.displayName = 'EditApplication';

export default EditApplication;

/** @type {MuiSx} */
const editApplicationStyles = () => ({
  form: {
    height: '100%',
  },
  tabPanel: {
    padding: '0rem !important',
  },
  tabContainer: {
    '& .MuiTabs-indicator': {
      display: 'none !important',
    },
    '& .MuiTab-root': {
      minWidth: 0,
      maxWidth: '18rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiTab-textColorPrimary': ({ palette }) => ({
      color: palette.text.secondary,
    }),
    '& .Mui-selected': ({ palette }) => ({
      color: `${palette.text.secondary} !important`,
    }),
  },
  leftTabbarSection: {
    maxWidth: '50%',
    width: 'fit-content',
  },
});
