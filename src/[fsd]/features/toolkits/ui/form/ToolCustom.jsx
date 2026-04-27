import { memo, useCallback, useEffect, useState } from 'react';

import { Box, FormControl, FormHelperText, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ToolCustomHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitNameProp } from '@/[fsd]/features/toolkits/lib/hooks';
import { Field } from '@/[fsd]/shared/ui';
import { handleCopy, isNullOrUndefined } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { Manual_Title } from '@/hooks/useConfigurations';
import useToast from '@/hooks/useToast';

const ToolCustom = memo(props => {
  const {
    editToolDetail = {},
    setEditToolDetail = () => {},
    setToolErrors = () => {},
    // eslint-disable-next-line no-unused-vars
    showValidation = true,
    schema,
    configurationSchema,
    editField,
    needToCheckSection = true,
  } = props;

  const styles = toolCustomStyles();
  const { toolkitNameProp, schemaOfTools, nameIsRequired } = useToolkitNameProp(editToolDetail?.type);
  const [originalJsonString] = useState(
    toolkitNameProp
      ? JSON.stringify(
          {
            settings: editToolDetail.settings,
            type: editToolDetail.type,
          },
          null,
          2,
        )
      : JSON.stringify(
          {
            name: editToolDetail.name,
            description: editToolDetail.description,
            settings: editToolDetail.settings,
            type: editToolDetail.type,
          },
          null,
          2,
        ),
  );
  const { name, description, settings, type } = editToolDetail;
  const { toastInfo } = useToast();
  const [jsonString, setJsonString] = useState(
    toolkitNameProp
      ? JSON.stringify({ settings, type }, null, 2)
      : JSON.stringify({ name, description, settings, type }, null, 2),
  );
  const [error, setError] = useState('');
  const { extensions } = useLanguageLinter('json');

  const handleChange = useCallback(value => {
    setJsonString(value);
  }, []);

  const onClickCopy = useCallback(() => {
    handleCopy(jsonString);
    toastInfo('The content has been copied to the clipboard');
  }, [toastInfo, jsonString]);

  useEffect(() => {
    try {
      const obj = toolkitNameProp
        ? {
            index: editToolDetail.index,
            id: editToolDetail.id,
            name,
            description,
            type,
            ...JSON.parse(jsonString),
          }
        : {
            index: editToolDetail.index,
            id: editToolDetail.id,
            type,
            ...JSON.parse(jsonString),
          };
      if (!obj.settings) {
        setError('Toolkit must have settings field');
      } else {
        if (nameIsRequired && !obj.name?.trim()) {
          setError('name is required');
        } else {
          const realSchema = schemaOfTools[obj.type];
          if (realSchema) {
            const { isValid, errorMessage } = ToolCustomHelpers.validationSettings(
              obj.settings,
              realSchema,
              configurationSchema,
              needToCheckSection,
            );
            if (!isValid) {
              setError(errorMessage);
            } else {
              setError('');
            }
          } else {
            setError('');
          }
        }
        if (originalJsonString !== jsonString) {
          setEditToolDetail(obj);
          if (editField) {
            Object.keys(obj).forEach(async key => {
              await editField(key, obj[key], true);
            });
          }
        }
      }
    } catch {
      setError('Invalid JSON format');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonString]);

  useEffect(() => {
    const requiredPropertiesError = {};
    if (!settings?.configuration_title || settings?.configuration_title === Manual_Title) {
      schema?.required?.forEach(prop => {
        requiredPropertiesError[prop] =
          schema?.properties[prop]?.type !== 'boolean' ? !settings[prop] : isNullOrUndefined(settings[prop]);
      });
      configurationSchema?.required?.forEach(prop => {
        requiredPropertiesError[prop] = false;
      });
      if (needToCheckSection) {
        Object.entries(schema?.metadata?.sections || {}).forEach(([, v]) => {
          if (v.required) {
            const selectedSubSection =
              v.subsections.find(subsection => {
                if (subsection.fields?.find(field => !isNullOrUndefined(settings[field]))) {
                  return true;
                }
                return false;
              }) || v.subsections[0];
            selectedSubSection?.fields.forEach(prop => {
              requiredPropertiesError[prop] = !settings[prop] && settings[prop] !== 0;
            });
          }
        });
      }
    } else {
      schema?.required?.forEach(prop => {
        requiredPropertiesError[prop] = false;
      });
      configurationSchema?.required?.forEach(prop => {
        requiredPropertiesError[prop] =
          configurationSchema?.properties[prop]?.type !== 'boolean'
            ? !settings[prop]
            : isNullOrUndefined(settings[prop]);
      });
    }

    setToolErrors(prevState => ({
      ...prevState,
      name: nameIsRequired && !name?.trim(),
      ...requiredPropertiesError,
    }));
  }, [
    configurationSchema?.properties,
    configurationSchema?.required,
    description,
    name,
    nameIsRequired,
    needToCheckSection,
    schema?.metadata?.sections,
    schema?.properties,
    schema?.required,
    setToolErrors,
    settings,
  ]);

  return (
    <Box sx={styles.container}>
      <FormControl
        sx={styles.formControl}
        error={!!error}
      >
        <Typography
          variant="labelMedium"
          color="text.primary"
          component="div"
          sx={styles.label}
        >
          JSON
        </Typography>
        <StyledTooltip
          title={'Copy to clipboard'}
          placement="top"
        >
          <IconButton
            sx={styles.copyButton}
            variant="alita"
            color="tertiary"
            onClick={onClickCopy}
          >
            <CopyIcon sx={styles.copyIcon} />
          </IconButton>
        </StyledTooltip>
        {error && <FormHelperText>{error}</FormHelperText>}

        <Box sx={styles.editorContainer(error)}>
          <Field.CodeMirrorEditor
            value={jsonString}
            extensions={extensions}
            height="100%"
            minHeight="100%"
            notifyChange={handleChange}
          />
        </Box>
      </FormControl>
    </Box>
  );
});

ToolCustom.displayName = 'ToolCustom';

/** @type {MuiSx} */
const toolCustomStyles = () => ({
  container: {
    height: 'calc(100% - 1.75rem)',
  },
  formControl: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  label: {
    display: 'block',
    margin: '1rem 0 0.5rem 0.75rem',
    fontWeight: '400',
  },
  copyButton: {
    marginLeft: '1.25rem',
    position: 'absolute',
    top: '0.75rem',
    right: '0.5rem',
  },
  copyIcon: {
    fontSize: '1rem',
  },
  editorContainer: error => ({
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    height: `calc(100% - ${!error ? '2.875rem' : '4.25rem'})`,
    overflow: 'auto',
    flexDirection: 'column',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
  }),
});

export default ToolCustom;
