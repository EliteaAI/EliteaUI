import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

import { InstructionsInputRefProvider } from '@/[fsd]/app/providers';
import { ApplicationControls, ApplicationTabBar } from '@/[fsd]/entities/application-tab-bar/ui';
import { useIsVersionNotFound } from '@/[fsd]/entities/version/lib/hooks';
import { ViewMode } from '@/common/constants';
import { buildErrorMessage, isNotFoundError } from '@/common/utils';
import StyledTabs from '@/components/StyledTabs';
import useCorrectUserNameInUrl from '@/hooks/application/useCorrectUserNameInUrl';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';
import useViewMode from '@/hooks/useViewMode';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import useApplicationInitialValues from '@/pages/Applications/useApplicationInitialValues';
import Page404 from '@/pages/Page404.jsx';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

import ConfigurationTab from './Components/ConfigurationTab';

const EditPipeline = memo(() => {
  const viewMode = useViewMode();
  const fileReaderEnhancerRef = useRef();
  const dispatch = useDispatch();

  const { toastError } = useToast();
  const { initialValues, isFetching, isError, error, applicationId } = useApplicationInitialValues(true);
  const { version } = useParams();
  const [searchParams] = useSearchParams();
  const isFromCreation = searchParams.get('isFromCreation') === 'true';

  const [dirty, setDirty] = useState(false);
  const [isYamlDirty, setIsYamlDirty] = useState(false);
  const [unsavedLLMSettings, setUnsavedLLMSettings] = useState();

  const styles = useMemo(() => editPipelineStyles(), []);

  const handleDiscard = useCallback(() => {
    setDirty(false);
    dispatch(actions.resetPipeline());
    dispatch(editorActions.resetPipelineEditor());
    setUnsavedLLMSettings(undefined);
  }, [dispatch]);

  const handleSuccess = useCallback(() => {
    setDirty(false);
    setIsYamlDirty(false);
  }, []);

  const blockOptions = useMemo(
    () => ({
      blockCondition: viewMode === ViewMode.Owner && (dirty || isYamlDirty),
    }),
    [dirty, isYamlDirty, viewMode],
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
        label: initialValues?.name || 'Pipeline',
        tabBarItems: !isFetching ? (
          <ApplicationTabBar
            onSuccess={handleSuccess}
            onDiscard={handleDiscard}
          />
        ) : null,
        rightToolbar: isFetching ? null : <ApplicationControls setBlockNav={setBlockNav} />,
        content: (
          <ConfigurationTab
            totalToolCount={initialValues?.version_details?.tools?.length || 0}
            isFetching={isFetching}
            isError={isError}
            applicationId={applicationId}
            setDirty={setDirty}
            setYamlDirty={setIsYamlDirty}
            unsavedLLMSettings={unsavedLLMSettings}
            setUnsavedLLMSettings={setUnsavedLLMSettings}
          />
        ),
      },
    ],
    [
      initialValues?.name,
      initialValues?.version_details?.tools?.length,
      isFetching,
      isError,
      applicationId,
      unsavedLLMSettings,
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
            forceShowLabel
            panelStyle={styles.tabPanel}
            containerStyle={styles.tabContainer}
            leftTabbarSectionSX={styles.leftTabbarSection}
            tabs={tabs}
          />
        </Form>
      </Formik>
    </InstructionsInputRefProvider>
  );
});

EditPipeline.displayName = 'EditPipeline';

export default EditPipeline;

/** @type {MuiSx} */
const editPipelineStyles = () => ({
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
      width: 'calc(100% - 2.215rem)',
      minWidth: 0,
    },
    '& .MuiTab-textColorPrimary': ({ palette }) => ({
      color: palette.text.secondary,
    }),
    '& .Mui-selected': ({ palette }) => ({
      pointerEvents: 'none',
      color: `${palette.text.secondary} !important`,
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      justifyContent: 'flex-start !important',
      paddingLeft: '0rem !important',
      paddingRight: '0rem !important',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'block',
    }),
  },
  leftTabbarSection: {
    maxWidth: '33%',
    width: 'fit-content',
  },
});
