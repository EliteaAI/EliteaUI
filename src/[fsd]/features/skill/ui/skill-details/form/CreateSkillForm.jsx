import { memo, useCallback, useEffect, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { FileReaderEnhancer } from '@/[fsd]/shared/ui/input';
import { useTagListQuery } from '@/api/tags.js';
import { MAX_NAME_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { useTheme } from '@emotion/react';

// Description follows the platform-wide cap (API allows 1-2304).
// Instructions get a Skills-specific visible counter capped at 2500 characters.
export const MAX_SKILL_DESCRIPTION_LENGTH = 2304;
export const MAX_SKILL_INSTRUCTIONS_LENGTH = 2500;

const noop = () => {};

const CreateSkillForm = memo(props => {
  const { accordionStyle, sx, disabled = false, instructionsKey } = props;
  const formik = useFormikContext();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const [name, setName] = useState(formik.values?.name || '');
  const styles = skillCreateFormStyles();
  const { toggleFieldFocus, isFocused } = useFieldFocus();

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

  const onChangeInstructions = useCallback(
    value => {
      formik.setFieldValue('version_details.instructions', value);
    },
    [formik],
  );

  const instructions = formik.values?.version_details?.instructions || '';

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
                <Box sx={styles.nameWrapperInput}>
                  <Input.StyledInputEnhancer
                    autoComplete="off"
                    id="name"
                    name="name"
                    label="Name"
                    error={formik.touched?.name && Boolean(formik.errors.name)}
                    helperText={formik.touched?.name && formik.errors.name}
                    disabled={disabled}
                    onChange={onChangeName}
                    onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.name)}
                    onBlur={onNameBlur}
                    value={name}
                    required
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                    containerProps={{ flex: 1 }}
                    enableAutoBlur={false}
                  />
                  {isFocused(PROMPT_PAYLOAD_KEY.name) && name.length > 0 && (
                    <Typography
                      variant="bodySmall2"
                      sx={styles.charactersLabel}
                    >
                      {`${MAX_NAME_LENGTH - name.length} characters left`}
                    </Typography>
                  )}
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
                    disabled={disabled}
                    inputProps={{ maxLength: MAX_SKILL_DESCRIPTION_LENGTH }}
                    hasActionsToolBar
                    fieldName="Description"
                  />
                  {isFocused(PROMPT_PAYLOAD_KEY.description) && formik.values?.description?.length > 0 && (
                    <Typography
                      variant="bodySmall"
                      sx={styles.descriptionCharactersLabel}
                    >
                      {`${MAX_SKILL_DESCRIPTION_LENGTH - formik.values.description.length} characters left`}
                    </Typography>
                  )}
                </Box>

                <TagEditor
                  id="tags"
                  label="Tags"
                  tagList={tagList || []}
                  stateTags={formik.values?.version_details?.tags || []}
                  disabled={disabled}
                  onChangeTags={onChangeTags}
                />
              </Box>
            ),
          },
        ]}
      />

      <BasicAccordion
        style={accordionStyle}
        accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        items={[
          {
            title: 'Instructions',
            content: (
              <Box sx={styles.instructionsWrapper}>
                <FileReaderEnhancer
                  key={instructionsKey}
                  showexpandicon="true"
                  id="skill-instructions"
                  placeholder="Markdown instructions for the skill"
                  defaultValue={instructions}
                  onChange={onChangeInstructions}
                  updateVariableList={noop}
                  onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.instructions || 'instructions')}
                  onBlur={() => toggleFieldFocus(null)}
                  multiline
                  maxRows={20}
                  disabled={disabled}
                  fieldName="Instructions"
                  inputProps={{ maxLength: MAX_SKILL_INSTRUCTIONS_LENGTH }}
                />
                {isFocused(PROMPT_PAYLOAD_KEY.instructions || 'instructions') && instructions.length > 0 && (
                  <Typography
                    variant="bodySmall"
                    sx={styles.descriptionCharactersLabel}
                  >
                    {`${MAX_SKILL_INSTRUCTIONS_LENGTH - instructions.length} characters left`}
                  </Typography>
                )}
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
});

const skillCreateFormStyles = () => ({
  rootContainer: {
    margin: '0.75rem auto 0',
    maxWidth: '40.1875rem',
  },
  accordionContent: {
    paddingBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  nameWrapperInput: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  charactersLabel: {
    textAlign: 'right',
    width: '100%',
    fontSize: '0.625rem',
    position: 'relative',
    top: '0.25rem',
  },
  descriptionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  descriptionCharactersLabel: {
    textAlign: 'right',
    width: '100%',
    fontSize: '0.625rem',
    position: 'relative',
    top: '0.5rem',
  },
  instructionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1rem',
  },
});

CreateSkillForm.displayName = 'CreateSkillForm';

export default CreateSkillForm;
