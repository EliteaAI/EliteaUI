import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Formik, useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Button, CircularProgress } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { adjustIndexDataSchema } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexNameValidation } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import Page404 from '@/pages/Page404.jsx';
import IndexBreadcrumb from '@/pages/Toolkits/IndexBreadcrumb';
import RouteDefinitions from '@/routes';

const emptyToolDetail = {};
const NAME_WHITESPACE_ERROR = 'Name cannot start or end with whitespace';

const CreateIndexForm = memo(props => {
  const { toolkitId, tab } = props;
  const navigate = useNavigate();
  const { values } = useFormikContext();
  const styles = createIndexStyles();

  const configInitialized = useRef(false);
  const navigatedRef = useRef(false);
  const pendingCollectionRef = useRef(null);
  const [toolInputVariables, setToolInputVariables] = useState({});
  const [nameFormatError, setNameFormatError] = useState(null);

  const { clearIndexNameError, indexNameError, updateIndexNameError, isIndexNameValid } =
    useIndexNameValidation();

  const indexDataSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: IndexesToolsEnum.indexData,
  });

  const combinedNameError = indexNameError || nameFormatError;

  const adjustedIndexDataSchema = useMemo(() => {
    const adjustment = {
      index_name: {
        ...(combinedNameError ? { error: combinedNameError } : {}),
      },
      query: { clipboard: true },
    };

    return adjustIndexDataSchema(indexDataSchema, adjustment);
  }, [combinedNameError, indexDataSchema]);

  const isSchemaValid = useMemo(() => {
    if (values.type === ToolTypes.custom.value) return true;
    if (!adjustedIndexDataSchema?.properties) return false;
    return ToolkitChatHelpers.validateToolkitForm(adjustedIndexDataSchema, toolInputVariables);
  }, [toolInputVariables, adjustedIndexDataSchema, values.type]);

  const isValidForm = isSchemaValid && !combinedNameError;

  const initializeDefaultConfigValues = useCallback(() => {
    configInitialized.current = true;

    const defaults = {};
    let hasDefaults = false;

    Object.entries(adjustedIndexDataSchema?.properties ?? {}).forEach(([key, property]) => {
      const currentValue = toolInputVariables?.[key];

      if (currentValue !== undefined && currentValue !== '' && typeof currentValue !== 'function') return;

      let defaultValue = property.default;

      if (property.anyOf && Array.isArray(property.anyOf) && defaultValue === undefined) {
        const arraySchema = property.anyOf.find(schema => schema.type === 'array');

        if (arraySchema && arraySchema.default !== undefined) defaultValue = arraySchema.default;
        else if (property.anyOf.find(schema => schema.type === 'null')) defaultValue = null;
      }

      if (defaultValue === undefined)
        defaultValue =
          {
            object: {},
            array: [],
            boolean: false,
            string: '',
            number: 0,
            integer: 0,
          }[property.type] ?? '';
      else {
        defaults[key] = defaultValue;
        hasDefaults = true;
      }
    });

    if (hasDefaults) setToolInputVariables(prev => ({ ...prev, ...defaults }));
  }, [adjustedIndexDataSchema?.properties, toolInputVariables]);

  useEffect(() => {
    if (adjustedIndexDataSchema?.properties && !configInitialized.current) initializeDefaultConfigValues();
  }, [adjustedIndexDataSchema, initializeDefaultConfigValues]);

  const traceNewIndex = useCallback(
    (_id, meta) => {
      if (navigatedRef.current) return;
      if (meta?.collection) pendingCollectionRef.current = meta.collection;

      const collection = pendingCollectionRef.current;
      if (meta?.conversation_id && meta?.conversation_uuid && collection) {
        navigatedRef.current = true;
        const target = RouteDefinitions.ToolkitIndex.replace(':tab', tab ?? 'all')
          .replace(':toolkitId', String(toolkitId))
          .replace(':indexName', encodeURIComponent(collection));
        navigate(target, {
          replace: true,
          state: {
            creating: true,
            collection,
            conversation_id: meta.conversation_id,
            conversation_uuid: meta.conversation_uuid,
          },
        });
      }
    },
    [navigate, tab, toolkitId],
  );

  const refetchIndexesList = useCallback(() => Promise.resolve(), []);

  const { handleIndexData, isRunning } = useToolkitChat({
    index: null,
    isValidForm,
    refetchIndexesList,
    runTool: null,
    toolkitId,
    toolInputVariables,
    traceNewIndex,
    values,
    modes: [ToolkitChatModesEnum.createIndex],
  });

  const onChangeInputVariables = useCallback(
    value => {
      const name = value?.index_name;

      if (typeof name === 'string' && name.length > 0 && name !== name.trim()) {
        setNameFormatError(NAME_WHITESPACE_ERROR);
        clearIndexNameError();
      } else {
        setNameFormatError(null);

        if (name && !isIndexNameValid(name)) updateIndexNameError(name);
        else clearIndexNameError();
      }

      setToolInputVariables(value);
    },
    [clearIndexNameError, isIndexNameValid, updateIndexNameError],
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const configFields = useMemo(
    () => Object.keys(adjustedIndexDataSchema?.properties || {}),
    [adjustedIndexDataSchema],
  );

  const accordionContent = (
    <Box sx={styles.accordionContent}>
      {configFields.length === 0 ? (
        <Box sx={styles.loading}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        configFields.map(key => (
          <ToolkitForm.ToolFormContainer
            key={key}
            fieldKey={key}
            property={adjustedIndexDataSchema.properties[key]}
            toolInputVariables={toolInputVariables}
            schema={adjustedIndexDataSchema}
            onChangeInputVariables={onChangeInputVariables}
            changesDisabled={isRunning}
          />
        ))
      )}
    </Box>
  );

  return (
    <Box sx={styles.body}>
      <BasicAccordion
        data-testid="create-index-configuration-accordion"
        style={styles.accordionWrapper}
        items={[{ title: 'Index configuration', content: accordionContent }]}
      />
      <Box sx={styles.actions}>
        <Button
          variant="special"
          onClick={handleIndexData}
          disabled={!isValidForm || isRunning}
        >
          Index
        </Button>
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isRunning}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
});

