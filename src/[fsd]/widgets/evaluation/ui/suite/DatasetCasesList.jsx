import { memo, useCallback, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';
import DatasetCaseItem from './DatasetCaseItem';

const DatasetCasesList = memo(props => {
  const { cases = [], caseCount = 0, onAddCase, onEditCase, onDeleteCase } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateDataset = checkPermission(EVAL_PERMISSIONS.datasetUpdate);

  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const displayCount = caseCount || cases.length;
  const styles = datasetCasesListStyles();

  return (
    <Box sx={styles.root}>
      <Box
        sx={styles.header}
        onClick={handleToggle}
      >
        <ArrowDownIcon style={expanded ? styles.chevron : styles.chevronCollapsed} />
        <Typography sx={styles.title}>Cases ({displayCount})</Typography>
      </Box>
      <Collapse in={expanded}>
        <Box sx={styles.list}>
          {cases.map(caseItem => (
            <DatasetCaseItem
              key={caseItem.id}
              caseItem={caseItem}
              onEdit={onEditCase}
              onDelete={onDeleteCase}
            />
          ))}
        </Box>
        {canUpdateDataset && (
          <Button.BaseBtn
            color={BUTTON_COLORS.secondary}
            startIcon={<PlusIcon />}
            onClick={onAddCase}
            sx={styles.addButton}
          >
            Case
          </Button.BaseBtn>
        )}
      </Collapse>
    </Box>
  );
});

DatasetCasesList.displayName = 'DatasetCasesList';

/** @type {MuiSx} */
const datasetCasesListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0',
  },
  chevron: {
    width: '1rem',
    height: '1rem',
    transition: 'transform 0.2s ease',
  },
  chevronCollapsed: {
    width: '1rem',
    height: '1rem',
    transition: 'transform 0.2s ease',
    transform: 'rotate(-90deg)',
  },
  title: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    color: palette.text.secondary,
  }),
  list: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  addButton: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.375rem 0.75rem',
    borderRadius: '1.25rem',
    borderColor: palette.border.lines,
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    marginTop: '1rem',

    '& .MuiButton-startIcon svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
    '& svg path': {
      fill: palette.text.secondary,
    },
    '&:hover': {
      borderColor: palette.border.lines,
      backgroundColor: palette.background.tabButton.default,
    },
  }),
});

export default DatasetCasesList;
