import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseEyeIcon from '@/components/Icons/CloseEyeIcon';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';

const DatasetCaseItem = memo(props => {
  const { caseItem, isExcluded = false, onInclude, onExclude } = props;

  const handleInclude = useCallback(
    event => {
      event.stopPropagation();
      onInclude?.(caseItem);
    },
    [onInclude, caseItem],
  );

  const handleExclude = useCallback(
    event => {
      event.stopPropagation();
      onExclude?.(caseItem);
    },
    [onExclude, caseItem],
  );

  const styles = datasetCaseItemStyles(isExcluded);

  return (
    <Box sx={styles.root}>
      <Box
        className="case-content"
        sx={styles.content}
      >
        <Typography sx={styles.text}>
          <Box
            component="span"
            sx={styles.label}
          >
            Input:
          </Box>{' '}
          {caseItem.input}
        </Typography>
        <Typography sx={styles.text}>
          <Box
            component="span"
            sx={styles.label}
          >
            Output:
          </Box>{' '}
          {caseItem.expected_output}
        </Typography>
        {isExcluded && (
          <Box sx={styles.excludedBadge}>
            <CloseEyeIcon sx={styles.excludedIcon} />
            <Typography sx={styles.excludedText}>Excluded</Typography>
          </Box>
        )}
      </Box>
      <Box
        className="case-actions"
        sx={styles.actions}
      >
        {isExcluded ? (
          <Tooltip
            title="Include in suite"
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={handleInclude}
                sx={styles.actionButton}
                data-testid={`case-include-${caseItem.id}`}
              >
                <OpenEyeIcon sx={styles.actionIcon} />
              </Button.BaseBtn>
            </Box>
          </Tooltip>
        ) : (
          <Tooltip
            title="Exclude from suite"
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={handleExclude}
                sx={styles.actionButton}
                data-testid={`case-exclude-${caseItem.id}`}
              >
                <CloseEyeIcon sx={styles.actionIcon} />
              </Button.BaseBtn>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

DatasetCaseItem.displayName = 'DatasetCaseItem';

/** @type {MuiSx} */
const datasetCaseItemStyles = isExcluded => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    padding: '0.5rem 0.75rem',
    marginLeft: '-0.75rem',
    marginRight: '-0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,

    '& .case-actions': {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },

    '&:hover .case-actions': {
      opacity: 1,
    },

    '&:hover .case-content': {
      paddingRight: '2.5rem',
    },
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    transition: 'padding-right 0.15s ease',
  },
  text: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.primary,
    opacity: isExcluded ? 0.5 : 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    ':last-of-type': {
      marginBottom: isExcluded ? 0 : '0.25rem',
    },
  }),
  label: ({ palette }) => ({
    fontWeight: 500,
    color: palette.text.secondary,
  }),
  excludedBadge: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '0.125rem',
    color: palette.text.disabled,
  }),
  excludedIcon: {
    width: '0.625rem',
    height: '0.625rem',
  },
  excludedText: {
    fontSize: '0.5625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  actionButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.25rem',
    backgroundColor: palette.background.secondary,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  actionIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
});

export default DatasetCaseItem;
