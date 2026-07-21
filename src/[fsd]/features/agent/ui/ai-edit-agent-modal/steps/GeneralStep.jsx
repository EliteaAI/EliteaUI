import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

const GeneralStep = memo(props => {
  const { currentData, draftData, onDraftChange, fieldApplyFlags, onToggleField } = props;

  const currentName = currentData.name || '';
  const currentDescription = currentData.description || '';
  const suggestedName = draftData.name || '';
  const suggestedDescription = draftData.description || '';

  const handleNameChange = useCallback(
    newText => {
      onDraftChange({ ...draftData, name: newText });
    },
    [draftData, onDraftChange],
  );

  const handleDescriptionChange = useCallback(
    newText => {
      onDraftChange({ ...draftData, description: newText });
    },
    [draftData, onDraftChange],
  );

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Typography sx={styles.fieldLabel}>Name</Typography>
            <Box sx={styles.readOnlyCard}>
              <TextDiffHighlight
                original={currentName}
                modified={suggestedName}
                mode="original"
              />
            </Box>
          </Box>
          <Box sx={styles.fieldSectionGrow}>
            <Typography sx={styles.fieldLabel}>Description</Typography>
            <Box sx={styles.readOnlyCardGrow}>
              <TextDiffHighlight
                original={currentDescription}
                modified={suggestedDescription}
                mode="original"
              />
            </Box>
          </Box>
        </Box>
      }
      suggestedContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Box sx={styles.fieldHeader}>
              <Typography sx={styles.fieldLabel}>Name</Typography>
              <Box sx={styles.applyToggle}>
                <Typography sx={styles.applyLabel}>Apply changes</Typography>
                <BaseCheckbox
                  size="small"
                  checked={fieldApplyFlags.name}
                  onChange={() => onToggleField('name')}
                  sx={styles.checkbox}
                />
              </Box>
            </Box>
            <Box sx={styles.editableCard}>
              <TextDiffHighlight
                original={currentName}
                modified={suggestedName}
                mode="modified"
                editable
                onChange={handleNameChange}
              />
            </Box>
          </Box>
          <Box sx={styles.fieldSectionGrow}>
            <Box sx={styles.fieldHeader}>
              <Typography sx={styles.fieldLabel}>Description</Typography>
              <Box sx={styles.applyToggle}>
                <Typography sx={styles.applyLabel}>Apply changes</Typography>
                <BaseCheckbox
                  size="small"
                  checked={fieldApplyFlags.description}
                  onChange={() => onToggleField('description')}
                  sx={styles.checkbox}
                />
              </Box>
            </Box>
            <Box sx={styles.editableCardGrow}>
              <TextDiffHighlight
                original={currentDescription}
                modified={suggestedDescription}
                mode="modified"
                editable
                onChange={handleDescriptionChange}
              />
            </Box>
          </Box>
        </Box>
      }
    />
  );
});

GeneralStep.displayName = 'GeneralStep';

/** @type {MuiSx} */
const styles = {
  fieldsColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
  },
  fieldSectionGrow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 2rem 1.25rem',
    flex: 1,
    minHeight: 0,
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  applyToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  applyLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'text.secondary',
  },
  checkbox: {
    padding: '0.25rem',
  },
  readOnlyCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  readOnlyCardGrow: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }),
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  editableCardGrow: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }),
};

export default GeneralStep;
