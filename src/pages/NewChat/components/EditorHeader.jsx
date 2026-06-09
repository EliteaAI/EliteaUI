import { useFormikContext } from 'formik';

import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Button } from '@/[fsd]/shared/ui';
import CloseIcon from '@/components/Icons/CloseIcon';
import useDiscardApplicationChanges from '@/pages/Applications/useDiscardApplicationChanges';
import { TabBarItems } from '@/pages/Common/Components/StyledComponents.jsx';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';

/**
 * Shared header component for editor interfaces (Agent, Toolkit, etc.)
 * @param {string} title - Primary title text
 * @param {string} subtitle - Optional subtitle text
 * @param {function} onCancel - Cancel button handler
 * @param {function} onDiscard - Discard button handler
 * @param {React.ReactNode} saveButton - Save button component to render
 */
const EditorHeader = ({ title, subtitle, onCancel, onDiscard, saveButton, isPublic }) => {
  const theme = useTheme();
  const { discardApplicationChanges } = useDiscardApplicationChanges(onDiscard);
  const { dirty: isFormDirty } = useFormikContext();
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.titleSection}>
        <IconButton
          sx={styles.closeButton}
          variant="elitea"
          color="tertiary"
          onClick={onCancel}
        >
          <CloseIcon
            fill={theme.palette.icon.fill.default}
            sx={styles.closeIcon}
          />
        </IconButton>
        <Box>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            noWrap
            sx={styles.title}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.primary"
              noWrap
              sx={styles.subtitle}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={styles.actionsSection}>
        <TabBarItems>
          {!isPublic && (
            <Button.DiscardButton
              disabled={!isFormDirty && !isYamlCodeDirty}
              onDiscard={discardApplicationChanges}
              size="small"
              sx={styles.discardButton}
            />
          )}
          {!isPublic && saveButton}
          {isPublic && (
            <Box sx={styles.publicLabelContainer}>
              <Typography
                variant="bodySmall"
                sx={styles.publicLabel}
              >
                Public
              </Typography>
            </Box>
          )}
        </TabBarItems>
      </Box>
    </Box>
  );
};

const styles = {
  container: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '1rem',
    background: palette.background.userInputBackground,
    minHeight: '2.625rem',
    flexShrink: 0,
  }),
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.4,
  },
  closeButton: {
    marginLeft: 0,
  },
  closeIcon: {
    fontSize: '1.125rem',
    cursor: 'pointer',
  },
  title: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  subtitle: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  actionsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    marginY: '0.5rem',
  },
  discardButton: {
    minWidth: 'auto',
    px: 2,
  },
  publicLabelContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    height: '1.25rem',
    borderRadius: '0.875rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
  },
  publicLabel: {
    textTransform: 'none',
    color: ({ palette }) => palette.text.metrics,
  },
};

export default EditorHeader;
