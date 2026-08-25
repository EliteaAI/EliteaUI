import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CopyIcon from '@/components/Icons/CopyIcon';

import CompareVersionHeader from '../CompareVersionHeader';

const CompareUserInteractionStep = memo(props => {
  const {
    leftVersion,
    rightVersion,
    leftData,
    rightData,
    leftEdits,
    rightEdits,
    onLeftEdit,
    onRightEdit,
    onSaveLeft,
    onSaveRight,
    savingLeftKeys,
    savingRightKeys,
    toastSuccess,
  } = props;

  const leftWelcome = leftEdits.welcome_message ?? leftData.welcome_message ?? '';
  const rightWelcome = rightEdits.welcome_message ?? rightData.welcome_message ?? '';

  const leftStarters = useMemo(
    () => leftEdits.conversation_starters ?? leftData.conversation_starters ?? [],
    [leftEdits.conversation_starters, leftData.conversation_starters],
  );
  const rightStarters = useMemo(
    () => rightEdits.conversation_starters ?? rightData.conversation_starters ?? [],
    [rightEdits.conversation_starters, rightData.conversation_starters],
  );

  const maxStarters = Math.max(leftStarters.length, rightStarters.length);

  const welcomeNoDiff = leftWelcome === rightWelcome;
  const startersNoDiff = useMemo(() => {
    if (leftStarters.length !== rightStarters.length) return false;
    return leftStarters.every((v, i) => v === rightStarters[i]);
  }, [leftStarters, rightStarters]);

  const handleLeftWelcomeChange = useCallback(val => onLeftEdit('welcome_message', val), [onLeftEdit]);
  const handleRightWelcomeChange = useCallback(val => onRightEdit('welcome_message', val), [onRightEdit]);

  const handleLeftStarterChange = useCallback(
    (index, val) => {
      const updated = [...leftStarters];
      updated[index] = val;
      onLeftEdit('conversation_starters', updated);
    },
    [leftStarters, onLeftEdit],
  );

  const handleRightStarterChange = useCallback(
    (index, val) => {
      const updated = [...rightStarters];
      updated[index] = val;
      onRightEdit('conversation_starters', updated);
    },
    [rightStarters, onRightEdit],
  );

  const handleCopyWelcomeLeft = useCallback(() => {
    navigator.clipboard.writeText(leftWelcome).then(() => toastSuccess('Copied to clipboard.'));
  }, [leftWelcome, toastSuccess]);

  const handleCopyWelcomeRight = useCallback(() => {
    navigator.clipboard.writeText(rightWelcome).then(() => toastSuccess('Copied to clipboard.'));
  }, [rightWelcome, toastSuccess]);

  const handleCopyStarterLeft = useCallback(
    (index, val) => () => {
      navigator.clipboard.writeText(val).then(() => toastSuccess('Copied to clipboard.'));
    },
    [toastSuccess],
  );

  const handleCopyStarterRight = useCallback(
    (index, val) => () => {
      navigator.clipboard.writeText(val).then(() => toastSuccess('Copied to clipboard.'));
    },
    [toastSuccess],
  );

  const leftWelcomeDirty = leftEdits.welcome_message !== undefined;
  const rightWelcomeDirty = rightEdits.welcome_message !== undefined;
  const leftStartersDirty = leftEdits.conversation_starters !== undefined;
  const rightStartersDirty = rightEdits.conversation_starters !== undefined;

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Box sx={styles.fieldHeader}>
              <Typography sx={styles.fieldLabel}>Welcome Message</Typography>
              <Tooltip
                title={`Copy Welcome Message from version ${leftVersion?.name}`}
                placement="top"
              >
                <BaseBtn
                  variant={BUTTON_VARIANTS.secondary}
                  startIcon={<CopyIcon />}
                  onClick={handleCopyWelcomeLeft}
                />
              </Tooltip>
            </Box>
            {welcomeNoDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
            <Box sx={styles.editableCard}>
              <TextDiffHighlight
                original={rightWelcome}
                modified={leftWelcome}
                mode="modified"
                editable
                onChange={handleLeftWelcomeChange}
              />
            </Box>
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              disabled={!leftWelcomeDirty || savingLeftKeys.welcome_message}
              onClick={() => onSaveLeft({ welcome_message: leftWelcome })}
              sx={styles.saveBtn}
            >
              {savingLeftKeys.welcome_message ? 'Saving...' : `Save ${leftVersion?.name}`}
            </BaseBtn>
          </Box>

          {maxStarters > 0 && (
            <Box sx={styles.fieldSectionGrow}>
              <Box sx={styles.fieldHeader}>
                <Typography sx={styles.sectionLabel}>Chat Starters</Typography>
              </Box>
              {startersNoDiff && (
                <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>
              )}
              <Box sx={styles.startersList}>
                {Array.from({ length: maxStarters }, (_, i) => {
                  const lVal = leftStarters[i] ?? null;
                  const rVal = rightStarters[i] ?? null;

                  return (
                    <Box
                      key={i}
                      sx={styles.starterRow}
                    >
                      <Box sx={styles.editableCard}>
                        <TextDiffHighlight
                          original={rVal ?? ''}
                          modified={lVal ?? ''}
                          mode="modified"
                          editable
                          onChange={val => handleLeftStarterChange(i, val)}
                        />
                      </Box>
                      <Tooltip
                        title={`Copy Chat Starter ${i + 1} from version ${leftVersion?.name}`}
                        placement="top"
                      >
                        <BaseBtn
                          variant={BUTTON_VARIANTS.secondary}
                          startIcon={<CopyIcon sx={{ fontSize: '1rem' }} />}
                          onClick={handleCopyStarterLeft(i, lVal ?? '')}
                        />
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
              <BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                size="small"
                disabled={!leftStartersDirty || savingLeftKeys.conversation_starters}
                onClick={() => onSaveLeft({ conversation_starters: leftStarters })}
                sx={styles.saveBtn}
              >
                {savingLeftKeys.conversation_starters ? 'Saving...' : `Save starters — ${leftVersion?.name}`}
              </BaseBtn>
            </Box>
          )}
        </Box>
      }
      suggestedContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Box sx={styles.fieldHeader}>
              <Typography sx={styles.fieldLabel}>Welcome Message</Typography>
              <Tooltip
                title={`Copy Welcome Message from version ${rightVersion?.name}`}
                placement="top"
              >
                <BaseBtn
                  variant={BUTTON_VARIANTS.secondary}
                  startIcon={<CopyIcon />}
                  onClick={handleCopyWelcomeRight}
                />
              </Tooltip>
            </Box>
            {welcomeNoDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
            <Box sx={styles.editableCard}>
              <TextDiffHighlight
                original={leftWelcome}
                modified={rightWelcome}
                mode="modified"
                editable
                onChange={handleRightWelcomeChange}
              />
            </Box>
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              disabled={!rightWelcomeDirty || savingRightKeys.welcome_message}
              onClick={() => onSaveRight({ welcome_message: rightWelcome })}
              sx={styles.saveBtn}
            >
              {savingRightKeys.welcome_message ? 'Saving...' : `Save ${rightVersion?.name}`}
            </BaseBtn>
          </Box>

          {maxStarters > 0 && (
            <Box sx={styles.fieldSectionGrow}>
              <Box sx={styles.fieldHeader}>
                <Typography sx={styles.sectionLabel}>Chat Starters</Typography>
              </Box>
              {startersNoDiff && (
                <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>
              )}
              <Box sx={styles.startersList}>
                {Array.from({ length: maxStarters }, (_, i) => {
                  const lVal = leftStarters[i] ?? null;
                  const rVal = rightStarters[i] ?? null;

                  return (
                    <Box
                      key={i}
                      sx={styles.starterRow}
                    >
                      <Box sx={styles.editableCard}>
                        <TextDiffHighlight
                          original={lVal ?? ''}
                          modified={rVal ?? ''}
                          mode="modified"
                          editable
                          onChange={val => handleRightStarterChange(i, val)}
                        />
                      </Box>
                      <Tooltip
                        title={`Copy Chat Starter ${i + 1} from version ${rightVersion?.name}`}
                        placement="top"
                      >
                        <BaseBtn
                          variant={BUTTON_VARIANTS.secondary}
                          startIcon={<CopyIcon sx={{ fontSize: '1rem' }} />}
                          onClick={handleCopyStarterRight(i, rVal ?? '')}
                        />
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
              <BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                size="small"
                disabled={!rightStartersDirty || savingRightKeys.conversation_starters}
                onClick={() => onSaveRight({ conversation_starters: rightStarters })}
                sx={styles.saveBtn}
              >
                {savingRightKeys.conversation_starters
                  ? 'Saving...'
                  : `Save starters — ${rightVersion?.name}`}
              </BaseBtn>
            </Box>
          )}
        </Box>
      }
    />
  );
});

CompareUserInteractionStep.displayName = 'CompareUserInteractionStep';

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
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    color: 'text.primary',
    textTransform: 'uppercase',
  },
  noDiffNote: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '2.5rem',
    maxHeight: '5.5rem',
    overflowY: 'auto',
    transition: 'border-color 0.2s ease',
    flex: 1,
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  startersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  starterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  saveBtn: {
    alignSelf: 'flex-end',
    marginTop: '0.25rem',
  },
};

export default CompareUserInteractionStep;
