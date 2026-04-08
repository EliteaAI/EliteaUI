import { memo, useCallback, useEffect, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useTagListQuery } from '@/api/tags';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { useTheme } from '@emotion/react';

const ApplicationEditForm = memo(props => {
  const { style } = props;

  const styles = applicationEditFormStyles();
  const theme = useTheme();
  const formik = useFormikContext();
  const projectId = useSelectedProjectId();
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const [name, setName] = useState(formik.values?.name || '');
  const isFromPipeline = useIsFromPipelineDetail();
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  // Sync local state when Formik value changes externally (e.g., on form reset/discard)
  const formikName = formik.values?.name;
  useEffect(() => {
    if (formikName !== name) {
      setName(formikName || '');
    }
  }, [formikName]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (formik.values?.name && !name) {
      setName(formik.values?.name);
    }
  }, [formik.values?.name, name]);

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      items={[
        {
          title: 'General',
          content: (
            <Box>
              <Box sx={styles.nameContainer}>
                <EntityIcon
                  icon={formik.values?.version_details?.meta?.icon_meta}
                  entityType={isFromPipeline ? 'pipeline' : 'application'}
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
                    onChange={onChangeName}
                    onBlur={onNameBlur}
                    onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.name)}
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
                  label="Description"
                  id="description"
                  name="description"
                  required
                  multiline
                  maxRows={15}
                  onChange={formik.handleChange}
                  onBlur={handleDescriptionBlur}
                  onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.description)}
                  value={formik.values?.description}
                  InputLabelProps={{ shrink: Boolean(formik.values?.description) }}
                  error={formik.touched?.description && Boolean(formik.errors.description)}
                  helperText={formik.touched?.description && formik.errors.description}
                  inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                  hasActionsToolBar
                  language="text"
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
                onChangeTags={onChangeTags}
              />
            </Box>
          ),
        },
      ]}
    />
  );
});

/** @type {MuiSx} */

const applicationEditFormStyles = () => ({
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

ApplicationEditForm.displayName = 'ApplicationEditForm';

export default ApplicationEditForm;
