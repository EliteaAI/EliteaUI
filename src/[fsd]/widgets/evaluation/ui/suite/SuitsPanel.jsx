import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import EvaluateIcon from '@/components/Icons/EvaluateIcon';

import SuitCard from './SuitCard';

const SuitsPanel = memo(props => {
  const { suites = [], isLoading, datasetNamesById = {}, onNewSuit, onDeleteSuit, onSelectSuit } = props;

  const styles = suitsPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.headerLabel}
        >
          Suits
        </Typography>
        {suites.length > 0 && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.contained}
            color={BUTTON_COLORS.primary}
            onClick={onNewSuit}
            sx={styles.newSuitButton}
          >
            New Suit
          </Button.BaseBtn>
        )}
      </Box>
      <Box sx={styles.content}>
        {isLoading ? (
          <Box sx={styles.centered}>
            <CircularProgress size={24} />
          </Box>
        ) : suites.length === 0 ? (
          <Box sx={styles.centered}>
            <EvaluateIcon sx={styles.emptyIcon} />
            <Typography
              variant="headingSmall"
              sx={styles.emptyTitle}
            >
              No suits created yet.
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={styles.emptyDescription}
            >
              Create your first evaluation suite to assess your agent&apos;s performance.
            </Typography>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.contained}
              color={BUTTON_COLORS.primary}
              onClick={onNewSuit}
              sx={styles.emptyButton}
            >
              New Suit
            </Button.BaseBtn>
          </Box>
        ) : (
          <Box sx={styles.list}>
            {suites.map(suite => (
              <SuitCard
                key={suite.id}
                suite={suite}
                datasetName={datasetNamesById[suite.dataset_id]}
                onDelete={onDeleteSuit}
                onClick={() => onSelectSuit?.(suite)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
});

SuitsPanel.displayName = 'SuitsPanel';

export default SuitsPanel;

/** @type {MuiSx} */
const suitsPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    height: '3.3125rem',
    minHeight: '3.3125rem',
    boxSizing: 'border-box',
    backgroundColor: palette.background.folder.default,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  newSuitButton: {
    height: '1.75rem',
    fontSize: '0.8125rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem',
  },
  emptyIcon: ({ palette }) => ({
    fontSize: '2rem',
    marginBottom: '0.5rem',
    '& path': {
      fill: palette.icon.fill.disabled,
    },
  }),
  emptyTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  emptyDescription: ({ palette }) => ({
    color: palette.text.default,
    textAlign: 'center',
    maxWidth: '20.5rem',
  }),
  emptyButton: {
    marginTop: '0.5rem',
    height: '1.75rem',
    fontSize: '0.8125rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
  },
});
