import { memo, useCallback, useEffect, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useTagListQuery } from '@/api/tags.js';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import ApplicationAdvanceSettings from '@/components/ApplicationAdvanceSettings';
import ApplicationVariables from '@/components/ApplicationVariables';
import ConversationStarters from '@/components/ConversationStarters';
import EntityIcon from '@/components/EntityIcon';
import useCreateApplication from '@/hooks/application/useCreateApplication';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { useTheme } from '@emotion/react';

import ApplicationContext from './ApplicationContext';
import ApplicationWelcomeMessage from './ApplicationWelcomeMessage';

const ApplicationCreateForm = memo(props => {
  const { accordionStyle, sx } = props;

  const formik = useFormikContext();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const { isLoading } = useCreateApplication(formik);
  const [name, setName] = useState(formik.values?.name || '');
  const { variables = [] } = formik.values?.version_details || {};

  // Sync local state when Formik value changes externally (e.g., on form reset/discard)
  const formikName = formik.values?.name;
  useEffect(() => {
    if (formikName !== name) {
      setName(formikName || '');
    }
  }, [formikName]); // eslint-disable-line react-hooks/exhaustive-deps
  const styles = applicationCreateFormStyles();
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  const onChangeVariable = useCallback(
    (label, newValue) => {
      const updateIndex = variables.findIndex(variable => variable.name === label);
      formik.setFieldValue(
        `version_details.variables`,
        variables.map((v, index) => (index === updateIndex ? { name: label, value: newValue } : v)),
      );
    },
    [formik, variables],
  );

  const onChangeTags = useCallback(
    newTags => {
      formik.setFieldValue('version_details.tags', newTags);
    },
    [formik],
  );

  const onChangeName = useCallback(
    event => {
      setName(event.target.value);
      formik.setFieldValue('name', event.target.value);
    },
    [formik],
  );

  const onNameBlur = useCallback(
    event => {
      const trimmedName = name.trim();
      setName(trimmedName);
      formik.setFieldValue('name', trimmedName);
      formik.handleBlur(event);
      toggleFieldFocus(null);
    },
    [formik, name, toggleFieldFocus],
  );

  const handleDescriptionBlur = useCallback(
    event => {
      formik.handleBlur(event);
      toggleFieldFocus(null);
    },
    [formik, toggleFieldFocus],
  );

  const onChangeApplicationIcon = useCallback(
    icon => {
      formik.setFieldValue('version_details.meta.icon_meta', icon);
    },
    [formik],
  );

  return (
    <Box sx={[styles.rootContainer, sx]}>
      <BasicAccordion
        style={accordionStyle}
        accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        items={[
          {
            title: 'General',
            content: (
              <Box sx={styles.accordionContent}>
                <Box sx={styles.nameContainer}>
                  <EntityIcon
                    icon={formik.values?.version_details?.meta?.icon_meta}
                    entityType="application"
                    editable={true}
                    onChangeIcon={onChangeApplicationIcon}
                    projectId={projectId}
                    entityId={formik.values?.id}
                    versionId={formik.values?.version_details?.id}
                  />
                  <Box sx={styles.nameWrapperInput}>
                    <Input.StyledInputEnhancer
                      autoComplete="off"
                      id="name"
                      name="name"
                      label="Name"
                      error={formik.touched?.name && Boolean(formik.errors.name)}
                      helperText={formik.touched?.name && formik.errors.name}
                      disabled={isLoading}
                      onChange={onChangeName}
                      onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.name)}
                      onBlur={onNameBlur}
                      value={name}
                      required
                      inputProps={{ maxLength: MAX_NAME_LENGTH }}
                      containerProps={{ flex: 1 }}
                      enableAutoBlur={false}
                    />
                    {isFocused(PROMPT_PAYLOAD_KEY.name) && MAX_NAME_LENGTH === name.length && (
                      <Typography
                        variant="bodySmall2"
                        sx={styles.nameCharactersLabel}
                      >
                        {` 0 is left from ${MAX_NAME_LENGTH} characters`}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={styles.descriptionWrapper}>
                  <Input.StyledInputEnhancer
                    autoComplete="off"
                    showexpandicon="true"
                    id="description"
                    label="Description"
                    required
                    multiline
                    maxRows={15}
                    onChange={formik.handleChange}
                    onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.description)}
                    onBlur={handleDescriptionBlur}
                    value={formik.values?.description}
                    error={formik.touched?.description && Boolean(formik.errors.description)}
                    helperText={formik.touched?.description && formik.errors.description}
                    disabled={isLoading}
                    inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                    hasActionsToolBar
                    fieldName="Description"
                  />
                  {isFocused(PROMPT_PAYLOAD_KEY.description) && formik.values?.description?.length > 0 && (
                    <Typography
                      variant="bodySmall"
                      sx={styles.descripitonCharactersLabel}
                    >
                      {`${MAX_DESCRIPTION_LENGTH - formik.values.description.length} characters left`}
                    </Typography>
                  )}
                </Box>

                <TagEditor
                  id="tags"
                  label="Tags"
                  tagList={tagList || []}
                  stateTags={formik.values?.version_details?.tags || []}
                  disabled={isLoading}
                  onChangeTags={onChangeTags}
                />
              </Box>
            ),
          },
        ]}
      />
      <ApplicationContext
        containerStyle={{ paddingBottom: '1rem' }}
        style={{ marginTop: '1rem' }}
      />
      <ApplicationVariables
        variables={variables}
        onChangeVariable={onChangeVariable}
        style={{
          marginBottom: '0',
        }}
      />
      <ApplicationWelcomeMessage style={{ marginTop: '1rem' }} />
      {/*<ApplicationTools containerSX={{ paddingBottom: '16px' }} />*/}
      <ConversationStarters style={{ marginTop: '1rem' }} />
      <ApplicationAdvanceSettings style={{ marginTop: '1rem' }} />
    </Box>
  );
});

const applicationCreateFormStyles = () => ({
  rootContainer: {
    margin: '0.75rem auto 0',
    maxWidth: '40.1875rem',
  },
  accordionContent: {
    paddingBottom: '1.5rem',
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '4.25rem',
    width: '100%',
    gap: '1rem',
  },
  nameWrapperInput: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  nameCharactersLabel: {
    textAlign: 'right',
    width: '100%',
    fontSize: '0.625rem',
    position: 'absolute',
    bottom: '3.5rem',
  },
  descriptionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  descripitonCharactersLabel: {
    textAlign: 'right',
    width: '100%',
    fontSize: '0.625rem',
    position: 'relative',
    top: '0.5rem',
  },
});

ApplicationCreateForm.displayName = 'ApplicationCreateForm';

export default ApplicationCreateForm;
