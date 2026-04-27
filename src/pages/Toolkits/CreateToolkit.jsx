import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Form, Formik } from 'formik';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Box, Grid } from '@mui/material';

import { NAV_BAR_HEIGHT_IN_PX } from '@/common/constants';
import StyledTabs from '@/components/StyledTabs';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';
import { StyledGridContainer } from '@/pages/Common/Components';
import CreateToolkitToolTabBar from '@/pages/Toolkits/CreateToolkitToolTabBar';
import ToolkitForm from '@/pages/Toolkits/ToolkitForm.jsx';
import ToolkitTypeSelector from '@/pages/Toolkits/ToolkitTypeSelector';
import { formatTitleFromSnakeCase } from '@/utils/stringUtils';
import { interpolateUrl } from '@/utils/urlInterpolation';

export const CreateToolkit = memo(props => {
  const { isMCP, isApplication } = props;

  const { toolkitType, mcpType, appType } = useParams();
  const toolType = isMCP ? mcpType : isApplication ? appType : toolkitType;

  const [editToolDetail, setEditToolDetail] = useState(null);
  const [formikInitialValues, setFormikInitialValues] = useState({
    type: toolType || '',
  });
  const [isToolDirty, setIsToolDirty] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const mode = useSelector(state => state.settings.mode);
  const currentProjectId = useSelectedProjectId();
  const iframeRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [showIframeFallback, setShowIframeFallback] = useState(false);
  const { toastInfo } = useToast();

  const styles = createToolkitStyles();

  const onChangeToolDetail = useCallback((...args) => {
    setIsToolDirty(!!args[0]);
    setEditToolDetail(args[0]);
    //@todo: clear url might be here
  }, []);

  const toolSchema = useMemo(() => {
    return editToolDetail?.schema;
  }, [editToolDetail?.schema]);

  const hasConfigurationGroup = useMemo(() => {
    return !!toolSchema?.metadata?.configuration_group?.name;
  }, [toolSchema]);

  const hasConfigurationProperties = useMemo(() => {
    const properties = toolSchema?.properties || {};

    return Object.keys(properties).some(key => properties[key]?.configuration === true);
  }, [toolSchema]);

  const hasCredentialsProperties = useMemo(() => {
    return hasConfigurationGroup || hasConfigurationProperties;
  }, [hasConfigurationGroup, hasConfigurationProperties]);

  // Check if selected toolkit type has a custom create_url
  const createUrl = useMemo(() => {
    return toolSchema?.metadata?.interface?.create_url;
  }, [toolSchema?.metadata?.interface?.create_url]);

  // Interpolate the create URL with current context
  const interpolatedCreateUrl = useMemo(() => {
    if (!createUrl) return null;
    return interpolateUrl(createUrl, {
      projectId: currentProjectId,
      toolkitId: null, // No toolkit ID yet during creation
      theme: mode,
    });
  }, [createUrl, currentProjectId, mode]);

  // Reload iframe when theme changes
  useEffect(() => {
    if (interpolatedCreateUrl && !showIframeFallback) {
      setIframeKey(prev => prev + 1);
    }
  }, [mode, interpolatedCreateUrl, showIframeFallback]);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    toastInfo('Custom UI unavailable, showing standard interface');
    setShowIframeFallback(true);
  }, [toastInfo]);

  const isNoTypeSelected = useMemo(() => {
    if (isMCP) return !mcpType;
    if (isApplication) return !appType;
    return !toolkitType;
  }, [isMCP, mcpType, isApplication, appType, toolkitType]);

  useEffect(() => {
    if (isNoTypeSelected) {
      setEditToolDetail(null);
      setShowValidation(false);
    }
  }, [setEditToolDetail, isNoTypeSelected]);

  const tabLabel = useMemo(() => {
    const typeLabel = toolSchema?.metadata?.label
      ? `${toolSchema.metadata.label} `
      : toolSchema?.title
        ? `${toolSchema.title} `
        : toolType
          ? `${formatTitleFromSnakeCase(toolType)} `
          : '';

    if (isApplication) {
      return `New ${typeLabel}Application`;
    }
    return `New ${typeLabel}${!isMCP ? 'Toolkit' : 'MCP'}`;
  }, [toolSchema, toolType, isMCP, isApplication]);

  return (
    <Formik
      enableReinitialize
      initialValues={formikInitialValues}
    >
      <StyledTabs
        fullWidth
        panelStyle={!editToolDetail ? styles.emptyPanelStyle : undefined}
        tabSX={styles.tabSX}
        forceShowLabel
        tabs={[
          {
            label: tabLabel,
            tabBarItems: editToolDetail ? (
              <CreateToolkitToolTabBar
                onClearEditTool={() => {
                  setEditToolDetail(null);
                }}
                hasNotSavedCredentials={false}
                isCredentialsSelected={false}
                hasCredentialsProperties={hasCredentialsProperties}
                isMCP={isMCP}
                setShowValidation={setShowValidation}
              />
            ) : null,
            rightToolbar: <div />,
            content: (
              <Form style={styles.formContainer}>
                <StyledGridContainer
                  columnSpacing="2rem"
                  container
                  sx={styles.gridContainer}
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={styles.gridItem}
                  >
                    {editToolDetail ? (
                      // Show iframe if create_url is present and not in fallback mode
                      interpolatedCreateUrl && !showIframeFallback ? (
                        <Box
                          sx={{
                            width: '100%',
                            height: `calc(100vh - ${NAV_BAR_HEIGHT_IN_PX})`,
                            overflow: 'hidden',
                          }}
                        >
                          <iframe
                            key={iframeKey}
                            ref={iframeRef}
                            src={interpolatedCreateUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title={`Create ${toolSchema?.metadata?.label || 'Application'}`}
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-storage-access-by-user-activation"
                            onError={handleIframeError}
                          />
                        </Box>
                      ) : (
                        // Standard toolkit form
                        <ToolkitForm
                          editToolDetail={editToolDetail}
                          hasNotSavedCredentials={false}
                          onChangeToolDetail={onChangeToolDetail}
                          isToolDirty={isToolDirty}
                          showOnlyRequiredFields={false}
                          hideConfigurationNameInput={true}
                          configurationViewOptions={CONFIGURATION_VIEW_OPTIONS.CredentialsSelect}
                          sx={styles.toolkitForm}
                          isMCP={isMCP}
                          validationTrigger={showValidation}
                        />
                      )
                    ) : (
                      <Box sx={styles.selectorContainer}>
                        <ToolkitTypeSelector
                          onSelectTool={setEditToolDetail}
                          setFormikInitialValues={setFormikInitialValues}
                          isMCP={isMCP}
                          isApplication={isApplication}
                        />
                      </Box>
                    )}
                  </Grid>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
});

CreateToolkit.displayName = 'CreateToolkit';

/** @type {MuiSx} */
const createToolkitStyles = () => ({
  emptyPanelStyle: {
    padding: '0 0 !important',
  },
  formContainer: {
    height: '100%',
  },
  gridContainer: {
    padding: 0,
  },
  tabSX: {
    paddingX: '1.125rem 1.5rem',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    '& .MuiBox-root': {
      flex: 'none',
    },
    '& .MuiBox-root:last-child': {
      marginLeft: 'auto',
    },
    '& button.Mui-selected': ({ palette }) => ({
      color: palette.text.secondary,
      padding: 0,
      cursor: 'default',
    }),
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  },
  gridItem: ({ breakpoints }) => ({
    [breakpoints.up('lg')]: {
      overflowY: 'scroll',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      height: '100%',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    },
    [breakpoints.down('lg')]: {
      marginBottom: '1.5rem',
    },
  }),
  toolkitForm: {
    paddingBottom: '1.5rem',
    paddingTop: '1.5rem',
  },
  selectorContainer: {
    height: '100%',
  },
});
