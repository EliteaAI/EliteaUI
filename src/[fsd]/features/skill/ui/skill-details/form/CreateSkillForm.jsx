import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { parseMdFrontmatter } from '@/[fsd]/entities/import-wizard/lib/helpers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Field, Input, Markdown } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useTagListQuery } from '@/api/tags.js';
import CodeIcon from '@/assets/code-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_NAME_LENGTH,
  PROMPT_PAYLOAD_KEY,
} from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import TagEditor from '@/pages/Common/Components/TagEditor';
import { markdown } from '@codemirror/lang-markdown';
import { useTheme } from '@emotion/react';

const CreateSkillForm = memo(props => {
  const { accordionStyle, sx, disabled = false, instructionsKey } = props;
  const formik = useFormikContext();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { data: tagList = {} } = useTagListQuery({ projectId }, { skip: !projectId });
  const [name, setName] = useState(formik.values?.name || '');
  const [instructionsViewMode, setInstructionsViewMode] = useState('edit');
  const importInputRef = useRef(null);
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

  // Import a .md file straight into the Instructions field (reuses the same
  // FileReader.readAsText logic as FileReaderEnhancer.handleDrop).
  const onClickImport = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const onImportFile = useCallback(
    event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result ?? '');
        try {
          const { frontmatter, body } = parseMdFrontmatter(raw);
          // Strip frontmatter: instructions become the body only.
          formik.setFieldValue('version_details.instructions', body || '');
          // Fill Name only when the field is currently empty.
          if (!formik.values.name?.trim() && frontmatter?.name) {
            setName(frontmatter.name);
            formik.setFieldValue('name', frontmatter.name);
          }
          // Fill Description only when the field is currently empty.
          if (!formik.values.description?.trim() && frontmatter?.description) {
            formik.setFieldValue('description', frontmatter.description);
          }
          // Ignore all other frontmatter (tags, version, type, etc.).
        } catch {
          // No frontmatter / parse failure: fall back to pasting the raw text.
          formik.setFieldValue('version_details.instructions', raw);
        }
      };
      reader.onerror = () => toastError('Failed to read the file.');
      reader.readAsText(file);
    },
    [formik, toastError],
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
            summaryAction: (
              <Box
                component="span"
                sx={styles.summaryActions}
                onClick={e => e.stopPropagation()}
              >
                <StyledTooltip
                  title="Import from a .md file"
                  placement="top"
                >
                  <IconButton
                    size="small"
                    aria-label="Import instructions from file"
                    disabled={disabled}
                    onClick={onClickImport}
                    sx={styles.importButton}
                  >
                    <ImportIcon />
                  </IconButton>
                </StyledTooltip>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".md,text/markdown"
                  hidden
                  onChange={onImportFile}
                />
                <TabGroupButton
                  value={instructionsViewMode}
                  onChange={(_e, m) => m && setInstructionsViewMode(m)}
                  size="small"
                  arrayBtn={modeButtons}
                />
              </Box>
            ),
            content:
              instructionsViewMode === 'edit' ? (
                <Box sx={styles.instructionsWrapper}>
                  <Box sx={styles.editorWrapper}>
                    <Field.CodeMirrorEditor
                      key={instructionsKey}
                      value={instructions}
                      notifyChange={onChangeInstructions}
                      extensions={markdownExtensions}
                      height="100%"
                      minHeight="0"
                      maxLength={MAX_INSTRUCTIONS_LENGTH}
                      readOnly={disabled}
                    />
                  </Box>
                  <Box sx={styles.charCounterWrapper}>
                    <Typography
                      variant="bodySmall"
                      sx={styles.charCounter}
                    >
                      {`${MAX_INSTRUCTIONS_LENGTH - instructions.length} characters left`}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={styles.instructionsPreview}>
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
  summaryActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    // TabGroupButton hardcodes zIndex: 2000, which otherwise paints the
    // edit/preview toggle above modals (zIndex 1300). Scope it with a local
    // stacking context so it can't escape over dialogs.
    isolation: 'isolate',
  },
  importButton: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    '& svg': {
      fontSize: '1rem',
      width: '1rem',
      height: '1rem',
      fill: palette.icon.fill.secondary,
    },
  }),
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
  charCounterWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  charCounter: ({ palette }) => ({
    color: palette.text.primary,
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
