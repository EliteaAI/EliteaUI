import { memo, useCallback, useState } from 'react';

import { Box, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button, Checkbox } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ViewFileIcon from '@/assets/icons/ViewFileIcon.svg?react';

import CreateCaseModal from '../../datasets/case-modals/CreateCaseModal';

const DatasetCaseItem = memo(props => {
  const { caseItem, isExcluded = false, onInclude, onExclude } = props;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleCheckedChange = useCallback(
    event => {
      event.stopPropagation();
      if (event.target.checked) {
        onInclude?.(caseItem);
        return;
      }

      onExclude?.(caseItem);
    },
    [onInclude, onExclude, caseItem],
  );

  const handleOpenDetails = useCallback(event => {
    event.stopPropagation();
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const styles = datasetCaseItemStyles(isExcluded);

  return (
    <Box sx={styles.root}>
      <Checkbox.BaseCheckbox
        checked={!isExcluded}
        onChange={handleCheckedChange}
        inputProps={{
          'aria-label': `Include case ${caseItem.id} in suite`,
          'data-testid': `case-selection-${caseItem.id}`,
        }}
      />
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
          <Box
            component="span"
            sx={styles.value}
          >
            {caseItem.input}
          </Box>
        </Typography>
        <Typography sx={styles.text}>
          <Box
            component="span"
            sx={styles.label}
          >
            Output:
          </Box>{' '}
          <Box
            component="span"
            sx={styles.value}
          >
            {caseItem.expected_output}
          </Box>
        </Typography>
      </Box>
      <Box
        className="case-details-button"
        sx={styles.detailsButtonWrapper}
      >
        <Tooltip
          title="View details"
          placement="top"
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            aria-label="View details"
            onClick={handleOpenDetails}
            sx={styles.detailsButton}
            data-testid={`case-view-details-${caseItem.id}`}
            startIcon={
              <SvgIcon
                component={ViewFileIcon}
                inheritViewBox
                sx={styles.detailsIcon}
              />
            }
          />
        </Tooltip>
      </Box>
      <CreateCaseModal
        open={isDetailsOpen}
        onClose={handleCloseDetails}
        datasetCase={caseItem}
        readOnly
      />
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
    gap: '0.5rem',
    padding: '0.5rem 0',
    borderBottom: `0.0625rem solid ${palette.border.default}`,

    '& .case-details-button': {
      opacity: 0,
      pointerEvents: 'none',
      transition: 'opacity 0.15s ease',
    },

    '&:hover .case-details-button': {
      opacity: 1,
      pointerEvents: 'auto',
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
  text: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    ':last-of-type': {
      marginBottom: isExcluded ? 0 : '0.25rem',
    },
  },
  label: ({ palette }) => ({
    fontWeight: 500,
    color: isExcluded ? palette.text.primary : palette.text.secondary,
  }),
  value: ({ palette }) => ({ color: isExcluded ? palette.text.muted : palette.text.primary }),
  detailsButtonWrapper: {
    position: 'absolute',
    top: '50%',
    right: 0,
    transform: 'translateY(-50%)',
  },
  detailsButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.5rem',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.selected,
    },
  }),
  detailsIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.default,
  }),
});

export default DatasetCaseItem;