CreateIndexForm.displayName = 'CreateIndexForm';

const CreateIndex = memo(() => {
  const { tab, toolkitId } = useParams();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = createIndexStyles();

  const goBackToToolkit = useCallback(() => {
    const target = RouteDefinitions.ToolkitDetail.replace(':tab', tab ?? 'all').replace(
      ':toolkitId',
      String(toolkitId),
    );
    navigate(target);
  }, [navigate, tab, toolkitId]);

  const goToToolkitsList = useCallback(() => {
    navigate(RouteDefinitions.ToolkitsWithTab.replace(':tab', tab ?? 'all'));
  }, [navigate, tab]);

  const {
    data: publicToolkitData = emptyToolDetail,
    isFetching,
    isError,
    error,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  useGetIndexesListQuery({ toolkitId, projectId }, { skip: !projectId || !toolkitId });

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const initialValues = useMemo(() => {
    if (!publicToolkitData?.id) return {};
    return {
      ...publicToolkitData,
      settings: publicToolkitData.settings || {},
      type: publicToolkitData.type || '',
    };
  }, [publicToolkitData]);

  if (shouldShowNotFoundPage) return <Page404 />;

  const toolkitName = publicToolkitData?.name || '';

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={toolkitName}
            current="New index"
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
          />
        }
      />
      <Box sx={styles.content}>
        {isFetching || !publicToolkitData?.id ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <CreateIndexForm
              toolkitId={toolkitId}
              tab={tab}
            />
          </Formik>
        )}
      </Box>
    </Box>
  );
});

CreateIndex.displayName = 'CreateIndex';

/** @type {MuiSx} */
const createIndexStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: '52rem',
    marginX: 'auto',
  },
  accordionWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '0.75rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default CreateIndex;
