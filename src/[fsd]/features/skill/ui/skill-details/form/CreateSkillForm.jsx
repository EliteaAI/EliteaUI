import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { GenerateSkillButton } from '@/[fsd]/features/skill/ui/generate-skill-modal';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Field, Input, Markdown } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useTagListQuery } from '@/api/tags.js';
import CodeIcon from '@/assets/code-icon.svg?react';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import {
  ChatParticipantType,
  MAX_DESCRIPTION_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_NAME_LENGTH,
  PROMPT_PAYLOAD_KEY,
} from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { markdown } from '@codemirror/lang-markdown';
import { useTheme } from '@emotion/react';

const CreateSkillForm = memo(props => {
  const {
    accordionStyle,
    sx,
    disabled = false,
    instructionsKey,
    onSkillCreated,
    showGenerateButton = false,
  } = props;
  const formik = useFormikContext();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  // Same permission key the backend enforces on POST /upload_skill_icon (AC-11).
  const canUploadIcon = !disabled && checkPermission('models.applications.skills.upload_icon.post');
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const [name, setName] = useState(formik.values?.name || '');
  const [instructionsViewMode, setInstructionsViewMode] = useState('edit');
  const styles = skillCreateFormStyles();
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  const modeButtons = useMemo(
    () => [
      {
        value: 'edit',
        icon: t => <CodeIcon fill={t.palette.icon.fill.secondary} />,
        tooltip: 'Edit mode',
      },
      {
        value: 'preview',
        icon: t => <OpenEyeIcon fill={t.palette.icon.fill.secondary} />,
        tooltip: 'Preview mode',
      },
    ],
    [],
  );

  const markdownExtensions = useMemo(() => [markdown()], []);

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
      formik.setFieldTouched('name', true, false);
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
      if (!formik.touched?.version_details?.instructions) {
        formik.setFieldTouched('version_details.instructions', true, false);
      }
    },
    [formik],
  );

  const onInstructionsBlur = useCallback(() => {
    formik.setFieldTouched('version_details.instructions', true);
  }, [formik]);

  const onChangeSkillIcon = useCallback(
    icon => {
      formik.setFieldValue('version_details.meta.icon_meta', icon);
    },
    [formik],
  );

  const instructions = formik.values?.version_details?.instructions || '';
  const instructionsError =
    formik.touched?.version_details?.instructions && formik.errors?.version_details?.instructions;
  const instructionsErrorNode = instructionsError ? (
    <Typography
      variant="bodySmall"
      sx={styles.instructionsError}
    >
      {instructionsError}
    </Typography>
  ) : null;

  return (
    <Box sx={[styles.rootContainer, sx]}>
      <BasicAccordion
        style={accordionStyle}
        accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        items={[
          {
            title: 'General',
            summaryAction: showGenerateButton ? (
              <GenerateSkillButton onSkillCreated={onSkillCreated} />
            ) : null,
            content: (
              <Box sx={styles.accordionContent}>
                <Box sx={styles.nameContainer}>
                  <EntityIcon
                    entityType={ChatParticipantType.Skills}
                    icon={formik.values?.version_details?.meta?.icon_meta}
                    editable={canUploadIcon}
                    onChangeIcon={onChangeSkillIcon}
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
                      data-testid="skill-name-input"
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
                </Box>

                <Box sx={styles.descriptionWrapper}>
                  <Input.StyledInputEnhancer
                    autoComplete="off"
                    showexpandicon="true"
                    id="description"
                    label="Description"
                    data-testid="skill-description-input"
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
                    inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                    hasActionsToolBar
                    fieldName="Description"
                  />
                  {isFocused(PROMPT_PAYLOAD_KEY.description) && formik.values?.description?.length > 0 && (
                    <Typography
                      variant="bodySmall"
                      sx={styles.descriptionCharactersLabel}
                    >
                      {`${MAX_DESCRIPTION_LENGTH - formik.values.description.length} characters left`}
                    </Typography>
                  )}
                </Box>

                <TagEditor
                  id="tags"
                  data-testid="skill-tags-input"
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
            title: 'Instructions *',
            summaryAction: (
              <Box
                component="span"
                sx={styles.summaryActions}
                onClick={e => e.stopPropagation()}
              >
                <TabGroupButton
                  value={instructionsViewMode}
                  onChange={(_e, m) => m && setInstructionsViewMode(m)}
                  size="small"
                  arrayBtn={modeButtons}
                />
              </Box>
            ),
            content: (
              <>
                {instructionsViewMode === 'edit' ? (
                  <Box sx={styles.instructionsWrapper}>
                    <Box
                      data-testid="skill-instructions-editor"
                      sx={[styles.editorWrapper, Boolean(instructionsError) && styles.errorBorder]}
                    >
                      <Field.CodeMirrorEditor
                        key={instructionsKey}
                        value={instructions}
                        notifyChange={onChangeInstructions}
                        onBlur={onInstructionsBlur}
                        extensions={markdownExtensions}
                        height="100%"
                        minHeight="0"
                        maxLength={MAX_INSTRUCTIONS_LENGTH}
                        readOnly={disabled}
                      />
                    </Box>
                    <Box sx={styles.charCounterWrapper}>
                      {instructionsErrorNode}
                      <Typography
                        variant="bodySmall"
                        sx={styles.charCounter}
                      >
                        {`${MAX_INSTRUCTIONS_LENGTH - instructions.length} characters left`}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={styles.instructionsWrapper}>
                    <Box sx={[styles.instructionsPreview, Boolean(instructionsError) && styles.errorBorder]}>
                      {instructions ? (
                        <Markdown>{instructions}</Markdown>
                      ) : (
                        <Typography
                          variant="bodyMedium"
                          sx={styles.emptyPreview}
                        >
                          No instructions yet.
                        </Typography>
                      )}
                    </Box>
                    {instructionsErrorNode}
                  </Box>
                )}
              </>
            ),
          },
        ]}
      />
    </Box>
  );
});

const skillCreateFormStyles = () => ({
  rootContainer: {
    width: '100%',
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
  summaryActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    // TabGroupButton hardcodes zIndex: 2000, which otherwise paints the
    // edit/preview toggle above modals (zIndex 1300). Scope it with a local
    // stacking context so it can't escape over dialogs.
    isolation: 'isolate',
  },
  instructionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1rem',
  },
  // Code-style editor with line numbers (CodeMirror), matching Figma. Reuses the
  // same Field.CodeMirrorEditor as the Project Context editor, so there is no MUI
  // hover toolbar (copy/expand/fullscreen) overlapping the content.
  editorWrapper: ({ palette }) => ({
    display: 'flex',
    height: '24rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    overflow: 'hidden',
    '&:focus-within': { borderColor: palette.primary.main },
    '& .cm-theme': { width: '100%' },
    '& .cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: `0.0625rem solid ${palette.border.table}`,
    },
  }),
  errorBorder: ({ palette }) => ({
    borderColor: palette.error.main,
    '&:focus-within': { borderColor: palette.error.main },
  }),
  charCounterWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  charCounter: ({ palette }) => ({
    color: palette.text.primary,
    marginLeft: 'auto',
  }),
  instructionsError: ({ palette }) => ({
    color: palette.error.main,
  }),
  instructionsPreview: ({ palette }) => ({
    minHeight: '12rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
    overflow: 'auto',
  }),
  emptyPreview: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
  }),
});

CreateSkillForm.displayName = 'CreateSkillForm';

export default CreateSkillForm;
