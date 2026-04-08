import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';
import { useParams, useSearchParams } from 'react-router-dom';

import { Box, Grid } from '@mui/material';

import { CredentialsTabBar } from '@/[fsd]/features/credentials/ui';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { Tooltip } from '@/[fsd]/shared/ui';
import { convertCredentialConfigSchema } from '@/common/credentialSchemaUtils.js';
import { SPACING } from '@/common/designTokens';
import { getPropValue } from '@/common/getToolInitialValueBySchema.js';
import StyledTabs from '@/components/StyledTabs';
import { useGetMultiSectionConfigurations } from '@/hooks/credentials/useMultiSectionConfigurations.js';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';
import useToolkitConfigurationProperties from '@/hooks/useToolkitConfigurationProperties.js';
import { StyledGridContainer } from '@/pages/Common/Components';
import CredentialForm from '@/pages/Credentials/CredentialForm.jsx';
import CredentialTypeSelector from '@/pages/Credentials/CredentialTypeSelector.jsx';

const CreateCredential = memo(
  ({ title, forceShowTitle, typeSelectorTitle, searchPlaceholder, showCategory }) => {
    const { credentialType } = useParams();
    const [searchParams] = useSearchParams();
    const systemSenderName = useSystemSenderName();
    const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();

    // Check if we're coming from Model Configuration Settings to show filtered credentials
    const isFromModelConfiguration = searchParams.get('from') === 'model-configuration';
    const section = searchParams.get('section');
    const [toolErrors, setToolErrors] = useState({});
    const [showValidation, setShowValidation] = useState(false);
    const [validationErrorMessages, setValidationErrorMessages] = useState({});
    const [apiError, setApiError] = useState('');

    // Define section parameters for different contexts
    const sectionParams = useMemo(() => {
      if (section) {
        return [section];
      } else if (isFromModelConfiguration) {
        // For model credentials, use multiple sections
        return ['llm', 'embedding', 'vectorstorage', 'ai_credentials', 'image_generation'];
      } else {
        // For regular credentials page, use credentials section
        return ['credentials'];
      }
    }, [isFromModelConfiguration, section]);

    // Get filtered configurations based on sections
    const { data: availableConfigurations, isFetching } = useGetMultiSectionConfigurations(
      sectionParams || [],
    );

    const schema = useMemo(
      () => configurationsAsSchema.find(item => item?.type === credentialType),
      [configurationsAsSchema, credentialType],
    );
    const pageTitle = useMemo(
      () => title || `New ${schema?.config_schema?.title || credentialType || ''} credential`,
      [credentialType, schema?.config_schema?.title, title],
    );

    const [editCredentialDetail, setEditCredentialDetail] = useState(null);
    const [isCredentialDirty, setIsCredentialDirty] = useState(false);
    const { toolSchema, sectionProps } = useToolkitConfigurationProperties({ toolType: credentialType });
    const hasErrors = useMemo(() => !!Object.values(toolErrors).some(i => i), [toolErrors]);

    const initialValues = useMemo(() => {
      if (!credentialType || !configurationsAsSchema || !schema) {
        return {};
      }
      const result = {
        type: credentialType,
        schema: convertCredentialConfigSchema(schema?.config_schema, toolSchema, systemSenderName),
        has_test_connection: schema?.has_test_connection || false,
        check_connection_label: schema?.check_connection_label,
        settings: {},
      };

      result.schema?.required?.forEach(async prop => {
        if (!sectionProps.find(sectionProp => sectionProp === prop)) {
          result.settings[prop] = getPropValue({
            schema: result.schema,
            name: prop,
            type: result.schema.properties[prop]?.type,
            format: result.schema.properties[prop]?.format,
            defaultValue: result.schema.properties[prop]?.default,
            items: result.schema.properties[prop]?.items,
            configuration_types: result.schema.properties[prop]?.configuration_types,
          });
        }
      });

      // Also initialize from schema defaults for any property (not only required)
      // This ensures fields like base_url or url get prefilled when the schema provides a default.
      const props = result.schema?.properties || {};
      Object.entries(props).forEach(([prop, propSchema]) => {
        // Only apply when schema explicitly provides a default
        const hasDefault = Object.prototype.hasOwnProperty.call(propSchema || {}, 'default');
        if (!hasDefault) return;

        const alreadySet =
          result.settings[prop] !== undefined &&
          result.settings[prop] !== null &&
          result.settings[prop] !== '';
        if (alreadySet) return;

        const value = getPropValue({
          schema: result.schema,
          name: prop,
          type: propSchema?.type,
          format: propSchema?.format,
          defaultValue: propSchema?.default,
          items: propSchema?.items,
          configuration_types: propSchema?.configuration_types,
        });

        if (value !== undefined && value !== null && value !== '') {
          result.settings[prop] = value;
        }
      });
      return result;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credentialType, sectionProps, toolSchema, schema]);

    useEffect(() => {
      setEditCredentialDetail(initialValues);
    }, [initialValues]);

    const onChangeCredentialDetail = useCallback((...args) => {
      setIsCredentialDirty(!!args[0]);
      setEditCredentialDetail(args[0]);
      //@todo: clear url might be here
    }, []);

    const handleClearCredentialDetail = useCallback(() => {
      setEditCredentialDetail(initialValues);
      setValidationErrorMessages({});
      setShowValidation(false);
      setApiError('');
    }, [initialValues]);

    const onEnableEditTitle = useCallback(() => {
      setEditCredentialDetail(prev => ({ ...prev, enableEditEliteATitle: true }));
    }, []);

    useEffect(() => {
      if (!credentialType) {
        setEditCredentialDetail(null);
      }
    }, [setEditCredentialDetail, credentialType]);

    const onSelectTool = useCallback(tool => {
      setEditCredentialDetail({
        ...tool,
      });
      setToolErrors({});
    }, []);

    useEffect(() => {
      // each tool must have name and description
      setToolErrors(prevState => ({
        ...prevState,
        name: false,
        type: false,
        data: false,
      }));
    }, [
      setToolErrors,
      editCredentialDetail?.name,
      editCredentialDetail?.description,
      editCredentialDetail?.settings,
    ]);

    const styles = createCredentialStyles();

    return (
      <Formik
        enableReinitialize
        initialValues={initialValues}
      >
        <StyledTabs
          fullWidth
          panelStyle={!editCredentialDetail ? styles.emptyPanelStyle : undefined}
          tabSX={styles.tabSX}
          forceShowLabel={forceShowTitle}
          tabs={[
            {
              label: (
                <Tooltip.TypographyWithConditionalTooltip
                  title={pageTitle}
                  placement="top"
                  variant="headingSmall"
                  sx={styles.pageTitle}
                >
                  {pageTitle}
                </Tooltip.TypographyWithConditionalTooltip>
              ),
              //@todo: need to optimize components for reusability of TabBars
              tabBarItems: editCredentialDetail ? (
                <CredentialsTabBar
                  credentialDetails={editCredentialDetail}
                  onClearCredentialDetails={handleClearCredentialDetail}
                  configurationsAsSchema={configurationsAsSchema}
                  onEnableEditTitle={onEnableEditTitle}
                  hasErrors={hasErrors}
                  setShowValidation={setShowValidation}
                  setApiError={setApiError}
                  setValidationErrorMessages={setValidationErrorMessages}
                />
              ) : null,
              rightToolbar: <div />,
              content: (
                <Form style={styles.formContainer}>
                  <StyledGridContainer
                    columnSpacing={SPACING.gridSpacing}
                    container
                    sx={styles.styledGridContainer}
                  >
                    <Grid
                      size={{ xs: 12 }}
                      sx={styles.gridContainer}
                    >
                      {editCredentialDetail && credentialType && Object.keys(initialValues).length > 0 ? (
                        //@todo: need to be replaced and customized for Credentials instead of using ToolkitForm components
                        <CredentialForm
                          key={credentialType}
                          credentialDetails={editCredentialDetail}
                          onChangeCredentialDetail={onChangeCredentialDetail}
                          isToolDirty={isCredentialDirty}
                          isViewToggleVisible={false}
                          showOnlyConfigurationFields={true}
                          configurationsAsSchema={configurationsAsSchema}
                          toolErrors={toolErrors}
                          setToolErrors={setToolErrors}
                          showValidation={showValidation}
                          setShowValidation={setShowValidation}
                          validationErrorMessages={validationErrorMessages}
                          setValidationErrorMessages={setValidationErrorMessages}
                          apiError={apiError}
                          setApiError={setApiError}
                        />
                      ) : (
                        <Box sx={styles.selectorContainer}>
                          <CredentialTypeSelector
                            onSelectTool={onSelectTool}
                            configurationsData={availableConfigurations}
                            isFetching={isFetching}
                            typeSelectorTitle={typeSelectorTitle}
                            showCategory={showCategory}
                            searchPlaceholder={searchPlaceholder}
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
  },
);

CreateCredential.displayName = 'CreateCredential';

/** @type {MuiSx} */
const createCredentialStyles = () => ({
  emptyPanelStyle: {
    padding: '0 0 !important',
  },
  formContainer: {
    height: '100%',
  },
  styledGridContainer: {
    padding: 0,
  },
  tabSX: {
    paddingX: `${SPACING.listItemSpacing} ${SPACING.XXL}`,
    justifyContent: 'flex-start',
    gap: SPACING.SM,
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
  pageTitle: {
    maxWidth: 'none',
    textAlign: 'center',
  },
  gridContainer: ({ breakpoints }) => ({
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
      marginBottom: SPACING.XXL,
    },
  }),
  selectorContainer: {
    height: '100%',
  },
});

export default CreateCredential;
