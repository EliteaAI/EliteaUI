import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography, useTheme } from '@mui/material';

import { EditableEntityIcon } from '@/[fsd]/features/entity-icon-editor';
import { SKILL_NAME_MAX_LENGTH, SPEC_MAX_DESCRIPTION_LENGTH } from '@/[fsd]/features/skill/lib/constants';
import { countSkillBodyLength } from '@/[fsd]/features/skill/lib/helpers';
import {
  useSkillFrontmatterEditor,
  useSkillInstructionsMaxLength,
  useSkillModels,
} from '@/[fsd]/features/skill/lib/hooks';
import { GenerateSkillButton } from '@/[fsd]/features/skill/ui/generate-skill-modal';
import { AccordionConstants, MarkdownConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Field, Input, Markdown, Text } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { MarkdownViewToggle } from '@/[fsd]/shared/ui/tab-group-button';
import { useTagListQuery } from '@/api/tags.js';
import { ChatParticipantType, MAX_DESCRIPTION_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { markdown } from '@codemirror/lang-markdown';

import SkillRunSettings from './SkillRunSettings';

const { MARKDOWN_VIEW_MODES } = MarkdownConstants;

const PREVIEW_FIRST = [MARKDOWN_VIEW_MODES.preview, MARKDOWN_VIEW_MODES.edit];

const CreateSkillForm = memo(props => {
  const {
    accordionStyle,
    sx,
    disabled = false,
    isCreateMode = false,
    instructionsKey,
    onSkillCreated,
    showGenerateButton = false,
    summaryEditAction = null,
  } = props;
  const formik = useFormikContext();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  // Same permission key the backend enforces on POST /upload_skill_icon (AC-11).
  const canUploadIcon = !disabled && checkPermission('models.applications.skills.upload_icon.post');
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const [name, setName] = useState(formik.values?.name || '');
  const [instructionsViewMode, setInstructionsViewMode] = useState(
    isCreateMode ? MARKDOWN_VIEW_MODES.edit : MARKDOWN_VIEW_MODES.preview,
  );
  const styles = skillCreateFormStyles();
  const { toggleFieldFocus, isFocused } = useFieldFocus();
  const { models } = useSkillModels();
  const { editorText, onEditorChange, frontmatterErrors } = useSkillFrontmatterEditor({ models });
  const maxInstructionsLength = useSkillInstructionsMaxLength();

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

  const onInstructionsBlur = useCallback(() => {
    formik.setFieldTouched('version_details.instructions', true);
  }, [formik]);

  const onChangeSkillIcon = useCallback(
    icon => {
      formik.setFieldValue('version_details.meta.icon_meta', icon);
    },
    [formik],
  );

  const description = formik.values?.description || '';
  const descriptionError = formik.touched?.description && formik.errors.description;
  const descriptionHelperText =
    descriptionError ||
    (description.length > SPEC_MAX_DESCRIPTION_LENGTH
      ? `Longer than ${SPEC_MAX_DESCRIPTION_LENGTH} characters: Claude and other Agent Skills tools will reject the exported skill.`
      : undefined);
  const license = formik.values?.version_details?.meta?.frontmatter?.license;

  const instructions = formik.values?.version_details?.instructions || '';
  const instructionsCharactersLeft = maxInstructionsLength - instructions.length;
  const instructionsCounterLabel =
    instructionsCharactersLeft >= 0
      ? `${instructionsCharactersLeft} characters left`
      : `${-instructionsCharactersLeft} characters over the limit`;
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
        accordionSX={{ background: `${theme.palette.background.default.tertiary} !important` }}
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        items={[
          {
            title: 'General',
            summaryAction: showGenerateButton ? (
              <GenerateSkillButton onSkillCreated={onSkillCreated} />
            ) : (
              summaryEditAction
            ),
            content: (
              <Box sx={styles.accordionContent}>
                <Box sx={styles.nameContainer}>
                  <EditableEntityIcon
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
                      // 'data-testid' here lands on the real <input> element via
                      // InputBase's slotProps.htmlInput (unlike the data-testid
                      // above on StyledInputEnhancer, which resolves to the
                      // MuiFormControl-root wrapper, not the input itself).
                      inputProps={{
                        maxLength: SKILL_NAME_MAX_LENGTH,
                        'data-testid': 'skill-name-input-field',
                      }}
                      containerProps={{ flex: 1 }}
                      enableAutoBlur={false}
                      hasActionsToolBar
                      copyMessage="The name has been copied to the clipboard."
                      showFullScreenAction={false}
                      showExpandAction={false}
                    />
                    {isFocused(PROMPT_PAYLOAD_KEY.name) && name.length > 0 && (
                      <Text.CharacterCounter
                        value={name}
                        maxLength={SKILL_NAME_MAX_LENGTH}
                        hideMaxLimitMessage
                        sx={styles.charactersLabel}
                      />
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
                    error={Boolean(descriptionError)}
                    helperText={descriptionHelperText}
                    disabled={disabled}
                    // Lands on the real <textarea> — see the analogous comment
                    // on the Name field's inputProps above.
                    inputProps={{
                      maxLength: MAX_DESCRIPTION_LENGTH,
                      'data-testid': 'skill-description-input-field',
                    }}
                    hasActionsToolBar
                    fieldName="Description"
                  />
                  {isFocused(PROMPT_PAYLOAD_KEY.description) && formik.values?.description?.length > 0 && (
                    <Text.CharacterCounter
                      value={formik.values.description}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      hideMaxLimitMessage
                      sx={styles.descriptionCharactersLabel}
                    />
                  )}
                </Box>

                {license && (
                  <Input.StyledInputEnhancer
                    autoComplete="off"
                    id="license"
                    label="License"
                    data-testid="skill-license"
                    value={license}
                    inputProps={{ readOnly: true, 'data-testid': 'skill-license-input-field' }}
                    multiline
                    maxRows={5}
                  />
                )}

                <TagEditor
                  id="tags"
                  data-testid="skill-tags-input"
                  // Sub-element testids threaded through AutoCompleteDropDown
                  // (see that component for how each lands on the DOM):
                  // the real <input>, each committed-tag chip, and each
                  // dropdown option (keyed by the option's own name).
                  inputTestId="skill-tags-input-field"
                  chipTestId="skill-tag-chip"
                  getOptionTestId={option => `skill-tag-option-${option?.name}`}
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
        accordionSX={{ background: `${theme.palette.background.default.tertiary} !important` }}
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
                <MarkdownViewToggle
                  value={instructionsViewMode}
                  onChange={setInstructionsViewMode}
                  iconOrder={PREVIEW_FIRST}
                />
              </Box>
            ),
            content: (
              <>
                {instructionsViewMode === MARKDOWN_VIEW_MODES.edit ? (
                  <Box sx={styles.instructionsWrapper}>
                    <Box
                      data-testid="skill-instructions-editor"
                      sx={[styles.editorWrapper, Boolean(instructionsError) && styles.errorBorder]}
                    >
                      <Field.CodeMirrorEditor
                        key={instructionsKey}
                        value={editorText}
                        notifyChange={onEditorChange}
                        onBlur={onInstructionsBlur}
                        extensions={markdownExtensions}
                        height="100%"
                        minHeight="0"
                        maxLength={maxInstructionsLength}
                        countLength={countSkillBodyLength}
                        readOnly={disabled}
                        contentTestId="skill-instructions-editor-content"
                      />
                    </Box>
                    <Box sx={styles.charCounterWrapper}>
                      {instructionsErrorNode}
                      {frontmatterErrors.length > 0 && (
                        <Box
                          sx={styles.frontmatterErrors}
                          data-testid="skill-frontmatter-error"
                        >
                          {frontmatterErrors.map(error => (
                            <Typography
                              key={error}
                              variant="bodySmall"
                              sx={styles.instructionsError}
                            >
                              {error}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <Typography
                        variant="bodySmall"
                        sx={styles.charCounter}
                      >
                        {instructionsCounterLabel}
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

      <SkillRunSettings
        accordionStyle={accordionStyle}
        disabled={disabled}
      />
    </Box>
  );
});

/** @type {MuiSx} */
const skillCreateFormStyles = () => ({
  rootContainer: {
    width: '100%',
  },
  accordionContent: {
    paddingBottom: '1.5rem',
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'baseline',
    minHeight: '4.25rem',
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
    position: 'relative',
    top: '0.25rem',
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
    border: `0.0625rem solid ${palette.border.default}`,
    overflow: 'hidden',
    '&:focus-within': { borderColor: palette.primary.main },
    '& .cm-theme': { width: '100%' },
    '& .cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: `0.0625rem solid ${palette.border.default}`,
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
  frontmatterErrors: {
    display: 'flex',
    flexDirection: 'column',
  },
  instructionsError: ({ palette }) => ({
    color: palette.error.main,
  }),
  instructionsPreview: ({ palette }) => ({
    minHeight: '12rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.background.surface.interactive.default,
    overflow: 'auto',
    fontSize: '0.875rem',
  }),
  emptyPreview: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
  }),
});

CreateSkillForm.displayName = 'CreateSkillForm';

export default CreateSkillForm;
