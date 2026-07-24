import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { adjustIndexDataSchema } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexNameValidation } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Button } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import RouteDefinitions from '@/routes';

const NAME_WHITESPACE_ERROR = 'Name cannot start or end with whitespace';

const CreateIndexForm = memo(props => {
  const { toolkitId, tab } = props;
  const navigate = useNavigate();
  const { values } = useFormikContext();
  const styles = createIndexFormStyles();

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
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.elitea}
          onClick={handleIndexData}
          disabled={!isValidForm || isRunning}
        >
          Index
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.secondary}
          onClick={handleCancel}
          disabled={isRunning}
        >
          Cancel
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

CreateIndexForm.displayName = 'CreateIndexForm';

/** @type {MuiSx} */
const createIndexFormStyles = () => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: '36.525rem',
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
    paddingLeft: '2.25rem',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default CreateIndexForm;
