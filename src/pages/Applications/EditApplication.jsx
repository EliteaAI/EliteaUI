import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Form, Formik } from 'formik';

import { ApplicationControls, ApplicationTabBar } from '@/[fsd]/entities/application-tab-bar/ui';
import { ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import StyledTabs from '@/components/StyledTabs';
import useCorrectUserNameInUrl from '@/hooks/application/useCorrectUserNameInUrl';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';
import useViewMode from '@/hooks/useViewMode';
import FileReaderEnhancerRefContext from '@/pages/Common/Components/FileReaderInputRefContext';

import getValidateSchema from './Components/Applications/ApplicationCreationValidateSchema';
import ConfigurationTab from './Components/Applications/ConfigurationTab';
import useApplicationInitialValues from './useApplicationInitialValues';

const EditApplication = memo(() => {
  const viewMode = useViewMode();
  const fileReaderEnhancerRef = useRef();

  const { toastError } = useToast();
  const { initialValues, isFetching, isError, error, applicationId } = useApplicationInitialValues();

  const [dirty, setDirty] = useState(false);
  const [unsavedLLMSettings, setUnsavedLLMSettings] = useState();

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
      blockCondition: viewMode === ViewMode.Owner && dirty,
    }),
    [dirty, viewMode],
  );

  const { setBlockNav } = useNavBlocker(blockOptions);

  useCorrectUserNameInUrl(initialValues?.name);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const tabs = useMemo(
    () => [
      {
        label: initialValues?.name || 'Agent',
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
          <ConfigurationTab
            totalToolCount={initialValues?.version_details?.tools.length || 0}
            isLoading={isFetching}
            isError={isError}
            applicationId={applicationId}
            setDirty={setDirty}
            unsavedLLMSettings={unsavedLLMSettings}
            setUnsavedLLMSettings={setUnsavedLLMSettings}
          />
        ),
      },
    ],
    [
      initialValues?.name,
      initialValues?.version_details?.tools.length,
      isFetching,
      isError,
      applicationId,
      unsavedLLMSettings,
      handleSuccess,
      handleDiscard,
      setBlockNav,
    ],
  );

  return (
    <FileReaderEnhancerRefContext.Provider value={fileReaderEnhancerRef}>
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
    </FileReaderEnhancerRefContext.Provider>
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
