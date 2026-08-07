import { memo, useCallback, useState } from 'react';

import { format } from 'date-fns';

import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';

import ExpandableText from '@/[fsd]/widgets/context-budget/ui/ExpandableText';
import ClockIcon from '@/assets/clock.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import EditIcon from '@/components/Icons/EditIcon';
import StyledInputModal from '@/components/StyledInputModal';

const SummaryDetailsItem = memo(props => {
  const { summary, index, onDelete, onEdit } = props;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const theme = useTheme();
  const styles = summaryDetailsItemStyles();

  const formattedDate = summary.created_at ? format(new Date(summary.created_at), 'dd-MM-yyyy HH:mm') : '';

  const handleEditOpen = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleEditSave = useCallback(
    event => {
      const newContent = event.target.value;
      if (newContent !== summary.summary_content) {
        onEdit?.(summary.id, newContent);
      }
      setIsEditModalOpen(false);
    },
    [onEdit, summary.id, summary.summary_content],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.headerText}
        >
          {index + 1}.
        </Typography>
        <ClockIcon />
        <Typography
          variant="bodyMedium"
          sx={styles.headerText}
        >
          {formattedDate}
        </Typography>
      </Box>
      <Box
        key={summary.id}
        sx={styles.container}
      >
        <ExpandableText
          text={summary.summary_content}
          maxLines={5}
        />
        <Box sx={styles.tokensContainer}>
          <Typography
            variant="bodyMedium"
            sx={styles.tokensText}
          >
            Original / Summary tokens:{' '}
            <Box
              component="span"
              sx={styles.tokensValues}
            >
              {summary.summary_meta?.metrics?.original_token_count || 0} /{' '}
              {summary.summary_meta?.metrics?.summary_token_count || 0}
            </Box>
          </Typography>
          <Box sx={styles.buttonsWrapper}>
            <Tooltip title="Edit summary">
              <IconButton
                size="small"
                onClick={handleEditOpen}
                sx={styles.iconButton}
              >
                <EditIcon
                  fill={theme.palette.text.primary}
                  sx={{ fontSize: '1rem' }}
                />
              </IconButton>
            </Tooltip>
            <DeleteEntityButton
              name={`summary message ${formattedDate}`}
              title="Delete summary"
              onDelete={() => onDelete?.(summary.id)}
              shouldRequestInputName={false}
              buttonColor=""
              iconColor={theme.palette.text.primary}
              modalSx={styles.deleteModalSx}
            />
          </Box>
        </Box>

        <StyledInputModal
          open={isEditModalOpen}
          onClose={handleEditClose}
          onInput={handleEditSave}
          value={summary.summary_content}
          title="Edit summary"
          name="summary_content"
          specifiedLanguage="text"
        />
      </Box>
    </Box>
  );
});

SummaryDetailsItem.displayName = 'SummaryDetailsItem';

/** @type {MuiSx} */
const summaryDetailsItemStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingLeft: '1rem',
  },
  headerText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  container: ({ palette, spacing }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(1.5),
    padding: spacing(1.5, 2),
    paddingLeft: '1.2rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: BORDER_RADIUS.MD,
    alignSelf: 'stretch',
  }),
  tokensContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokensText: ({ palette }) => ({
    color: palette.text.primary,
  }),
  tokensValues: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  buttonsWrapper: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  iconButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.text.primary,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  deleteModalSx: {
    paper: {
      width: '31.25rem !important',
    },
  },
});

export default SummaryDetailsItem;
