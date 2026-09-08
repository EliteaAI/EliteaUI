import { memo, useCallback, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ViewFileIcon from '@/assets/icons/ViewFileIcon.svg?react';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';

import { formatScore } from '../../lib/helpers';
import DimensionResultCard from './DimensionResultCard';

const CaseResultItem = memo(props => {
  const { card, canEvaluate = false, onViewDetails, onEvaluate } = props;

  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleViewDetails = useCallback(
    event => {
      event.stopPropagation();
      onViewDetails?.(card);
    },
    [card, onViewDetails],
  );

  const handleEvaluate = useCallback(
    cell => {
      onEvaluate?.(cell, card);
    },
    [onEvaluate, card],
  );

  const pendingCount = card.pendingCount ?? 0;
  const styles = caseResultItemStyles();

  return (
    <Box
      sx={styles.wrapper}
      data-testid={`case-result-item-${card.id}`}
    >
      <Box sx={styles.container}>
        <Box
          sx={styles.header}
          onClick={handleToggle}
        >
          <Box sx={styles.headerLeft}>
            <Box sx={[styles.expandIcon, expanded && styles.expandIconExpanded]}>
              <ExpandMoreIcon sx={styles.chevron} />
            </Box>
            <Typography
              variant="bodyMedium"
              sx={styles.caseLabel}
            >
              Case #{card.id}
            </Typography>
            {pendingCount > 0 && (
              <Box
                sx={styles.pendingBadge}
                data-testid={`case-pending-badge-${card.id}`}
              >
                <OpenEyeIcon sx={styles.pendingBadgeIcon} />
                <Typography
                  variant="labelMedium"
                  sx={styles.pendingBadgeText}
                >
                  Evaluation required: {pendingCount}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography
            variant="bodyMedium"
            sx={styles.caseScore}
          >
            {formatScore(card.caseScore)}
          </Typography>
        </Box>

        <Collapse
          in={expanded}
          timeout="auto"
        >
          <Box sx={styles.content}>
            {card.cells.map(cell => (
              <DimensionResultCard
                key={cell.binding.key}
                cell={cell}
                canEvaluate={canEvaluate}
                onEvaluate={handleEvaluate}
              />
            ))}
          </Box>
        </Collapse>
      </Box>

      <Tooltip
        title="View details"
        placement="top"
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            aria-label="View details"
            onClick={handleViewDetails}
            sx={styles.viewButton}
            data-testid={`case-view-details-${card.id}`}
            startIcon={
              <SvgIcon
                component={ViewFileIcon}
                inheritViewBox
                sx={styles.viewIcon}
              />
            }
          />
        </Box>
      </Tooltip>
    </Box>
  );
});

CaseResultItem.displayName = 'CaseResultItem';

/** @type {MuiSx} */
const caseResultItemStyles = () => ({
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.background.dataGrid.main}`,
    backgroundColor: palette.background.folder.default,
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    minHeight: '3.125rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  expandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
    transform: 'rotate(-90deg)',
  },
  expandIconExpanded: {
    transform: 'rotate(0deg)',
  },
  chevron: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.icon.fill.default,
  }),
  caseLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    flexShrink: 0,
  }),
  pendingBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0 0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.chatContinue}`,
  }),
  pendingBadgeIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.button.showMore,
    '& path': {
      fill: palette.text.button.showMore,
    },
  }),
  pendingBadgeText: ({ palette }) => ({
    color: palette.text.button.showMore,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  }),
  caseScore: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
  }),
  viewButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.5rem',
    marginTop: '0.375rem',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '&:hover': {
      backgroundColor: palette.background.tabButton.active,
    },
  }),
  viewIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 1rem 1rem 1rem',
  },
});

export default CaseResultItem;
