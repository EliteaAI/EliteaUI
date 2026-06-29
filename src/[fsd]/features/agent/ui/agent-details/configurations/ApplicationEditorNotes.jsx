import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

const NOTES_MAX_LENGTH = 1000;

const ApplicationEditorNotes = memo(props => {
  const { style, disabled } = props;

  const { values: { version_details } = {}, setFieldValue } = useFormikContext();

  const handleNotesChange = useCallback(
    e => {
      setFieldValue('version_details.notes', e.target.value);
    },
    [setFieldValue],
  );

  const styles = useMemo(() => applicationEditorNotesStyles(), []);

  const accordionItems = useMemo(
    () => [
      {
        title: 'EDITOR NOTES',
        content: (
          <Box sx={styles.fieldContainer}>
            <Input.StyledInputEnhancer
              value={version_details?.notes ?? ''}
              onChange={handleNotesChange}
              disabled={disabled}
              label={
                <Label.InfoLabelWithTooltip
                  label="Notes"
                  tooltip="Free-text notes for documentation only. Not sent to the LLM, chat, or execution; not used in monitoring."
                  variant="bodyMedium"
                />
              }
              minRows={3}
              maxRows={10}
              inputProps={{ maxLength: NOTES_MAX_LENGTH }}
            />
          </Box>
        ),
      },
    ],
    [version_details?.notes, handleNotesChange, disabled, styles],
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={accordionItems}
    />
  );
});

ApplicationEditorNotes.displayName = 'ApplicationEditorNotes';

/** @type {MuiSx} */
const applicationEditorNotesStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
});

export default ApplicationEditorNotes;
